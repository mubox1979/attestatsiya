from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from models.database import get_db, Question, Option, Category, Test
from auth import require_editor
from schemas import CategoryIn, CategoryOut, QuestionCreate, QuestionUpdate, QuestionOut

router = APIRouter(prefix="/questions", tags=["questions"])


# ---- CATEGORIES ----
@router.post("/categories", response_model=CategoryOut)
def create_category(data: CategoryIn, db: Session = Depends(get_db), editor=Depends(require_editor)):
    if editor.role == "editor" and editor.subject_id != data.subject_id:
        raise HTTPException(403, "Siz faqat o'z faningizga kategoriya qo'sha olasiz")
    c = Category(subject_id=data.subject_id, name=data.name)
    db.add(c); db.commit(); db.refresh(c)
    return c


@router.get("/categories/{subject_id}", response_model=List[CategoryOut])
def get_categories(subject_id: int, db: Session = Depends(get_db)):
    return db.query(Category).filter_by(subject_id=subject_id).all()


# ---- QUESTIONS ----
@router.post("/", response_model=QuestionOut)
def create_question(data: QuestionCreate, db: Session = Depends(get_db), editor=Depends(require_editor)):
    test = db.query(Test).filter_by(id=data.test_id).first()
    if not test: raise HTTPException(404, "Test topilmadi")
    if editor.role == "editor" and editor.subject_id != test.subject_id:
        raise HTTPException(403, "Siz faqat o'z faniga savol qo'sha olasiz")
    correct_count = sum(1 for o in data.options if o.is_correct)
    if correct_count != 1:
        raise HTTPException(400, "Aynan 1 ta to'g'ri javob bo'lishi kerak")
    q = Question(
        test_id=data.test_id,
        category_id=data.category_id,
        is_pedagogy=data.is_pedagogy,
        question_text=data.question_text,
        image_url=data.image_url
    )
    db.add(q); db.flush()
    for opt in data.options:
        db.add(Option(question_id=q.id, option_text=opt.option_text, is_correct=opt.is_correct))
    db.commit(); db.refresh(q)
    return db.query(Question).options(joinedload(Question.options)).filter(Question.id == q.id).first()


@router.get("/test/{test_id}", response_model=List[QuestionOut])
def get_questions(test_id: int, db: Session = Depends(get_db), editor=Depends(require_editor)):
    test = db.query(Test).filter_by(id=test_id).first()
    if not test: raise HTTPException(404, "Test topilmadi")
    if editor.role == "editor" and editor.subject_id != test.subject_id:
        raise HTTPException(403, "Ruxsat yo'q")
    return db.query(Question).options(joinedload(Question.options)).filter_by(test_id=test_id).all()


@router.put("/{question_id}", response_model=QuestionOut)
def update_question(question_id: int, data: QuestionUpdate, db: Session = Depends(get_db), editor=Depends(require_editor)):
    q = db.query(Question).filter_by(id=question_id).first()
    if not q: raise HTTPException(404, "Savol topilmadi")
    test = db.query(Test).filter_by(id=q.test_id).first()
    if editor.role == "editor" and editor.subject_id != test.subject_id:
        raise HTTPException(403, "Ruxsat yo'q")
    if data.question_text: q.question_text = data.question_text
    if data.image_url is not None: q.image_url = data.image_url
    if data.category_id is not None: q.category_id = data.category_id
    if data.is_pedagogy is not None: q.is_pedagogy = data.is_pedagogy
    if data.options:
        for o in q.options: db.delete(o)
        db.flush()
        for opt in data.options:
            db.add(Option(question_id=q.id, option_text=opt.option_text, is_correct=opt.is_correct))
    db.commit(); db.refresh(q)
    return q


@router.delete("/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db), editor=Depends(require_editor)):
    q = db.query(Question).filter_by(id=question_id).first()
    if not q: raise HTTPException(404, "Savol topilmadi")
    db.delete(q); db.commit()
    return {"ok": True}
