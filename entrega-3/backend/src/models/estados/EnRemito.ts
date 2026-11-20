import type { CambioEstadoDocumentacion } from '../CambioEstadoDocumentacion.js';
import type { Documentacion } from '../Documentacion.js';
import type { Empleado } from '../Empleado.js';
import { EnBolsinSaliente } from './EnBolsinSaliente.js';
import { EstadoDocumentacion } from './EstadoDocumentacion.js';
import { Registrada } from './Registrada.js';

export class EnRemito extends EstadoDocumentacion {
  constructor() {
    super(
      'En Remito',
      'Documentación incorporada en un remito generado para una CM destino.',
    );
  }

  public override quitarDeRemito(
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

  public override asociarBolsin(
    documentacion: Documentacion,
    fechaHoraActual: Date,
    cambiosEstado: CambioEstadoDocumentacion[],
    responsable: Empleado,
  ): void {
    this.cambiarEstado(fechaHoraActual, cambiosEstado, responsable);
    const nuevoEstado = new EnBolsinSaliente();
    const nuevoCambioEstado = this.crearCambioEstado(fechaHoraActual, nuevoEstado, responsable);
    documentacion.setEstadoActual(nuevoEstado);
    documentacion.agregarCambioEstado(nuevoCambioEstado);
  }
}
