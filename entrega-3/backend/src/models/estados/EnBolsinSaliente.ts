import type { CambioEstadoDocumentacion } from '../CambioEstadoDocumentacion.js';
import type { Documentacion } from '../Documentacion.js';
import type { Empleado } from '../Empleado.js';
import { EnBolsinEnviado } from './EnBolsinEnviado.js';
import { EnRemito } from './EnRemito.js';
import { EstadoDocumentacion } from './EstadoDocumentacion.js';

export class EnBolsinSaliente extends EstadoDocumentacion {
  constructor() {
    super(
      'En Bolsín Saliente',
      'Documentación cuyo remito fue agregado a un bolsín saliente pendiente de retiro por el correo.',
    );
  }

  public override desasociarBolsin(
    documentacion: Documentacion,
    fechaHoraActual: Date,
    cambiosEstado: CambioEstadoDocumentacion[],
    responsable: Empleado,
  ): void {
    this.cambiarEstado(fechaHoraActual, cambiosEstado, responsable);
    const nuevoEstado = new EnRemito();
    const nuevoCambioEstado = this.crearCambioEstado(fechaHoraActual, nuevoEstado, responsable);
    documentacion.setEstadoActual(nuevoEstado);
    documentacion.agregarCambioEstado(nuevoCambioEstado);
  }

  public override enviar(
    documentacion: Documentacion,
    fechaHoraActual: Date,
    cambiosEstado: CambioEstadoDocumentacion[],
    responsable: Empleado,
  ): void {
    this.cambiarEstado(fechaHoraActual, cambiosEstado, responsable);
    const nuevoEstado = new EnBolsinEnviado();
    const nuevoCambioEstado = this.crearCambioEstado(fechaHoraActual, nuevoEstado, responsable);
    documentacion.setEstadoActual(nuevoEstado);
    documentacion.agregarCambioEstado(nuevoCambioEstado);
  }
}
