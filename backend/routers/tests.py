from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import random
from models.database import get_db, Test, Question, Option, Attempt, AttemptAnswer, Transaction, User, Subject
from auth import get_current_user, require_editor, require_admin

router = APIRouter(prefix="/tests", tags=["tests"])


class TestIn(BaseModel):
    subject_id: int
    title: str
    description: Optional[str] = None
    duration_minutes: int = 120
    questions_count: int = 50
    price: float = 5000.0


class SubmitAnswerIn(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None


class FinishIn(BaseModel):
    answers: List[SubmitAnswerIn]


@router.post("/")
def create_test(data: TestIn, db: Session = Depends(get_db), editor=Depends(require_editor)):
    if editor.role == "editor" and editor.subject_id != data.subject_id:
        raise HTTPException(403, "Faqat o'z faniga test yarata olasiz")
    t = Test(
        subject_id=data.subject_id,
        title=data.title,
        description=data.description,
        price=data.price,
        duration_minutes=data.duration_minutes,
        created_by=editor.id
    )
    db.add(t); db.commit(); db.refresh(t)
    return _tdict(t)


@router.get("/")
def list_tests(db: Session = Depends(get_db)):
    tests = db.query(Test).filter_by(is_active=True).all()
    result = []
    for t in tests:
        q_count = db.query(Question).filter_by(test_id=t.id).count()
        result.append({**_tdict(t), "question_count": q_count})
    return result


@router.get("/my-subject")
def my_subject_tests(db: Session = Depends(get_db), editor=Depends(require_editor)):
    tests = db.query(Test).filter_by(subject_id=editor.subject_id).all()
    result = []
    for t in tests:
        q_count = db.query(Question).filter_by(test_id=t.id).count()
        result.append({**_tdict(t), "question_count": q_count})
    return result


@router.delete("/{test_id}")
def delete_test(test_id: int, db: Session = Depends(get_db), editor=Depends(require_editor)):
    t = db.query(Test).filter_by(id=test_id).first()
    if not t: raise HTTPException(404, "Test topilmadi")
    if editor.role == "editor" and editor.subject_id != t.subject_id:
        raise HTTPException(403, "Ruxsat yo'q")
    db.delete(t); db.commit()
    return {"ok": True}


@router.post("/{test_id}/start")
def start_test(test_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    test = db.query(Test).filter_by(id=test_id, is_active=True).first()
    if not test: raise HTTPException(404, "Test topilmadi")

    if user.balance < test.price:
        raise HTTPException(400, f"Balans yetarli emas. Kerak: {test.price:,.0f} so'm, Sizda: {user.balance:,.0f} so'm")

    all_questions = db.query(Question).filter_by(test_id=test_id).all()
    if len(all_questions) == 0:
        raise HTTPException(400, "Bu testda savollar yo'q")

    count = min(50, len(all_questions))
    selected = random.sample(all_questions, count)

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
            "options": [{"id": o.id, "text": o.option_text} for o in opts]
        })

    db.commit()

    return {
        "attempt_id": attempt.id,
        "duration_minutes": test.duration_minutes,
        "questions": questions_data,
        "balance_after": user.balance
    }


@router.post("/{test_id}/finish/{attempt_id}")
def finish_test(test_id: int, attempt_id: int, data: FinishIn,
                db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from datetime import datetime
    attempt = db.query(Attempt).filter_by(id=attempt_id, user_id=user.id).first()
    if not attempt: raise HTTPException(404, "Urinish topilmadi")
    if attempt.finished_at: raise HTTPException(400, "Test allaqachon yakunlangan")

    correct = 0
    answers_result = []

    for ans in data.answers:
        is_correct = False
        if ans.selected_option_id:
            opt = db.query(Option).filter_by(id=ans.selected_option_id, question_id=ans.question_id).first()
            is_correct = bool(opt and opt.is_correct)
        if is_correct:
            correct += 1
        db.add(AttemptAnswer(
            attempt_id=attempt_id,
            question_id=ans.question_id,
            selected_option_id=ans.selected_option_id,
            is_correct=is_correct
        ))

        # To'g'ri va xato javoblarni qaytarish
        all_opts = db.query(Option).filter_by(question_id=ans.question_id).all()
        answers_result.append({
            "question_id": ans.question_id,
            "selected_option_id": ans.selected_option_id,
            "is_correct": is_correct,
            "options": [{"id": o.id, "is_correct": o.is_correct} for o in all_opts]
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


@router.get("/attempt/{attempt_id}/review")
def review_attempt(attempt_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    attempt = db.query(Attempt).filter_by(id=attempt_id, user_id=user.id).first()
    if not attempt: raise HTTPException(404, "Topilmadi")

    answers = db.query(AttemptAnswer).filter_by(attempt_id=attempt_id).all()
    result = []
    for a in answers:
        q = db.query(Question).filter_by(id=a.question_id).first()
        opts = db.query(Option).filter_by(question_id=a.question_id).all()
        result.append({
            "question_text": q.question_text if q else "",
            "image_url": q.image_url if q else None,
            "selected_option_id": a.selected_option_id,
            "is_correct": a.is_correct,
            "options": [{"id": o.id, "text": o.option_text, "is_correct": o.is_correct} for o in opts]
        })
    return {
        "score": attempt.score,
        "total": attempt.total_questions,
        "answers": result
    }


@router.get("/my-attempts")
def my_attempts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    attempts = db.query(Attempt).filter_by(user_id=user.id).order_by(Attempt.started_at.desc()).limit(20).all()
    result = []
    for a in attempts:
        test = db.query(Test).filter_by(id=a.test_id).first()
        result.append({
            "id": a.id,
            "test_title": test.title if test else "",
            "score": a.score,
            "total": a.total_questions,
            "started_at": a.started_at,
            "finished_at": a.finished_at
        })
    return result


def _tdict(t: Test):
    return {
        "id": t.id, "title": t.title, "description": t.description,
        "subject_id": t.subject_id, "price": t.price,
        "duration_minutes": t.duration_minutes, "is_active": t.is_active
    }
