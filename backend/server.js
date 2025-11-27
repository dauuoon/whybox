const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS 설정 (로컬 + Replit)
const corsOrigins = NODE_ENV === 'production'
  ? [/^https:\/\/.*\.replit\.dev$/, /^https:\/\/.*\.replit\.com$/] // Replit 도메인 패턴
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:5173', 'http://localhost:5174'];

// Middleware
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// CSP 헤더 제거 (개발 환경)
app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  next();
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// ============ API 라우트 ============

// 건강 확인
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'WHY BOX 백엔드 서버 실행 중',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// ============ 메모리 데이터 스토어 (현재) ============
let designs = [];
let users = [];
let admins = [];

// 기본 관리자 및 사용자 계정 초기화
const initUsers = () => {
  admins = [
    { id: 'admin001', username: 'admin', password: '1720', email: 'admin@whybox.com', createdAt: new Date().toISOString() }
  ];
  users = [
    { 
      id: 'user001', 
      username: 'testuser', 
      password: '1234', 
      email: 'user@whybox.com',
      name: '테스트 사용자',
      experience: '5년',
      jobTitle: '주임 디자이너',
      createdAt: new Date().toISOString() 
    }
  ];
  console.log('✅ 관리자/사용자 계정 초기화 완료');
};

// 테스트 데이터 초기화 (개발용)
const initTestData = () => {
  designs = [];
  console.log('✅ 디자인 데이터 초기화 완료');
};

// 서버 시작 시 테스트 데이터 초기화
initUsers();
initTestData();

// 디자인 목록 조회
app.get('/api/designs', (req, res) => {
  res.json(designs);
});

// 디자인 상세 조회
app.get('/api/designs/:id', (req, res) => {
  const design = designs.find(d => d.id === req.params.id);
  if (!design) return res.status(404).json({ error: 'Design not found' });
  res.json(design);
});

// 디자인 생성
app.post('/api/designs', (req, res) => {
  console.log('📨 POST /api/designs 요청 받음:', req.body);
  const newDesign = {
    id: Date.now().toString(),
    ...req.body,
    pins: [],
    createdAt: new Date().toISOString()
  };
  console.log('✅ 생성된 디자인:', newDesign);
  designs.push(newDesign);
  res.json(newDesign);
});

// 디자인 상태 변경
app.patch('/api/designs/:id/status', (req, res) => {
  const design = designs.find(d => d.id === req.params.id);
  if (!design) return res.status(404).json({ error: 'Design not found' });
  design.status = req.body.status;
  res.json(design);
});

// 디자인 수정 (피드백 저장 등)
app.patch('/api/designs/:id', (req, res) => {
  const design = designs.find(d => d.id === req.params.id);
  if (!design) return res.status(404).json({ error: 'Design not found' });
  
  // feedback 필드 업데이트
  if (req.body.feedback !== undefined) {
    design.feedback = req.body.feedback;
  }
  
  // status 필드 업데이트
  if (req.body.status !== undefined) {
    design.status = req.body.status;
  }
  
  res.json(design);
});

// 디자인 삭제
app.delete('/api/designs/:id', (req, res) => {
  const index = designs.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Design not found' });
  const deleted = designs.splice(index, 1);
  res.json(deleted[0]);
});

// ============ 핀(Pin) API ============

// 핀 생성
app.post('/api/designs/:designId/pins', (req, res) => {
  console.log('📍 POST /api/designs/:designId/pins 요청:', req.params.designId);
  console.log('📍 현재 저장된 디자인 ID들:', designs.map(d => d.id));
  const design = designs.find(d => d.id === req.params.designId);
  if (!design) {
    console.log('❌ 디자인을 찾을 수 없음:', req.params.designId);
    return res.status(404).json({ error: 'Design not found' });
  }
  
  const newPin = {
    id: Date.now().toString(),
    ...req.body,
    comments: [],
    createdAt: new Date().toISOString()
  };
  
  if (!design.pins) design.pins = [];
  design.pins.push(newPin);
  
  console.log('✅ 핀 생성 완료:', newPin);
  res.json(newPin);
});

