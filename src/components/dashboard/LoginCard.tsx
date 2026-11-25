'use client';

import React, { useState } from 'react';
import { Lock, Mail, KeyRound, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { loginWithEmail, signUpWithEmail } from '@/lib/supabase';

interface LoginCardProps {
  onLoginSuccess: () => void;
}

export function LoginCard({ onLoginSuccess }: LoginCardProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await signUpWithEmail(email, password);
        if (error) throw error;
        if (data?.user && !data.session) {
          setSuccessNotice(
            '¡Usuario registrado! Por favor revisa tu correo para confirmar tu cuenta antes de iniciar sesión.'
          );
        } else {
          onLoginSuccess();
        }
      } else {
        const { error } = await loginWithEmail(email, password);
        if (error) throw error;
        onLoginSuccess();
      }
    } catch (err: unknown) {
      console.error('Error de autenticación:', err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Invalid login credentials')) {
        setErrorMessage('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else if (msg.includes('Email not confirmed')) {
        setErrorMessage('Tu correo no ha sido confirmado aún. Por favor revisa tu bandeja de entrada.');
      } else {
        setErrorMessage('No se pudo iniciar sesión. Por favor verifica tus datos o intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        
        {/* Cabecera del Login */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
            Pensión Digna
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Panel de Control y Revisión de Expedientes
          </p>
        </div>

        {/* Notificaciones de error o éxito */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                required
                placeholder="asesor@pensiondigna.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>{isSignUp ? 'Crear Cuenta de Asesor' : 'Iniciar Sesión'}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Iniciar Sesión / Registro */}
        <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage(null);
            }}
            className="text-xs text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium cursor-pointer"
          >
            {isSignUp
              ? '¿Ya tienes cuenta? Inicia sesión aquí'
              : '¿Primera vez? Regístrate como asesor'}
          </button>
        </div>

      </div>
    </div>
  );
}
