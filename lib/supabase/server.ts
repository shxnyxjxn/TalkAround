import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import type { Request, Response } from 'express';

function parseCookieHeader(cookieHeader?: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const eqIndex = part.indexOf('=');
      if (eqIndex === -1) return { name: part, value: '' };
      const name = decodeURIComponent(part.slice(0, eqIndex).trim());
      const value = decodeURIComponent(part.slice(eqIndex + 1).trim());
      return { name, value };
    });
}

function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  let str = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  if (options.maxAge !== undefined) str += `; Max-Age=${Math.floor(options.maxAge)}`;
  if (options.domain) str += `; Domain=${options.domain}`;
  if (options.path) str += `; Path=${options.path}`;
  else str += '; Path=/';
  if (options.expires) str += `; Expires=${options.expires.toUTCString()}`;
  if (options.httpOnly) str += '; HttpOnly';
  if (options.secure) str += '; Secure';
  if (options.sameSite) {
    const sameSite =
      typeof options.sameSite === 'string'
        ? options.sameSite
        : options.sameSite
        ? 'Strict'
        : '';
    if (sameSite) str += `; SameSite=${sameSite}`;
  }
  return str;
}

/**
 * Creates a request-scoped Supabase server client using @supabase/ssr.
 * Pass Express (req, res) to read/write auth cookies cleanly across requests.
 */
export function createClient(req?: Request, res?: Response) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or ANON_KEY)'
    );
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(req?.headers?.cookie);
      },
      setAll(cookiesToSet, headers) {
        if (!res || res.headersSent) return;
        cookiesToSet.forEach(({ name, value, options }) => {
          res.append('Set-Cookie', serializeCookie(name, value, options));
        });
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
        }
      },
    },
  });
}

/**
 * Creates a privileged Supabase Admin client using SUPABASE_SERVICE_ROLE_KEY.
 * Server-side only — never expose to the browser.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createSupabaseJsClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
