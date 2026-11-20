import type {
  AccionEstadoDocumentacion,
  CatalogosResponse,
  ConfirmacionRecepcionResponse,
  DocumentacionDto,
  InicioRecepcionResponse,
  SeleccionBolsinResponse,
  SeleccionOpcionResponse,
  TransicionResponse,
  TrazaPasoDto,
} from '../types/api';

export type ApiResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      message: string;
      status: number;
      estadoActual?: string;
      accion?: string;
      traza?: TrazaPasoDto[];
    };

async function requestJson<T>(url: string, options?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
      ...options,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) {
      return {
        success: false,
        message:
          payload?.error ||
          payload?.mensaje ||
          `Error HTTP ${response.status} al consultar ${url}`,
        status: response.status,
        estadoActual: payload?.estadoActual,
        accion: payload?.accion,
        traza: payload?.traza,
      };
    }

    return { success: true, data: payload as T };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? `No se pudo conectar con el backend (${error.message}). Verificá que el servidor TypeScript esté corriendo en el puerto 8080.`
          : 'Error de red al conectar con el backend.',
      status: 0,
    };
  }
}

// =========================================================
// CU 28 — Registrar recepción de bolsín
// =========================================================

export function iniciarRecepcionBolsin(): Promise<ApiResult<InicioRecepcionResponse>> {
  return requestJson<InicioRecepcionResponse>('/recepcion-bolsin/iniciar', {
    method: 'POST',
  });
}

export function seleccionarBolsin(numeroBolsin: number): Promise<ApiResult<SeleccionBolsinResponse>> {
  return requestJson<SeleccionBolsinResponse>('/recepcion-bolsin/seleccionar-bolsin', {
    method: 'POST',
    body: JSON.stringify({ numeroBolsin }),
  });
}

export function seleccionarOpcionRecepcion(
  opcion: number,
): Promise<ApiResult<SeleccionOpcionResponse>> {
  return requestJson<SeleccionOpcionResponse>('/recepcion-bolsin/seleccionar-opcion', {
    method: 'POST',
    body: JSON.stringify({ opcion }),
  });
}

export function confirmarRecepcionBolsin(): Promise<ApiResult<ConfirmacionRecepcionResponse>> {
  return requestJson<ConfirmacionRecepcionResponse>('/recepcion-bolsin/confirmar', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function reiniciarDatosDemo(): Promise<ApiResult<{ mensaje: string }>> {
  return requestJson<{ mensaje: string }>('/recepcion-bolsin/reiniciar', {
    method: 'POST',
  });
}

// =========================================================
// Visualizador del Patrón State (Documentacion)
// =========================================================

export function obtenerCatalogos(): Promise<ApiResult<CatalogosResponse>> {
  return requestJson<CatalogosResponse>('/documentaciones/catalogos');
}

export function listarDocumentaciones(): Promise<ApiResult<DocumentacionDto[]>> {
  return requestJson<DocumentacionDto[]>('/documentaciones');
}

export function crearDocumentacion(payload: {
  asunto: string;
  fechaPase: string;
  tipoDocumento: string;
  cmOrigen: string;
  emailResponsable: string;
}): Promise<ApiResult<DocumentacionDto>> {
  return requestJson<DocumentacionDto>('/documentaciones', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function ejecutarTransicionDocumentacion(
  numero: number,
  payload: {
    accion: AccionEstadoDocumentacion;
    emailResponsable: string;
    fechaHoraActual?: string;
  },
): Promise<ApiResult<TransicionResponse>> {
  return requestJson<TransicionResponse>(`/documentaciones/${numero}/transicion`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
