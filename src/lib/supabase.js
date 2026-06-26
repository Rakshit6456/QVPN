import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchAll(table, { orderCol, ascending = false, limit = 1000 } = {}) {
  let q = supabase.from(table).select("*").limit(limit);
  if (orderCol) q = q.order(orderCol, { ascending });
  const { data, error } = await q;
  if (error) console.error(`fetchAll ${table}:`, error.message);
  return data || [];
}