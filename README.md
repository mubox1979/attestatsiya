# Attestatsiya Test Platformasi

## Loyiha strukturasi

```
testplatform/
├── backend/
│   ├── main.py              # Asosiy FastAPI ilovasi
│   ├── auth.py              # JWT autentifikatsiya
│   ├── requirements.txt     # Python kutubxonalari
│   ├── models/
│   │   └── database.py      # Ma'lumotlar bazasi modellari
│   └── routers/
│       ├── auth.py          # Login/register/topup
│       ├── admin.py         # Admin API
│       ├── questions.py     # Savollar API
│       └── tests.py         # Testlar API
├── frontend/
│   └── index.html           # Butun frontend (SPA)
└── render.yaml              # Render.com konfiguratsiya
```

## Mahalliy ishga tushirish

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API hujjatlari: http://localhost:8000/docs

## Render.com ga deploy qilish

1. GitHub'ga yuklang:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/attestatsiya.git
git push -u origin main
```

2. render.com ga kiring → "New Web Service"
3. GitHub reponi tanlang
4. Sozlamalar:
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. "Deploy" bosing

6. Deploy tugagach URL oling, masalan:
   `https://attestatsiya-backend.onrender.com`

## Frontend sozlash

`frontend/index.html` faylida quyidagi qatorni toping va URL ni o'zgartiring:

```javascript
const API = 'https://your-backend.onrender.com';
// Bunga o'zgartiring:
const API = 'https://attestatsiya-backend.onrender.com';
```

Keyin frontend ni Netlify ga yuklang.

## Default hisob ma'lumotlari

Admin:
- Username: `admin`
- Parol: `Admin@2024`

(Kirganingizdan keyin parolni o'zgartiring!)

## Rollar

| Rol     | Imkoniyatlar                              |
|---------|-------------------------------------------|
| admin   | Barcha boshqaruv, fanlar, muharrirlar     |
| editor  | Faqat o'z faniga savollar qo'shish        |
| user    | Testlarga kirish, hisob to'ldirish        |

## Test narxi

Har bir test: 5000 so'm (admin o'zgartira oladi)

## API Endpoints

### Auth
- POST /auth/register
- POST /auth/login
- GET  /auth/me
- POST /auth/topup

### Tests
- GET  /tests/
- POST /tests/{id}/start
- POST /tests/{id}/finish/{attempt_id}
- GET  /tests/attempt/{id}/review
- GET  /tests/my-attempts

### Admin
- GET/POST /admin/subjects
- GET/POST /admin/editors
- GET      /admin/users
- PATCH    /admin/users/{id}
- POST     /admin/users/{id}/topup
- GET      /admin/stats

### Questions (Editor)
- POST /questions/
- GET  /questions/test/{test_id}
- PUT  /questions/{id}
- DELETE /questions/{id}
