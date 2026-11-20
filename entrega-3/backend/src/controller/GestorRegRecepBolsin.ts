import type {
  AccionEstadoDocumentacion,
  BolsinDetalleDto,
  BolsinResumenDto,
  CambioEstadoBolsinDto,
  CambioEstadoDocumentacionDto,
  CatalogosResponse,
  ConfirmacionRecepcionResponse,
  DocumentacionDto,
  EmpleadoDto,
  EstadoClase,
  EstadoDocumentacionDto,
  InicioRecepcionResponse,
  NotificacionCu29Dto,
  OpcionRecepcionDto,
  RemitoDto,
  SeleccionBolsinResponse,
  SeleccionOpcionResponse,
  TransicionResponse,
  TrazaPasoDto,
} from '../dtos/documentacionDto.js';
import { Bolsin } from '../models/Bolsin.js';
import { CambioEstadoBolsin } from '../models/CambioEstadoBolsin.js';
import type { CambioEstadoDocumentacion } from '../models/CambioEstadoDocumentacion.js';
import { ComisionMedica } from '../models/ComisionMedica.js';
import { DetalleRemito } from '../models/DetalleRemito.js';
import { Documentacion } from '../models/Documentacion.js';
import { Empleado } from '../models/Empleado.js';
import { EstadoBolsin } from '../models/EstadoBolsin.js';
import { EstadoRemito } from '../models/EstadoRemito.js';
import { Remito } from '../models/Remito.js';
import { Sesion } from '../models/Sesion.js';
import { TipoDocumento } from '../models/TipoDocumento.js';
import { Usuario } from '../models/Usuario.js';
import { DeBaja } from '../models/estados/DeBaja.js';
import { EnBolsinEnviado } from '../models/estados/EnBolsinEnviado.js';
import { EnBolsinSaliente } from '../models/estados/EnBolsinSaliente.js';
import { EnRemito } from '../models/estados/EnRemito.js';
import type { EstadoDocumentacion } from '../models/estados/EstadoDocumentacion.js';
import { NoRecibida } from '../models/estados/NoRecibida.js';
import { ParaRedirigir } from '../models/estados/ParaRedirigir.js';
import { RecibidaYAceptada } from '../models/estados/RecibidaYAceptada.js';
import { RecibidaYRechazada } from '../models/estados/RecibidaYRechazada.js';
import { Registrada } from '../models/estados/Registrada.js';
import { TransicionInvalidaError } from '../models/estados/TransicionInvalidaError.js';

export class DominioError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'DominioError';
    this.statusCode = statusCode;
  }
}

export class TransicionConTrazaError extends TransicionInvalidaError {
  public readonly traza: TrazaPasoDto[];

  constructor(error: TransicionInvalidaError, traza: TrazaPasoDto[]) {
    super(error.estadoActual, error.accion);
    this.traza = traza;
  }
}

const ACCION_DISPATCH: Record<
  AccionEstadoDocumentacion,
  (doc: Documentacion, responsable: Empleado, fechaHoraActual: Date) => void
> = {
  remitir: (doc, resp, fecha) => doc.remitir(resp, fecha),
  quitarDeRemito: (doc, resp, fecha) => doc.quitarDeRemito(resp, fecha),
  asociarBolsin: (doc, resp, fecha) => doc.asociarBolsin(resp, fecha),
  desasociarBolsin: (doc, resp, fecha) => doc.desasociarBolsin(resp, fecha),
  enviar: (doc, resp, fecha) => doc.enviar(resp, fecha),
  aceptar: (doc, resp, fecha) => doc.aceptar(resp, fecha),
  rechazar: (doc, resp, fecha) => doc.rechazar(resp, fecha),
  redirigir: (doc, resp, fecha) => doc.redirigir(resp, fecha),
  noRecibir: (doc, resp, fecha) => doc.noRecibir(resp, fecha),
  darDeBaja: (doc, resp, fecha) => doc.darDeBaja(resp, fecha),
  registrar: (doc, resp, fecha) => doc.registrar(resp, fecha),
};

const OPCIONES_RECEPCION: OpcionRecepcionDto[] = [
  {
    codigo: 1,
    titulo: 'El contenido del bolsín es igual al registrado',
    descripcion:
      'El contenido físico del bolsín coincide exactamente con los remitos y la documentación registrada.',
    habilitadaEnCu28: true,
  },
  {
    codigo: 2,
    titulo: 'No se recibe toda la documentación asociada a los remitos que contiene el bolsín',
    descripcion:
      'Falta parte de la documentación incluida en los remitos; la documentación faltante quedará registrada como No Recibida.',
    habilitadaEnCu28: false,
  },
  {
    codigo: 3,
    titulo: 'Existe documentación que no corresponde al destino (CM del usuario logueado)',
    descripcion:
      'Se recibió documentación dirigida a otra Comisión Médica; quedará marcada como Recibida y Rechazada para su devolución al origen.',
    habilitadaEnCu28: false,
  },
  {
    codigo: 4,
    titulo: 'La documentación se debe redirigir a otra área',
    descripcion:
      'Documentación recibida en la Comisión Médica Central que debe derivarse internamente a otra área.',
    habilitadaEnCu28: false,
  },
];

