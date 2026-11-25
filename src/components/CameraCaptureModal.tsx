'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, RotateCcw, Check, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob, previewUrl: string) => void;
  lado: 'frente' | 'reverso' | 'general';
  title?: string;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  lado,
  title,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameContainerRef = useRef<HTMLDivElement | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isShutterActive, setIsShutterActive] = useState<boolean>(false);

  // Detener la cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Iniciar la cámara
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    stopCamera();
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta el acceso directo a la cámara.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasPermission(true);
    } catch (err: unknown) {
      console.warn('Error accediendo a cámara con ideal:', err);
      // Fallback intentando sin restricciones estrictas
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setHasPermission(true);
      } catch (fallbackErr: unknown) {
        setHasPermission(false);
        const msg = fallbackErr instanceof Error ? fallbackErr.message : 'No se pudo acceder a la cámara';
        if (msg.includes('Permission') || msg.includes('NotAllowedError')) {
          setErrorMessage('Permiso de cámara denegado. Permite el acceso a la cámara en tu navegador o sube el archivo desde la galería.');
        } else {
          setErrorMessage('No se encontró ninguna cámara disponible o está siendo usada por otra aplicación.');
        }
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setCapturedBlob(null);
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, startCamera, stopCamera]);

  // Cambiar entre cámara frontal y trasera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Tomar fotografía y recortar al encuadre si es posible
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Efecto de obturador (flash blanco)
    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 200);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Obtenemos las dimensiones reales del video
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // Queremos capturar el encuadre central en proporción de tarjeta (1.586 : 1)
    // El video puede estar en landscape o portrait
    const targetAspect = 1.586; // Proporción credencial INE estándar
    let cropWidth = vw;
    let cropHeight = cropWidth / targetAspect;

    if (cropHeight > vh * 0.85) {
      cropHeight = vh * 0.85;
      cropWidth = cropHeight * targetAspect;
    }

    // Centrar el recorte
    const startX = (vw - cropWidth) / 2;
    const startY = (vh - cropHeight) / 2;

    // Asignar resolución alta al canvas de salida
    canvas.width = Math.round(cropWidth);
    canvas.height = Math.round(cropHeight);

    // Si es cámara frontal, aplicar mirror horizontal para que no quede invertida
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(
      video,
      startX,
      startY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const preview = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedImage(preview);
      },
      'image/jpeg',
      0.95
    );
  };

  const handleRetake = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedBlob(null);
  };

  const handleConfirm = () => {
    if (capturedBlob && capturedImage) {
      onCapture(capturedBlob, capturedImage);
      stopCamera();
      onClose();
    }
  };

  const handleClose = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/95 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white">
                {title || (lado === 'frente' ? 'Fotografiar Frente de INE' : 'Fotografiar Reverso de INE')}
              </h3>
              <p className="text-xs text-zinc-400">
                {lado === 'frente'
                  ? 'Alinea el rostro y datos frontales dentro del encuadre'
                  : 'Alinea el código de barras y firma dentro del encuadre'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
            aria-label="Cerrar cámara"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visor de Cámara / Previsualización */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[360px] sm:min-h-[440px]">
          {isShutterActive && (
            <div className="absolute inset-0 bg-white z-40 animate-pulse" />
          )}

          {errorMessage ? (
            <div className="p-6 text-center max-w-md mx-auto z-20">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 mx-auto flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-white font-medium mb-1">No se pudo activar la cámara</h4>
              <p className="text-xs sm:text-sm text-zinc-400 mb-4">{errorMessage}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reintentar
              </button>
            </div>
          ) : capturedImage ? (
            /* Vista de confirmación con foto tomada */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
              <div className="relative max-w-md w-full aspect-[1.586/1] rounded-xl overflow-hidden shadow-2xl border-2 border-emerald-500/70 bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedImage}
                  alt="Captura de INE"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2.5 py-1 bg-emerald-600/90 text-white text-[11px] font-medium rounded-full backdrop-blur-sm flex items-center gap-1">
                  <Check className="w-3 h-3" /> Foto Capturada
                </div>
              </div>
              <p className="text-zinc-300 text-xs mt-3 text-center">
                Verifica que los datos y la fotografía se lean claramente sin reflejos de luz.
              </p>
            </div>
          ) : (
            /* Vista en Vivo con Encuadre de Tarjeta */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* OVERLAY DEL ENCUADRE DE LA TARJETA */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4 sm:p-6">
                <div
                  ref={frameContainerRef}
                  className="relative w-full max-w-[420px] aspect-[1.586/1] rounded-2xl border-2 border-dashed border-emerald-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] flex flex-col justify-between p-3.5 transition-all"
                >
                  {/* Esquinas sólidas luminosas estilo escáner */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  {/* Siluetas de guía según el lado */}
                  {lado === 'frente' ? (
                    <div className="w-full h-full flex flex-col justify-between opacity-40">
                      <div className="flex justify-between items-start">
                        <div className="w-16 h-20 border border-zinc-300 rounded-md flex flex-col items-center justify-center text-[10px] text-zinc-300">
                          <span>Foto</span>
                        </div>
                        <div className="text-right text-[10px] text-zinc-300">
                          <span>MÉXICO INE</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 w-3/4 bg-zinc-400/50 rounded" />
                        <div className="h-2 w-1/2 bg-zinc-400/50 rounded" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col justify-between opacity-40">
                      <div className="flex justify-between items-start">
                        <div className="text-[10px] text-zinc-300">REVERSO</div>
                        <div className="w-10 h-10 border border-zinc-300 rounded flex items-center justify-center text-[8px] text-zinc-300">
                          QR
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2.5 w-full bg-zinc-400/60 rounded" />
                        <div className="h-2.5 w-full bg-zinc-400/60 rounded" />
                      </div>
                    </div>
                  )}

                  {/* Etiqueta flotante inferior */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/80 rounded-full border border-emerald-500/40 text-[11px] font-medium text-emerald-300 whitespace-nowrap shadow-md">
                    {lado === 'frente' ? 'Frente (con foto)' : 'Reverso (código de barras)'}
                  </div>
                </div>
              </div>

              {/* Botón para cambiar cámara */}
              <button
                onClick={toggleFacingMode}
                className="absolute top-4 right-4 z-30 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full border border-white/20 backdrop-blur-md transition"
                title="Cambiar cámara frontal/trasera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Barra de Controles Inferior */}
        <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-900/95 flex items-center justify-between gap-3 z-20">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Volver a tomar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition"
              >
                <Check className="w-4 h-4" />
                Usar esta foto
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={handleCapture}
                disabled={Boolean(errorMessage) || !hasPermission}
                className="group relative flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Tomar foto"
              >
                <span className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-white flex items-center justify-center transition group-hover:scale-105 active:scale-95 shadow-lg">
                  <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-500 group-hover:bg-emerald-400 flex items-center justify-center text-white transition">
                    <Camera className="w-6 h-6" />
                  </span>
                </span>
              </button>
              <span className="text-xs font-bold text-white tracking-wide">
                Toca aquí para tomar la foto
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
