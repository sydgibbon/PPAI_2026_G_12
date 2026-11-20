import type { CambioEstadoDocumentacion } from '../CambioEstadoDocumentacion.js';
import type { Documentacion } from '../Documentacion.js';
import type { Empleado } from '../Empleado.js';
import { EnRemito } from './EnRemito.js';
import { EstadoDocumentacion } from './EstadoDocumentacion.js';

export class Registrada extends EstadoDocumentacion {
  constructor() {
    super(
      'Registrada',
      'Documentación registrada en el sistema en su CM de origen, disponible para incluirse en un remito.',
    );
  }

  public override remitir(
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
}
