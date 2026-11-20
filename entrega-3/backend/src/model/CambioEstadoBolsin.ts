import type { Empleado } from './Empleado.js';
import type { EstadoBolsin } from './EstadoBolsin.js';

export class CambioEstadoBolsin {
  private fechaHoraInicio: Date;
  private fechaHoraFin: Date | null;
  private estado: EstadoBolsin;
  private responsable: Empleado;

  constructor(fechaHoraInicio: Date, estado: EstadoBolsin, responsable: Empleado) {
    this.fechaHoraInicio = fechaHoraInicio;
    this.fechaHoraFin = null;
    this.estado = estado;
    this.responsable = responsable;
  }

  public setFechaHoraFin(fechaHoraActual: Date): void {
    this.fechaHoraFin = fechaHoraActual;
  }

  public esActual(): boolean {
    return this.fechaHoraFin === null;
  }

  public sosEnviado(): boolean {
    return this.estado.esEnviado();
  }

  public getFechaHoraInicio(): Date {
    return this.fechaHoraInicio;
  }

  public getFechaHoraFin(): Date | null {
    return this.fechaHoraFin;
  }

  public getEstado(): EstadoBolsin {
    return this.estado;
  }

  public getResponsable(): Empleado {
    return this.responsable;
  }
}
