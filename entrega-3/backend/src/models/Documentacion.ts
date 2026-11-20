import { CambioEstadoDocumentacion } from './CambioEstadoDocumentacion.js';
import type { ComisionMedica } from './ComisionMedica.js';
import type { Empleado } from './Empleado.js';
import type { TipoDocumento } from './TipoDocumento.js';
import type { EstadoDocumentacion } from './estados/EstadoDocumentacion.js';
import { Registrada } from './estados/Registrada.js';

export class Documentacion {
  private asunto: string;
  private fechaPase: Date;
  private numero: number;
  private tipoDocumento: TipoDocumento;
  private cmOrigen: ComisionMedica;
  private estadoActual: EstadoDocumentacion;
  private cambioEstado: CambioEstadoDocumentacion[];

  constructor(
    asunto: string,
    fechaPase: Date,
    numero: number,
    tipoDocumento: TipoDocumento,
    cmOrigen: ComisionMedica,
    fechaHoraActual: Date,
    responsable: Empleado,
  ) {
    this.asunto = asunto;
    this.fechaPase = fechaPase;
    this.numero = numero;
    this.tipoDocumento = tipoDocumento;
    this.cmOrigen = cmOrigen;

    const estadoInicial = new Registrada();
    this.estadoActual = estadoInicial;
    this.cambioEstado = [
      new CambioEstadoDocumentacion(fechaHoraActual, estadoInicial, responsable),
    ];
  }

  public getAsunto(): string {
    return this.asunto;
  }

  public getFechaPase(): Date {
    return this.fechaPase;
  }

  public getNumero(): number {
    return this.numero;
  }

  public getTipoDocumento(): TipoDocumento {
    return this.tipoDocumento;
  }

  public getCmOrigen(): ComisionMedica {
    return this.cmOrigen;
  }

  public getEstadoActual(): EstadoDocumentacion {
    return this.estadoActual;
  }

  public getCambiosEstado(): CambioEstadoDocumentacion[] {
    return [...this.cambioEstado];
  }

  public setEstadoActual(estado: EstadoDocumentacion): void {
    this.estadoActual = estado;
  }

  public agregarCambioEstado(cambioEstado: CambioEstadoDocumentacion): void {
    this.cambioEstado.push(cambioEstado);
  }

  public remitir(responsable: Empleado, fechaHoraActual: Date): void {
    this.estadoActual.remitir(this, fechaHoraActual, this.cambioEstado, responsable);
  }

  public quitarDeRemito(responsable: Empleado, fechaHoraActual: Date): void {
    this.estadoActual.quitarDeRemito(this, fechaHoraActual, this.cambioEstado, responsable);
  }

  public asociarBolsin(responsable: Empleado, fechaHoraActual: Date): void {
    this.estadoActual.asociarBolsin(this, fechaHoraActual, this.cambioEstado, responsable);
  }

  public desasociarBolsin(responsable: Empleado, fechaHoraActual: Date): void {
    this.estadoActual.desasociarBolsin(this, fechaHoraActual, this.cambioEstado, responsable);
  }

  public enviar(responsable: Empleado, fechaHoraActual: Date): void {
    this.estadoActual.enviar(this, fechaHoraActual, this.cambioEstado, responsable);
  }

  public aceptar(responsable: Empleado, fechaHoraActual: Date): void {
    this.estadoActual.aceptar(this, fechaHoraActual, this.cambioEstado, responsable);
  }

  public rechazar(responsable: Empleado, fechaHoraActual: Date): void {
    this.estadoActual.rechazar(this, fechaHoraActual, this.cambioEstado, responsable);
  }

  public redirigir(responsable: Empleado, fechaHoraActual: Date): void {
    this.estadoActual.redirigir(this, fechaHoraActual, this.cambioEstado, responsable);
  }

  public noRecibir(responsable: Empleado, fechaHoraActual: Date): void {
    this.estadoActual.noRecibir(this, fechaHoraActual, this.cambioEstado, responsable);
  }

  public darDeBaja(responsable: Empleado, fechaHoraActual: Date): void {
    this.estadoActual.darDeBaja(this, fechaHoraActual, this.cambioEstado, responsable);
  }

  public registrar(responsable: Empleado, fechaHoraActual: Date): void {
    this.estadoActual.registrar(this, fechaHoraActual, this.cambioEstado, responsable);
  }
}
