const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingColumns() {
  try {
    console.log("🔍 Checking users table structure...");
    
    // users 테이블에서 데이터 조회하여 스키마 확인
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .limit(1);
    
    if (error) {
      console.error("❌ Error checking users table:", error.message);
      return;
    }

    console.log("✅ Users table exists");
    
    // 현재 컬럼 확인
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log("📋 Current columns:", columns);
      
      if (!columns.includes("jobTitle")) {
        console.log("⚠️ jobTitle column is missing!");
        console.log("\nRun this SQL in Supabase SQL Editor:");
        console.log(`
ALTER TABLE public.users
ADD COLUMN jobTitle TEXT DEFAULT '';
        `);
      } else {
        console.log("✅ jobTitle column already exists");
      }
    } else {
      console.log("📝 Table is empty, creating test user to check schema...");
      console.log("\nRun this SQL in Supabase SQL Editor:");
      console.log(`
ALTER TABLE public.users
ADD COLUMN jobTitle TEXT DEFAULT '';
      `);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

addMissingColumns();