export function obtenerNombreClaseEstado(estado: EstadoDocumentacion): EstadoClase {
  if (estado instanceof Registrada) return 'Registrada';
  if (estado instanceof EnRemito) return 'EnRemito';
  if (estado instanceof EnBolsinSaliente) return 'EnBolsinSaliente';
  if (estado instanceof EnBolsinEnviado) return 'EnBolsinEnviado';
  if (estado instanceof RecibidaYAceptada) return 'RecibidaYAceptada';
  if (estado instanceof NoRecibida) return 'NoRecibida';
  if (estado instanceof RecibidaYRechazada) return 'RecibidaYRechazada';
  if (estado instanceof ParaRedirigir) return 'ParaRedirigir';
  if (estado instanceof DeBaja) return 'DeBaja';
  throw new Error(`Subclase de EstadoDocumentacion desconocida: ${estado.getNombre()}`);
}

export class GestorRegRecepBolsin {
  // Atributos del diagrama de clases (1.vista-estatica.puml)
  private estadoBolsin: EstadoBolsin | null = null;
  private estadoRemito: EstadoRemito | null = null;
  private fechaHoraActual: Date | null = null;
  private estadoActual: CambioEstadoBolsin | null = null;
  private responsable: Empleado | null = null;

  // Estado del caso de uso y catálogos en memoria
  private sesionActiva!: Sesion;
  private comisionesMedicas: ComisionMedica[] = [];
  private tiposDocumento: TipoDocumento[] = [];
  private empleados: Empleado[] = [];
  private estadosBolsin: EstadoBolsin[] = [];
  private estadosRemito: EstadoRemito[] = [];
  private documentaciones: Documentacion[] = [];
  private bolsines: Bolsin[] = [];

  private bolsinSeleccionado: Bolsin | null = null;
  private opcionRecepcionSeleccionada: number | null = null;
  private siguienteNumeroDoc: number = 1009;

  constructor() {
    this.poblarDatos();
  }

