import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl =
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL ||
    '';

  const supabaseKey =
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or ANON_KEY)'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
