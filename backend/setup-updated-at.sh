#!/bin/bash

# Supabase PostgreSQL 직접 연결을 위해 pgAdmin 또는 SQL Editor 필요
# 대신, 초기화 함수로 업데이트된 기록 반영

echo "⚠️ updated_at column needs to be added to designs table"
echo ""
echo "Manual Setup Required:"
echo "1. Go to https://app.supabase.com/"
echo "2. Select WHY BOX project"
echo "3. Go to SQL Editor"
echo "4. Run this SQL:"
echo ""
echo "ALTER TABLE public.designs"
echo "ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;"
echo ""
echo "After running this, the backend will start recording updated_at timestamps."
