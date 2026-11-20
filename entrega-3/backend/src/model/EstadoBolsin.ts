export class EstadoBolsin {
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

  public esEnviado(): boolean {
    return this.nombre === 'Enviado';
  }

  public esRecibidoEnCMDestino(): boolean {
    return this.nombre === 'Recibido en CM destino';
  }

  /** Alias exacto del typo en DiagramaDeClasesDEFINITIVO.puml */
  public esRebidoEnCMDestino(): boolean {
    return this.esRecibidoEnCMDestino();
  }
}
