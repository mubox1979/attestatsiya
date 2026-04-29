from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class RegisterIn(UserCreate):
    pass

class LoginIn(BaseModel):
    username: str
    password: str

class CreateEditorIn(BaseModel):
    username: str
    email: str
    password: str
    subject_id: int

class EditorOut(BaseModel):
    id: int
    username: str
    subject: str

class UpdateUserIn(BaseModel):
    is_active: Optional[bool] = None
    balance: Optional[float] = None
    role: Optional[str] = None

class UserUpdate(UpdateUserIn):
    pass

class UserOut(UserBase):
    id: int
    balance: float
    role: str
    subject_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SubjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class CreateSubjectIn(SubjectBase):
    pass

class SubjectCreate(SubjectBase):
    pass

class SubjectOut(SubjectBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class CategoryBase(BaseModel):
    name: str

class CategoryIn(CategoryBase):
    subject_id: int

class CategoryCreate(CategoryBase):
    subject_id: int

class CategoryOut(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class OptionBase(BaseModel):
    option_text: str
    is_correct: bool

class OptionIn(OptionBase):
    pass

class OptionOut(BaseModel):
    id: int
    text: str = Field(alias="option_text")
    is_correct: bool
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class OptionSimple(BaseModel):
    id: int
    text: str = Field(alias="option_text")
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class OptionResult(BaseModel):
    id: int
    is_correct: bool
    model_config = ConfigDict(from_attributes=True)

class QuestionBase(BaseModel):
    question_text: str
    image_url: Optional[str] = None
    category_id: Optional[int] = None

class QuestionCreate(QuestionBase):
    test_id: int
    options: List[OptionIn]

class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    options: Optional[List[OptionIn]] = None

class QuestionOut(QuestionBase):
    id: int
    options: List[OptionOut]
    model_config = ConfigDict(from_attributes=True)

class QuestionSimple(BaseModel):
    id: int
    text: str = Field(alias="question_text")
    image_url: Optional[str] = None
    options: List[OptionSimple]
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class TestBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: float = 5000.0
    duration_minutes: int = 120

class TestCreate(BaseModel):
    subject_id: int
    title: str
    description: Optional[str] = None
    duration_minutes: int = 120
    questions_count: int = 50
    price: float = 5000.0

class TestOut(TestBase):
    id: int
    subject_id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class TestListOut(TestOut):
    question_count: int

class AttemptAnswerBase(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None

class AttemptAnswerOut(AttemptAnswerBase):
    id: int
    is_correct: bool
    model_config = ConfigDict(from_attributes=True)

class AttemptBase(BaseModel):
    test_id: int

class AttemptOut(BaseModel):
    id: int
    test_title: str = ""
    score: Optional[float] = None
    total: Optional[int] = Field(alias="total_questions", default=None)
    started_at: datetime
    finished_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class AttemptReviewAnswer(BaseModel):
    question_text: str
    image_url: Optional[str] = None
    selected_option_id: Optional[int] = None
    is_correct: Optional[bool] = None
    options: List[OptionOut]

class AttemptReviewOut(BaseModel):
    score: Optional[float] = None
    total: Optional[int] = Field(alias="total_questions", default=None)
    answers: List[AttemptReviewAnswer]
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class TransactionBase(BaseModel):
    amount: float
    description: Optional[str] = None

class TransactionOut(TransactionBase):
    date: datetime = Field(alias="created_at")
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class RegisterOut(BaseModel):
    token: str
    user: UserOut

class LoginOut(BaseModel):
    token: str
    user: UserOut

class TopUpIn(BaseModel):
    amount: float

class TopUpOut(BaseModel):
    balance: float
    message: str

class AdminTopUpIn(BaseModel):
    amount: float
    description: Optional[str] = "Admin tomonidan to'ldirish"

class AdminStats(BaseModel):
    total_users: int
    total_editors: int
    total_subjects: int
    total_tests: int
    total_attempts: int

class StartTestOut(BaseModel):
    attempt_id: int
    duration_minutes: int
    questions: List[QuestionSimple]
    balance_after: float

class SubmitAnswerIn(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None

class FinishIn(BaseModel):
    answers: List[SubmitAnswerIn]

class FinishAnswerResult(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None
    is_correct: bool
    options: List[OptionResult]

class FinishOut(BaseModel):
    score: float
    total: int
    percent: float
    answers: List[FinishAnswerResult]
