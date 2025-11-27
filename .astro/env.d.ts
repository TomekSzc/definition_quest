declare module 'astro:env/server' {
	export const SUPABASE_URL: string;	
	export const SUPABASE_KEY: string;	
	export const OPENROUTER_API_KEY: string;	
	export const ENV_NAME: 'dev' | 'test' | 'prod';	
}