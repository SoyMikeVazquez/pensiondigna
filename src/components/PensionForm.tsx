'use client';

import React, { useState } from 'react';
import {
  Building2,
  User,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  Share2,
  PhoneCall,
  Mail,
  Landmark,
  FileCheck2,
  Check
} from 'lucide-react';
import { Institucion, PensionFormData } from '@/types/pension';
import { DocumentUploadCard } from './DocumentUploadCard';
import { analizarNSS, NSSAnalysis } from '@/lib/nss-helper';
import { uploadDocumento, guardarSolicitud } from '@/lib/supabase';

export function PensionForm() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitProgress, setSubmitProgress] = useState<string>('');
  const [submittedFolio, setSubmittedFolio] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<PensionFormData>({
    nombreCompleto: '',
    telefono: '',
    email: '',
    institucion: 'IMSS',
    regimenLey: 'ley_73',
    nss: '',
    ineFrente: null,
    ineReverso: null,
    comprobanteBancario: null,
    notas: '',
  });

  const [nssAnalysis, setNssAnalysis] = useState<NSSAnalysis | null>(null);

  // Detección automática al escribir NSS
  const handleNssChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData((prev) => ({ ...prev, nss: val }));

    if (val.length === 11) {
      const analysis = analizarNSS(val);
      setNssAnalysis(analysis);
      if (analysis.regimenSugerido) {
        setFormData((prev) => ({
          ...prev,
          regimenLey: analysis.regimenSugerido === 'Ley 73' ? 'ley_73' : 'ley_97',
        }));
      }
    } else {
      setNssAnalysis(null);
    }
  };

  const handleInstitucionChange = (inst: Institucion) => {
    if (inst === 'IMSS') {
      setFormData((prev) => ({
        ...prev,
        institucion: inst,
        regimenLey: 'ley_73',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        institucion: inst,
        regimenLey: 'decimo_transitorio',
      }));
    }
  };

  // Validación amigable
  const isFormValid = Boolean(
    formData.nombreCompleto.trim().length >= 3 &&
    formData.telefono.replace(/\D/g, '').length >= 10 &&
    formData.ineFrente &&
    formData.ineReverso
  );


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombreCompleto.trim()) {
      alert('Por favor escribe tu nombre completo.');
      return;
    }

    if (formData.telefono.replace(/\D/g, '').length < 10) {
      alert('Por favor escribe un número de teléfono a 10 dígitos.');
      return;
    }

    if (!formData.ineFrente || !formData.ineReverso) {
      alert('Por favor toma o sube las dos fotos de tu credencial INE (frente y vuelta).');
      return;
    }

    setIsSubmitting(true);
    const folio = `PEN-${formData.institucion}-${Date.now().toString().slice(-6)}`;

    try {
      // 1. Subir INE Frente al bucket general
      let ineFrenteUrl = '';
      if (formData.ineFrente?.file) {
        setSubmitProgress('Guardando foto del frente de tu credencial...');
        const res = await uploadDocumento(
          formData.ineFrente.file,
          `solicitudes/${folio}/ine_frente`
        );
        ineFrenteUrl = res.url;
      }

      // 2. Subir INE Reverso al bucket general
      let ineReversoUrl = '';
      if (formData.ineReverso?.file) {
        setSubmitProgress('Guardando foto de la vuelta de tu credencial...');
        const res = await uploadDocumento(
          formData.ineReverso.file,
          `solicitudes/${folio}/ine_reverso`
        );
        ineReversoUrl = res.url;
      }

      // 3. Subir Estado de Cuenta Bancario al bucket general
      let comprobanteBancarioUrl = '';
      if (formData.comprobanteBancario?.file) {
        setSubmitProgress('Guardando estado de cuenta bancario...');
        const res = await uploadDocumento(
          formData.comprobanteBancario.file,
          `solicitudes/${folio}/estado_cuenta_bancario`
        );
        comprobanteBancarioUrl = res.url;
      }

      // 4. Guardar registro en Supabase
      setSubmitProgress('Registrando tu información...');
      const regimenLegible =
        formData.institucion === 'IMSS'
          ? formData.regimenLey === 'ley_73'
            ? 'Ley 73'
            : 'Ley 97'
          : formData.regimenLey === 'decimo_transitorio'
          ? 'Décimo Transitorio'
          : 'Cuentas Individuales';

      await guardarSolicitud({
        folio,
        nombre_completo: formData.nombreCompleto.trim().toUpperCase(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim(),
        nss: formData.nss?.trim() || undefined,
        institucion: formData.institucion,
        regimen_ley: regimenLegible,
        ine_frente_url: ineFrenteUrl,
        ine_reverso_url: ineReversoUrl,
        comprobante_bancario_url: comprobanteBancarioUrl,
        estado: 'pendiente',
      });

      setSubmittedFolio(folio);
    } catch (err: unknown) {
      console.error('Error al procesar solicitud:', err);
      alert('Ocurrió un inconveniente al enviar la información. Por favor verifica tu conexión o inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
      setSubmitProgress('');
    }
  };

  // Pantalla de Confirmación
  if (submittedFolio) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white dark:bg-zinc-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
            ¡Tus documentos se enviaron con éxito!
          </h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base mt-2">
            Hemos guardado tus fotos y datos. Un asesor te llamará o escribirá a tu WhatsApp para continuar con tu trámite.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-emerald-50 dark:bg-zinc-800 border border-emerald-200 dark:border-emerald-800 max-w-sm mx-auto">
            <span className="text-xs uppercase font-bold text-emerald-800 dark:text-emerald-400 block mb-1">
              Tu Número de Folio
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 select-all">
              {submittedFolio}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Hola, ya envié mis documentos para trámite de pensión ${formData.institucion}. Mi nombre es ${formData.nombreCompleto} y mi folio es: ${submittedFolio}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition cursor-pointer"
            >
              <Share2 className="w-5 h-5" />
              Avisar por WhatsApp
            </a>

            <button
              onClick={() => {
                setSubmittedFolio(null);
                setFormData({
                  nombreCompleto: '',
                  telefono: '',
                  email: '',
                  institucion: 'IMSS',
                  regimenLey: 'ley_73',
                  nss: '',
                  ineFrente: null,
                  ineReverso: null,
                  comprobanteBancario: null,
                  notas: '',
                });
              }}
              className="w-full py-3.5 px-6 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm transition cursor-pointer"
            >
              Llenar otro registro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-6 px-4 sm:px-6">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-8 shadow-xl space-y-8">
        
        {/* ========================================================================= */}
        {/* SECCIÓN 1: TUS DATOS */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-base">
              1
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                Tus Datos Personales
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Para identificarte y ponernos en contacto contigo.
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Nombre Completo */}
            <div>
              <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Nombre Completo <span className="text-zinc-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Escribe aquí tu nombre y apellidos"
                value={formData.nombreCompleto}
                onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-base focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Teléfono */}
              <div>
                <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Teléfono Celular o WhatsApp <span className="text-zinc-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={14}
                  placeholder="Ej. 866 123 4567"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-base focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Correo */}
              <div>
                <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Correo Electrónico <span className="text-xs font-normal text-zinc-400">(Opcional)</span>
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-base focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 2: INSTITUCIÓN Y LEY */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-base">
              2
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                ¿A qué institución perteneces?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Selecciona si trabajaste cotizando para el IMSS o el ISSSTE.
              </p>
            </div>
          </div>

          {/* Botones grandes de IMSS / ISSSTE */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => handleInstitucionChange('IMSS')}
              className={`py-4 px-4 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-bold text-base sm:text-lg transition cursor-pointer ${
                formData.institucion === 'IMSS'
                  ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 shadow-sm ring-2 ring-emerald-500/20'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span>IMSS</span>
            </button>

            <button
              type="button"
              onClick={() => handleInstitucionChange('ISSSTE')}
              className={`py-4 px-4 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-bold text-base sm:text-lg transition cursor-pointer ${
                formData.institucion === 'ISSSTE'
                  ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 shadow-sm ring-2 ring-emerald-500/20'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
              }`}
            >
              <Landmark className="w-5 h-5" />
              <span>ISSSTE</span>
            </button>
          </div>

          {/* Selector de Ley simplificado */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">
              {formData.institucion === 'IMSS' ? '¿En qué año te inscribiste al IMSS?' : '¿Qué régimen del ISSSTE te corresponde?'}
            </label>

            {formData.institucion === 'IMSS' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, regimenLey: 'ley_73' })}
                    className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                      formData.regimenLey === 'ley_73'
                        ? 'border-emerald-600 bg-white dark:bg-zinc-800 text-emerald-900 dark:text-emerald-200 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-base font-bold">Ley 73</strong>
                      {formData.regimenLey === 'ley_73' && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-1">
                      Comenzaste a cotizar antes de julio de 1997.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, regimenLey: 'ley_97' })}
                    className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                      formData.regimenLey === 'ley_97'
                        ? 'border-emerald-600 bg-white dark:bg-zinc-800 text-emerald-900 dark:text-emerald-200 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-base font-bold">Ley 97</strong>
                      {formData.regimenLey === 'ley_97' && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-1">
                      Comenzaste a cotizar a partir de julio de 1997.
                    </span>
                  </button>
                </div>

                {/* NSS Opcional para ayudar al adulto mayor si no sabe qué ley es */}
                <div className="pt-1">
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    ¿No estás seguro de tu ley? Escribe tu Número de Seguro Social (NSS) y lo detectamos:
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="Escribe aquí tu NSS (11 números)"
                    value={formData.nss}
                    onChange={handleNssChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-mono tracking-wider focus:outline-none focus:border-emerald-500"
                  />
                  {nssAnalysis?.isValid && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{nssAnalysis.mensaje}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, regimenLey: 'decimo_transitorio' })}
                  className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                    formData.regimenLey === 'decimo_transitorio'
                      ? 'border-emerald-600 bg-white dark:bg-zinc-800 text-emerald-900 dark:text-emerald-200 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-base font-bold">Décimo Transitorio</strong>
                    {formData.regimenLey === 'decimo_transitorio' && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-1">
                    Régimen tradicional por años de servicio.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, regimenLey: 'cuentas_individuales' })}
                  className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                    formData.regimenLey === 'cuentas_individuales'
                      ? 'border-emerald-600 bg-white dark:bg-zinc-800 text-emerald-900 dark:text-emerald-200 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-base font-bold">Cuentas Individuales</strong>
                    {formData.regimenLey === 'cuentas_individuales' && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-1">
                    Ley ISSSTE 2007 (AFORE PENSIONISSSTE).
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 3: SUBIDA DE FOTOS Y DOCUMENTOS (SIMPLIFICADA PARA ADULTOS MAYORES) */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-base">
              3
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                Sube tus Documentos
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Puedes tomarles foto con tu celular o subirlos si ya los tienes guardados.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 1. INE Frente */}
            <DocumentUploadCard
              id="ine_frente"
              stepNumber={1}
              title="Credencial INE - Parte de Enfrente"
              subtitle="Donde aparece tu foto, tu nombre y tu firma."
              required
              lado="frente"
              document={formData.ineFrente}
              onChange={(doc) => setFormData({ ...formData, ineFrente: doc })}
            />

            {/* 2. INE Reverso */}
            <DocumentUploadCard
              id="ine_reverso"
              stepNumber={2}
              title="Credencial INE - Parte de Atrás"
              subtitle="La vuelta de tu credencial (donde está el código de barras)."
              required
              lado="reverso"
              document={formData.ineReverso}
              onChange={(doc) => setFormData({ ...formData, ineReverso: doc })}
            />

            {/* 3. Estado de Cuenta */}
            <DocumentUploadCard
              id="comprobante_bancario"
              stepNumber={3}
              title="Estado de Cuenta Bancario (PDF o Foto)"
              subtitle="Para saber a qué cuenta depositarte (debe mostrar tu CLABE de 18 números)."
              lado="general"
              acceptPdf
              document={formData.comprobanteBancario}
              onChange={(doc) => setFormData({ ...formData, comprobanteBancario: doc })}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ENVÍO */}
        {/* ========================================================================= */}
        {isSubmitting && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-400 flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin shrink-0" />
            <div className="text-sm text-emerald-900 dark:text-emerald-200">
              <span className="font-bold block">Guardando tus documentos...</span>
              <span>{submitProgress || 'Por favor espera unos segundos...'}</span>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/30 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enviando tus documentos...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Enviar mis Documentos</span>
              </>
            )}
          </button>

          {!isFormValid && (
            <p className="text-center text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2.5">
              * Recuerda escribir tu <strong>Nombre</strong>, <strong>Teléfono</strong> y tomar las fotos del <strong>Frente</strong> y <strong>Atrás</strong> de tu credencial INE.
            </p>
          )}
        </div>

      </form>
    </div>
  );
}
