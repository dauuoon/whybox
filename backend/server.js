const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

// Supabase 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS 설정
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: false,
};

app.use(cors(corsOptions));

app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  res.sendStatus(200);
});

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

const PORT = process.env.PORT || 3000;

// Health checks
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "WHY BOX Backend", db: "Supabase" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "WHY BOX Backend", db: "Supabase" });
});

app.get("/api", (req, res) => {
  res.json({ status: "ok", message: "WHY BOX API v2.0", db: "Supabase" });
});

// Designs API
app.get("/api/designs", async (req, res) => {
  try {
    const { userId, limit = 20 } = req.query;
    
    let query = supabase
      .from("designs")
      .select("*")
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    // userId가 전달되면 해당 사용자의 설계만 조회
    if (userId) {
      query = query.eq("user_id", userId);
    }
    
    const { data: designs, error: designsError } = await query;
    if (designsError) {
      console.error("Designs query error:", designsError);
      throw designsError;
    }
    
    if (!designs || designs.length === 0) {
      return res.json([]);
    }
    
    // 간단한 응답으로 변환 (핀과 댓글 제외)
    const result = designs.map(d => ({
      id: d.id,
      imageUrl: d.image_url,
      category: d.title,
      notes: d.description,
      date: d.created_at ? new Date(d.created_at).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR'),
      status: d.status || '질문생성중',
      pins: [], // 빈 배열로 초기화
      title: d.title,
      description: d.description,
      image_url: d.image_url,
      userName: d.user_name,
      userId: d.user_id,
      questionCreatedAt: d.question_created_at,
      answerSubmittedAt: d.answer_submitted_at,
      finalFeedbackCompletedAt: d.final_feedback_completed_at,
      feedback: d.feedback
    }));
    
    res.json(result);
  } catch (err) {
    console.error("GET /api/designs error:", err);
    res.status(500).json({ error: err.message, details: err });
  }
});

app.post("/api/designs", async (req, res) => {
  try {
    const { imageUrl, category, date, status, notes, userName, userId } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: "Missing required fields: imageUrl" });
    }
    const { data, error } = await supabase
      .from("designs")
      .insert([{ 
        title: category || "Untitled",
        description: notes || "",
        image_url: imageUrl,
        user_name: userName || "Unknown",
        user_id: userId || "unknown"
      }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("POST /api/designs error:", err);
    res.status(500).json({ error: err.message, details: err });
  }
});

// 특정 디자인 상세 조회 (핀, 댓글 포함)
app.get("/api/designs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // 디자인 조회
    const { data: design, error: designError } = await supabase
      .from("designs")
      .select("*")
      .eq("id", parseInt(id))
      .single();
    
    if (designError) throw designError;
    if (!design) {
      return res.status(404).json({ error: "Design not found" });
    }
    
    // 해당 디자인의 핀 조회
    const { data: pins, error: pinsError } = await supabase
      .from("pins")
      .select("*")
      .eq("design_id", parseInt(id));
    
    if (pinsError) throw pinsError;
    
    // 핀의 댓글 조회
    const pinIds = (pins || []).map(p => p.id);
    let comments = [];
    if (pinIds.length > 0) {
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .in("pin_id", pinIds);
      if (commentsError) throw commentsError;
      comments = commentsData || [];
    }
    
    // 댓글 맵 생성
    const commentsMap = {};
    comments.forEach(c => {
      if (!commentsMap[c.pin_id]) {
        commentsMap[c.pin_id] = [];
      }
      commentsMap[c.pin_id].push(c);
    });
    
    // 핀에 댓글 포함
    const pinsWithComments = (pins || []).map(p => ({
      id: p.id,
      designId: p.design_id,
      x: p.x,
      y: p.y,
      text: p.text,
      comments: commentsMap[p.id] || []
    }));
    
    // 응답 구성
    const result = {
      id: design.id,
      imageUrl: design.image_url,
      category: design.title,
      notes: design.description,
      date: design.created_at ? new Date(design.created_at).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR'),
      status: design.status || '질문생성중',
      pins: pinsWithComments,
      title: design.title,
      description: design.description,
      image_url: design.image_url,
      userName: design.user_name,
      userId: design.user_id,
      questionCreatedAt: design.question_created_at,
      answerSubmittedAt: design.answer_submitted_at,
      finalFeedbackCompletedAt: design.final_feedback_completed_at,
      feedback: design.feedback
    };
    
    res.json(result);
  } catch (err) {
    console.error("GET /api/designs/:id error:", err);
    res.status(500).json({ error: err.message, details: err });
  }
});

app.patch("/api/designs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image_url, feedback, status, finalFeedbackCompletedAt } = req.body;
    
    console.log('PATCH /api/designs/:id called with:', { id, status, feedback });
    
    // 업데이트할 필드 구성
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (image_url) updateData.image_url = image_url;
    if (feedback) updateData.feedback = feedback;
    if (status) {
      updateData.status = status;
      // 상태 변경 시 날짜 자동 저장
      const now = new Date();
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
      if (status === '질문생성완료') {
        updateData.question_created_at = dateStr;
      } else if (status === '답변전송완료') {
        updateData.answer_submitted_at = dateStr;
      } else if (status === '최종피드백완료') {
        updateData.final_feedback_completed_at = finalFeedbackCompletedAt || dateStr;
      }
    }
    
    console.log('Update data:', updateData);
    
    const { data, error } = await supabase
      .from("designs")
      .update(updateData)
      .eq("id", parseInt(id))
      .select();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Update successful:', data);
    res.json(data[0] || { success: true });
  } catch (err) {
    console.error("PATCH /api/designs/:id error:", err);
    res.status(500).json({ error: err.message, details: err });
  }
});

