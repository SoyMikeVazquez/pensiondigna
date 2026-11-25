import { createClient, User, Session } from '@supabase/supabase-js';
import { SolicitudPensionRecord } from '@/types/pension';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'general';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('tu-proyecto') &&
  supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Sube un archivo al almacenamiento.
 */
export async function uploadDocumento(
  fileOrBlob: File | Blob,
  path: string
): Promise<{ url: string; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    const objectUrl = URL.createObjectURL(fileOrBlob);
    return { url: objectUrl };
  }

  try {
    const fileExt = fileOrBlob.type.includes('png')
      ? 'png'
      : fileOrBlob.type.includes('pdf')
      ? 'pdf'
      : 'jpg';
    const cleanPath = path.endsWith(`.${fileExt}`) ? path : `${path}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(storageBucket)
      .upload(cleanPath, fileOrBlob, {
        upsert: true,
        contentType: fileOrBlob.type || 'image/jpeg',
      });

    if (error) {
      console.error('Error storage upload:', error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(storageBucket)
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl };
  } catch (err: unknown) {
    console.error('Upload error:', err);
    return { url: URL.createObjectURL(fileOrBlob), error: 'Error al subir archivo' };
  }
}

/**
 * Guarda el registro de la solicitud.
 */
export async function guardarSolicitud(
  registro: SolicitudPensionRecord
): Promise<{ data: SolicitudPensionRecord | null; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    if (typeof window !== 'undefined') {
      const prev = JSON.parse(localStorage.getItem('solicitudes_pension_demo') || '[]');
      const newRec = { ...registro, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      prev.unshift(newRec);
      localStorage.setItem('solicitudes_pension_demo', JSON.stringify(prev));
      return { data: newRec };
    }
    return { data: { ...registro, id: crypto.randomUUID() } };
  }

  try {
    const { data, error } = await supabase
      .from('solicitudes_pension')
      .insert([registro])
      .select()
      .single();

    if (error) {
      console.error('Error insert:', error);
      throw error;
    }

    return { data };
  } catch (err: unknown) {
    console.error('Error guardarSolicitud:', err);
    throw err;
  }
}

/**
 * Obtiene la lista de solicitudes con filtros opcionales de fecha e institución.
 */
export async function getSolicitudes(filtros?: {
  fechaInicio?: string;
  fechaFin?: string;
  institucion?: string;
  estado?: string;
  busqueda?: string;
}): Promise<{ data: SolicitudPensionRecord[]; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    if (typeof window !== 'undefined') {
      let items: SolicitudPensionRecord[] = JSON.parse(
        localStorage.getItem('solicitudes_pension_demo') || '[]'
      );

      if (filtros?.institucion && filtros.institucion !== 'TODAS') {
        items = items.filter((s) => s.institucion === filtros.institucion);
      }
      if (filtros?.fechaInicio) {
        items = items.filter((s) => s.created_at && s.created_at >= filtros.fechaInicio!);
      }
      if (filtros?.fechaFin) {
        items = items.filter((s) => s.created_at && s.created_at <= `${filtros.fechaFin}T23:59:59`);
      }
      if (filtros?.busqueda) {
        const q = filtros.busqueda.toLowerCase();
        items = items.filter(
          (s) =>
            (s.nombre_completo && s.nombre_completo.toLowerCase().includes(q)) ||
            (s.folio && s.folio.toLowerCase().includes(q)) ||
            (s.telefono && s.telefono.includes(q))
        );
      }

      return { data: items };
    }
    return { data: [] };
  }

  try {
    let query = supabase
      .from('solicitudes_pension')
      .select('*')
      .order('created_at', { ascending: false });

    if (filtros?.institucion && filtros.institucion !== 'TODAS') {
      query = query.eq('institucion', filtros.institucion);
    }

    if (filtros?.estado && filtros.estado !== 'TODOS') {
      query = query.eq('estado', filtros.estado);
    }

    // Filtros de fecha con conversión segura de zona horaria local
    if (filtros?.fechaInicio) {
      const parts = filtros.fechaInicio.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number);
        const dStart = new Date(y, m - 1, d, 0, 0, 0, 0);
        query = query.gte('created_at', dStart.toISOString());
      } else {
        query = query.gte('created_at', `${filtros.fechaInicio}T00:00:00Z`);
      }
    }

    if (filtros?.fechaFin) {
      const parts = filtros.fechaFin.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number);
        const dEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
        query = query.lte('created_at', dEnd.toISOString());
      } else {
        query = query.lte('created_at', `${filtros.fechaFin}T23:59:59Z`);
      }
    }

    if (filtros?.busqueda) {
      const cleanQ = filtros.busqueda.replace(/[%_,]/g, ' ').trim();
      if (cleanQ) {
        const q = `%${cleanQ}%`;
        query = query.or(`nombre_completo.ilike.${q},folio.ilike.${q},telefono.ilike.${q}`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al consultar solicitudes:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [] };
  } catch (err: unknown) {
    console.error('Error getSolicitudes:', err);
    return { data: [], error: 'Error al consultar registros' };
  }
}

/**
 * Actualiza el estado de una solicitud.
 */
export async function actualizarEstadoSolicitud(
  id: string,
  nuevoEstado: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    if (typeof window !== 'undefined') {
      const prev: SolicitudPensionRecord[] = JSON.parse(
        localStorage.getItem('solicitudes_pension_demo') || '[]'
      );
      const updated = prev.map((item) =>
        item.id === id ? { ...item, estado: nuevoEstado } : item
      );
      localStorage.setItem('solicitudes_pension_demo', JSON.stringify(updated));
    }
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('solicitudes_pension')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (error) {
      console.error('Error update estado:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error actualizarEstadoSolicitud:', err);
    return { success: false, error: 'Error al actualizar estado' };
  }
}

/**
 * Actualiza la información completa de una solicitud.
 */
export async function actualizarSolicitudCompleta(
  id: string,
  datos: Partial<SolicitudPensionRecord>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    if (typeof window !== 'undefined') {
      const prev: SolicitudPensionRecord[] = JSON.parse(
        localStorage.getItem('solicitudes_pension_demo') || '[]'
      );
      const updated = prev.map((item) =>
        item.id === id ? { ...item, ...datos } : item
      );
      localStorage.setItem('solicitudes_pension_demo', JSON.stringify(updated));
    }
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('solicitudes_pension')
      .update(datos)
      .eq('id', id);

    if (error) {
      console.error('Error update solicitud:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error actualizarSolicitudCompleta:', err);
    return { success: false, error: 'Error al actualizar información' };
  }
}

/**
 * Elimina una solicitud.
 */
export async function eliminarSolicitud(
  id: string,
  folio?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    if (typeof window !== 'undefined') {
      const prev: SolicitudPensionRecord[] = JSON.parse(
        localStorage.getItem('solicitudes_pension_demo') || '[]'
      );
      const filtered = prev.filter((item) => item.id !== id);
      localStorage.setItem('solicitudes_pension_demo', JSON.stringify(filtered));
    }
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('solicitudes_pension')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error delete solicitud:', error);
      return { success: false, error: error.message };
    }

    if (folio) {
      try {
        const { data: files } = await supabase.storage
          .from(storageBucket)
          .list(`solicitudes/${folio}`);
        if (files && files.length > 0) {
          const filePaths = files.map((f) => `solicitudes/${folio}/${f.name}`);
          await supabase.storage.from(storageBucket).remove(filePaths);
        }
      } catch (storageErr) {
        console.warn('Detalle al limpiar archivos:', storageErr);
      }
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error eliminarSolicitud:', err);
    return { success: false, error: 'Error al eliminar registro' };
  }
}

/**
 * Funciones de Autenticación
 */
export async function loginWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured || !supabase) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_auth_user', JSON.stringify({ email }));
    }
    return { data: { user: { email } as User, session: null as Session | null }, error: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function signUpWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured || !supabase) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_auth_user', JSON.stringify({ email }));
    }
    return { data: { user: { email } as User, session: null as Session | null }, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return { data, error };
}

export async function logoutUser() {
  if (!isSupabaseConfigured || !supabase) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demo_auth_user');
    }
    return { error: null };
  }

  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('demo_auth_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  }

  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}
