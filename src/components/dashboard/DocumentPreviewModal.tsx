'use client';

import React, { useState } from 'react';
import { X, ExternalLink, Download, FileText, Phone, MessageSquare, Check, Eye, Edit3, Trash2 } from 'lucide-react';
import { SolicitudPensionRecord } from '@/types/pension';

interface DocumentPreviewModalProps {
  solicitud: SolicitudPensionRecord | null;
  onClose: () => void;
  onUpdateEstado?: (nuevoEstado: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function DocumentPreviewModal({
  solicitud,
  onClose,
  onUpdateEstado,
  onEdit,
  onDelete,
}: DocumentPreviewModalProps) {
  const [selectedDoc, setSelectedDoc] = useState<'frente' | 'reverso' | 'banco'>('frente');

  if (!solicitud) return null;

  const currentUrl =
    selectedDoc === 'frente'
      ? solicitud.ine_frente_url
      : selectedDoc === 'reverso'
      ? solicitud.ine_reverso_url
      : solicitud.comprobante_bancario_url;

  const isPdf = Boolean(currentUrl && currentUrl.toLowerCase().includes('.pdf'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                {solicitud.folio}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {solicitud.nombre_completo}
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {solicitud.institucion} • {solicitud.regimen_ley}
              {solicitud.nss ? ` • NSS: ${solicitud.nss}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Editar datos del titular"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}

            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-zinc-700"
                title="Eliminar este expediente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <a
              href={`https://wa.me/52${(solicitud.telefono || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                `Hola ${solicitud.nombre_completo || ''}, me comunico de Pensión Digna respecto a tu trámite de pensión (${solicitud.folio || ''}).`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              title="Abrir chat de WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selector de Pestañas de Documentos */}
        <div className="px-5 py-2.5 bg-zinc-950/80 border-b border-zinc-800 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedDoc('frente')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              selectedDoc === 'frente'
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-800/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>INE Frente</span>
            {solicitud.ine_frente_url && <span className="text-[10px] opacity-75">✓</span>}
          </button>

          <button
            onClick={() => setSelectedDoc('reverso')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              selectedDoc === 'reverso'
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-800/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>INE Reverso</span>
            {solicitud.ine_reverso_url && <span className="text-[10px] opacity-75">✓</span>}
          </button>

          <button
            onClick={() => setSelectedDoc('banco')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              selectedDoc === 'banco'
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Estado de Cuenta (CLABE)</span>
            {solicitud.comprobante_bancario_url ? (
              <span className="text-[10px] opacity-75">✓</span>
            ) : (
              <span className="text-[10px] text-zinc-500">No adjunto</span>
            )}
          </button>

          {currentUrl && (
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center gap-1 transition"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">Abrir original</span>
              </a>
            </div>
          )}
        </div>

        {/* Visor del Documento */}
        <div className="flex-1 bg-black flex items-center justify-center p-4 overflow-auto min-h-[350px]">
          {currentUrl ? (
            isPdf ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <FileText className="w-16 h-16 text-emerald-400 mb-3" />
                <h4 className="text-white font-bold text-base mb-1">
                  Documento PDF: Estado de Cuenta
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mb-4">
                  El solicitante adjuntó un archivo PDF con su estado de cuenta bancario y CLABE.
                </p>
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver PDF en pestaña nueva
                </a>
              </div>
            ) : (
              <div className="relative max-w-full max-h-[60vh] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUrl}
                  alt={selectedDoc}
                  className="max-h-[58vh] max-w-full object-contain rounded-xl border border-zinc-700 shadow-xl"
                />
              </div>
            )
          ) : (
            <div className="text-center p-8 text-zinc-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se adjuntó este documento en la solicitud.</p>
            </div>
          )}
        </div>

        {/* Barra de Gestión de Estado Inferior */}
        <div className="px-5 py-3.5 bg-zinc-900 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span>Teléfono: <strong className="text-zinc-200">{solicitud.telefono}</strong></span>
            {solicitud.email && (
              <span>• Correo: <strong className="text-zinc-200">{solicitud.email}</strong></span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Cambiar estado:</span>
            <select
              value={solicitud.estado || 'pendiente'}
              onChange={(e) => onUpdateEstado && onUpdateEstado(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En Revisión</option>
              <option value="contactado">Contactado</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
              <option value="completado">Completado</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
}
