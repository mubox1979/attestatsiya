from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func
from typing import List, Optional
import random
from datetime import datetime
from models.database import get_db, Test, Question, Option, Attempt, AttemptAnswer, Transaction, User
from auth import get_current_user, require_editor
from schemas import (
    TestCreate, TestOut, TestListOut, StartTestOut,
    FinishIn, FinishOut, AttemptOut, AttemptReviewOut
)

router = APIRouter(prefix="/tests", tags=["tests"])


@router.post("/", response_model=TestOut)
def create_test(data: TestCreate, db: Session = Depends(get_db), editor=Depends(require_editor)):
    if editor.role == "editor" and editor.subject_id != data.subject_id:
        raise HTTPException(403, "Faqat o'z faniga test yarata olasiz")
    t = Test(
        subject_id=data.subject_id,
        title=data.title,
        description=data.description,
        price=data.price,
        duration_minutes=data.duration_minutes,
        info_count=data.info_count,
        ped_count=data.ped_count,
        created_by=editor.id
    )
    db.add(t); db.commit(); db.refresh(t)
    return db.query(Test).options(joinedload(Test.subject)).filter(Test.id == t.id).first()


@router.get("/", response_model=List[TestListOut])
def list_tests(db: Session = Depends(get_db)):
    # Optimize using join and group_by to get counts in one query
    test_counts = db.query(Test, func.count(Question.id).label("question_count"))\
        .options(joinedload(Test.subject))\
        .outerjoin(Question).filter(Test.is_active == True)\
        .group_by(Test.id, Test.subject_id).all()

    result = []
    for test, count in test_counts:
        test.question_count = count
        result.append(test)
    return result


@router.get("/my-subject", response_model=List[TestListOut])
def my_subject_tests(db: Session = Depends(get_db), editor=Depends(require_editor)):
    test_counts = db.query(Test, func.count(Question.id).label("question_count"))\
        .options(joinedload(Test.subject))\
        .outerjoin(Question).filter(Test.subject_id == editor.subject_id)\
        .group_by(Test.id, Test.subject_id).all()

    result = []
    for test, count in test_counts:
        test.question_count = count
        result.append(test)
    return result


@router.delete("/{test_id}")
def delete_test(test_id: int, db: Session = Depends(get_db), editor=Depends(require_editor)):
    t = db.query(Test).filter_by(id=test_id).first()
    if not t: raise HTTPException(404, "Test topilmadi")
    if editor.role == "editor" and editor.subject_id != t.subject_id:
        raise HTTPException(403, "Ruxsat yo'q")
    db.delete(t); db.commit()
    return {"ok": True}


