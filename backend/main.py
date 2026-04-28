from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from models.database import Base, engine, SessionLocal, User, Subject
from auth import hash_password
from routers import auth, admin, questions, tests
import os

app = FastAPI(title="Attestatsiya Test Platformasi", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(questions.router)
app.include_router(tests.router)

# Static files (frontend)
if os.path.exists("../frontend"):
    app.mount("/static", StaticFiles(directory="../frontend/static"), name="static")

    @app.get("/", response_class=FileResponse)
    def index():
        return "../frontend/index.html"

    @app.get("/{path:path}", response_class=FileResponse)
    def catch_all(path: str):
        fp = f"../frontend/{path}"
        if os.path.exists(fp):
            return fp
        return "../frontend/index.html"


# DB yaratish + admin va fanlar qo'shish
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Admin yaratish
        if not db.query(User).filter_by(username="admin").first():
            admin_user = User(
                username="admin",
                email="admin@test.uz",
                password_hash=hash_password("Admin@2024"),
                role="admin",
                balance=0
            )
            db.add(admin_user)

        # 15 ta fan yaratish
        fan_nomlari = [
            "Informatika", "Matematika", "Fizika", "Kimyo", "Biologiya",
            "Tarix", "Geografiya", "Ona tili", "Adabiyot", "Ingliz tili",
            "Rus tili", "Tasviriy san'at", "Musiqa", "Jismoniy tarbiya", "Pedagogika"
        ]
        for nom in fan_nomlari:
            if not db.query(Subject).filter_by(name=nom).first():
                db.add(Subject(name=nom, description=f"{nom} fani bo'yicha testlar"))

        db.commit()
        print("✅ Ma'lumotlar bazasi tayyor!")
        print("👤 Admin: admin / Admin@2024")
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "Test platformasi ishlayapti!"}
