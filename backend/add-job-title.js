const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addJobTitleColumn() {
  try {
    console.log("🔍 Checking if job_title column exists in users table...");
    
    // users 테이블에서 데이터 조회
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .limit(1);
    
    if (error) {
      console.error("❌ Error:", error.message);
      return;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log("✅ Users table columns:", columns);
      
      if (!columns.includes("job_title")) {
        console.log("\n⚠️ job_title column is MISSING!");
        console.log("\nRun this SQL in Supabase SQL Editor to add it:");
        console.log(`
ALTER TABLE public.users
ADD COLUMN job_title TEXT DEFAULT '';
        `);
      } else {
        console.log("✅ job_title column already exists");
      }
    } else {
      console.log("📝 Users table is empty");
      console.log("\nRun this SQL in Supabase SQL Editor:");
      console.log(`
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS job_title TEXT DEFAULT '';
      `);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

addJobTitleColumn();
