import type { APIRoute } from 'astro';
import { supabaseClient } from '../../../db/supabase.client.ts';

export const POST: APIRoute = async ({ request, locals }) => {
    const body = await request.json().catch(() => null);
    const { data, error } = await supabaseClient.auth.signUp({
        email: body.email,
        password: body.password,
      });
    return new Response(JSON.stringify(data), { status: 200 });
}