// 핀 삭제
app.delete('/api/designs/:designId/pins/:pinId', (req, res) => {
  console.log('📍 DELETE /api/designs/:designId/pins/:pinId 요청');
  const design = designs.find(d => d.id === req.params.designId);
  if (!design) return res.status(404).json({ error: 'Design not found' });
  
  if (!design.pins) design.pins = [];
  const pinIndex = design.pins.findIndex(p => p.id === req.params.pinId);
  if (pinIndex === -1) return res.status(404).json({ error: 'Pin not found' });
  
  const deletedPin = design.pins.splice(pinIndex, 1);
  
  console.log('✅ 핀 삭제 완료:', deletedPin[0]);
  res.json(deletedPin[0]);
});

// ============ 댓글(Comment) API ============

// 댓글 생성
app.post('/api/designs/:designId/pins/:pinId/comments', (req, res) => {
  console.log('💬 POST /api/designs/:designId/pins/:pinId/comments 요청:', req.body);
  const design = designs.find(d => d.id === req.params.designId);
  if (!design) return res.status(404).json({ error: 'Design not found' });
  
  if (!design.pins) design.pins = [];
  const pin = design.pins.find(p => p.id === req.params.pinId);
  if (!pin) return res.status(404).json({ error: 'Pin not found' });
  
  const newComment = {
    id: Date.now().toString(),
    ...req.body,
    timestamp: new Date().toISOString()
  };
  
  if (!pin.comments) pin.comments = [];
  pin.comments.push(newComment);
  
  console.log('✅ 댓글 생성 완료:', newComment);
  res.json(newComment);
});

// 댓글 삭제
app.delete('/api/designs/:designId/pins/:pinId/comments/:commentId', (req, res) => {
  console.log('💬 DELETE /api/designs/:designId/pins/:pinId/comments/:commentId 요청');
  const design = designs.find(d => d.id === req.params.designId);
  if (!design) return res.status(404).json({ error: 'Design not found' });
  
  if (!design.pins) design.pins = [];
  const pin = design.pins.find(p => p.id === req.params.pinId);
  if (!pin) return res.status(404).json({ error: 'Pin not found' });
  
  if (!pin.comments) pin.comments = [];
  const commentIndex = pin.comments.findIndex(c => c.id === req.params.commentId);
  if (commentIndex === -1) return res.status(404).json({ error: 'Comment not found' });
  
  const deletedComment = pin.comments.splice(commentIndex, 1);
  
  console.log('✅ 댓글 삭제 완료:', deletedComment[0]);
  res.json(deletedComment[0]);
});

// 댓글(답변)에 대한 피드백 저장
app.patch('/api/designs/:designId/pins/:pinId/comments/:commentId/feedback', (req, res) => {
  console.log('💬 PATCH /api/designs/:designId/pins/:pinId/comments/:commentId/feedback 요청:', req.body);
  console.log('💬 요청 파라미터:', { designId: req.params.designId, pinId: req.params.pinId, commentId: req.params.commentId });
  
  const design = designs.find(d => d.id === req.params.designId);
  if (!design) {
    console.log('❌ 디자인 찾을 수 없음:', req.params.designId);
    return res.status(404).json({ error: 'Design not found' });
  }
  
  if (!design.pins) design.pins = [];
  const pin = design.pins.find(p => p.id === req.params.pinId);
  if (!pin) {
    console.log('❌ 핀 찾을 수 없음:', req.params.pinId);
    console.log('💬 현재 핀 ID들:', design.pins.map(p => p.id));
    return res.status(404).json({ error: 'Pin not found' });
  }
  
  if (!pin.comments) pin.comments = [];
  console.log('💬 현재 댓글 ID들:', pin.comments.map(c => c.id));
  const comment = pin.comments.find(c => c.id === req.params.commentId);
  if (!comment) {
    console.log('❌ 댓글 찾을 수 없음:', req.params.commentId);
    return res.status(404).json({ error: 'Comment not found' });
  }
  
  // 관리자 피드백 저장
  comment.adminFeedback = {
    text: req.body.feedbackText,
    timestamp: new Date().toISOString()
  };
  
  console.log('✅ 댓글 피드백 저장 완료:', comment);
  res.json(comment);
});

// ============ 인증 API ============

