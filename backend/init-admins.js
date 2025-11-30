const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeAdmins() {
  try {
    console.log("🔍 Checking if admins table exists...");
    
    // 기존 admins 데이터 확인
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .limit(1);
    
    if (error && error.code === "PGRST116") {
      // 테이블이 없음
      console.log("⚠️ Admins table does not exist. Need to create it manually via Supabase console.");
      console.log("\nRun this SQL in Supabase SQL Editor:");
      console.log(`
CREATE TABLE public.admins (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 초기 관리자 계정 추가
INSERT INTO public.admins (id, username, password, email, created_at)
VALUES ('admin001', 'admin', '1720', 'admin@whybox.com', CURRENT_TIMESTAMP);
      `);
      return;
    } else if (error) {
      throw error;
    }
    
    // 테이블 존재함 - 초기 데이터 확인
    if (!data || data.length === 0) {
      console.log("📝 Creating default admin account...");
      const { data: insertData, error: insertError } = await supabase
        .from("admins")
        .insert([{
          id: "admin001",
          username: "admin",
          password: "1720",
          email: "admin@whybox.com"
        }])
        .select();
      
      if (insertError) throw insertError;
      console.log("✅ Default admin account created:", insertData[0]);
    } else {
      console.log("✅ Admins table already exists with data:", data);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

initializeAdmins();
