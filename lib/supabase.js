import { createClient } from '@supabase/supabase-js';

// Публичный клиент — можно использовать в браузере, ограничен RLS-политиками.
export function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Административный клиент — ТОЛЬКО для серверного кода (API routes).
// Игнорирует RLS, поэтому service role key никогда не должен попадать в браузер.
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
