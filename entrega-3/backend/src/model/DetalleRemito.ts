import type { Documentacion } from './Documentacion.js';
import type { Empleado } from './Empleado.js';

export class DetalleRemito {
  private areaCMDestino: string;
  private documentacion: Documentacion;

  constructor(documentacion: Documentacion, areaCMDestino: string = '') {
    this.documentacion = documentacion;
    this.areaCMDestino = areaCMDestino;
  }

  public getAreaCMDestino(): string {
    return this.areaCMDestino;
  }

  public getDocumentacion(): Documentacion {
    return this.documentacion;
  }

  public aceptarDocumentacion(responsable: Empleado, fechaHoraActual: Date): void {
    this.documentacion.aceptar(responsable, fechaHoraActual);
  }
}
