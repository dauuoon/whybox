const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addUpdatedAtColumn() {
  try {
    console.log("🔍 Checking designs table structure...");
    
    // 테이블 컬럼 확인
    const { data, error } = await supabase
      .from("designs")
      .select("*")
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    // 테이블이 존재하는지 확인하기 위해 한 줄을 가져옴
    if (data && data.length > 0) {
      const firstRecord = data[0];
      if (!('updated_at' in firstRecord)) {
        console.log("⚠️ updated_at column does not exist. Need to add it manually via Supabase console.");
        console.log("\nRun this SQL in Supabase SQL Editor:");
        console.log(`
ALTER TABLE public.designs
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        `);
      } else {
        console.log("✅ updated_at column already exists");
      }
    } else {
      console.log("✅ designs table is empty, updated_at will be added on next insert");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

addUpdatedAtColumn();
