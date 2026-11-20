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
    this.transicionar(
      documentacion,
      fechaHoraActual,
      cambiosEstado,
      responsable,
      () => new Registrada(),
    );
  }
}
