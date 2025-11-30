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
    const { data, error } = await supabase.from("designs").select("*");
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/designs", async (req, res) => {
  try {
    const { title, description, image_url } = req.body;
    const { data, error } = await supabase
      .from("designs")
      .insert([{ title, description, image_url }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    const { design_id, x, y } = req.body;
    const { data, error } = await supabase
      .from("pins")
      .insert([{ design_id, x, y }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
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
const admins = [
  { id: "admin001", username: "admin", password: "1720", email: "admin@whybox.com" },
];

app.post("/api/auth/admin/login", (req, res) => {
  const { username, password } = req.body;
  const admin = admins.find((a) => a.username === username && a.password === password);
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ success: true, user: { id: admin.id, username: admin.username, email: admin.email, role: "admin" } });
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
