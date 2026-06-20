import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env
const envPath = resolve(__dirname, '.env');
const envContent = readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');
let rawUrl = '';
let anonKey = '';
for (const line of lines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) rawUrl = line.split('=').slice(1).join('=').trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) anonKey = line.split('=').slice(1).join('=').trim();
}

const baseUrl = rawUrl?.replace(/\/rest\/v1\/?$/, '');
const url = baseUrl || rawUrl;
console.log('Supabase URL:', url);
console.log('Anon Key:', anonKey?.slice(0, 20) + '...');

const supabase = createClient(url, anonKey);

async function run() {
  console.log('\n=== DIAGNOSTIC 1: Current Auth Session ===');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  console.log('Session:', JSON.stringify(sessionData, null, 2));
  if (sessionError) console.log('Session error:', sessionError);

  console.log('\n=== DIAGNOSTIC 2: Get Authenticated User ===');
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.log('getUser error:', userError);
  } else {
    console.log('User:', JSON.stringify(userData, null, 2));
  }

  console.log('\n=== DIAGNOSTIC 3: Check splitmate_groups table ===');
  const { data: tblData, error: tblError } = await supabase
    .from('splitmate_groups')
    .select('*')
    .limit(1);
  console.log('SELECT result:', JSON.stringify(tblData));
  if (tblError) {
    console.log('SELECT error:', JSON.stringify(tblError, null, 2));
    console.log('ERROR code:', tblError.code);
    console.log('ERROR message:', tblError.message);
    console.log('ERROR details:', tblError.details);
    console.log('ERROR hint:', tblError.hint);
  }

  console.log('\n=== DIAGNOSTIC 4: Check group_members table ===');
  const { data: memData, error: memError } = await supabase
    .from('group_members')
    .select('*')
    .limit(1);
  console.log('SELECT result:', JSON.stringify(memData));
  if (memError) {
    console.log('SELECT error:', JSON.stringify(memError, null, 2));
    console.log('ERROR code:', memError.code);
    console.log('ERROR message:', memError.message);
  }

  console.log('\n=== DIAGNOSTIC 5: Count rows in splitmate_groups ===');
  const { count, error: countError } = await supabase
    .from('splitmate_groups')
    .select('*', { count: 'exact', head: true });
  if (countError) {
    console.log('Count error:', JSON.stringify(countError));
  } else {
    console.log('Count:', count);
  }

  console.log('\n=== DIAGNOSTIC 6: Try INSERT into splitmate_groups ===');
  if (userData?.user) {
    const testPayload = {
      name: 'DIAGNOSTIC_TEST_GROUP',
      category: 'other',
      description: 'Temp test group',
      created_by: userData.user.id,
      currency: 'INR',
      invite_code: 'DIAG001',
    };
    console.log('Insert payload:', JSON.stringify(testPayload, null, 2));
    const { data: insertData, error: insertError } = await supabase
      .from('splitmate_groups')
      .insert(testPayload)
      .select()
      .single();

    if (insertError) {
      console.log('INSERT error:', JSON.stringify(insertError, null, 2));
      console.log('ERROR code:', insertError.code);
      console.log('ERROR message:', insertError.message);
      console.log('ERROR details:', insertError.details);
      console.log('ERROR hint:', insertError.hint);
    } else {
      console.log('INSERT SUCCESS:', JSON.stringify(insertData));
      // Clean up the test row
      await supabase.from('splitmate_groups').delete().eq('id', insertData.id);
      console.log('Test row cleaned up.');
    }
  } else {
    console.log('Cannot test INSERT — no authenticated user.');
  }

  console.log('\n=== DIAGNOSTIC 7: Check pg_policies for splitmate_groups ===');
  try {
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies', { table_name: 'splitmate_groups' });
    if (policiesError) {
      console.log('RPC error (expected — no rpc defined):', policiesError.message);
      // Fallback: try raw query
      const r = await supabase.from('pg_policies').select('*').eq('tablename', 'splitmate_groups');
      console.log('pg_policies query result:', JSON.stringify(r));
    } else {
      console.log('Policies:', JSON.stringify(policies, null, 2));
    }
  } catch (err) {
    console.log('Policy check failed:', err.message);
  }

  console.log('\n=== DIAGNOSTIC COMPLETE ===');
}

run().catch(console.error);
