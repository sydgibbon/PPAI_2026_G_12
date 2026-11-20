import { EstadoDocumentacion } from './EstadoDocumentacion.js';

export class RecibidaYAceptada extends EstadoDocumentacion {
  constructor() {
    super(
      'Recibida y Aceptada',
      'Estado final: documentación recibida y aceptada conforme en la CM o área destino.',
    );
  }
}
