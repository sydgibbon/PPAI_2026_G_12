import type { Usuario } from './Usuario.js';

export class Sesion {
  private fechaHoraInicio: Date;
  private fechaHoraFin: Date | null;
  private usuario: Usuario;

  constructor(usuario: Usuario, fechaHoraInicio: Date = new Date(), fechaHoraFin: Date | null = null) {
    this.usuario = usuario;
    this.fechaHoraInicio = fechaHoraInicio;
    this.fechaHoraFin = fechaHoraFin;
  }

  public getUsuario(): Usuario {
    return this.usuario;
  }

  public getFechaHoraInicio(): Date {
    return this.fechaHoraInicio;
  }

  public getFechaHoraFin(): Date | null {
    return this.fechaHoraFin;
  }
}
