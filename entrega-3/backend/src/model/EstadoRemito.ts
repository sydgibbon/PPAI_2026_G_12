export class EstadoRemito {
  private nombre: string;
  private descripcion: string;

  constructor(nombre: string, descripcion: string) {
    this.nombre = nombre;
    this.descripcion = descripcion;
  }

  public getNombre(): string {
    return this.nombre;
  }

  public getDescripcion(): string {
    return this.descripcion;
  }

  public esRecibidoYAceptado(): boolean {
    return this.nombre === 'Recibido y Aceptado';
  }
}
