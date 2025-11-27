declare module 'astro:env/client' {
	export const SUPABASE_URL: string | undefined;	
	export const SUPABASE_KEY: string | undefined;	
}declare module 'astro:env/server' {
	export const OPENROUTER_API_KEY: string | undefined;	
	export const ENV_NAME: 'dev' | 'test' | 'prod';	
}