  public poblarDatos(): void {
    this.estadoBolsin = null;
    this.estadoRemito = null;
    this.fechaHoraActual = null;
    this.estadoActual = null;
    this.responsable = null;
    this.bolsinSeleccionado = null;
    this.opcionRecepcionSeleccionada = null;

    const cmCentral = new ComisionMedica('Comisión Médica Central (CMC - C.A.B.A.)');
    const cmCordoba = new ComisionMedica('Comisión Médica Córdoba');
    const cmRosario = new ComisionMedica('Comisión Médica Rosario');
    const cmMendoza = new ComisionMedica('Comisión Médica Mendoza');
    const cmParana = new ComisionMedica('Comisión Médica Paraná');
    const cmVillaMaria = new ComisionMedica('Comisión Médica Villa María');
    this.comisionesMedicas = [
      cmCentral,
      cmCordoba,
      cmRosario,
      cmMendoza,
      cmParana,
      cmVillaMaria,
    ];

    const tdExpediente = new TipoDocumento('Expediente');
    const tdDictamen = new TipoDocumento('Dictamen');
    const tdEstudio = new TipoDocumento('Estudio Médico');
    const tdCarta = new TipoDocumento('Carta Documento');
    this.tiposDocumento = [tdExpediente, tdDictamen, tdEstudio, tdCarta];

    const usrMaria = new Usuario('mgonzalez', 'dsi2026');
    const usrJuan = new Usuario('jperez', 'dsi2026');
    const usrCarlos = new Usuario('crodriguez', 'dsi2026');
    const usrLaura = new Usuario('lmartinez', 'dsi2026');

    const empMaria = new Empleado(
      'González',
      'María',
      'maria.gonzalez@srt.gob.ar',
      cmCentral,
      usrMaria,
    );
    const empJuan = new Empleado(
      'Pérez',
      'Juan',
      'juan.perez@srt.gob.ar',
      cmCordoba,
      usrJuan,
    );
    const empCarlos = new Empleado(
      'Rodríguez',
      'Carlos',
      'carlos.rodriguez@srt.gob.ar',
      cmRosario,
      usrCarlos,
    );
    const empLaura = new Empleado(
      'Martínez',
      'Laura',
      'laura.martinez@srt.gob.ar',
      cmMendoza,
      usrLaura,
    );
    this.empleados = [empMaria, empJuan, empCarlos, empLaura];

    this.sesionActiva = new Sesion(usrMaria, new Date('2026-11-20T08:00:00-03:00'));

    const ebCreado = new EstadoBolsin('Creado', 'Bolsín creado en CM origen');
    const ebCerrado = new EstadoBolsin('Cerrado', 'Bolsín cerrado con precinto de seguridad');
    const ebEnviado = new EstadoBolsin('Enviado', 'Bolsín retirado por el servicio de correo');
    const ebRecibido = new EstadoBolsin(
      'Recibido en CM destino',
      'Bolsín recepcionado conforme en la CM destino',
    );
    const ebBaja = new EstadoBolsin('De baja', 'Bolsín dado de baja antes del envío');
    this.estadosBolsin = [ebCreado, ebCerrado, ebEnviado, ebRecibido, ebBaja];

    const erCreado = new EstadoRemito('Creado', 'Remito generado en CM origen');
    const erSaliente = new EstadoRemito(
      'En bolsín saliente',
      'Remito asociado a un bolsín saliente',
    );
    const erEnviado = new EstadoRemito('En bolsín enviado', 'Remito en tránsito hacia destino');
    const erRecibidoAceptado = new EstadoRemito(
      'Recibido y Aceptado',
      'Remito y documentación recibidos y aceptados en destino',
    );
    const erRecibidoParcial = new EstadoRemito(
      'Recibido y Aceptado Parcial',
      'Remito recibido con observaciones parciales',
    );
    this.estadosRemito = [erCreado, erSaliente, erEnviado, erRecibidoAceptado, erRecibidoParcial];

    const crearYAvanzarDoc = (
      numero: number,
      asunto: string,
      tipo: TipoDocumento,
      cmOrigen: ComisionMedica,
      respOrigen: Empleado,
      fechaBaseIso: string,
      pasos: AccionEstadoDocumentacion[],
    ): Documentacion => {
      const baseMs = new Date(fechaBaseIso).getTime();
      const doc = new Documentacion(
        asunto,
        new Date(baseMs),
        numero,
        tipo,
        cmOrigen,
        new Date(baseMs),
        respOrigen,
      );
      pasos.forEach((accion, idx) => {
        const resp =
          accion === 'redirigir' || accion === 'noRecibir' || accion === 'aceptar'
            ? empMaria
            : respOrigen;
        const fechaPaso = new Date(baseMs + (idx + 1) * 3_600_000);
        ACCION_DISPATCH[accion](doc, resp, fechaPaso);
      });
      return doc;
    };

    // Documentaciones del Bolsín #501 (CM Córdoba -> CMC)
    const doc1001 = crearYAvanzarDoc(
      1001,
      'EXP-2026-44120 — Recurso de Apelación Junta Médica',
      tdExpediente,
      cmCordoba,
      empJuan,
      '2026-11-18T09:00:00-03:00',
      ['remitir', 'asociarBolsin', 'enviar'],
    );
    const doc1002 = crearYAvanzarDoc(
      1002,
      'DIC-2026-08914 — Dictamen Médico Comisión N° 5',
      tdDictamen,
      cmCordoba,
      empJuan,
      '2026-11-18T09:15:00-03:00',
      ['remitir', 'asociarBolsin', 'enviar'],
    );
    const doc1003 = crearYAvanzarDoc(
      1003,
      'EST-2026-31092 — Resonancia Magnética Columna Lumbar',
      tdEstudio,
      cmCordoba,
      empJuan,
      '2026-11-18T09:30:00-03:00',
      ['remitir', 'asociarBolsin', 'enviar'],
    );

    // Documentaciones del Bolsín #502 (CM Rosario -> CMC)
    const doc1004 = crearYAvanzarDoc(
      1004,
      'EXP-2026-55201 — Homologación Acuerdo Incapacidad',
      tdExpediente,
      cmRosario,
      empCarlos,
      '2026-11-19T08:30:00-03:00',
      ['remitir', 'asociarBolsin', 'enviar'],
    );
    const doc1005 = crearYAvanzarDoc(
      1005,
      'CD-2026-19204 — Notificación Fehaciente Empleador',
      tdCarta,
      cmRosario,
      empCarlos,
      '2026-11-19T08:45:00-03:00',
      ['remitir', 'asociarBolsin', 'enviar'],
    );

    // Documentaciones independientes en distintos estados del ciclo de vida
    const doc1006 = crearYAvanzarDoc(
      1006,
      'EXP-2026-60112 — Solicitud Revisión Grado Incapacidad',
      tdExpediente,
      cmMendoza,
      empLaura,
      '2026-11-20T09:00:00-03:00',
      [],
    );
    const doc1007 = crearYAvanzarDoc(
      1007,
      'EST-2026-29840 — Electromiografía Miembro Superior',
      tdEstudio,
      cmParana,
      empCarlos,
      '2026-11-17T10:00:00-03:00',
      ['remitir', 'asociarBolsin', 'enviar', 'redirigir'],
    );
    const doc1008 = crearYAvanzarDoc(
      1008,
      'CD-2026-18500 — Citación Audiencia Médica',
      tdCarta,
      cmVillaMaria,
      empJuan,
      '2026-11-16T11:00:00-03:00',
      ['remitir', 'asociarBolsin', 'enviar', 'noRecibir'],
    );

    this.documentaciones = [
      doc1001,
      doc1002,
      doc1003,
      doc1004,
      doc1005,
      doc1006,
      doc1007,
      doc1008,
    ];
    this.siguienteNumeroDoc = 1009;

    const remito201 = new Remito(
      201,
      new Date('2026-11-18T10:00:00-03:00'),
      erEnviado,
      cmCordoba,
      cmCentral,
      [new DetalleRemito(doc1001, 'Mesa de Entradas CMC'), new DetalleRemito(doc1002, 'Comisión Revisora')],
    );
    const remito202 = new Remito(
      202,
      new Date('2026-11-18T10:30:00-03:00'),
      erEnviado,
      cmCordoba,
      cmCentral,
      [new DetalleRemito(doc1003, 'Área Estudios Médicos')],
    );
    const remito203 = new Remito(
      203,
      new Date('2026-11-19T09:30:00-03:00'),
      erEnviado,
      cmRosario,
      cmCentral,
      [new DetalleRemito(doc1004, 'Homologaciones'), new DetalleRemito(doc1005, 'Legales')],
    );

    const crearHistorialBolsinEnviado = (
      fechaBase: string,
      respOrigen: Empleado,
    ): CambioEstadoBolsin[] => {
      const t0 = new Date(fechaBase).getTime();
      const c1 = new CambioEstadoBolsin(new Date(t0), ebCreado, respOrigen);
      c1.setFechaHoraFin(new Date(t0 + 1_800_000));
      const c2 = new CambioEstadoBolsin(new Date(t0 + 1_800_000), ebCerrado, respOrigen);
      c2.setFechaHoraFin(new Date(t0 + 43_200_000));
      const c3 = new CambioEstadoBolsin(new Date(t0 + 43_200_000), ebEnviado, respOrigen);
      return [c1, c2, c3];
    };

    const bolsin501 = new Bolsin(
      501,
      90421,
      1450,
      new Date('2026-11-18T11:00:00-03:00'),
      cmCordoba,
      cmCentral,
      crearHistorialBolsinEnviado('2026-11-18T11:00:00-03:00', empJuan),
      [remito201, remito202],
    );
    const bolsin502 = new Bolsin(
      502,
      90588,
      820,
      new Date('2026-11-19T10:00:00-03:00'),
      cmRosario,
      cmCentral,
      crearHistorialBolsinEnviado('2026-11-19T10:00:00-03:00', empCarlos),
      [remito203],
    );

    this.bolsines = [bolsin501, bolsin502];
  }

