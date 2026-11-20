import type { AccionEstadoDocumentacion, EstadoClase } from '../types/api';

export interface EstadoVisualMeta {
  clase: EstadoClase;
  etiqueta: string;
  simbolo: string;
  esFinal: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  tone: 'info' | 'transit' | 'warning' | 'success' | 'danger';
}

export interface TransicionMeta {
  id: string;
  desde: EstadoClase;
  hacia: EstadoClase;
  accion: AccionEstadoDocumentacion;
  cu: string;
  guarda?: string;
  labelOffset?: { dx: number; dy: number };
  curveOffset?: number;
}

export interface AccionMeta {
  accion: AccionEstadoDocumentacion;
  etiqueta: string;
  descripcion: string;
}

export const ESTADOS_VISUAL_META: Record<EstadoClase, EstadoVisualMeta> = {
  Registrada: {
    clase: 'Registrada',
    etiqueta: 'Registrada',
    simbolo: '●',
    esFinal: false,
    x: 90,
    y: 120,
    width: 170,
    height: 54,
    tone: 'info',
  },
  EnRemito: {
    clase: 'EnRemito',
    etiqueta: 'EnRemito',
    simbolo: '▤',
    esFinal: false,
    x: 335,
    y: 120,
    width: 170,
    height: 54,
    tone: 'info',
  },
  EnBolsinSaliente: {
    clase: 'EnBolsinSaliente',
    etiqueta: 'EnBolsinSaliente',
    simbolo: '◫',
    esFinal: false,
    x: 580,
    y: 120,
    width: 185,
    height: 54,
    tone: 'transit',
  },
  EnBolsinEnviado: {
    clase: 'EnBolsinEnviado',
    etiqueta: 'EnBolsinEnviado',
    simbolo: '➔',
    esFinal: false,
    x: 580,
    y: 280,
    width: 185,
    height: 54,
    tone: 'transit',
  },
  RecibidaYAceptada: {
    clase: 'RecibidaYAceptada',
    etiqueta: 'RecibidaYAceptada',
    simbolo: '✓',
    esFinal: true,
    x: 840,
    y: 230,
    width: 190,
    height: 54,
    tone: 'success',
  },
  ParaRedirigir: {
    clase: 'ParaRedirigir',
    etiqueta: 'ParaRedirigir',
    simbolo: '⇄',
    esFinal: false,
    x: 840,
    y: 380,
    width: 185,
    height: 54,
    tone: 'warning',
  },
  NoRecibida: {
    clase: 'NoRecibida',
    etiqueta: 'NoRecibida',
    simbolo: '⚠',
    esFinal: false,
    x: 335,
    y: 380,
    width: 175,
    height: 54,
    tone: 'warning',
  },
  RecibidaYRechazada: {
    clase: 'RecibidaYRechazada',
    etiqueta: 'RecibidaYRechazada',
    simbolo: '✕',
    esFinal: false,
    x: 90,
    y: 280,
    width: 195,
    height: 54,
    tone: 'danger',
  },
  DeBaja: {
    clase: 'DeBaja',
    etiqueta: 'DeBaja',
    simbolo: '■',
    esFinal: true,
    x: 90,
    y: 485,
    width: 165,
    height: 54,
    tone: 'danger',
  },
};

