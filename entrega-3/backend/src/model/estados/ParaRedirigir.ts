import type { CambioEstadoDocumentacion } from '../CambioEstadoDocumentacion.js';
import type { Documentacion } from '../Documentacion.js';
import type { Empleado } from '../Empleado.js';
import { EstadoDocumentacion } from './EstadoDocumentacion.js';
import { RecibidaYAceptada } from './RecibidaYAceptada.js';
import { RecibidaYRechazada } from './RecibidaYRechazada.js';

export class ParaRedirigir extends EstadoDocumentacion {
  constructor() {
    super(
      'Para Redirigir',
      'Documentación recibida en la CMC pendiente de derivación y verificación por un área interna.',
    );
  }

  public override aceptar(
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
      () => new RecibidaYAceptada(),
    );
  }

  public override rechazar(
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
      () => new RecibidaYRechazada(),
    );
  }
}