  public reiniciarDatos(): void {
    this.poblarDatos();
  }

  // =========================================================
  // FLUJO CU 28 — REGISTRAR RECEPCIÓN DE BOLSÍN
  // =========================================================

  public regRecepBolsin(): InicioRecepcionResponse {
    const usuarioActivo = this.sesionActiva.getUsuario();
    const empLogueado = this.empleados.find((emp) => emp.esTuUsuario(usuarioActivo));
    if (!empLogueado) {
      throw new DominioError('No se encontró un empleado asociado a la sesión activa.', 404);
    }

    this.responsable = empLogueado;
    this.bolsinSeleccionado = null;
    this.opcionRecepcionSeleccionada = null;

    const cmEmpleado = empLogueado.getCM();
    const bolsinesEnviados = this.getBolsinesEnviados(cmEmpleado);

    return {
      empleadoLogueado: this.mapEmpleado(empLogueado),
      cmEmpleado: cmEmpleado.getNombre(),
      bolsinesEnviados: bolsinesEnviados.map((b) => this.mapBolsinResumen(b)),
    };
  }

  public getBolsinesEnviados(cmDestino: ComisionMedica): Bolsin[] {
    return this.bolsines.filter(
      (bolsin) => bolsin.tenesEstaCMDestino(cmDestino) && bolsin.sosEnviado(),
    );
  }

  public tomarSelecBolsin(numeroBolsin: number): SeleccionBolsinResponse {
    if (!this.responsable) {
      this.regRecepBolsin();
    }
    const cmEmpleado = this.responsable!.getCM();
    const bolsin = this.bolsines.find(
      (b) =>
        b.getNumeroBolsin() === numeroBolsin &&
        b.tenesEstaCMDestino(cmEmpleado) &&
        b.sosEnviado(),
    );

    if (!bolsin) {
      throw new DominioError(
        `No se encontró el bolsín enviado #${numeroBolsin} para ${cmEmpleado.getNombre()}.`,
        404,
      );
    }

    this.bolsinSeleccionado = bolsin;
    this.opcionRecepcionSeleccionada = null;

    return {
      bolsin: this.mapBolsinDetalle(bolsin),
      opcionesRecepcion: OPCIONES_RECEPCION,
    };
  }

