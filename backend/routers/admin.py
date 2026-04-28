from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from models.database import get_db, User, Subject, Transaction
from auth import hash_password, require_admin, get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


class CreateEditorIn(BaseModel):
    username: str
    email: str
    password: str
    subject_id: int


class CreateSubjectIn(BaseModel):
    name: str
    description: Optional[str] = None


class UpdateUserIn(BaseModel):
    is_active: Optional[bool] = None
    balance: Optional[float] = None
    role: Optional[str] = None


class TopUpUserIn(BaseModel):
    amount: float
    description: Optional[str] = "Admin tomonidan to'ldirish"


# ---- SUBJECTS ----
@router.post("/subjects")
def create_subject(data: CreateSubjectIn, db: Session = Depends(get_db), admin=Depends(require_admin)):
    s = Subject(name=data.name, description=data.description)
    db.add(s); db.commit(); db.refresh(s)
    return {"id": s.id, "name": s.name}


@router.get("/subjects")
def list_subjects(db: Session = Depends(get_db), admin=Depends(require_admin)):
    subjects = db.query(Subject).all()
    return [{"id": s.id, "name": s.name, "description": s.description} for s in subjects]


@router.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    s = db.query(Subject).filter_by(id=subject_id).first()
    if not s: raise HTTPException(404, "Fan topilmadi")
    db.delete(s); db.commit()
    return {"ok": True}


# ---- EDITORS ----
@router.post("/editors")
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
    return {"id": u.id, "username": u.username, "subject": subj.name}


@router.get("/editors")
def list_editors(db: Session = Depends(get_db), admin=Depends(require_admin)):
    editors = db.query(User).filter(User.role == "editor").all()
    return [_udict(e) for e in editors]


# ---- USERS ----
@router.get("/users")
def list_users(db: Session = Depends(get_db), admin=Depends(require_admin)):
    users = db.query(User).filter(User.role == "user").order_by(User.created_at.desc()).all()
    return [_udict(u) for u in users]


@router.patch("/users/{user_id}")
def update_user(user_id: int, data: UpdateUserIn, db: Session = Depends(get_db), admin=Depends(require_admin)):
    u = db.query(User).filter_by(id=user_id).first()
    if not u: raise HTTPException(404, "Foydalanuvchi topilmadi")
    if data.is_active is not None: u.is_active = data.is_active
    if data.balance is not None: u.balance = data.balance
    if data.role is not None: u.role = data.role
    db.commit()
    return _udict(u)


@router.post("/users/{user_id}/topup")
def topup_user(user_id: int, data: TopUpUserIn, db: Session = Depends(get_db), admin=Depends(require_admin)):
    u = db.query(User).filter_by(id=user_id).first()
    if not u: raise HTTPException(404, "Foydalanuvchi topilmadi")
    u.balance += data.amount
    tx = Transaction(user_id=u.id, amount=data.amount, description=data.description)
    db.add(tx); db.commit()
    return {"balance": u.balance}


@router.get("/stats")
def stats(db: Session = Depends(get_db), admin=Depends(require_admin)):
    from models.database import Attempt, Test
    return {
        "total_users": db.query(User).filter(User.role == "user").count(),
        "total_editors": db.query(User).filter(User.role == "editor").count(),
        "total_subjects": db.query(Subject).count(),
        "total_tests": db.query(Test).count(),
        "total_attempts": db.query(Attempt).count(),
    }


def _udict(u: User):
    return {
        "id": u.id, "username": u.username, "email": u.email,
        "balance": u.balance, "role": u.role, "is_active": u.is_active,
        "subject_id": u.subject_id, "created_at": u.created_at
    }
