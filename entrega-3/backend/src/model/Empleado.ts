import type { ComisionMedica } from './ComisionMedica.js';
import type { Usuario } from './Usuario.js';

export class Empleado {
  private apellido: string;
  private nombre: string;
  private email: string;
  private comisionMedica: ComisionMedica;
  private usuario: Usuario | null;

  constructor(
    apellido: string,
    nombre: string,
    email: string,
    comisionMedica: ComisionMedica,
    usuario: Usuario | null = null,
  ) {
    this.apellido = apellido;
    this.nombre = nombre;
    this.email = email;
    this.comisionMedica = comisionMedica;
    this.usuario = usuario;
  }

  public getApellido(): string {
    return this.apellido;
  }

  public getNombre(): string {
    return this.nombre;
  }

  public getEmail(): string {
    return this.email;
  }

  public getCM(): ComisionMedica {
    return this.comisionMedica;
  }

  public esTuUsuario(usuario: Usuario): boolean {
    return this.usuario !== null && this.usuario.getNombre() === usuario.getNombre();
  }
}
