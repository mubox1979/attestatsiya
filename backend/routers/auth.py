from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from models.database import get_db, User, Transaction
from auth import hash_password, verify_password, create_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterIn(BaseModel):
    username: str
    email: str
    password: str


class LoginIn(BaseModel):
    username: str
    password: str


class TopUpIn(BaseModel):
    amount: float


@router.post("/register")
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(400, "Bu username band")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Bu email band")
    if len(data.password) < 6:
        raise HTTPException(400, "Parol kamida 6 ta belgi bo'lishi kerak")
    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        role="user",
        balance=0.0
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token({"user_id": user.id, "role": user.role})
    return {"token": token, "user": _user_dict(user)}


@router.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Username yoki parol noto'g'ri")
    if not user.is_active:
        raise HTTPException(403, "Akkaunt bloklangan")
    token = create_token({"user_id": user.id, "role": user.role})
    return {"token": token, "user": _user_dict(user)}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return _user_dict(user)


@router.post("/topup")
def topup(data: TopUpIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.amount <= 0:
        raise HTTPException(400, "Summa noto'g'ri")
    user.balance += data.amount
    tx = Transaction(user_id=user.id, amount=data.amount, description="Hisob to'ldirish")
    db.add(tx)
    db.commit()
    db.refresh(user)
    return {"balance": user.balance, "message": f"{data.amount:,.0f} so'm qo'shildi"}


@router.get("/transactions")
def transactions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txs = db.query(__import__('models.database', fromlist=['Transaction']).Transaction)\
            .filter_by(user_id=user.id).order_by(__import__('models.database', fromlist=['Transaction']).Transaction.created_at.desc()).limit(50).all()
    return [{"amount": t.amount, "description": t.description, "date": t.created_at} for t in txs]


def _user_dict(u: User):
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "balance": u.balance,
        "role": u.role,
        "subject_id": u.subject_id,
        "created_at": u.created_at
    }