// 관리자 로그인
app.post('/api/auth/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = admins.find(a => a.username === username && a.password === password);
  
  if (!admin) {
    return res.status(401).json({ error: '관리자 인증 정보가 일치하지 않습니다.' });
  }
  
  res.json({ 
    success: true, 
    user: { id: admin.id, username: admin.username, email: admin.email, role: 'admin' }
  });
});

// 사용자 로그인
app.post('/api/auth/user/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: '사용자 인증 정보가 일치하지 않습니다.' });
  }
  
  res.json({ 
    success: true, 
    user: { id: user.id, username: user.username, name: user.name, experience: user.experience, jobTitle: user.jobTitle, role: 'user' }
  });
});

// 관리자 계정 조회
app.get('/api/admins', (req, res) => {
  res.json(admins.map(a => ({ id: a.id, username: a.username, email: a.email, createdAt: a.createdAt })));
});

// 사용자 계정 조회
app.get('/api/users', (req, res) => {
  res.json(users.map(u => ({ 
    id: u.id, 
    username: u.username, 
    name: u.name,
    experience: u.experience,
    jobTitle: u.jobTitle,
    createdAt: u.createdAt 
  })));
});

// 관리자 계정 생성
app.post('/api/admins', (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password || !email) {
    return res.status(400).json({ error: '필수 정보를 입력하세요.' });
  }
  
  if (admins.find(a => a.username === username)) {
    return res.status(400).json({ error: '이미 존재하는 관리자 아이디입니다.' });
  }
  
  const newAdmin = {
    id: 'admin-' + Date.now(),
    username,
    password,
    email,
    createdAt: new Date().toISOString()
  };
  
  admins.push(newAdmin);
  res.json({ success: true, admin: { id: newAdmin.id, username: newAdmin.username, email: newAdmin.email } });
});

// 사용자 계정 생성
app.post('/api/users', (req, res) => {
  const { username, password, name, experience, jobTitle } = req.body;
  
  if (!username || !password || !name || !experience || !jobTitle) {
    return res.status(400).json({ error: '모든 필수 정보를 입력하세요.' });
  }
  
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: '이미 존재하는 사용자 아이디입니다.' });
  }
  
  const newUser = {
    id: 'user-' + Date.now(),
    username,
    password,
    name,
    experience,
    jobTitle,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  res.json({ success: true, user: { id: newUser.id, username: newUser.username, name: newUser.name, experience: newUser.experience, jobTitle: newUser.jobTitle } });
});

// 관리자 계정 삭제
app.delete('/api/admins/:id', (req, res) => {
  const index = admins.findIndex(a => a.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: '관리자를 찾을 수 없습니다.' });
  }
  
  const deleted = admins.splice(index, 1);
  res.json({ success: true, admin: deleted[0] });
});

// 사용자 계정 삭제
app.delete('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  }
  
  const deleted = users.splice(index, 1);
  res.json({ success: true, user: deleted[0] });
});

// 관리자 계정 수정
app.patch('/api/admins/:id', (req, res) => {
  const { username, password, email } = req.body;
  const admin = admins.find(a => a.id === req.params.id);
  
  if (!admin) {
    return res.status(404).json({ error: '관리자를 찾을 수 없습니다.' });
  }
  
  if (username && username !== admin.username && admins.find(a => a.username === username)) {
    return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
  }
  
  if (username) admin.username = username;
  if (password) admin.password = password;
  if (email) admin.email = email;
  
  res.json({ success: true, admin });
});

// 사용자 계정 수정
app.patch('/api/users/:id', (req, res) => {
  const { username, password, name, experience, jobTitle } = req.body;
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  }
  
  if (username && username !== user.username && users.find(u => u.username === username)) {
    return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
  }
  
  if (username) user.username = username;
  if (password) user.password = password;
  if (name) user.name = name;
  if (experience) user.experience = experience;
  if (jobTitle) user.jobTitle = jobTitle;
  
  res.json({ success: true, user });
});

// ============ 서버 시작 ============
app.listen(PORT, () => {
  console.log(`✅ WHY BOX 백엔드 서버 실행 중`);
  console.log(`📡 포트: ${PORT}`);
  console.log(`🌍 환경: ${NODE_ENV}`);
  console.log(`🏥 상태 확인: http://localhost:${PORT}/api/health`);
  console.log(`📋 API: http://localhost:${PORT}/api`);
});
