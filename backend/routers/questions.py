from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from models.database import get_db, Question, Option, Category, Test, Subject
from auth import require_editor, get_current_user

router = APIRouter(prefix="/questions", tags=["questions"])


class OptionIn(BaseModel):
    option_text: str
    is_correct: bool


class QuestionIn(BaseModel):
    test_id: int
    category_id: Optional[int] = None
    question_text: str
    image_url: Optional[str] = None
    options: List[OptionIn]


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    options: Optional[List[OptionIn]] = None


class CategoryIn(BaseModel):
    subject_id: int
    name: str


# ---- CATEGORIES ----
@router.post("/categories")
def create_category(data: CategoryIn, db: Session = Depends(get_db), editor=Depends(require_editor)):
    # Editor faqat o'z faniga kategoriya qo'sha oladi
    if editor.role == "editor" and editor.subject_id != data.subject_id:
        raise HTTPException(403, "Siz faqat o'z faningizga kategoriya qo'sha olasiz")
    c = Category(subject_id=data.subject_id, name=data.name)
    db.add(c); db.commit(); db.refresh(c)
    return {"id": c.id, "name": c.name}


@router.get("/categories/{subject_id}")
def get_categories(subject_id: int, db: Session = Depends(get_db)):
    cats = db.query(Category).filter_by(subject_id=subject_id).all()
    return [{"id": c.id, "name": c.name} for c in cats]


# ---- QUESTIONS ----
@router.post("/")
def create_question(data: QuestionIn, db: Session = Depends(get_db), editor=Depends(require_editor)):
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
        question_text=data.question_text,
        image_url=data.image_url
    )
    db.add(q); db.flush()
    for opt in data.options:
        db.add(Option(question_id=q.id, option_text=opt.option_text, is_correct=opt.is_correct))
    db.commit(); db.refresh(q)
    return _qdict(q)


@router.get("/test/{test_id}")
def get_questions(test_id: int, db: Session = Depends(get_db), editor=Depends(require_editor)):
    test = db.query(Test).filter_by(id=test_id).first()
    if not test: raise HTTPException(404, "Test topilmadi")
    if editor.role == "editor" and editor.subject_id != test.subject_id:
        raise HTTPException(403, "Ruxsat yo'q")
    qs = db.query(Question).filter_by(test_id=test_id).all()
    return [_qdict(q) for q in qs]


@router.put("/{question_id}")
def update_question(question_id: int, data: QuestionUpdate, db: Session = Depends(get_db), editor=Depends(require_editor)):
    q = db.query(Question).filter_by(id=question_id).first()
    if not q: raise HTTPException(404, "Savol topilmadi")
    test = db.query(Test).filter_by(id=q.test_id).first()
    if editor.role == "editor" and editor.subject_id != test.subject_id:
        raise HTTPException(403, "Ruxsat yo'q")
    if data.question_text: q.question_text = data.question_text
    if data.image_url is not None: q.image_url = data.image_url
    if data.category_id is not None: q.category_id = data.category_id
    if data.options:
        for o in q.options: db.delete(o)
        db.flush()
        for opt in data.options:
            db.add(Option(question_id=q.id, option_text=opt.option_text, is_correct=opt.is_correct))
    db.commit(); db.refresh(q)
    return _qdict(q)


@router.delete("/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db), editor=Depends(require_editor)):
    q = db.query(Question).filter_by(id=question_id).first()
    if not q: raise HTTPException(404, "Savol topilmadi")
    db.delete(q); db.commit()
    return {"ok": True}


def _qdict(q: Question):
    return {
        "id": q.id,
        "question_text": q.question_text,
        "image_url": q.image_url,
        "category_id": q.category_id,
        "options": [{"id": o.id, "text": o.option_text, "is_correct": o.is_correct} for o in q.options]
    }
