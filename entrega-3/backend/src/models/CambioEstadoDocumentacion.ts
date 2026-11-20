import type { Empleado } from './Empleado.js';
import type { EstadoDocumentacion } from './estados/EstadoDocumentacion.js';

export class CambioEstadoDocumentacion {
  private fechaHoraInicio: Date;
  private fechaHoraFin: Date | null;
  private estado: EstadoDocumentacion;
  private responsable: Empleado;

  constructor(fechaHoraActual: Date, estado: EstadoDocumentacion, responsable: Empleado) {
    this.fechaHoraInicio = fechaHoraActual;
    this.fechaHoraFin = null;
    this.estado = estado;
    this.responsable = responsable;
  }

  public setFechaHoraFin(fechaHoraActual: Date): void {
    this.fechaHoraFin = fechaHoraActual;
  }

  public sosActual(): boolean {
    return this.fechaHoraFin === null;
  }

  public getEstado(): EstadoDocumentacion {
    return this.estado;
  }

  public getFechaHoraInicio(): Date {
    return this.fechaHoraInicio;
  }

  public getFechaHoraFin(): Date | null {
    return this.fechaHoraFin;
  }

  public getResponsable(): Empleado {
    return this.responsable;
  }
}
