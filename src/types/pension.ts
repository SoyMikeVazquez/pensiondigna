export type Institucion = 'IMSS' | 'ISSSTE';

export type RegimenIMSS = 'ley_73' | 'ley_97';
export type RegimenISSSTE = 'decimo_transitorio' | 'cuentas_individuales';

export interface DocumentState {
  file: File | Blob | null;
  previewUrl: string | null;
  name: string;
  size?: number;
  type?: string;
  source: 'camera' | 'file';
  uploadedUrl?: string;
}

export interface PensionFormData {
  // Datos personales básicos
  nombreCompleto: string;
  telefono: string;
  email: string;

  // Régimen
  institucion: Institucion;
  regimenLey: string;
  nss?: string;

  // Documentos
  ineFrente: DocumentState | null;
  ineReverso: DocumentState | null;
  comprobanteBancario: DocumentState | null;

  // Opcional
  notas?: string;
}

export interface SolicitudPensionRecord {
  id?: string;
  folio: string;
  created_at?: string;
  nombre_completo: string;
  telefono: string;
  email?: string;
  institucion: string;
  regimen_ley: string;
  modalidad?: string;
  nss?: string;
  ine_frente_url?: string;
  ine_reverso_url?: string;
  comprobante_bancario_url?: string;
  notas?: string;
  estado?: string;
}