  public tomarOpcionContenidoOK(opcion: number = 1): SeleccionOpcionResponse {
    if (!this.bolsinSeleccionado) {
      throw new DominioError(
        'Debe seleccionar un bolsín enviado antes de elegir la opción de recepción.',
        400,
      );
    }

    const opcionMeta = OPCIONES_RECEPCION.find((o) => o.codigo === opcion);
    if (!opcionMeta) {
      throw new DominioError(`Opción de recepción inválida: ${opcion}.`, 400);
    }
    if (!opcionMeta.habilitadaEnCu28) {
      throw new DominioError(
        `Por el momento solo se encuentra habilitada la recepción con contenido conforme (opción 1). La opción ${opcion} ("${opcionMeta.titulo}") aún no está disponible en esta pantalla.`,
        400,
      );
    }

    this.opcionRecepcionSeleccionada = opcion;
    return {
      bolsin: this.mapBolsinDetalle(this.bolsinSeleccionado),
      opcionSeleccionada: opcionMeta,
    };
  }

  public buscarEstadoRecibido(): EstadoBolsin {
    const encontrado = this.estadosBolsin.find((estado) => estado.esRecibidoEnCMDestino());
    if (!encontrado) {
      throw new DominioError('No existe el estado de bolsín "Recibido en CM destino".', 500);
    }
    return encontrado;
  }

  public buscarEstadoRecibidoYAceptado(): EstadoRemito {
    const encontrado = this.estadosRemito.find((estado) => estado.esRecibidoYAceptado());
    if (!encontrado) {
      throw new DominioError('No existe el estado de remito "Recibido y Aceptado".', 500);
    }
    return encontrado;
  }

  public tomarConfirmacion(fechaHoraManual?: Date): ConfirmacionRecepcionResponse {
    if (!this.bolsinSeleccionado) {
      throw new DominioError('No hay ningún bolsín seleccionado para confirmar.', 400);
    }
    if (this.opcionRecepcionSeleccionada !== 1) {
      throw new DominioError(
        'Debe seleccionar la opción 1 ("El contenido del bolsín es igual al registrado") antes de confirmar.',
        400,
      );
    }
    if (!this.bolsinSeleccionado.sosEnviado()) {
      throw new DominioError(
        `El bolsín #${this.bolsinSeleccionado.getNumeroBolsin()} ya no se encuentra en estado Enviado.`,
        400,
      );
    }

    return this.confirmarRecepcion(fechaHoraManual ?? new Date());
  }

  private confirmarRecepcion(fechaHora: Date): ConfirmacionRecepcionResponse {
    const bolsin = this.bolsinSeleccionado!;
    const responsable = this.responsable!;

    this.fechaHoraActual = fechaHora;
    this.estadoBolsin = this.buscarEstadoRecibido();
    this.estadoRemito = this.buscarEstadoRecibidoYAceptado();
    this.estadoActual = bolsin.obtenerEstadoActual();

    const traza: TrazaPasoDto[] = [];
    let orden = 1;
    const agregarTraza = (origen: string, destino: string, mensaje: string, detalle?: string) => {
      traza.push({ orden: orden++, origen, destino, mensaje, detalle });
    };

    agregarTraza(
      ':GestorRegRecepBolsin',
      `seleccionado:Bolsin (#${bolsin.getNumeroBolsin()})`,
      'recibir(estadoBolsin, estadoRemito, fechaHoraActual, estadoActual, responsable)',
      `Estado Bolsín destino: "${this.estadoBolsin.getNombre()}", Estado Remito: "${this.estadoRemito.getNombre()}"`,
    );
    agregarTraza(
      `seleccionado:Bolsin (#${bolsin.getNumeroBolsin()})`,
      'actual:CambioEstadoBolsin',
      'setFechaHoraFin(fechaHoraActual)',
      `Cierra estado "${this.estadoActual.getEstado().getNombre()}"`,
    );
    agregarTraza(
      `seleccionado:Bolsin (#${bolsin.getNumeroBolsin()})`,
      'nuevo:CambioEstadoBolsin',
      'crearCEBolsin(fechaHoraActual, responsable, estado) / new()',
      `Nuevo estado "${this.estadoBolsin.getNombre()}"`,
    );
    agregarTraza(
      `seleccionado:Bolsin (#${bolsin.getNumeroBolsin()})`,
      `seleccionado:Bolsin (#${bolsin.getNumeroBolsin()})`,
      'recibirAceptarRemito()',
      `Itera ${bolsin.getRemitos().length} remito(s)`,
    );

    for (const remito of bolsin.getRemitos()) {
      agregarTraza(
        `seleccionado:Bolsin`,
        `:Remito (#${remito.getNumero()})`,
        'recibirAceptar(estado, responsable, fechaHoraActual)',
      );
      agregarTraza(
        `:Remito (#${remito.getNumero()})`,
        `:Remito (#${remito.getNumero()})`,
        'setEstado(estado)',
        `Nuevo estado "${this.estadoRemito.getNombre()}"`,
      );
      agregarTraza(
        `:Remito (#${remito.getNumero()})`,
        `:Remito (#${remito.getNumero()})`,
        'aceptarDocumentacion()',
      );

      for (const detalle of remito.getDetallesRemito()) {
        const doc = detalle.getDocumentacion();
        const estadoPrevio = obtenerNombreClaseEstado(doc.getEstadoActual());
        agregarTraza(
          `:Remito (#${remito.getNumero()})`,
          `:DetalleRemito`,
          'aceptarDocumentacion(responsable, fechaHoraActual)',
        );
        agregarTraza(
          `:DetalleRemito`,
          `:Documentacion (#${doc.getNumero()})`,
          'aceptar(responsable, fechaHoraActual)',
        );
        agregarTraza(
          `:Documentacion (#${doc.getNumero()})`,
          `:${estadoPrevio}`,
          'aceptar(documentacion, fechaHoraActual, cambiosEstado, responsable)',
        );
        agregarTraza(
          `:${estadoPrevio}`,
          'actual:CambioEstadoDocumentacion',
          'cambiarEstado(...) -> sosActual() -> setFechaHoraFin(fechaHoraActual)',
        );
        agregarTraza(
          `:${estadoPrevio}`,
          'nuevo:RecibidaYAceptada',
          'crearEstado() -> new(): RecibidaYAceptada',
        );
        agregarTraza(
          `:${estadoPrevio}`,
          'nuevo:CambioEstadoDocumentacion',
          'crearCambioEstado(...) -> new(fechaHoraActual, estado, responsable)',
        );
        agregarTraza(
          `:${estadoPrevio}`,
          `:Documentacion (#${doc.getNumero()})`,
          'setEstadoActual(nuevoEstado) & agregarCambioEstado(nuevoCambioEstado)',
        );
      }
    }

    // Ejecución real del dominio según 2.vista-dinamica.puml
    bolsin.recibir(
      this.estadoBolsin,
      this.estadoRemito,
      this.fechaHoraActual,
      this.estadoActual,
      responsable,
    );

    const notificacionesCu29 = this.llamarCUNotifRecepBolsin(bolsin);
    this.finCU();

    return {
      mensaje: `Recepción del bolsín #${bolsin.getNumeroBolsin()} (precinto ${bolsin.getNroPrecinto()}) confirmada exitosamente.`,
      bolsin: this.mapBolsinDetalle(bolsin),
      notificacionesCu29,
      traza,
    };
  }

