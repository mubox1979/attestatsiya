from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from models.database import get_db, Complaint, Test
from auth import get_current_user, require_editor
from schemas import ComplaintCreate, ComplaintOut

router = APIRouter(prefix="/complaints", tags=["complaints"])

@router.post("", response_model=ComplaintOut)
def create_complaint(data: ComplaintCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    c = Complaint(
        user_id=user.id,
        test_id=data.test_id,
        question_id=data.question_id,
        text=data.text
    )
    db.add(c); db.commit(); db.refresh(c)
    # Reload with relationships
    return db.query(Complaint).options(
        joinedload(Complaint.user),
        joinedload(Complaint.test),
        joinedload(Complaint.question)
    ).filter(Complaint.id == c.id).first()

@router.get("/my-tests", response_model=List[ComplaintOut])
def get_complaints_for_editor(db: Session = Depends(get_db), editor = Depends(require_editor)):
    return db.query(Complaint).join(Test).filter(Test.created_by == editor.id).options(
        joinedload(Complaint.user),
        joinedload(Complaint.test),
        joinedload(Complaint.question)
    ).order_by(Complaint.created_at.desc()).all()