@router.post("/{test_id}/start", response_model=StartTestOut)
def start_test(test_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    test = db.query(Test).filter_by(id=test_id, is_active=True).first()
    if not test: raise HTTPException(404, "Test topilmadi")

    if user.balance < test.price:
        raise HTTPException(400, f"Balans yetarli emas. Kerak: {test.price:,.0f} so'm, Sizda: {user.balance:,.0f} so'm")

    subject_questions = db.query(Question).filter_by(test_id=test_id, is_pedagogy=False).options(joinedload(Question.options)).all()
    pedagogy_questions = db.query(Question).filter_by(test_id=test_id, is_pedagogy=True).options(joinedload(Question.options)).all()

    if not subject_questions and not pedagogy_questions:
        raise HTTPException(400, "Bu testda savollar yo'q")

    selected_subject = random.sample(subject_questions, min(test.info_count, len(subject_questions)))
    selected_pedagogy = random.sample(pedagogy_questions, min(test.ped_count, len(pedagogy_questions)))

    selected = selected_subject + selected_pedagogy
    count = len(selected)

    user.balance -= test.price
    tx = Transaction(user_id=user.id, amount=-test.price, description=f"Test: {test.title}")
    db.add(tx)

    attempt = Attempt(user_id=user.id, test_id=test_id, total_questions=count)
    db.add(attempt); db.flush()

    questions_data = []
    for q in selected:
        opts = list(q.options)
        random.shuffle(opts)
        questions_data.append({
            "id": q.id,
            "text": q.question_text,
            "image_url": q.image_url,
            "is_pedagogy": q.is_pedagogy,
            "options": [{"id": o.id, "text": o.option_text} for o in opts]
        })

    db.commit()

    return {
        "attempt_id": attempt.id,
        "duration_minutes": test.duration_minutes,
        "questions": questions_data,
        "balance_after": user.balance
    }


@router.post("/{test_id}/finish/{attempt_id}", response_model=FinishOut)
def finish_test(test_id: int, attempt_id: int, data: FinishIn,
                db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    attempt = db.query(Attempt).filter_by(id=attempt_id, user_id=user.id).first()
    if not attempt: raise HTTPException(404, "Urinish topilmadi")
    if attempt.finished_at: raise HTTPException(400, "Test allaqachon yakunlangan")

    # Optimization: Fetch all options for the submitted questions in one query if needed,
    # but here we'll stick to a slightly cleaner loop or improved query logic.
    correct = 0
    answers_result = []

    # Get all questions and their options for this test to avoid repeated queries
    question_ids = [ans.question_id for ans in data.answers]
    questions = db.query(Question).filter(Question.id.in_(question_ids)).options(joinedload(Question.options)).all()
    q_map = {q.id: q for q in questions}

    for ans in data.answers:
        is_correct = False
        q = q_map.get(ans.question_id)
        if q and ans.selected_option_id:
            opt = next((o for o in q.options if o.id == ans.selected_option_id), None)
            is_correct = bool(opt and opt.is_correct)

        if is_correct:
            correct += 1

        db.add(AttemptAnswer(
            attempt_id=attempt_id,
            question_id=ans.question_id,
            selected_option_id=ans.selected_option_id,
            is_correct=is_correct
        ))

        if q:
            answers_result.append({
                "question_id": ans.question_id,
                "selected_option_id": ans.selected_option_id,
                "is_correct": is_correct,
                "options": [{"id": o.id, "is_correct": o.is_correct} for o in q.options]
            })

    attempt.finished_at = datetime.utcnow()
    attempt.score = correct
    db.commit()

    return {
        "score": correct,
        "total": attempt.total_questions,
        "percent": round(correct / attempt.total_questions * 100, 1) if attempt.total_questions else 0,
        "answers": answers_result
    }


@router.get("/attempt/{attempt_id}/review", response_model=AttemptReviewOut)
def review_attempt(attempt_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    attempt = db.query(Attempt).filter_by(id=attempt_id, user_id=user.id).first()
    if not attempt: raise HTTPException(404, "Topilmadi")

    # Use joinedload to fetch answers, questions and options in fewer queries
    answers = db.query(AttemptAnswer).filter_by(attempt_id=attempt_id)\
        .options(joinedload(AttemptAnswer.attempt))\
        .all()

    # We need options for each question too.
    # Fetch questions with options in one go for the answers' question_ids
    q_ids = [a.question_id for a in answers]
    questions = db.query(Question).filter(Question.id.in_(q_ids)).options(joinedload(Question.options)).all()
    q_map = {q.id: q for q in questions}

    result = []
    for a in answers:
        q = q_map.get(a.question_id)
        result.append({
            "question_text": q.question_text if q else "",
            "image_url": q.image_url if q else None,
            "is_pedagogy": q.is_pedagogy if q else False,
            "selected_option_id": a.selected_option_id,
            "is_correct": a.is_correct,
            "options": [{"id": o.id, "option_text": o.option_text, "is_correct": o.is_correct} for o in q.options] if q else []
        })

    return {
        "score": attempt.score,
        "total_questions": attempt.total_questions,
        "answers": result
    }


@router.get("/my-attempts", response_model=List[AttemptOut])
def my_attempts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    attempts = db.query(Attempt).filter_by(user_id=user.id).options(joinedload(Attempt.test))\
        .order_by(Attempt.started_at.desc()).limit(20).all()

    result = []
    for a in attempts:
        # Pydantic's alias and from_attributes will handle this
        a.test_title = a.test.title if a.test else ""
        result.append(a)
    return result