  private llamarCUNotifRecepBolsin(bolsin: Bolsin): NotificacionCu29Dto[] {
    const porCm = new Map<string, number>();
    for (const remito of bolsin.getRemitos()) {
      const nombreCm = remito.getOrigen().getNombre();
      porCm.set(nombreCm, (porCm.get(nombreCm) ?? 0) + remito.getDetallesRemito().length);
    }

    const notificaciones: NotificacionCu29Dto[] = [];
    for (const [cmOrigen, cantidadDocumentos] of porCm.entries()) {
      const empOrigen = this.empleados.find((e) => e.getCM().getNombre() === cmOrigen);
      notificaciones.push({
        cmOrigen,
        destinatario: empOrigen ? empOrigen.getEmail() : 'mesa.entradas@srt.gob.ar',
        asunto: `Recepción conforme — Bolsín #${bolsin.getNumeroBolsin()} (Precinto ${bolsin.getNroPrecinto()})`,
        cantidadDocumentos,
        estadoNotificado: 'Recibida y Aceptada',
      });
    }
    return notificaciones;
  }

  private finCU(): void {
    this.bolsinSeleccionado = null;
    this.opcionRecepcionSeleccionada = null;
  }

  // =========================================================
  // VISUALIZADOR DEL PATRÓN STATE (Documentacion)
  // =========================================================

  public getCatalogos(): CatalogosResponse {
    return {
      comisionesMedicas: this.comisionesMedicas.map((cm) => cm.getNombre()),
      tiposDocumento: this.tiposDocumento.map((td) => td.getNombre()),
      empleados: this.empleados.map((e) => this.mapEmpleado(e)),
      acciones: Object.keys(ACCION_DISPATCH) as AccionEstadoDocumentacion[],
    };
  }

  public listarDocumentaciones(): DocumentacionDto[] {
    return this.documentaciones.map((doc) => this.mapDocumentacion(doc));
  }

  public obtenerDocumentacion(numero: number): DocumentacionDto {
    const doc = this.buscarDocumentacionPorNumero(numero);
    return this.mapDocumentacion(doc);
  }

