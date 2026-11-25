/**
 * Analizador y detector del Régimen de Ley basado en el NSS (Número de Seguridad Social) del IMSS.
 * El NSS mexicano consta de 11 dígitos:
 * [0-1]: Subdelegación
 * [2-3]: Año de inscripción ante el IMSS
 * [4-5]: Año de nacimiento del asegurado
 * [6-9]: Folio consecutivo
 * [10]: Dígito verificador
 */

export interface NSSAnalysis {
  isValid: boolean;
  cleanNss: string;
  subdelegacion?: string;
  anoInscripcion?: number;
  anoNacimiento?: number;
  regimenSugerido?: 'Ley 73' | 'Ley 97';
  mensaje?: string;
}

export function analizarNSS(nssInput: string): NSSAnalysis {
  const clean = (nssInput || '').replace(/\D/g, '');

  if (clean.length !== 11) {
    return {
      isValid: false,
      cleanNss: clean,
    };
  }

  const subdelegacion = clean.substring(0, 2);
  const anoInscripcionDigitos = parseInt(clean.substring(2, 4), 10);
  const anoNacimientoDigitos = parseInt(clean.substring(4, 6), 10);

  // Determinar siglo del año de inscripción
  // Si los 2 dígitos son > 50 se asume 19XX, si <= año actual (26) se asume 20XX
  const currentYear2Digits = new Date().getFullYear() % 100;
  const anoInscripcion =
    anoInscripcionDigitos <= currentYear2Digits
      ? 2000 + anoInscripcionDigitos
      : 1900 + anoInscripcionDigitos;

  const anoNacimiento =
    anoNacimientoDigitos <= currentYear2Digits
      ? 2000 + anoNacimientoDigitos
      : 1900 + anoNacimientoDigitos;

  // La Ley 73 estuvo vigente hasta el 30 de junio de 1997. A partir del 1 de julio de 1997 es Ley 97.
  let regimenSugerido: 'Ley 73' | 'Ley 97' = 'Ley 97';
  let mensaje = '';

  if (anoInscripcion < 1997) {
    regimenSugerido = 'Ley 73';
    mensaje = `Inscrito en ${anoInscripcion} (antes del 1 de julio de 1997). Tu régimen sugerido es Ley 73.`;
  } else if (anoInscripcion === 1997) {
    regimenSugerido = 'Ley 73';
    mensaje = `Inscrito en 1997. Depende si fue antes o después del 1 de julio de 1997 (sugerido verificar semanas cotizadas).`;
  } else {
    regimenSugerido = 'Ley 97';
    mensaje = `Inscrito en ${anoInscripcion} (posterior a 1997). Tu régimen sugerido es Ley 97.`;
  }

  return {
    isValid: true,
    cleanNss: clean,
    subdelegacion,
    anoInscripcion,
    anoNacimiento,
    regimenSugerido,
    mensaje,
  };
}
