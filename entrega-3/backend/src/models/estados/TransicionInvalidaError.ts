export class TransicionInvalidaError extends Error {
  public readonly estadoActual: string;
  public readonly accion: string;

  constructor(estadoActual: string, accion: string) {
    super(
      `Transición inválida: la documentación en estado "${estadoActual}" no admite la acción "${accion}()".`,
    );
    this.name = 'TransicionInvalidaError';
    this.estadoActual = estadoActual;
    this.accion = accion;
  }
}
