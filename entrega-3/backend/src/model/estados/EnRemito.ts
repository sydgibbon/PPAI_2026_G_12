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
    this.transicionar(
      documentacion,
      fechaHoraActual,
      cambiosEstado,
      responsable,
      () => new Registrada(),
    );
  }

  public override asociarBolsin(
    documentacion: Documentacion,
    fechaHoraActual: Date,
    cambiosEstado: CambioEstadoDocumentacion[],
    responsable: Empleado,
  ): void {
    this.transicionar(
      documentacion,
      fechaHoraActual,
      cambiosEstado,
      responsable,
      () => new EnBolsinSaliente(),
    );
  }
}
