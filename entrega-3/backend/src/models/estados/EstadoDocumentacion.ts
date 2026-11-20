import { CambioEstadoDocumentacion } from '../CambioEstadoDocumentacion.js';
import type { Documentacion } from '../Documentacion.js';
import type { Empleado } from '../Empleado.js';
import { TransicionInvalidaError } from './TransicionInvalidaError.js';

export abstract class EstadoDocumentacion {
  private nombre: string;
  private descripcion: string;

  protected constructor(nombre: string, descripcion: string) {
    this.nombre = nombre;
    this.descripcion = descripcion;
  }

  public getNombre(): string {
    return this.nombre;
  }

  public getDescripcion(): string {
    return this.descripcion;
  }

  public remitir(
    _documentacion: Documentacion,
    _fechaHoraActual: Date,
    _cambiosEstado: CambioEstadoDocumentacion[],
    _responsable: Empleado,
  ): void {
    throw new TransicionInvalidaError(this.nombre, 'remitir');
  }

  public quitarDeRemito(
    _documentacion: Documentacion,
    _fechaHoraActual: Date,
    _cambiosEstado: CambioEstadoDocumentacion[],
    _responsable: Empleado,
  ): void {
    throw new TransicionInvalidaError(this.nombre, 'quitarDeRemito');
  }

  public asociarBolsin(
    _documentacion: Documentacion,
    _fechaHoraActual: Date,
    _cambiosEstado: CambioEstadoDocumentacion[],
    _responsable: Empleado,
  ): void {
    throw new TransicionInvalidaError(this.nombre, 'asociarBolsin');
  }

  public desasociarBolsin(
    _documentacion: Documentacion,
    _fechaHoraActual: Date,
    _cambiosEstado: CambioEstadoDocumentacion[],
    _responsable: Empleado,
  ): void {
    throw new TransicionInvalidaError(this.nombre, 'desasociarBolsin');
  }

  public enviar(
    _documentacion: Documentacion,
    _fechaHoraActual: Date,
    _cambiosEstado: CambioEstadoDocumentacion[],
    _responsable: Empleado,
  ): void {
    throw new TransicionInvalidaError(this.nombre, 'enviar');
  }

  public aceptar(
    _documentacion: Documentacion,
    _fechaHoraActual: Date,
    _cambiosEstado: CambioEstadoDocumentacion[],
    _responsable: Empleado,
  ): void {
    throw new TransicionInvalidaError(this.nombre, 'aceptar');
  }

  public rechazar(
    _documentacion: Documentacion,
    _fechaHoraActual: Date,
    _cambiosEstado: CambioEstadoDocumentacion[],
    _responsable: Empleado,
  ): void {
    throw new TransicionInvalidaError(this.nombre, 'rechazar');
  }

  public redirigir(
    _documentacion: Documentacion,
    _fechaHoraActual: Date,
    _cambiosEstado: CambioEstadoDocumentacion[],
    _responsable: Empleado,
  ): void {
    throw new TransicionInvalidaError(this.nombre, 'redirigir');
  }

  public noRecibir(
    _documentacion: Documentacion,
    _fechaHoraActual: Date,
    _cambiosEstado: CambioEstadoDocumentacion[],
    _responsable: Empleado,
  ): void {
    throw new TransicionInvalidaError(this.nombre, 'noRecibir');
  }

  public darDeBaja(
    _documentacion: Documentacion,
    _fechaHoraActual: Date,
    _cambiosEstado: CambioEstadoDocumentacion[],
    _responsable: Empleado,
  ): void {
    throw new TransicionInvalidaError(this.nombre, 'darDeBaja');
  }

  public registrar(
    _documentacion: Documentacion,
    _fechaHoraActual: Date,
    _cambiosEstado: CambioEstadoDocumentacion[],
    _responsable: Empleado,
  ): void {
    throw new TransicionInvalidaError(this.nombre, 'registrar');
  }

  public cambiarEstado(
    fechaHoraActual: Date,
    historial: CambioEstadoDocumentacion[],
    responsable: Empleado,
  ): void {
    void responsable;
    for (const cambio of historial) {
      if (cambio.sosActual()) {
        cambio.setFechaHoraFin(fechaHoraActual);
      }
    }
  }

  public crearCambioEstado(
    fechaHoraActual: Date,
    estado: EstadoDocumentacion,
    responsable: Empleado,
  ): CambioEstadoDocumentacion {
    return new CambioEstadoDocumentacion(fechaHoraActual, estado, responsable);
  }
}
