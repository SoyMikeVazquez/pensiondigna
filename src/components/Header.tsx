import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
          Pensión Digna
        </Link>
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Acceso Asesores</span>
        </Link>
      </div>
    </header>
  );
}
