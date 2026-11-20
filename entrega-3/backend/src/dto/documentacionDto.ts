export type AccionEstadoDocumentacion =
  | 'remitir'
  | 'quitarDeRemito'
  | 'asociarBolsin'
  | 'desasociarBolsin'
  | 'enviar'
  | 'aceptar'
  | 'rechazar'
  | 'redirigir'
  | 'noRecibir'
  | 'darDeBaja'
  | 'registrar';

export type EstadoClase =
  | 'Registrada'
  | 'EnRemito'
  | 'EnBolsinSaliente'
  | 'EnBolsinEnviado'
  | 'RecibidaYAceptada'
  | 'NoRecibida'
  | 'RecibidaYRechazada'
  | 'ParaRedirigir'
  | 'DeBaja';

export interface EmpleadoDto {
  apellido: string;
  nombre: string;
  email: string;
  comisionMedica: string;
}

export interface EstadoDocumentacionDto {
  clase: EstadoClase;
  nombre: string;
  descripcion: string;
  esFinal: boolean;
}

export interface CambioEstadoDocumentacionDto {
  fechaHoraInicio: string;
  fechaHoraFin: string | null;
  esActual: boolean;
  estado: EstadoDocumentacionDto;
  responsable: EmpleadoDto;
}

export interface DocumentacionDto {
  numero: number;
  asunto: string;
  fechaPase: string;
  tipoDocumento: string;
  cmOrigen: string;
  estadoActual: EstadoDocumentacionDto;
  cambiosEstado: CambioEstadoDocumentacionDto[];
}

export interface DetalleRemitoDto {
  areaCMDestino: string;
  documentacion: DocumentacionDto;
}

export interface RemitoDto {
  numero: number;
  fecha: string;
  estado: {
    nombre: string;
    descripcion: string;
  };
  origen: string;
  destino: string;
  detalles: DetalleRemitoDto[];
}

export interface CambioEstadoBolsinDto {
  fechaHoraInicio: string;
  fechaHoraFin: string | null;
  esActual: boolean;
  estado: {
    nombre: string;
    descripcion: string;
  };
  responsable: EmpleadoDto;
}

export interface BolsinResumenDto {
  numeroBolsin: number;
  numeroPrecinto: number;
  peso: number;
  fecha: string;
  cmOrigen: string;
  cmDestino: string;
  estadoActual: string;
  cantidadRemitos: number;
  cantidadDocumentaciones: number;
}

export interface BolsinDetalleDto extends BolsinResumenDto {
  cambiosEstado: CambioEstadoBolsinDto[];
  remitos: RemitoDto[];
}

export interface OpcionRecepcionDto {
  codigo: number;
  titulo: string;
  descripcion: string;
  habilitadaEnCu28: boolean;
}

export interface TrazaPasoDto {
  orden: number;
  origen: string;
  destino: string;
  mensaje: string;
  detalle?: string;
}

export interface NotificacionCu29Dto {
  cmOrigen: string;
  destinatario: string;
  asunto: string;
  cantidadDocumentos: number;
  estadoNotificado: string;
}

export interface InicioRecepcionResponse {
  empleadoLogueado: EmpleadoDto;
  cmEmpleado: string;
  bolsinesEnviados: BolsinResumenDto[];
}

export interface SeleccionBolsinResponse {
  bolsin: BolsinDetalleDto;
  opcionesRecepcion: OpcionRecepcionDto[];
}

export interface SeleccionOpcionResponse {
  bolsin: BolsinDetalleDto;
  opcionSeleccionada: OpcionRecepcionDto;
}

export interface ConfirmacionRecepcionResponse {
  mensaje: string;
  bolsin: BolsinDetalleDto;
  notificacionesCu29: NotificacionCu29Dto[];
  traza: TrazaPasoDto[];
}

export interface TransicionResponse {
  mensaje: string;
  accion: AccionEstadoDocumentacion;
  estadoAnterior: EstadoClase;
  estadoNuevo: EstadoClase;
  documentacion: DocumentacionDto;
  traza: TrazaPasoDto[];
}

export interface CatalogosResponse {
  comisionesMedicas: string[];
  tiposDocumento: string[];
  empleados: EmpleadoDto[];
  acciones: AccionEstadoDocumentacion[];
}
