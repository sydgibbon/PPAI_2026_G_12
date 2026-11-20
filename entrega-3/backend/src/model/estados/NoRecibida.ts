import type { CambioEstadoDocumentacion } from '../CambioEstadoDocumentacion.js';
import type { Documentacion } from '../Documentacion.js';
import type { Empleado } from '../Empleado.js';
import { DeBaja } from './DeBaja.js';
import { EstadoDocumentacion } from './EstadoDocumentacion.js';
import { Registrada } from './Registrada.js';

export class NoRecibida extends EstadoDocumentacion {
  constructor() {
    super(
      'No Recibida',
      'Documentación incluida en un remito cuyo faltante se constató al recibir el bolsín en destino.',
    );
  }

  public override darDeBaja(
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
      () => new DeBaja(),
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
