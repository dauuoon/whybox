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
    const { data: designs, error: designsError } = await supabase.from("designs").select("*");
    if (designsError) throw designsError;
    
    // 모든 핀 가져오기
    const { data: allPins, error: pinsError } = await supabase.from("pins").select("*");
    if (pinsError) throw pinsError;
    
    // 프론트엔드 형식으로 변환
    const result = (designs || []).map(d => {
      // 이 설계의 핀들만 필터링
      const designPins = (allPins || []).filter(p => p.design_id === d.id).map(p => ({
        id: p.id,
        designId: p.design_id,
        x: p.x,
        y: p.y,
        text: p.text
      }));
      
      return {
        id: d.id,
        imageUrl: d.image_url,
        category: d.title,
        notes: d.description,
        date: d.created_at ? new Date(d.created_at).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR'),
        status: d.status || '질문생성중',
        pins: designPins,
        title: d.title,
        description: d.description,
        image_url: d.image_url,
        userName: d.user_name,
        userId: d.user_id
      };
    });
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

app.patch("/api/designs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image_url } = req.body;
    const { data, error } = await supabase
      .from("designs")
      .update({ title, description, image_url })
      .eq("id", id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    const { status } = req.body;
    const { data, error } = await supabase
      .from("designs")
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
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
    const { data, error } = await supabase.from("pins").select("*");
    if (error) throw error;
    res.json(data || []);
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
    const { data, error } = await supabase.from("comments").select("*");
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
    const { text } = req.body;
    const { data, error } = await supabase
      .from("comments")
      .insert([{ pin_id: parseInt(pinId), text }])
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
        jobTitle: user.jobTitle, 
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
        jobTitle: jobTitle || ''
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
      .update({ username, email, name, experience, jobTitle })
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
app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ WHY BOX Backend - Supabase Connected");
  console.log("Port:", PORT);
  console.log("DB: Supabase PostgreSQL");
});
