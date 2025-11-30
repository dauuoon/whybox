const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log("🔍 Checking comments table structure...");
    
    // comments 테이블 데이터 조회하여 컬럼 확인
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .limit(1);
    
    if (error) {
      console.error("❌ Error:", error.message);
      return;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log("✅ Comments table columns:", columns);
    } else {
      console.log("📝 Comments table is empty. Checking table structure...");
      console.log("\nTry to insert a test comment to verify schema");
      
      // 테스트 댓글 삽입 시도
      const { data: testData, error: testError } = await supabase
        .from("comments")
        .insert([{ pin_id: 1, text: "test", author: "test" }])
        .select();
      
      if (testError) {
        console.error("❌ Insert error:", testError.message);
        console.log("\nPossible missing columns. Run this SQL in Supabase:");
        console.log(`
-- Add author column if missing
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS author TEXT;
        `);
      } else {
        console.log("✅ Test insert successful. Columns:", Object.keys(testData[0]));
        // 테스트 데이터 삭제
        await supabase.from("comments").delete().eq("id", testData[0].id);
      }
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

checkSchema();
