from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.database import Base, engine, SessionLocal, User, Subject
from auth import hash_password
from routers import auth, admin, questions, tests

app = FastAPI(title="Attestatsiya")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(questions.router)
app.include_router(tests.router)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(User).filter_by(username="admin").first():
            db.add(User(username="admin", email="admin@test.uz", password_hash=hash_password("Admin@2024"), role="admin", balance=0))
        for nom in ["Informatika","Matematika","Fizika","Kimyo","Biologiya","Tarix","Geografiya","Ona tili","Adabiyot","Ingliz tili","Rus tili","Tasviriy san'at","Musiqa","Jismoniy tarbiya","Pedagogika"]:
            if not db.query(Subject).filter_by(name=nom).first():
                db.add(Subject(name=nom, description=nom))
        db.commit()
    finally:
        db.close()

@app.get("/api/health")
def health():
    return {"status": "ok"}