import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODEzOTM3MiwiZXhwIjoxOTI5NDM3MzcyfQ.1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('permit_applications').update({ notes: 'Testing DB notes' }).eq('id', 'APP-9999900000-03').select();
  console.log('Update result:', data, error);
}

test();