app.delete("/api/designs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("designs").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 설계 상태 변경
app.patch("/api/designs/:designId/status", async (req, res) => {
  try {
    const { designId } = req.params;
    const { status, answerSubmittedAt, questionCreatedAt, finalFeedbackCompletedAt } = req.body;
    
    // 업데이트할 필드 구성
    const updateData = { status };
    if (answerSubmittedAt) updateData.answer_submitted_at = answerSubmittedAt;
    if (questionCreatedAt) updateData.question_created_at = questionCreatedAt;
    if (finalFeedbackCompletedAt) updateData.final_feedback_completed_at = finalFeedbackCompletedAt;
    
    const { data, error } = await supabase
      .from("designs")
      .update(updateData)
      .eq("id", parseInt(designId))
      .select();
    if (error) throw error;
    res.json(data[0] || { success: true });
  } catch (err) {
    console.error("PATCH /api/designs/:designId/status error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Pins API
app.get("/api/pins", async (req, res) => {
  try {
    const { limit = 200 } = req.query;
    const { data: pins, error: pinsError } = await supabase
      .from("pins")
      .select("*")
      .limit(parseInt(limit));
    if (pinsError) throw pinsError;
    
    // 모든 댓글 가져오기
    const { data: comments, error: commentsError } = await supabase.from("comments").select("*");
    if (commentsError) throw commentsError;
    
    // 각 핀에 댓글 추가
    const pinsWithComments = (pins || []).map(pin => ({
      ...pin,
      comments: (comments || []).filter(c => c.pin_id === pin.id)
    }));
    
    res.json(pinsWithComments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/pins", async (req, res) => {
  try {
    const { design_id, x, y, text } = req.body;
    const { data, error } = await supabase
      .from("pins")
      .insert([{ design_id, x, y, text: text || "" }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 특정 설계의 핀 추가 (관리자 패널용)
app.post("/api/designs/:designId/pins", async (req, res) => {
  try {
    const { designId } = req.params;
    const { x, y, text } = req.body;
    const { data, error } = await supabase
      .from("pins")
      .insert([{ design_id: parseInt(designId), x, y, text: text || "" }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("POST /api/designs/:designId/pins error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/pins/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("pins").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comments API
app.get("/api/comments", async (req, res) => {
  try {
    const { limit = 500 } = req.query;
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .limit(parseInt(limit));
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/comments", async (req, res) => {
  try {
    const { pin_id, text } = req.body;
    const { data, error } = await supabase
      .from("comments")
      .insert([{ pin_id, text }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 특정 핀의 댓글 추가
app.post("/api/designs/:designId/pins/:pinId/comments", async (req, res) => {
  try {
    const { pinId } = req.params;
    const { text, author } = req.body;
    const { data, error } = await supabase
      .from("comments")
      .insert([{ pin_id: parseInt(pinId), text, author: author || '사용자' }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("POST /api/designs/:designId/pins/:pinId/comments error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/comments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 댓글 피드백 추가
app.patch("/api/designs/:designId/pins/:pinId/comments/:commentId/feedback", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { feedbackText } = req.body;
    
    const { data, error } = await supabase
      .from("comments")
      .update({ admin_feedback: feedbackText })
      .eq("id", parseInt(commentId))
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error("PATCH feedback error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Admin Login
app.post("/api/auth/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("username", username);
    
    if (error) throw error;
    if (!data || data.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    
    const admin = data[0];
    if (admin.password !== password) return res.status(401).json({ error: "Invalid credentials" });
    
    res.json({ 
      success: true, 
      user: { 
        id: admin.id, 
        username: admin.username, 
        email: admin.email, 
        role: "admin" 
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/user/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username);
    
    if (error) throw error;
    if (!data || data.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    
    const user = data[0];
    if (user.password !== password) return res.status(401).json({ error: "Invalid credentials" });
    
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        name: user.name, 
        experience: user.experience, 
        jobTitle: user.jobtitle || '',
        role: "user" 
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ Admins API ============
app.get("/api/admins", async (req, res) => {
  try {
    const { data, error } = await supabase.from("admins").select("*");
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admins", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const { data, error } = await supabase
      .from("admins")
      .insert([{
        id: `admin${Date.now()}`,
        username,
        password,
        email,
        created_at: new Date().toISOString()
      }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/admins/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;
    const { data, error } = await supabase
      .from("admins")
      .update({ username, email })
      .eq("id", id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: "Admin not found" });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admins/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("admins")
      .delete()
      .eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ Users API ============
app.get("/api/users", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { username, password, email, name, experience, jobTitle } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Missing required fields: username, password" });
    }
    const { data, error } = await supabase
      .from("users")
      .insert([{
        id: `user${Date.now()}`,
        username,
        password,
        email: email || `${username}@whybox.com`,
        name: name || '',
        experience: experience || '',
        jobtitle: jobTitle || ''
      }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, name, experience, jobTitle } = req.body;
    const { data, error } = await supabase
      .from("users")
      .update({ username, email, name, experience, jobtitle: jobTitle })
      .eq("id", id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log("✅ WHY BOX Backend - Supabase Connected");
  console.log("Server running on port:", PORT);
  console.log("DB: Supabase PostgreSQL");
  console.log("Server is ready to accept connections");
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});
