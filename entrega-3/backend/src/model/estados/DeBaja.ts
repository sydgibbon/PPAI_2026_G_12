import { EstadoDocumentacion } from './EstadoDocumentacion.js';

export class DeBaja extends EstadoDocumentacion {
  constructor() {
    super(
      'De Baja',
      'Estado final: documentación dada de baja por considerarse irrelevante su envío.',
    );
  }
}
