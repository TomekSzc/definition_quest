declare module "astro:env/client" {
  export const SUPABASE_URL: string;
  export const SUPABASE_KEY: string;
}
declare module "astro:env/server" {
  export const OPENROUTER_API_KEY: string;
  export const E2E_USERNAME_ID: string | undefined;
  export const E2E_USERNAME: string | undefined;
  export const E2E_PASSWORD: string | undefined;
}
