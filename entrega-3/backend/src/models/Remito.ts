import type { ComisionMedica } from './ComisionMedica.js';
import type { DetalleRemito } from './DetalleRemito.js';
import type { Documentacion } from './Documentacion.js';
import type { Empleado } from './Empleado.js';
import type { EstadoRemito } from './EstadoRemito.js';

export class Remito {
  private fecha: Date;
  private numero: number;
  private estado: EstadoRemito;
  private detalleRemito: DetalleRemito[];
  private origen: ComisionMedica;
  private destino: ComisionMedica;

  constructor(
    numero: number,
    fecha: Date,
    estado: EstadoRemito,
    origen: ComisionMedica,
    destino: ComisionMedica,
    detalleRemito: DetalleRemito[] = [],
  ) {
    this.numero = numero;
    this.fecha = fecha;
    this.estado = estado;
    this.origen = origen;
    this.destino = destino;
    this.detalleRemito = [...detalleRemito];
  }

  public getNumero(): number {
    return this.numero;
  }

  public getFecha(): Date {
    return this.fecha;
  }

  public getEstado(): EstadoRemito {
    return this.estado;
  }

  public getOrigen(): ComisionMedica {
    return this.origen;
  }

  public getDestino(): ComisionMedica {
    return this.destino;
  }

  public getDetallesRemito(): DetalleRemito[] {
    return [...this.detalleRemito];
  }

  public buscarDocumentacion(): Documentacion[] {
    return this.detalleRemito.map((detalle) => detalle.getDocumentacion());
  }

  public setEstado(estado: EstadoRemito): void {
    this.estado = estado;
  }

  public recibirAceptar(
    estado: EstadoRemito,
    responsable: Empleado,
    fechaHoraActual: Date,
  ): void {
    this.setEstado(estado);
    this.aceptarDocumentacion(responsable, fechaHoraActual);
  }

  public aceptarDocumentacion(responsable: Empleado, fechaHoraActual: Date): void {
    for (const detalle of this.detalleRemito) {
      detalle.aceptarDocumentacion(responsable, fechaHoraActual);
    }
  }
}
