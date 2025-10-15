import type { APIRoute } from 'astro';
import { z } from 'zod';

import type { SupabaseClient } from '../../../db/supabase.client.ts';

// Input validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const POST: APIRoute = async ({ request, locals }) => {
  // Parse and validate JSON body
  const body = await request.json().catch(() => null);
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid input', details: result.error.flatten() }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const { email, password } = result.data;

  const supabase = locals.supabase as SupabaseClient;
  // Sign in with email/password to obtain a session
  console.log('tomek', supabase);
  const { data: authData, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    const status = error.status || 401;
    return new Response(
      JSON.stringify({ error: error.message }),
      { status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Return the session and user information
  return new Response(JSON.stringify(authData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