  public crearDocumentacion(params: {
    asunto: string;
    fechaPase?: string;
    tipoDocumento: string;
    cmOrigen: string;
    emailResponsable?: string;
  }): DocumentacionDto {
    const asunto = params.asunto.trim();
    if (!asunto) {
      throw new DominioError('El asunto de la documentación es obligatorio.', 400);
    }

    const tipoDoc = this.tiposDocumento.find((t) => t.getNombre() === params.tipoDocumento);
    if (!tipoDoc) {
      throw new DominioError(`Tipo de documento desconocido: "${params.tipoDocumento}".`, 400);
    }

    const cmOrigen = this.comisionesMedicas.find((cm) => cm.getNombre() === params.cmOrigen);
    if (!cmOrigen) {
      throw new DominioError(`Comisión Médica desconocida: "${params.cmOrigen}".`, 400);
    }

    const responsable = this.resolverResponsable(params.emailResponsable);
    const fechaPase = params.fechaPase ? new Date(params.fechaPase) : new Date();
    if (Number.isNaN(fechaPase.getTime())) {
      throw new DominioError('La fecha de pase no tiene un formato válido.', 400);
    }

    const numero = this.siguienteNumeroDoc++;
    const nuevaDoc = new Documentacion(
      asunto,
      fechaPase,
      numero,
      tipoDoc,
      cmOrigen,
      new Date(),
      responsable,
    );
    this.documentaciones.unshift(nuevaDoc);
    return this.mapDocumentacion(nuevaDoc);
  }

  public ejecutarTransicion(
    numero: number,
    accion: AccionEstadoDocumentacion,
    emailResponsable?: string,
    fechaHoraManual?: string,
  ): TransicionResponse {
    const handler = ACCION_DISPATCH[accion];
    if (!handler) {
      throw new DominioError(`Acción de estado desconocida: "${accion}".`, 400);
    }

    const doc = this.buscarDocumentacionPorNumero(numero);
    const responsable = this.resolverResponsable(emailResponsable);
    const fechaHora = fechaHoraManual ? new Date(fechaHoraManual) : new Date();
    if (Number.isNaN(fechaHora.getTime())) {
      throw new DominioError('La fecha y hora indicada no es válida.', 400);
    }

    const estadoAnterior = obtenerNombreClaseEstado(doc.getEstadoActual());
    const traza: TrazaPasoDto[] = [
      {
        orden: 1,
        origen: ':VisualizadorState',
        destino: `:Documentacion (#${doc.getNumero()})`,
        mensaje: `${accion}(responsable, fechaHoraActual)`,
        detalle: `Responsable: ${responsable.getApellido()}, ${responsable.getNombre()}`,
      },
      {
        orden: 2,
        origen: `:Documentacion (#${doc.getNumero()})`,
        destino: `estadoActual:${estadoAnterior}`,
        mensaje: `${accion}(this, fechaHoraActual, cambioEstado, responsable)`,
        detalle: 'Delegación polimórfica al objeto State concreto actual',
      },
    ];

    try {
      // Delegación directa al Context sin condicionales sobre el estado
      handler(doc, responsable, fechaHora);
    } catch (error) {
      if (error instanceof TransicionInvalidaError) {
        traza.push({
          orden: 3,
          origen: `estadoActual:${estadoAnterior}`,
          destino: ':EstadoDocumentacion (base)',
          mensaje: `throw TransicionInvalidaError("${error.estadoActual}", "${error.accion}")`,
          detalle: error.message,
        });
        throw new TransicionConTrazaError(error, traza);
      }
      throw error;
    }

    const estadoNuevo = obtenerNombreClaseEstado(doc.getEstadoActual());
    traza.push(
      {
        orden: 3,
        origen: `estadoActual:${estadoAnterior}`,
        destino: 'actual:CambioEstadoDocumentacion',
        mensaje: 'cambiarEstado(fechaHoraActual, historial, responsable) -> setFechaHoraFin(fechaHoraActual)',
      },
      ...(estadoAnterior === 'EnBolsinEnviado' && accion === 'aceptar'
        ? [
            {
              orden: 4,
              origen: `estadoActual:${estadoAnterior}`,
              destino: `nuevo:${estadoNuevo}`,
              mensaje: 'crearEstado() -> new(): RecibidaYAceptada',
            },
          ]
        : []),
      {
        orden: estadoAnterior === 'EnBolsinEnviado' && accion === 'aceptar' ? 5 : 4,
        origen: `estadoActual:${estadoAnterior}`,
        destino: 'nuevo:CambioEstadoDocumentacion',
        mensaje: `crearCambioEstado(fechaHoraActual, nuevoEstado:${estadoNuevo}, responsable)`,
      },
      {
        orden: estadoAnterior === 'EnBolsinEnviado' && accion === 'aceptar' ? 6 : 5,
        origen: `estadoActual:${estadoAnterior}`,
        destino: `:Documentacion (#${doc.getNumero()})`,
        mensaje: `setEstadoActual(${estadoNuevo}) & agregarCambioEstado(nuevoCambioEstado)`,
      },
    );

    return {
      mensaje: `Documentación #${doc.getNumero()} transicionó de ${estadoAnterior} a ${estadoNuevo} mediante ${accion}().`,
      accion,
      estadoAnterior,
      estadoNuevo,
      documentacion: this.mapDocumentacion(doc),
      traza,
    };
  }

