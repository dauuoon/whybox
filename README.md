# WHY BOX - 디자인 피드백 시스템

프론트엔드와 백엔드를 함께 구성한 디자인 피드백 플랫폼입니다.

## 📁 폴더 구조

```
WHY-BOX/
├── frontend/       # React + Vite 프론트엔드
├── backend/        # Express.js 백엔드
├── .env.local      # 로컬 개발 환경 변수
├── .gitignore
└── README.md
```

## 🚀 시작하기

### 로컬 개발 (Local)

#### 터미널 1: 백엔드 실행
```bash
cd backend
npm install
npm start
```

#### 터미널 2: 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```

- 프론트엔드: http://localhost:3002 (Vite 기본 포트)
- 백엔드 API: http://localhost:3000/api

### Replit 배포

1. GitHub에 푸시 후 Replit에서 import
2. Replit의 `.env` 설정:
   ```
   VITE_API_URL=https://your-replit-name.replit.dev/api
   NODE_ENV=production
   ```

## 🛠️ 기술 스택

- **Frontend**: React 18, TypeScript, Vite, CSS
- **Backend**: Express.js, SQLite3, CORS
- **Deployment**: Replit (자동 배포)

## 📝 API 엔드포인트

- `GET /api/health` - 헬스 체크
- `GET /api/designs` - 디자인 목록
- `GET /api/designs/:id` - 디자인 상세
- `POST /api/comments` - 댓글 추가
- 등등...

## ⚙️ 환경 변수

### 로컬 (.env.local)
```
VITE_API_URL=http://localhost:3000/api
```

### Replit (.env)
```
VITE_API_URL=https://your-replit-url/api
PORT=3000
```

---

**개발자**: dawoonkim
