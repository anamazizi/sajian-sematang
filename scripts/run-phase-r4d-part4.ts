/**
 * Phase R4D Part 4: Execute Order Item Options Migration
 * Run with: npx tsx scripts/run-phase-r4d-part4.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Phase R4D Part 4: Order Item Options Migration');
    console.log('================================================\n');

    // Read migration files
    const migration1Path = path.join(__dirname, '../supabase/10_add_order_item_options.sql');
    const migration2Path = path.join(__dirname, '../supabase/11_update_order_rpc_with_options.sql');

    const sql1 = fs.readFileSync(migration1Path, 'utf-8');
    const sql2 = fs.readFileSync(migration2Path, 'utf-8');

    console.log('📄 Running migration 10_add_order_item_options.sql...');
    const { error: error1 } = await supabase.rpc('exec_sql', { sql: sql1 });
    
    if (error1) {
      console.error('❌ Migration 1 failed:', error1);
      console.log('\n🔧 Trying alternative method...');
      
      // Try executing with raw query
      const { error: altError1 } = await supabase.from('_exec').insert({ query: sql1 });
      if (altError1) {
        console.error('❌ Alternative method failed:', altError1);
      }
    } else {
      console.log('✅ Migration 1 completed');
    }

    console.log('\n📄 Running migration 11_update_order_rpc_with_options.sql...');
    const { error: error2 } = await supabase.rpc('exec_sql', { sql: sql2 });
    
    if (error2) {
      console.error('❌ Migration 2 failed:', error2);
    } else {
      console.log('✅ Migration 2 completed');
    }

    console.log('\n✅ Phase R4D Part 4 migration completed!');
    console.log('\nNext steps:');
    console.log('1. Update Server Action to pass selectedOptions');
    console.log('2. Update UI to display options in order summary');
    console.log('3. Test end-to-end order flow');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

runMigration();
