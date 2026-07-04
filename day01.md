# 바이브코딩 1일차

## VibeCoding with Codex/Cursor/Claude Code / Gemini

### AI에게 제대로 코딩을 시키자

#### 1.핵심개념

코딩을 직접 작성 하지 말것.<BR>AI와 협업해서 새로운 프로그램을 만들자

##### 기본 개발방식

요구사항 분석 > 설계 (DB/UI포함) > 구현/디버깅 > 테스트>배포>유지보수

##### 바이브코딩 방식

요구사항정의(PRD) / 사람 > 코드생성 /AI > 디버깅, 테스트 / AI > 검증 및 수정/사람 > 배포 / 사람

##### 핵심 포인트

- AI 주니어? 시니어 개발자!
- 사람 - PM + 리뷰어

#### TIP
문맥의 토큰을 어떻게 분리 하는지 확인
https://platform.openai.com/tokenizer

#### 2. 바이브코딩 개발환경

여러방식 존재. 나에게 맞는 방법을 찾기

##### CLI 코딩 방식

콘솔(터미널 파워쉘 bash 등)에서 바이브 코딩을 수행

- node.js 패키지 모듈 명령어(npm)로 설치
- https://nodejs.org/ko/download
- C:\Program Files\nodejs\
- 

###### ChatGPT - OpenAI Codex CLI
설치
```powershell
> npm install -g @openai/codex
```
사용
```powershell
> codex
```

###### Gemini CLI
설치
```powershell
> npm install -g @google/gemini-cli
```
사용
```powershell
> gemini 
```

###### ClaudeCode CLI
```powershell
# 설치
> npm install -g @anthropic-ai/claude-code
# 사용
> claude 
```

##### 웹브라우저 LLM 사용 방식

ChatGPT, 클로드, 잼민이 등 사이트 접속해서 바이브 코딩

##### IDE 툴 확장툴 사용 방식

VS Code (insider) 확장 설치 바이브코딩

###### Codex

- 확장 > Codex 검색 > Open AI Codex 설치

#### 3. 바이브코딩 시작

##### 프롬프트 가이드

- LLM에 질문을 던지는 컨텍스트
- 간결한 프롬프트로 처리할 것
    - '주의를 살펴서 조심스럽게', '자세히' 단어 사용 금지
    - '수정해줘', '분석해줘' 등 명령형태로 작성

##### 프롬프트 종류

- 제로샷 프롬프트 - 아무 예제 없이 AI와 코딩 시작

- 원샷 프롬프트 - 1개 예제로 시작

- 퓨샷 프롬프트 - 2~5개 정도 예제 제시

##### Gemini 웹브라우저 바이브 코딩

- 프롬프트는 명령이 아니고 설계도, 지시를 잘못하면 결과도 이상하게 나옴
```bash
# 나쁜 예
> 로그인을 만들어줘

# 좋은 예
> 로그인 기능을 만들어줘, Python으로
```

- 좀 더 개선된 프롬프트 작성 필요

```bash
# 개선 1차 - 원샷 프롬프트
> 

너는 백엔드 개발자야

사용자 로그인 기능을 만들어줘. Python FastApi 사용해줘.
```

- 더욱 개선된 퓨샷 프롬프트 작성

```bash
>
너는 백엔드 개발자야.

사용자 로그인 API를 만들어줘.
- Python FastAPI 사용
- JWT 인증, OAuth2
- 예외처리 포함
```

###### 웹 브라우저 프롬프트 사용 바이브 코딩 단점

- 나온 결과를 직접 구성. 폴더, 파일 개발자가 수동으로 처리
- 디버깅이 개발툴과 웹브라우저 LLM 사이에서 전환하면서 처리
- CLI나 IDE 툴 확장으로 좀 더 편하게 바이브코딩 하자

##### Codex, API 사용 바이브 코딩

- VS Code 등의 IDE툴 사용해서 개발환경 구성
- AI가 직접 폴더나 파일을 제어 가능
- 디버깅도 실시간으로 가능, 배포도 AI가 가능

###### 에이전틱 코딩 - 바이브 코딩 실습

- HTML, Javascript, CSS를 사용한 간단한 Todo 리스트 프로그램
- 프롬프트 영역에 작성시 Shift+Enter 로 여러줄 작성
- Enter는 실행

```markdown
현재 Antigravity IDE 툴에 Live Server 확장을 설치해줘
```

```markdown
좋아. Live Server로 방금 작성한 todo.html을 실행해줘
```
- 서버 실행이 실패 할 수도 있음.

###### VibeCoding 실습 - Todo 리스트 개선

- Python 웹서비스와 연계

- Python 가상환경 설치 및 실행

```powershell
# Python 가상환경 설치
> python -m venv venv
# 가상환경 활성화
> .\venv\Scripts\Activate.ps1
(venv) >
```

```markdown
너는 백엔드 개발자야

python FastAPI로 간단한 Todo API를 만들어줘

요구사항
- 할 일 목록 조회
- 할 일 추가
- 할 일 완료 상태 변경
- 할 일 삭제
- 데이터는 메모리 리스트에 저장(DB사용 아님)
- 초보자도 이해하기 쉽게 작성
- 실행 방법도 같이 설명
```

##### 다음 진행할 것

- 실제 DB와 연동해서 데이터를 DB에 저장하는 기능 구현


#### 5. PRD.md

- Product Requirments Document의 약자. 제품 요구사항 정의서
- 마크다운으로 작성. 필요한 경우는 이미지도 포함

##### 퍼즐게임 PRD 예시

```markdown
## 프로젝트: 간단한 퍼즐 게임

### 목표:
- 브라우저에서 실행되는 퍼즐 게임

### 기능:
- 퍼즐 보드 표시
- 클릭 이벤트 처리
- 클리어 조건 판단

### 기술:
- HTML, CSS, JavaScript
- 하나의 index.html 파일

### 대상:
- 코딩 초보자
```

```markdown
> day1\puzzle_game\prd.md 파일 참조해서 만들어줘. UI는 ui.png 파일을 확인해서 만들어줘.
```

##### 분석

- AI가 생성한 소스코드를 확인
- 소스코드 > context menu > add to codex thread 선택
- 범위 선택 > Ctrl + L
- 오류(예외) 발생하는 코드 영역을 선택, Codex Thread 등 전달 뒤 분석 요청

##### 리팩토링

- 원본 소스를 분석해서 좀 더 개선된 로직으로 변경하는 것

```markdown
현재 index.html을 더 깔끔하게 리팩토링 해줘.
조건
- 기능은 유지
- 함수 최대한 분리
- 변수명 SnakeCasing으로 변경
- 초보자도 이해 가능하게
- JS scripts에 주석 최대한 작성
- 변경 이유 설명
```

- 원본파일 탐색기에서 context menu > 비교를 위해서 선택
- 리팩토링할 파일 탐색기에서 context menu > 비교를 위해서 선택 > 비교 결과

##### 예외처리

- 실행 중 발생하는 오류
- 예외 발생하는 구문을 AI에게 질의

##### 구조변경

- 게임 쪼끔 바꾸기

```markdown
 현재 index.html을 16칸 퍼즐 게임으로 바꿔줘.

 조건
 - 등등등 
```

##### 코드 설명 요청

```markdown
index.html 자바스크립트 코드에 대해서 블록단위로 자세히 설명해줘.

- 외부 라이브러리 확인
- 엔트리 포인트 확인
- 변수 선언 확인
- 이벤트리스너 확인
- 실행 흐름
```