  // =========================================================
  // HELPERS PRIVADOS Y MAPPERS A DTO
  // =========================================================

  private buscarDocumentacionPorNumero(numero: number): Documentacion {
    const doc = this.documentaciones.find((d) => d.getNumero() === numero);
    if (!doc) {
      throw new DominioError(`No se encontró la documentación #${numero}.`, 404);
    }
    return doc;
  }

  private resolverResponsable(email?: string): Empleado {
    if (email) {
      const encontrado = this.empleados.find((e) => e.getEmail() === email);
      if (!encontrado) {
        throw new DominioError(`No se encontró un empleado con email "${email}".`, 400);
      }
      return encontrado;
    }
    return this.empleados[0];
  }

  private mapEmpleado(empleado: Empleado): EmpleadoDto {
    return {
      apellido: empleado.getApellido(),
      nombre: empleado.getNombre(),
      email: empleado.getEmail(),
      comisionMedica: empleado.getCM().getNombre(),
    };
  }

  private mapEstadoDocumentacion(estado: EstadoDocumentacion): EstadoDocumentacionDto {
    const clase = obtenerNombreClaseEstado(estado);
    return {
      clase,
      nombre: estado.getNombre(),
      descripcion: estado.getDescripcion(),
      esFinal: clase === 'RecibidaYAceptada' || clase === 'DeBaja',
    };
  }

  private mapCambioEstadoDocumentacion(
    cambio: CambioEstadoDocumentacion,
  ): CambioEstadoDocumentacionDto {
    const fechaFin = cambio.getFechaHoraFin();
    return {
      fechaHoraInicio: cambio.getFechaHoraInicio().toISOString(),
      fechaHoraFin: fechaFin ? fechaFin.toISOString() : null,
      esActual: cambio.sosActual(),
      estado: this.mapEstadoDocumentacion(cambio.getEstado()),
      responsable: this.mapEmpleado(cambio.getResponsable()),
    };
  }

  private mapDocumentacion(doc: Documentacion): DocumentacionDto {
    return {
      numero: doc.getNumero(),
      asunto: doc.getAsunto(),
      fechaPase: doc.getFechaPase().toISOString(),
      tipoDocumento: doc.getTipoDocumento().getNombre(),
      cmOrigen: doc.getCmOrigen().getNombre(),
      estadoActual: this.mapEstadoDocumentacion(doc.getEstadoActual()),
      cambiosEstado: doc
        .getCambiosEstado()
        .map((c) => this.mapCambioEstadoDocumentacion(c)),
    };
  }

  private mapRemito(remito: Remito): RemitoDto {
    return {
      numero: remito.getNumero(),
      fecha: remito.getFecha().toISOString(),
      estado: {
        nombre: remito.getEstado().getNombre(),
        descripcion: remito.getEstado().getDescripcion(),
      },
      origen: remito.getOrigen().getNombre(),
      destino: remito.getDestino().getNombre(),
      detalles: remito.getDetallesRemito().map((detalle) => ({
        areaCMDestino: detalle.getAreaCMDestino(),
        documentacion: this.mapDocumentacion(detalle.getDocumentacion()),
      })),
    };
  }

  private mapCambioEstadoBolsin(cambio: CambioEstadoBolsin): CambioEstadoBolsinDto {
    const fechaFin = cambio.getFechaHoraFin();
    return {
      fechaHoraInicio: cambio.getFechaHoraInicio().toISOString(),
      fechaHoraFin: fechaFin ? fechaFin.toISOString() : null,
      esActual: cambio.esActual(),
      estado: {
        nombre: cambio.getEstado().getNombre(),
        descripcion: cambio.getEstado().getDescripcion(),
      },
      responsable: this.mapEmpleado(cambio.getResponsable()),
    };
  }

  private mapBolsinResumen(bolsin: Bolsin): BolsinResumenDto {
    const remitos = bolsin.getRemitos();
    const cantidadDocumentaciones = remitos.reduce(
      (total, remito) => total + remito.getDetallesRemito().length,
      0,
    );
    return {
      numeroBolsin: bolsin.getNumeroBolsin(),
      numeroPrecinto: bolsin.getNroPrecinto(),
      peso: bolsin.getPeso(),
      fecha: bolsin.getFecha().toISOString(),
      cmOrigen: bolsin.getCMOrigen().getNombre(),
      cmDestino: bolsin.getCMDestino().getNombre(),
      estadoActual: bolsin.obtenerEstadoActual().getEstado().getNombre(),
      cantidadRemitos: remitos.length,
      cantidadDocumentaciones,
    };
  }

  private mapBolsinDetalle(bolsin: Bolsin): BolsinDetalleDto {
    return {
      ...this.mapBolsinResumen(bolsin),
      cambiosEstado: bolsin.getCambiosEstado().map((c) => this.mapCambioEstadoBolsin(c)),
      remitos: bolsin.getRemitos().map((r) => this.mapRemito(r)),
    };
  }
}
