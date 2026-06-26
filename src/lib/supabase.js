import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

const BATCH = 1000;

/**
 * Fetches every row from a table by looping through 1000-row batches,
 * working around PostgREST's default 1000-row cap.
 */
export async function fetchAll(table, { orderCol, ascending = false } = {}) {
  let from = 0;
  let all = [];
  while (true) {
    let q = supabase.from(table).select("*").range(from, from + BATCH - 1);
    if (orderCol) q = q.order(orderCol, { ascending });
    const { data, error } = await q;
    if (error || !data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < BATCH) break;
    from += BATCH;
  }
  return all;
}