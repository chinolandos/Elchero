'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { clearOfflineCache } from '@/components/ui/service-worker-register';

export interface UseAuthResult {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: (next?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Hook de autenticación para Client Components.
 *
 * Mantiene la sesión sincronizada vía onAuthStateChange — si el user inicia sesión
 * en otra pestaña o expira, se actualiza automáticamente.
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      },
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (next?: string) => {
    const supabase = createSupabaseBrowserClient();
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    if (next) callbackUrl.searchParams.set('next', next);

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    // Limpiar cache offline antes del logout — previene que el próximo
    // user que entre en este device vea pages cacheadas del user anterior.
    // No bloqueante: si falla (ej. no hay SW activo), seguimos con el logout.
    try {
      await clearOfflineCache();
    } catch {
      // ignore
    }
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return { user, isLoading, signInWithGoogle, signOut };
}