export const TRANSICIONES_META: TransicionMeta[] = [
  {
    id: 'reg-remitir',
    desde: 'Registrada',
    hacia: 'EnRemito',
    accion: 'remitir',
    cu: '15. Generar Remito / 16. Modificar Remito',
    curveOffset: -28,
    labelOffset: { dx: 0, dy: -22 },
  },
  {
    id: 'rem-quitar',
    desde: 'EnRemito',
    hacia: 'Registrada',
    accion: 'quitarDeRemito',
    cu: '16. Modificar Remito / 17. Cancelar Remito',
    curveOffset: -28,
    labelOffset: { dx: 0, dy: 28 },
  },
  {
    id: 'rem-asociar',
    desde: 'EnRemito',
    hacia: 'EnBolsinSaliente',
    accion: 'asociarBolsin',
    cu: '19. Generar Bolsín / 20. Modificar Bolsín',
    curveOffset: -28,
    labelOffset: { dx: 0, dy: -22 },
  },
  {
    id: 'bs-desasociar',
    desde: 'EnBolsinSaliente',
    hacia: 'EnRemito',
    accion: 'desasociarBolsin',
    cu: '20. Modificar Bolsín / 21. Eliminar Bolsín',
    curveOffset: -28,
    labelOffset: { dx: 0, dy: 28 },
  },
  {
    id: 'bs-enviar',
    desde: 'EnBolsinSaliente',
    hacia: 'EnBolsinEnviado',
    accion: 'enviar',
    cu: '27. Registrar el retiro de bolsines',
    labelOffset: { dx: 54, dy: 0 },
  },
  {
    id: 'be-aceptar',
    desde: 'EnBolsinEnviado',
    hacia: 'RecibidaYAceptada',
    accion: 'aceptar',
    cu: '28. Registrar recepción de bolsín',
    guarda: 'Contenido coincide = SI',
    labelOffset: { dx: 0, dy: -18 },
  },
  {
    id: 'be-redirigir',
    desde: 'EnBolsinEnviado',
    hacia: 'ParaRedirigir',
    accion: 'redirigir',
    cu: '28. Registrar recepción de bolsín',
    guarda: 'Para redirigir a otra área = SI',
    labelOffset: { dx: 12, dy: 18 },
  },
  {
    id: 'be-norecibir',
    desde: 'EnBolsinEnviado',
    hacia: 'NoRecibida',
    accion: 'noRecibir',
    cu: '28. Registrar recepción de bolsín',
    guarda: 'No se recibe toda la doc = SI',
    labelOffset: { dx: -24, dy: -16 },
  },
  {
    id: 'be-rechazar',
    desde: 'EnBolsinEnviado',
    hacia: 'RecibidaYRechazada',
    accion: 'rechazar',
    cu: '28. Registrar recepción de bolsín',
    guarda: 'No corresponde a CM destino = SI',
    labelOffset: { dx: 0, dy: -14 },
  },
  {
    id: 'pr-aceptar',
    desde: 'ParaRedirigir',
    hacia: 'RecibidaYAceptada',
    accion: 'aceptar',
    cu: '31. Registrar Revisión de Documentación',
    guarda: 'Documentación es correcta = SI',
    labelOffset: { dx: 55, dy: 0 },
  },
  {
    id: 'pr-rechazar',
    desde: 'ParaRedirigir',
    hacia: 'RecibidaYRechazada',
    accion: 'rechazar',
    cu: '31. Registrar Revisión de Documentación',
    guarda: 'No corresponde al área = SI',
    curveOffset: 115,
    labelOffset: { dx: 0, dy: 26 },
  },
  {
    id: 'nr-registrar',
    desde: 'NoRecibida',
    hacia: 'Registrada',
    accion: 'registrar',
    cu: '31. Registrar Revisión de Documentación',
    guarda: 'Se desea volver a vincular a remito = SI',
    labelOffset: { dx: 18, dy: 16 },
  },
  {
    id: 'nr-baja',
    desde: 'NoRecibida',
    hacia: 'DeBaja',
    accion: 'darDeBaja',
    cu: '31. Registrar Revisión de Documentación',
    guarda: 'Ya no es relevante su envío = SI',
    labelOffset: { dx: 24, dy: 22 },
  },
  {
    id: 'rr-registrar',
    desde: 'RecibidaYRechazada',
    hacia: 'Registrada',
    accion: 'registrar',
    cu: '31. Registrar Revisión de Documentación',
    labelOffset: { dx: -52, dy: 0 },
  },
];

export const ACCIONES_META: Record<AccionEstadoDocumentacion, AccionMeta> = {
  remitir: {
    accion: 'remitir',
    etiqueta: 'remitir()',
    descripcion: 'Incluir documentación registrada en un remito.',
  },
  quitarDeRemito: {
    accion: 'quitarDeRemito',
    etiqueta: 'quitarDeRemito()',
    descripcion: 'Quitar o cancelar el remito para volver a Registrada.',
  },
  asociarBolsin: {
    accion: 'asociarBolsin',
    etiqueta: 'asociarBolsin()',
    descripcion: 'Agregar el remito con la documentación a un bolsín saliente.',
  },
  desasociarBolsin: {
    accion: 'desasociarBolsin',
    etiqueta: 'desasociarBolsin()',
    descripcion: 'Quitar o eliminar el bolsín devolviendo la doc a EnRemito.',
  },
  enviar: {
    accion: 'enviar',
    etiqueta: 'enviar()',
    descripcion: 'Registrar el retiro del bolsín por el correo.',
  },
  aceptar: {
    accion: 'aceptar',
    etiqueta: 'aceptar()',
    descripcion: 'Aceptar conforme en CM destino o área interna (CU 28 / CU 31).',
  },
  rechazar: {
    accion: 'rechazar',
    etiqueta: 'rechazar()',
    descripcion: 'Rechazar documentación que no corresponde a la CM o área.',
  },
  redirigir: {
    accion: 'redirigir',
    etiqueta: 'redirigir()',
    descripcion: 'Marcar documentación en CMC para redirigir a área interna.',
  },
  noRecibir: {
    accion: 'noRecibir',
    etiqueta: 'noRecibir()',
    descripcion: 'Constatar que la documentación registrada no llegó físicamente.',
  },
  darDeBaja: {
    accion: 'darDeBaja',
    etiqueta: 'darDeBaja()',
    descripcion: 'Dar de baja definitiva cuando su envío deja de ser relevante.',
  },
  registrar: {
    accion: 'registrar',
    etiqueta: 'registrar()',
    descripcion: 'Rehabilitar documentación devuelta o no recibida a Registrada.',
  },
};
