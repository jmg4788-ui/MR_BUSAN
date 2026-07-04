import os
import uuid
import threading
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import List

# 1. FastAPI 인스턴스 생성
app = FastAPI(title="안전하고 강력한 Todo API")

# 전역 예외 처리기 등록: 예기치 못한 서버 오류 발생 시 서버가 죽지 않고 에러 JSON을 안전하게 반환합니다.
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[ERROR] 전역 예외 발생: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "서버 내부 오류가 발생했습니다. 나중에 다시 시도해 주세요.",
            "error": str(exc)
        }
    )

# CORS 미들웨어 추가: 프론트엔드와 백엔드의 다른 포트 간 통신을 허용합니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실습용이므로 모든 출처(Origin)의 접근을 허용합니다.
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE 등 모든 HTTP 메소드를 허용합니다.
    allow_headers=["*"],  # 모든 HTTP 헤더를 허용합니다.
)

# 2. 데이터 구조 정의 (Pydantic 모델)
class Todo(BaseModel):
    id: str          # UUID 문자열로 고유성 보장
    text: str        # 할 일 내용
    completed: bool  # 완료 여부 (True / False)

# 할 일을 생성할 때 입력받을 형식을 정의합니다.
class TodoCreate(BaseModel):
    # 빈 문자열 전송 방지 및 최대 100글자 제한
    text: str = Field(..., min_length=1, max_length=100, description="할 일 내용")

# 3. 인메모리(In-Memory) 데이터 저장소 및 동시성 제어용 락
todos_db: List[Todo] = []
db_lock = threading.Lock()

# 파일의 절대 경로 탐색 (실행 경로 의존성 제거)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_FILE_PATH = os.path.join(CURRENT_DIR, "todo_api.html")

# 서버 시작 시 HTML 캐싱하여 디스크 I/O 제거 및 속도 극대화 (안전하게 예외 처리 적용)
cached_html = ""
try:
    if os.path.exists(HTML_FILE_PATH):
        with open(HTML_FILE_PATH, "r", encoding="utf-8") as f:
            cached_html = f.read()
except Exception as e:
    print(f"[WARNING] cached_html 로드 중 오류 발생 (무시하고 계속 진행): {e}")

# 4. API 엔드포인트 정의 (CRUD 기능)

@app.get("/", response_class=HTMLResponse)
def read_root():
    """
    todo_api.html 파일을 읽어 HTML 화면을 서비스합니다.
    """
    if cached_html:
        return HTMLResponse(content=cached_html)
    return HTMLResponse(content="<h1>todo_api.html 파일을 찾을 수 없습니다.</h1>", status_code=404)

# [기능 1] 할 일 목록 조회 API
@app.get("/todos", response_model=List[Todo])
def get_todos():
    """
    현재 메모리에 등록된 모든 할 일 목록을 반환합니다. (Thread-safe)
    """
    with db_lock:
        return list(todos_db)  # 리스트 복사본 반환으로 레이스 컨디션 방지

# [기능 2] 할 일 추가 API
@app.post("/todos", response_model=Todo)
def create_todo(todo_in: TodoCreate):
    """
    새로운 할 일을 목록에 추가합니다. (Thread-safe)
    UUID를 사용해 중복 ID 생성을 방지합니다.
    """
    new_id = str(uuid.uuid4())
    
    new_todo = Todo(
        id=new_id,
        text=todo_in.text.strip(),  # 양끝 공백 제거
        completed=False  # 신규 등록은 기본적으로 완료되지 않은 상태(False)입니다.
    )
    
    with db_lock:
        todos_db.append(new_todo)
    return new_todo

# [기능 3] 할 일 완료 상태 변경 (Toggle) API
@app.put("/todos/{todo_id}", response_model=Todo)
def toggle_todo(todo_id: str):
    """
    특정 할 일(todo_id)의 완료 상태(completed)를 참/거짓으로 반전(Toggle)시킵니다. (Thread-safe)
    """
    with db_lock:
        for todo in todos_db:
            if todo.id == todo_id:
                todo.completed = not todo.completed
                return todo
            
    # 일치하는 ID가 없으면 404 예외를 발생시킵니다.
    raise HTTPException(status_code=404, detail="해당 할 일을 찾을 수 없습니다.")

# [기능 4] 할 일 삭제 API
@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: str):
    """
    특정 할 일(todo_id)을 메모리 리스트에서 완전히 제거합니다. (Thread-safe)
    """
    with db_lock:
        for index, todo in enumerate(todos_db):
            if todo.id == todo_id:
                todos_db.pop(index)
                return {"message": "성공적으로 삭제되었습니다.", "id": todo_id}
            
    # 일치하는 ID가 없으면 404 예외를 발생시킵니다.
    raise HTTPException(status_code=404, detail="해당 할 일을 찾을 수 없습니다.")
