from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from models.database import get_db, User, Subject, Transaction, Attempt, Test
from auth import hash_password, require_admin
from schemas import (
    CreateEditorIn, EditorOut, CreateSubjectIn, SubjectOut,
    UpdateUserIn, UserOut, AdminTopUpIn, AdminStats
)

router = APIRouter(prefix="/admin", tags=["admin"])


# ---- SUBJECTS ----
@router.post("/subjects", response_model=SubjectOut)
def create_subject(data: CreateSubjectIn, db: Session = Depends(get_db), admin=Depends(require_admin)):
    s = Subject(name=data.name, description=data.description)
    db.add(s); db.commit(); db.refresh(s)
    return s


@router.get("/subjects", response_model=List[SubjectOut])
def list_subjects(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(Subject).all()


@router.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    s = db.query(Subject).filter_by(id=subject_id).first()
    if not s: raise HTTPException(404, "Fan topilmadi")
    db.delete(s); db.commit()
    return {"ok": True}


# ---- EDITORS ----
@router.post("/editors", response_model=EditorOut)
def create_editor(data: CreateEditorIn, db: Session = Depends(get_db), admin=Depends(require_admin)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(400, "Bu username band")
    subj = db.query(Subject).filter_by(id=data.subject_id).first()
    if not subj: raise HTTPException(404, "Fan topilmadi")
    u = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        role="editor",
        subject_id=data.subject_id
    )
    db.add(u); db.commit(); db.refresh(u)
    # Refresh to load relationship
    u = db.query(User).options(joinedload(User.subject)).filter(User.id == u.id).first()
    return u


@router.get("/editors", response_model=List[UserOut])
def list_editors(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(User).options(joinedload(User.subject)).filter(User.role == "editor").all()


# ---- USERS ----
@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(User).options(joinedload(User.subject)).filter(User.role == "user").order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UpdateUserIn, db: Session = Depends(get_db), admin=Depends(require_admin)):
    u = db.query(User).filter_by(id=user_id).first()
    if not u: raise HTTPException(404, "Foydalanuvchi topilmadi")
    if data.is_active is not None: u.is_active = data.is_active
    if data.balance is not None: u.balance = data.balance
    if data.role is not None: u.role = data.role
    db.commit()
    return u


@router.post("/users/{user_id}/topup")
def topup_user(user_id: int, data: AdminTopUpIn, db: Session = Depends(get_db), admin=Depends(require_admin)):
    u = db.query(User).filter_by(id=user_id).first()
    if not u: raise HTTPException(404, "Foydalanuvchi topilmadi")
    u.balance += data.amount
    tx = Transaction(user_id=u.id, amount=data.amount, description=data.description)
    db.add(tx); db.commit()
    return {"balance": u.balance}


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return {
        "total_users": db.query(User).filter(User.role == "user").count(),
        "total_editors": db.query(User).filter(User.role == "editor").count(),
        "total_subjects": db.query(Subject).count(),
        "total_tests": db.query(Test).count(),
        "total_attempts": db.query(Attempt).count(),
    }
