from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models.database import get_db, User, Transaction
from auth import hash_password, verify_password, create_token, get_current_user
from schemas import RegisterIn, RegisterOut, LoginIn, LoginOut, UserOut, TopUpIn, TopUpOut, TransactionOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterOut)
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
    return {"token": token, "user": user}


@router.post("/login", response_model=LoginOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Username yoki parol noto'g'ri")
    if not user.is_active:
        raise HTTPException(403, "Akkaunt bloklangan")
    token = create_token({"user_id": user.id, "role": user.role})
    return {"token": token, "user": user}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/topup", response_model=TopUpOut)
def topup(data: TopUpIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.amount <= 0:
        raise HTTPException(400, "Summa noto'g'ri")
    user.balance += data.amount
    tx = Transaction(user_id=user.id, amount=data.amount, description="Hisob to'ldirish")
    db.add(tx)
    db.commit()
    db.refresh(user)
    return {"balance": user.balance, "message": f"{data.amount:,.0f} so'm qo'shildi"}


@router.get("/transactions", response_model=List[TransactionOut])
def transactions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txs = db.query(Transaction).filter_by(user_id=user.id).order_by(Transaction.created_at.desc()).limit(50).all()
    return txs
