'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Filter,
  Search,
  Building2,
  Landmark,
  FileText,
  Phone,
  MessageSquare,
  Eye,
  RefreshCw,
  LogOut,
  ExternalLink,
  CheckCircle,
  Clock,
  UserCheck,
  AlertCircle,
  Edit3,
  Trash2
} from 'lucide-react';
import { SolicitudPensionRecord } from '@/types/pension';
import { getSolicitudes, actualizarEstadoSolicitud, eliminarSolicitud, logoutUser } from '@/lib/supabase';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { EditSolicitudModal } from './EditSolicitudModal';

interface DashboardViewProps {
  userEmail?: string;
  onLogout: () => void;
}

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DashboardView({ userEmail, onLogout }: DashboardViewProps) {
  const [solicitudes, setSolicitudes] = useState<SolicitudPensionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudPensionRecord | null>(null);
  const [editingSolicitud, setEditingSolicitud] = useState<SolicitudPensionRecord | null>(null);

  // Fechas: Por default los últimos 7 días calculados en zona horaria local
  const [fechaInicio, setFechaInicio] = useState<string>(() => {
    const ahora = new Date();
    const sieteDiasAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    return getLocalDateString(sieteDiasAtras);
  });
  const [fechaFin, setFechaFin] = useState<string>(() => {
    return getLocalDateString();
  });

  const [filtroInstitucion, setFiltroInstitucion] = useState<string>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  // Cargar solicitudes
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      const res = await getSolicitudes({
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        institucion: filtroInstitucion !== 'TODAS' ? filtroInstitucion : undefined,
        estado: filtroEstado !== 'TODOS' ? filtroEstado : undefined,
        busqueda: busqueda.trim() || undefined,
      });

      if (res.error) {
        console.error('Error al cargar datos:', res.error);
        setHasError(true);
      }
      setSolicitudes(res.data || []);
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, filtroInstitucion, filtroEstado, busqueda]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Actualizar estado de una solicitud
  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    await actualizarEstadoSolicitud(id, nuevoEstado);
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s))
    );
    if (selectedSolicitud && selectedSolicitud.id === id) {
      setSelectedSolicitud((prev) => (prev ? { ...prev, estado: nuevoEstado } : null));
    }
  };

  // Eliminar una solicitud
  const handleEliminarSolicitud = async (sol: SolicitudPensionRecord) => {
    if (!sol.id) return;
    const confirmacion = window.confirm(
      `¿Deseas eliminar el expediente ${sol.folio || ''} a nombre de ${sol.nombre_completo || ''}?`
    );
    if (!confirmacion) return;

    const res = await eliminarSolicitud(sol.id, sol.folio);
    if (!res.success) {
      alert('No se pudo eliminar el expediente. Inténtalo de nuevo.');
      return;
    }

    setSolicitudes((prev) => prev.filter((s) => s.id !== sol.id));
    if (selectedSolicitud?.id === sol.id) {
      setSelectedSolicitud(null);
    }
  };

  // Presets de fechas
  const setPresetFecha = (tipo: 'hoy' | '7dias' | 'mes' | 'todo') => {
    const ahora = new Date();

    if (tipo === 'todo') {
      setFechaInicio('');
      setFechaFin('');
    } else if (tipo === 'hoy') {
      const hoyStr = getLocalDateString(ahora);
      setFechaInicio(hoyStr);
      setFechaFin(hoyStr);
    } else if (tipo === '7dias') {
      const sieteDias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      setFechaInicio(getLocalDateString(sieteDias));
      setFechaFin(getLocalDateString(ahora));
    } else if (tipo === 'mes') {
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      setFechaInicio(getLocalDateString(inicioMes));
      setFechaFin(getLocalDateString(ahora));
    }
  };

  // Contadores
  const totalCount = solicitudes.length;
  const imssCount = solicitudes.filter((s) => s.institucion === 'IMSS').length;
  const isssteCount = solicitudes.filter((s) => s.institucion === 'ISSSTE').length;
  const pendientesCount = solicitudes.filter(
    (s) => !s.estado || s.estado === 'pendiente'
  ).length;

  const formatearFecha = (iso?: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col text-zinc-900 dark:text-zinc-100">
      
      {/* Barra Superior del Dashboard */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              Pensión Digna
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-semibold">
              Panel de Expedientes
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition"
            >
              <span>Ver Formulario</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />

            <div className="text-xs text-zinc-500 dark:text-zinc-400 hidden md:block">
              {userEmail}
            </div>

            <button
              onClick={async () => {
                await logoutUser();
                onLogout();
              }}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Aviso amigable en caso de error de conexión */}
        {hasError && (
          <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>No se pudieron cargar algunos datos en este momento. Por favor verifica tu conexión o recarga la página.</span>
            </div>
            <button
              onClick={cargarDatos}
              className="px-3 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-lg font-semibold transition cursor-pointer shrink-0"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Recibidas</span>
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              {totalCount}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pendientes</span>
              <Clock className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              {pendientesCount}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">IMSS</span>
              <Building2 className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              {imssCount}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">ISSSTE</span>
              <Landmark className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              {isssteCount}
            </span>
          </div>
        </div>

        {/* Panel de Filtros y Búsqueda */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o folio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filtro de Institución */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">Institución:</span>
              <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 text-xs">
                {['TODAS', 'IMSS', 'ISSSTE'].map((inst) => (
                  <button
                    key={inst}
                    onClick={() => setFiltroInstitucion(inst)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                      filtroInstitucion === inst
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {inst}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro de Estado */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">Estado:</span>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="en_revision">En Revisión</option>
                <option value="contactado">Contactados</option>
                <option value="aprobado">Aprobados</option>
                <option value="rechazado">Rechazados</option>
                <option value="completado">Completados</option>
              </select>
            </div>

            <button
              onClick={cargarDatos}
              disabled={loading}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer shrink-0"
              title="Recargar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          {/* Selector de Rango de Fechas */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-semibold">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Rango de Fechas:</span>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium"
                />
                <span className="text-zinc-400">al</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium"
                />
              </div>
            </div>

            {/* Accesos rápidos de fecha */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-zinc-400 font-medium">Filtro rápido:</span>
              <button
                type="button"
                onClick={() => setPresetFecha('hoy')}
                className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setPresetFecha('7dias')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  fechaInicio && fechaFin && !busqueda
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700'
                }`}
              >
                Últimos 7 días
              </button>
              <button
                type="button"
                onClick={() => setPresetFecha('mes')}
                className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              >
                Este Mes
              </button>
              <button
                type="button"
                onClick={() => setPresetFecha('todo')}
                className="px-2.5 py-1 rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-semibold transition cursor-pointer"
              >
                Ver Todo (Sin filtro)
              </button>
            </div>

          </div>

        </div>

        {/* Tabla / Lista de Solicitudes */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
          
          {loading ? (
            <div className="p-12 text-center text-zinc-400">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-emerald-600" />
              <p className="text-sm">Consultando expedientes...</p>
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 space-y-3">
              <AlertCircle className="w-10 h-10 mx-auto opacity-50" />
              <div>
                <h4 className="text-base font-bold text-zinc-700 dark:text-zinc-300">
                  No se encontraron expedientes
                </h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  No hay solicitudes registradas en las fechas o filtros seleccionados.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setPresetFecha('todo')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Ver todo el historial sin filtro de fecha
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Folio / Fecha</th>
                    <th className="py-3.5 px-4">Titular / Teléfono</th>
                    <th className="py-3.5 px-4">Institución / Ley</th>
                    <th className="py-3.5 px-4">Documentos</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {solicitudes.map((sol) => (
                    <tr
                      key={sol.id || sol.folio}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition"
                    >
                      {/* Folio y Fecha */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 block w-fit mb-1">
                          {sol.folio || '-'}
                        </span>
                        <span className="text-[11px] text-zinc-400 block">
                          {formatearFecha(sol.created_at)}
                        </span>
                      </td>

                      {/* Titular y Contacto */}
                      <td className="py-3.5 px-4 align-top">
                        <strong className="block font-bold text-zinc-900 dark:text-zinc-100">
                          {sol.nombre_completo || 'Sin nombre'}
                        </strong>
                        {sol.telefono && (
                          <div className="flex items-center gap-2 mt-1">
                            <a
                              href={`https://wa.me/52${(sol.telefono || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Hola ${sol.nombre_completo || ''}, le escribo de Pensión Digna sobre su solicitud ${sol.folio || ''}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold text-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{sol.telefono}</span>
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Institución y Régimen */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          {sol.institucion || 'IMSS'}
                        </span>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          {sol.regimen_ley || '-'}
                        </span>
                      </td>

                      {/* Chips de Documentos */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {sol.ine_frente_url && (
                            <button
                              onClick={() => setSelectedSolicitud(sol)}
                              className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold flex items-center gap-1 hover:bg-zinc-200 transition cursor-pointer"
                              title="Ver INE Frente"
                            >
                              <Eye className="w-3 h-3" />
                              <span>INE Frente</span>
                            </button>
                          )}
                          {sol.ine_reverso_url && (
                            <button
                              onClick={() => setSelectedSolicitud(sol)}
                              className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold flex items-center gap-1 hover:bg-zinc-200 transition cursor-pointer"
                              title="Ver INE Reverso"
                            >
                              <Eye className="w-3 h-3" />
                              <span>INE Vuelta</span>
                            </button>
                          )}
                          {sol.comprobante_bancario_url && (
                            <button
                              onClick={() => setSelectedSolicitud(sol)}
                              className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold flex items-center gap-1 hover:bg-zinc-200 transition cursor-pointer"
                              title="Ver Estado de Cuenta"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Banco</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 align-top">
                        <select
                          value={sol.estado || 'pendiente'}
                          onChange={(e) => sol.id && handleCambiarEstado(sol.id, e.target.value)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold border border-zinc-200 dark:border-zinc-700 bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_revision">En Revisión</option>
                          <option value="contactado">Contactado</option>
                          <option value="aprobado">Aprobado</option>
                          <option value="rechazado">Rechazado</option>
                          <option value="completado">Completado</option>
                        </select>
                      </td>

                      {/* Botones de acción: Editar, Ver, Eliminar */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSolicitud(sol)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                            title="Ver expediente y fotos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setEditingSolicitud(sol)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                            title="Editar datos del titular"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleEliminarSolicitud(sol)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition cursor-pointer"
                            title="Eliminar este expediente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </main>

      {/* Modal Visor de Documentos */}
      <DocumentPreviewModal
        solicitud={selectedSolicitud}
        onClose={() => setSelectedSolicitud(null)}
        onUpdateEstado={(nuevo) => {
          if (selectedSolicitud?.id) {
            handleCambiarEstado(selectedSolicitud.id, nuevo);
          }
        }}
        onEdit={() => {
          if (selectedSolicitud) {
            setEditingSolicitud(selectedSolicitud);
          }
        }}
        onDelete={() => {
          if (selectedSolicitud) {
            handleEliminarSolicitud(selectedSolicitud);
          }
        }}
      />

      {/* Modal de Edición de Solicitud */}
      <EditSolicitudModal
        isOpen={Boolean(editingSolicitud)}
        solicitud={editingSolicitud}
        onClose={() => setEditingSolicitud(null)}
        onSaved={(actualizada) => {
          setSolicitudes((prev) =>
            prev.map((s) => (s.id === actualizada.id ? actualizada : s))
          );
          if (selectedSolicitud?.id === actualizada.id) {
            setSelectedSolicitud(actualizada);
          }
        }}
      />

    </div>
  );
}
