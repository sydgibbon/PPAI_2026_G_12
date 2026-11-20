export class Usuario {
  private nombre: string;
  private password: string;

  constructor(nombre: string, password: string) {
    this.nombre = nombre;
    this.password = password;
  }

  public getNombre(): string {
    return this.nombre;
  }

  public validarPassword(password: string): boolean {
    return this.password === password;
  }
}
