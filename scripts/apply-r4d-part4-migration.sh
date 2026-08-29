#!/bin/bash

# Phase R4D Part 4: Apply Order Options Migration
# Execute SQL files directly to Supabase

set -e

echo "🚀 Phase R4D Part 4: Applying Order Options Migration"
echo "======================================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ Error: .env.local file not found"
  exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check required variables
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "⚠️  SUPABASE_DB_URL not found in .env.local"
  echo "Using direct connection string format..."
  DB_URL="postgresql://postgres.pdmdebixfpyqczbhiuzn:[email protected]:5432/postgres"
else
  DB_URL="$SUPABASE_DB_URL"
fi

echo "📄 Migration 1: Adding order_items.selected_options column..."
echo ""

cat supabase/10_add_order_item_options.sql | npx --yes supabase db push --db-url "$DB_URL" || {
  echo "⚠️  Method 1 failed, trying alternative..."
  
  # Try with psql if available
  if command -v psql &> /dev/null; then
    psql "$DB_URL" -f supabase/10_add_order_item_options.sql
  else
    echo "❌ psql not available. Please run migration manually in Supabase SQL Editor"
    echo "File: supabase/10_add_order_item_options.sql"
    exit 1
  fi
}

echo ""
echo "📄 Migration 2: Updating RPC with options support..."
echo ""

cat supabase/11_update_order_rpc_with_options.sql | npx --yes supabase db push --db-url "$DB_URL" || {
  echo "⚠️  Method 1 failed, trying alternative..."
  
  if command -v psql &> /dev/null; then
    psql "$DB_URL" -f supabase/11_update_order_rpc_with_options.sql
  else
    echo "❌ psql not available. Please run migration manually in Supabase SQL Editor"
    echo "File: supabase/11_update_order_rpc_with_options.sql"
    exit 1
  fi
}

echo ""
echo "✅ Phase R4D Part 4 migration completed!"
echo ""
echo "Next steps:"
echo "1. ✅ Database schema updated"
echo "2. ⏳ Update Server Action (create-order.ts)"
echo "3. ⏳ Update UI components"
echo "4. ⏳ Test end-to-end"
echo ""
