import type { CambioEstadoDocumentacion } from '../CambioEstadoDocumentacion.js';
import type { Documentacion } from '../Documentacion.js';
import type { Empleado } from '../Empleado.js';
import { EstadoDocumentacion } from './EstadoDocumentacion.js';
import { NoRecibida } from './NoRecibida.js';
import { ParaRedirigir } from './ParaRedirigir.js';
import { RecibidaYAceptada } from './RecibidaYAceptada.js';
import { RecibidaYRechazada } from './RecibidaYRechazada.js';

export class EnBolsinEnviado extends EstadoDocumentacion {
  constructor() {
    super(
      'En Bolsín Enviado',
      'Documentación despachada en un bolsín retirado por el correo hacia la CM destino.',
    );
  }

  public override aceptar(
    documentacion: Documentacion,
    fechaHoraActual: Date,
    cambiosEstado: CambioEstadoDocumentacion[],
    responsable: Empleado,
  ): void {
    this.cambiarEstado(fechaHoraActual, cambiosEstado, responsable);
    const nuevoEstado = this.crearEstado();
    const nuevoCambioEstado = this.crearCambioEstado(fechaHoraActual, nuevoEstado, responsable);
    documentacion.setEstadoActual(nuevoEstado);
    documentacion.agregarCambioEstado(nuevoCambioEstado);
  }

  public override rechazar(
    documentacion: Documentacion,
    fechaHoraActual: Date,
    cambiosEstado: CambioEstadoDocumentacion[],
    responsable: Empleado,
  ): void {
    this.cambiarEstado(fechaHoraActual, cambiosEstado, responsable);
    const nuevoEstado = new RecibidaYRechazada();
    const nuevoCambioEstado = this.crearCambioEstado(fechaHoraActual, nuevoEstado, responsable);
    documentacion.setEstadoActual(nuevoEstado);
    documentacion.agregarCambioEstado(nuevoCambioEstado);
  }

  public override redirigir(
    documentacion: Documentacion,
    fechaHoraActual: Date,
    cambiosEstado: CambioEstadoDocumentacion[],
    responsable: Empleado,
  ): void {
    this.cambiarEstado(fechaHoraActual, cambiosEstado, responsable);
    const nuevoEstado = new ParaRedirigir();
    const nuevoCambioEstado = this.crearCambioEstado(fechaHoraActual, nuevoEstado, responsable);
    documentacion.setEstadoActual(nuevoEstado);
    documentacion.agregarCambioEstado(nuevoCambioEstado);
  }

  public override noRecibir(
    documentacion: Documentacion,
    fechaHoraActual: Date,
    cambiosEstado: CambioEstadoDocumentacion[],
    responsable: Empleado,
  ): void {
    this.cambiarEstado(fechaHoraActual, cambiosEstado, responsable);
    const nuevoEstado = new NoRecibida();
    const nuevoCambioEstado = this.crearCambioEstado(fechaHoraActual, nuevoEstado, responsable);
    documentacion.setEstadoActual(nuevoEstado);
    documentacion.agregarCambioEstado(nuevoCambioEstado);
  }

  public override cambiarEstado(
    fechaHoraActual: Date,
    historial: CambioEstadoDocumentacion[],
    responsable: Empleado,
  ): void {
    super.cambiarEstado(fechaHoraActual, historial, responsable);
  }

  public crearEstado(): RecibidaYAceptada {
    return new RecibidaYAceptada();
  }

  public override crearCambioEstado(
    fechaHoraActual: Date,
    estado: EstadoDocumentacion,
    responsable: Empleado,
  ): CambioEstadoDocumentacion {
    return super.crearCambioEstado(fechaHoraActual, estado, responsable);
  }
}
