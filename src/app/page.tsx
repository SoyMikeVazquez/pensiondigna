'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { PensionForm } from '@/components/PensionForm';
import { Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header />

      {/* Main Content */}
      <main className="flex-1 py-4 sm:py-6">
        <PensionForm />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-5 px-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Tus datos y documentos están protegidos con confidencialidad.</span>
          </div>
          <span>© 2026 Pensión Digna</span>
        </div>
      </footer>
    </div>
  );
}
