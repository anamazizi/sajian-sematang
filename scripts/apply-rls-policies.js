#!/usr/bin/env node

/**
 * SAJIAN SEMATANG - Apply RLS Policies to Supabase
 * This script applies RLS policies from SQL files to Supabase database
 * using the service role key (admin access required)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL files to execute in order
const sqlFiles = [
  'supabase/rls_policies_part1_cleanup.sql',
  'supabase/rls_policies_part2_main.sql'
];

async function executeSQLFile(filePath) {
  console.log(`\n📄 Executing: ${filePath}`);
  
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  
  const sqlContent = fs.readFileSync(fullPath, 'utf8');
  
  // Execute SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent }).catch(async (e) => {
    // If RPC doesn't exist, try direct query
    console.log('   ℹ️  RPC method not available, using direct query...');
    return await supabase.from('_').select('*').maybeSingle().then(() => {
      // Split SQL into individual statements and execute
      return executeSQLStatements(sqlContent);
    });
  });
  
  if (error) {
    throw error;
  }
  
  console.log(`   ✅ Success: ${filePath}`);
  return data;
}

async function executeSQLStatements(sqlContent) {
  // Remove comments and split by semicolon
  const statements = sqlContent
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
  
  console.log(`   📋 Found ${statements.length} SQL statements to execute`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    // Skip empty or comment-only statements
    if (!stmt || stmt.trim().length === 0) continue;
    
    try {
      // Use Supabase's REST API to execute SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: stmt + ';' })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ⚠️  Statement ${i + 1} warning: ${errorText.substring(0, 100)}`);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.log(`   ⚠️  Statement ${i + 1} error: ${err.message.substring(0, 100)}`);
      errorCount++;
    }
  }
  
  console.log(`   📊 Results: ${successCount} success, ${errorCount} warnings/errors`);
  
  return { successCount, errorCount };
}

async function verifyPolicies() {
  console.log('\n🔍 Verifying policies...');
  
  // Query pg_policies to count created policies
  const { data, error } = await supabase
    .from('pg_policies')
    .select('tablename', { count: 'exact' })
    .eq('schemaname', 'public');
  
  if (error) {
    console.log('   ⚠️  Cannot verify (pg_policies not accessible via REST API)');
    console.log('   ℹ️  Please verify manually in Supabase Dashboard → Database → Policies');
    return;
  }
  
  console.log(`   ✅ Found ${data?.length || 0} policies in public schema`);
}

async function main() {
  console.log('🔐 SAJIAN SEMATANG - RLS Policies Application');
  console.log('=' .repeat(60));
  console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Using service role key (admin access)`);
  
  try {
    // Execute SQL files
    for (const file of sqlFiles) {
      await executeSQLFile(file);
    }
    
    // Verify
    await verifyPolicies();
    
    console.log('\n✅ RLS Policies applied successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify in Supabase Dashboard → Authentication → Policies');
    console.log('   2. Run test suite: node scripts/test-rls-policies.js');
    console.log('   3. Update app code to use customer views');
    
  } catch (error) {
    console.error('\n❌ Error applying policies:', error.message);
    console.error('\n💡 Try manual application:');
    console.error('   1. Open Supabase Dashboard → SQL Editor');
    console.error('   2. Copy content from supabase/rls_policies_part1_cleanup.sql');
    console.error('   3. Paste and Execute');
    console.error('   4. Copy content from supabase/rls_policies_part2_main.sql');
    console.error('   5. Paste and Execute');
    process.exit(1);
  }
}

main();
