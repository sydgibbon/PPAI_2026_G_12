import { CambioEstadoBolsin } from './CambioEstadoBolsin.js';
import type { ComisionMedica } from './ComisionMedica.js';
import type { Empleado } from './Empleado.js';
import type { EstadoBolsin } from './EstadoBolsin.js';
import type { EstadoRemito } from './EstadoRemito.js';
import type { Remito } from './Remito.js';

export class Bolsin {
  private fecha: Date;
  private numeroBolsin: number;
  private numeroPrecinto: number;
  private peso: number;
  private origen: ComisionMedica;
  private destino: ComisionMedica;
  private cambioEstado: CambioEstadoBolsin[];
  private remito: Remito[];

  constructor(
    numeroBolsin: number,
    numeroPrecinto: number,
    peso: number,
    fecha: Date,
    origen: ComisionMedica,
    destino: ComisionMedica,
    cambioEstado: CambioEstadoBolsin[],
    remito: Remito[],
  ) {
    this.numeroBolsin = numeroBolsin;
    this.numeroPrecinto = numeroPrecinto;
    this.peso = peso;
    this.fecha = fecha;
    this.origen = origen;
    this.destino = destino;
    this.cambioEstado = [...cambioEstado];
    this.remito = [...remito];
  }

  public obtenerEstadoActual(): CambioEstadoBolsin {
    const actual = this.cambioEstado.find((cambio) => cambio.esActual());
    if (!actual) {
      throw new Error(`El bolsín #${this.numeroBolsin} no tiene un estado actual activo.`);
    }
    return actual;
  }

  public tenesEstaCMDestino(cm: ComisionMedica): boolean {
    return this.destino.getNombre() === cm.getNombre();
  }

  public sosEnviado(): boolean {
    return this.obtenerEstadoActual().sosEnviado();
  }

  public crearCEBolsin(
    fechaHoraActual: Date,
    responsable: Empleado,
    estado: EstadoBolsin,
  ): CambioEstadoBolsin {
    const nuevoCambio = new CambioEstadoBolsin(fechaHoraActual, estado, responsable);
    this.cambioEstado.push(nuevoCambio);
    return nuevoCambio;
  }

  public recibir(
    estadoBolsin: EstadoBolsin,
    estadoRemito: EstadoRemito,
    fechaHoraActual: Date,
    estadoActual: CambioEstadoBolsin,
    responsable: Empleado,
  ): void {
    const cambioActual = this.obtenerEstadoActual();
    if (estadoActual && cambioActual !== estadoActual) {
      estadoActual.setFechaHoraFin(fechaHoraActual);
    }
    cambioActual.setFechaHoraFin(fechaHoraActual);
    this.crearCEBolsin(fechaHoraActual, responsable, estadoBolsin);
    this.recibirAceptarRemito(estadoRemito, responsable, fechaHoraActual);
  }

  public recibirAceptarRemito(
    estadoRemito: EstadoRemito,
    responsable: Empleado,
    fechaHoraActual: Date,
  ): void {
    for (const rem of this.remito) {
      rem.recibirAceptar(estadoRemito, responsable, fechaHoraActual);
    }
  }

  public getFecha(): Date {
    return this.fecha;
  }

  public getNumeroBolsin(): number {
    return this.numeroBolsin;
  }

  public getNroPrecinto(): number {
    return this.numeroPrecinto;
  }

  public getPeso(): number {
    return this.peso;
  }

  public getCMOrigen(): ComisionMedica {
    return this.origen;
  }

  public getCMDestino(): ComisionMedica {
    return this.destino;
  }

  public getCambiosEstado(): CambioEstadoBolsin[] {
    return [...this.cambioEstado];
  }

  public getRemitos(): Remito[] {
    return [...this.remito];
  }
}
