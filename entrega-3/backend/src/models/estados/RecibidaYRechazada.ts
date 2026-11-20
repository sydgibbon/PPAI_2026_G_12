import type { CambioEstadoDocumentacion } from '../CambioEstadoDocumentacion.js';
import type { Documentacion } from '../Documentacion.js';
import type { Empleado } from '../Empleado.js';
import { EstadoDocumentacion } from './EstadoDocumentacion.js';
import { Registrada } from './Registrada.js';

export class RecibidaYRechazada extends EstadoDocumentacion {
  constructor() {
    super(
      'Recibida y Rechazada',
      'Documentación recibida que no corresponde a la CM destino o al área interna; debe devolverse al origen.',
    );
  }

  public override registrar(
    documentacion: Documentacion,
    fechaHoraActual: Date,
    cambiosEstado: CambioEstadoDocumentacion[],
    responsable: Empleado,
  ): void {
    this.cambiarEstado(fechaHoraActual, cambiosEstado, responsable);
    const nuevoEstado = new Registrada();
    const nuevoCambioEstado = this.crearCambioEstado(fechaHoraActual, nuevoEstado, responsable);
    documentacion.setEstadoActual(nuevoEstado);
    documentacion.agregarCambioEstado(nuevoCambioEstado);
  }
}
