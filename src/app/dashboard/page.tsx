'use client';

import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, getCurrentUser } from '@/lib/supabase';
import { LoginCard } from '@/components/dashboard/LoginCard';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { Loader2 } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Verificar sesión inicial
    const checkSession = async () => {
      try {
        if (!isSupabaseConfigured || !supabase) {
          const user = await getCurrentUser();
          setCurrentUser(user);
          setLoading(false);
          return;
        }

        const { data } = await supabase.auth.getSession();
        setCurrentUser(data?.session?.user || null);
      } catch (err) {
        console.error('Error verificando sesión:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 2. Suscribirse a cambios de autenticación
    if (isSupabaseConfigured && supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user || null);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold text-zinc-500">
            Comprobando acceso seguro...
          </span>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar formulario de login
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <LoginCard
          onLoginSuccess={async () => {
            const user = await getCurrentUser();
            setCurrentUser(user);
          }}
        />
      </div>
    );
  }

  // Si está autenticado, mostrar Dashboard completo
  return (
    <DashboardView
      userEmail={currentUser.email}
      onLogout={() => setCurrentUser(null)}
    />
  );
}
