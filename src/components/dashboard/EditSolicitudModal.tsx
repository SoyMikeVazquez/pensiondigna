'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, User, Phone, Mail, Building2, Landmark, FileText } from 'lucide-react';
import { SolicitudPensionRecord } from '@/types/pension';
import { actualizarSolicitudCompleta } from '@/lib/supabase';

interface EditSolicitudModalProps {
  solicitud: SolicitudPensionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (actualizada: SolicitudPensionRecord) => void;
}

export function EditSolicitudModal({
  solicitud,
  isOpen,
  onClose,
  onSaved,
}: EditSolicitudModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    telefono: '',
    email: '',
    nss: '',
    institucion: 'IMSS',
    regimen_ley: 'Ley 73',
    estado: 'pendiente',
    notas: '',
  });

  useEffect(() => {
    if (solicitud) {
      setFormData({
        nombre_completo: solicitud.nombre_completo || '',
        telefono: solicitud.telefono || '',
        email: solicitud.email || '',
        nss: solicitud.nss || '',
        institucion: solicitud.institucion || 'IMSS',
        regimen_ley: solicitud.regimen_ley || 'Ley 73',
        estado: solicitud.estado || 'pendiente',
        notas: solicitud.notas || '',
      });
      setErrorMsg(null);
    }
  }, [solicitud]);

  if (!isOpen || !solicitud) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitud.id) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await actualizarSolicitudCompleta(solicitud.id, {
        nombre_completo: formData.nombre_completo.trim().toUpperCase(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim(),
        nss: formData.nss.trim() || undefined,
        institucion: formData.institucion,
        regimen_ley: formData.regimen_ley,
        estado: formData.estado,
        notas: formData.notas.trim() || undefined,
      });

      if (!res.success) {
        throw new Error(res.error || 'No se pudo actualizar el registro');
      }

      onSaved({
        ...solicitud,
        nombre_completo: formData.nombre_completo.trim().toUpperCase(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim(),
        nss: formData.nss.trim() || undefined,
        institucion: formData.institucion,
        regimen_ley: formData.regimen_ley,
        estado: formData.estado,
        notas: formData.notas.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Editar Registro de Pensión
            </h3>
            <span className="font-mono text-xs text-zinc-500">
              Folio: {solicitud.folio}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario de Edición */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                required
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                NSS (11 dígitos)
              </label>
              <input
                type="text"
                maxLength={11}
                value={formData.nss}
                onChange={(e) => setFormData({ ...formData, nss: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Institución
              </label>
              <select
                value={formData.institucion}
                onChange={(e) => {
                  const inst = e.target.value;
                  setFormData({
                    ...formData,
                    institucion: inst,
                    regimen_ley: inst === 'IMSS' ? 'Ley 73' : 'Décimo Transitorio',
                  });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="IMSS">IMSS</option>
                <option value="ISSSTE">ISSSTE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Régimen / Ley
              </label>
              <select
                value={formData.regimen_ley}
                onChange={(e) => setFormData({ ...formData, regimen_ley: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {formData.institucion === 'IMSS' ? (
                  <>
                    <option value="Ley 73">Ley 73</option>
                    <option value="Ley 97">Ley 97</option>
                  </>
                ) : (
                  <>
                    <option value="Décimo Transitorio">Décimo Transitorio</option>
                    <option value="Cuentas Individuales">Cuentas Individuales</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Estado de la Solicitud
            </label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En Revisión</option>
              <option value="contactado">Contactado</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
              <option value="completado">Completado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Notas u Observaciones del Asesor
            </label>
            <textarea
              rows={3}
              placeholder="Notas de seguimiento, documentos faltantes o fecha de llamada..."
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
