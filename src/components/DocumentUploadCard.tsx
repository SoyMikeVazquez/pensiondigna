'use client';

import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, Eye, CheckCircle2, FileText, RotateCcw } from 'lucide-react';
import { DocumentState } from '@/types/pension';
import { CameraCaptureModal } from './CameraCaptureModal';

interface DocumentUploadCardProps {
  id: string;
  stepNumber?: number;
  title: string;
  subtitle: string;
  required?: boolean;
  lado?: 'frente' | 'reverso' | 'general';
  document: DocumentState | null;
  onChange: (doc: DocumentState | null) => void;
  acceptPdf?: boolean;
}

export function DocumentUploadCard({
  id,
  stepNumber,
  title,
  subtitle,
  required = false,
  lado = 'general',
  document,
  onChange,
  acceptPdf = false,
}: DocumentUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Manejo de captura de cámara
  const handleCameraCapture = (blob: Blob, previewUrl: string) => {
    const fileName = `${id}_${lado}_${Date.now()}.jpg`;
    const docState: DocumentState = {
      file: blob,
      previewUrl,
      name: fileName,
      size: blob.size,
      type: 'image/jpeg',
      source: 'camera',
    };
    onChange(docState);
  };

  // Manejo de subida desde galería o archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : null;

    const docState: DocumentState = {
      file,
      previewUrl,
      name: file.name,
      size: file.size,
      type: file.type,
      source: 'file',
    };
    onChange(docState);
    e.target.value = '';
  };

  const handleRemove = () => {
    if (document?.previewUrl) {
      URL.revokeObjectURL(document.previewUrl);
    }
    onChange(null);
  };

  return (
    <>
      <div className={`rounded-2xl border-2 transition-all p-4 sm:p-5 ${
        document
          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm'
          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-zinc-300'
      }`}>
        
        {/* Encabezado muy claro y grande para adultos mayores */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            {stepNumber && (
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${
                document
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}>
                {document ? '✓' : stepNumber}
              </span>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {title}
                </h4>
                {required && !document && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-full">
                    Necesario
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          {document && (
            <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
              ¡Listo!
            </span>
          )}
        </div>

        {/* SI YA TIENE DOCUMENTO: Vista previa amplia y clara */}
        {document ? (
          <div className="mt-3 p-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              {document.previewUrl ? (
                <div
                  onClick={() => setShowPreviewModal(true)}
                  className="w-20 h-14 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-700 shrink-0 cursor-pointer border border-zinc-300 dark:border-zinc-600 relative group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={document.previewUrl}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-16 h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                  Foto guardada correctamente
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 block truncate max-w-[200px] sm:max-w-xs">
                  {document.source === 'camera' ? 'Tomada con cámara' : 'Archivo subido'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-700">
              {document.previewUrl && (
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver foto
                </button>
              )}
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Cambiar foto
              </button>
            </div>
          </div>
        ) : (
          /* SI NO TIENE DOCUMENTO: Botones grandes y amigables para gente mayor */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {/* Opción 1: Tomar Foto */}
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition shadow-md shadow-emerald-900/20 active:scale-98 cursor-pointer"
            >
              <Camera className="w-5 h-5 shrink-0" />
              <span>Tomar Foto con Cámara</span>
            </button>

            {/* Opción 2: Subir de Fotos o Galería */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border-2 border-zinc-300 dark:border-zinc-700 font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition active:scale-98 cursor-pointer"
            >
              {acceptPdf ? (
                <>
                  <FileText className="w-5 h-5 text-zinc-600 dark:text-zinc-400 shrink-0" />
                  <span>Elegir PDF o Foto</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-400 shrink-0" />
                  <span>Subir de mis Fotos</span>
                </>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept={acceptPdf ? 'image/*,application/pdf' : 'image/*'}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>

      {/* Modal de Cámara con Encuadre */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        lado={lado}
        title={title}
      />

      {/* Modal de Previsualización en Grande */}
      {showPreviewModal && document?.previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-700 p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-3 py-2 text-white border-b border-zinc-800 mb-2">
              <span className="font-bold text-sm sm:text-base">{title}</span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold text-white transition"
              >
                Cerrar
              </button>
            </div>
            <div className="flex items-center justify-center max-h-[70vh] overflow-auto p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={document.previewUrl}
                alt={title}
                className="max-h-[65vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
