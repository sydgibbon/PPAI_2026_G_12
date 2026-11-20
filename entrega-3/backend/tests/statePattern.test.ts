import { describe, expect, it, vi } from 'vitest';
import { ComisionMedica } from '../src/models/ComisionMedica.js';
import { Documentacion } from '../src/models/Documentacion.js';
import { Empleado } from '../src/models/Empleado.js';
import { TipoDocumento } from '../src/models/TipoDocumento.js';
import { DeBaja } from '../src/models/estados/DeBaja.js';
import { EnBolsinEnviado } from '../src/models/estados/EnBolsinEnviado.js';
import { EnBolsinSaliente } from '../src/models/estados/EnBolsinSaliente.js';
import { EnRemito } from '../src/models/estados/EnRemito.js';
import { NoRecibida } from '../src/models/estados/NoRecibida.js';
import { ParaRedirigir } from '../src/models/estados/ParaRedirigir.js';
import { RecibidaYAceptada } from '../src/models/estados/RecibidaYAceptada.js';
import { RecibidaYRechazada } from '../src/models/estados/RecibidaYRechazada.js';
import { Registrada } from '../src/models/estados/Registrada.js';
import { TransicionInvalidaError } from '../src/models/estados/TransicionInvalidaError.js';

type AccionNombre =
  | 'remitir'
  | 'quitarDeRemito'
  | 'asociarBolsin'
  | 'desasociarBolsin'
  | 'enviar'
  | 'aceptar'
  | 'rechazar'
  | 'redirigir'
  | 'noRecibir'
  | 'darDeBaja'
  | 'registrar';

const TODAS_LAS_ACCIONES: AccionNombre[] = [
  'remitir',
  'quitarDeRemito',
  'asociarBolsin',
  'desasociarBolsin',
  'enviar',
  'aceptar',
  'rechazar',
  'redirigir',
  'noRecibir',
  'darDeBaja',
  'registrar',
];

function crearContextoPrueba() {
  const cmCordoba = new ComisionMedica('Comisión Médica Córdoba');
  const cmCentral = new ComisionMedica('Comisión Médica Central');
  const tipoDoc = new TipoDocumento('Expediente');
  const empOrigen = new Empleado('Pérez', 'Juan', 'juan@srt.gob.ar', cmCordoba);
  const empDestino = new Empleado('González', 'María', 'maria@srt.gob.ar', cmCentral);

  const t0 = new Date('2026-11-20T09:00:00Z');
  const doc = new Documentacion('Asunto de prueba', t0, 1, tipoDoc, cmCordoba, t0, empOrigen);

  return { doc, empOrigen, empDestino, t0 };
}

function paso(doc: Documentacion, accion: AccionNombre, resp: Empleado, fecha: Date) {
  doc[accion](resp, fecha);
}

describe('Patrón State en Documentacion', () => {
  it('inicia en estado Registrada con un CambioEstadoDocumentacion activo', () => {
    const { doc, empOrigen, t0 } = crearContextoPrueba();

    expect(doc.getEstadoActual()).toBeInstanceOf(Registrada);
    const historial = doc.getCambiosEstado();
    expect(historial).toHaveLength(1);
    expect(historial[0].sosActual()).toBe(true);
    expect(historial[0].getFechaHoraInicio()).toEqual(t0);
    expect(historial[0].getFechaHoraFin()).toBeNull();
    expect(historial[0].getEstado()).toBeInstanceOf(Registrada);
    expect(historial[0].getResponsable()).toBe(empOrigen);
  });

  it('cubre el ciclo feliz y transiciones inversas: Registrada <-> EnRemito <-> EnBolsinSaliente -> EnBolsinEnviado -> RecibidaYAceptada', () => {
    const { doc, empOrigen, empDestino, t0 } = crearContextoPrueba();
    const t = (min: number) => new Date(t0.getTime() + min * 60_000);

    // 1. Registrada -> EnRemito
    doc.remitir(empOrigen, t(10));
    expect(doc.getEstadoActual()).toBeInstanceOf(EnRemito);
    expect(doc.getCambiosEstado()).toHaveLength(2);
    expect(doc.getCambiosEstado()[0].sosActual()).toBe(false);
    expect(doc.getCambiosEstado()[0].getFechaHoraFin()).toEqual(t(10));
    expect(doc.getCambiosEstado()[1].sosActual()).toBe(true);
    expect(doc.getCambiosEstado()[1].getResponsable()).toBe(empOrigen);

    // 2. EnRemito -> Registrada (quitarDeRemito)
    doc.quitarDeRemito(empOrigen, t(20));
    expect(doc.getEstadoActual()).toBeInstanceOf(Registrada);
    expect(doc.getCambiosEstado()).toHaveLength(3);
    expect(doc.getCambiosEstado()[1].sosActual()).toBe(false);
    expect(doc.getCambiosEstado()[1].getFechaHoraFin()).toEqual(t(20));
    expect(doc.getCambiosEstado()[2].sosActual()).toBe(true);

    // 3. Re-remitir y asociar a bolsín: Registrada -> EnRemito -> EnBolsinSaliente
    doc.remitir(empOrigen, t(30));
    doc.asociarBolsin(empOrigen, t(40));
    expect(doc.getEstadoActual()).toBeInstanceOf(EnBolsinSaliente);

    // 4. EnBolsinSaliente -> EnRemito (desasociarBolsin)
    doc.desasociarBolsin(empOrigen, t(50));
    expect(doc.getEstadoActual()).toBeInstanceOf(EnRemito);

    // 5. EnRemito -> EnBolsinSaliente -> EnBolsinEnviado -> RecibidaYAceptada
    doc.asociarBolsin(empOrigen, t(60));
    doc.enviar(empOrigen, t(70));
    expect(doc.getEstadoActual()).toBeInstanceOf(EnBolsinEnviado);

    doc.aceptar(empDestino, t(80));
    expect(doc.getEstadoActual()).toBeInstanceOf(RecibidaYAceptada);
    const historial = doc.getCambiosEstado();
    expect(historial).toHaveLength(9);
    expect(historial.slice(0, 8).every((c) => !c.sosActual() && c.getFechaHoraFin() !== null)).toBe(
      true,
    );
    const ultimo = historial[8];
    expect(ultimo.sosActual()).toBe(true);
    expect(ultimo.getFechaHoraFin()).toBeNull();
    expect(ultimo.getEstado()).toBeInstanceOf(RecibidaYAceptada);
    expect(ultimo.getResponsable()).toBe(empDestino);
  });

  it('cubre las bifurcaciones desde EnBolsinEnviado, ParaRedirigir, NoRecibida y RecibidaYRechazada (14 transiciones)', () => {
    // Rama A: EnBolsinEnviado -> ParaRedirigir -> RecibidaYAceptada
    {
      const { doc, empOrigen, empDestino, t0 } = crearContextoPrueba();
      doc.remitir(empOrigen, new Date(t0.getTime() + 1_000));
      doc.asociarBolsin(empOrigen, new Date(t0.getTime() + 2_000));
      doc.enviar(empOrigen, new Date(t0.getTime() + 3_000));
      doc.redirigir(empDestino, new Date(t0.getTime() + 4_000));
      expect(doc.getEstadoActual()).toBeInstanceOf(ParaRedirigir);

      doc.aceptar(empDestino, new Date(t0.getTime() + 5_000));
      expect(doc.getEstadoActual()).toBeInstanceOf(RecibidaYAceptada);
    }

    // Rama B: EnBolsinEnviado -> ParaRedirigir -> RecibidaYRechazada -> Registrada
    {
      const { doc, empOrigen, empDestino, t0 } = crearContextoPrueba();
      doc.remitir(empOrigen, new Date(t0.getTime() + 1_000));
      doc.asociarBolsin(empOrigen, new Date(t0.getTime() + 2_000));
      doc.enviar(empOrigen, new Date(t0.getTime() + 3_000));
      doc.redirigir(empDestino, new Date(t0.getTime() + 4_000));
      doc.rechazar(empDestino, new Date(t0.getTime() + 5_000));
      expect(doc.getEstadoActual()).toBeInstanceOf(RecibidaYRechazada);

      doc.registrar(empOrigen, new Date(t0.getTime() + 6_000));
      expect(doc.getEstadoActual()).toBeInstanceOf(Registrada);
    }

    // Rama C: EnBolsinEnviado -> RecibidaYRechazada -> Registrada
    {
      const { doc, empOrigen, empDestino, t0 } = crearContextoPrueba();
      doc.remitir(empOrigen, new Date(t0.getTime() + 1_000));
      doc.asociarBolsin(empOrigen, new Date(t0.getTime() + 2_000));
      doc.enviar(empOrigen, new Date(t0.getTime() + 3_000));
      doc.rechazar(empDestino, new Date(t0.getTime() + 4_000));
      expect(doc.getEstadoActual()).toBeInstanceOf(RecibidaYRechazada);

      doc.registrar(empOrigen, new Date(t0.getTime() + 5_000));
      expect(doc.getEstadoActual()).toBeInstanceOf(Registrada);
    }

    // Rama D: EnBolsinEnviado -> NoRecibida -> Registrada -> ... -> NoRecibida -> DeBaja
    {
      const { doc, empOrigen, empDestino, t0 } = crearContextoPrueba();
      doc.remitir(empOrigen, new Date(t0.getTime() + 1_000));
      doc.asociarBolsin(empOrigen, new Date(t0.getTime() + 2_000));
      doc.enviar(empOrigen, new Date(t0.getTime() + 3_000));
      doc.noRecibir(empDestino, new Date(t0.getTime() + 4_000));
      expect(doc.getEstadoActual()).toBeInstanceOf(NoRecibida);

      doc.registrar(empOrigen, new Date(t0.getTime() + 5_000));
      expect(doc.getEstadoActual()).toBeInstanceOf(Registrada);

      doc.remitir(empOrigen, new Date(t0.getTime() + 6_000));
      doc.asociarBolsin(empOrigen, new Date(t0.getTime() + 7_000));
      doc.enviar(empOrigen, new Date(t0.getTime() + 8_000));
      doc.noRecibir(empDestino, new Date(t0.getTime() + 9_000));
      doc.darDeBaja(empOrigen, new Date(t0.getTime() + 10_000));
      expect(doc.getEstadoActual()).toBeInstanceOf(DeBaja);
    }
  });

  it('rechaza todas las transiciones inválidas en los 9 estados sin mutar estado ni historial', () => {
    const casos: Array<{
      setup: (doc: Documentacion, resp: Empleado, t0: Date) => void;
      permitidas: AccionNombre[];
      nombreEsperado: string;
    }> = [
      {
        setup: () => {},
        permitidas: ['remitir'],
        nombreEsperado: 'Registrada',
      },
      {
        setup: (doc, resp, t0) => {
          doc.remitir(resp, new Date(t0.getTime() + 1_000));
        },
        permitidas: ['quitarDeRemito', 'asociarBolsin'],
        nombreEsperado: 'En Remito',
      },
      {
        setup: (doc, resp, t0) => {
          doc.remitir(resp, new Date(t0.getTime() + 1_000));
          doc.asociarBolsin(resp, new Date(t0.getTime() + 2_000));
        },
        permitidas: ['desasociarBolsin', 'enviar'],
        nombreEsperado: 'En Bolsín Saliente',
      },
      {
        setup: (doc, resp, t0) => {
          doc.remitir(resp, new Date(t0.getTime() + 1_000));
          doc.asociarBolsin(resp, new Date(t0.getTime() + 2_000));
          doc.enviar(resp, new Date(t0.getTime() + 3_000));
        },
        permitidas: ['aceptar', 'rechazar', 'redirigir', 'noRecibir'],
        nombreEsperado: 'En Bolsín Enviado',
      },
      {
        setup: (doc, resp, t0) => {
          doc.remitir(resp, new Date(t0.getTime() + 1_000));
          doc.asociarBolsin(resp, new Date(t0.getTime() + 2_000));
          doc.enviar(resp, new Date(t0.getTime() + 3_000));
          doc.noRecibir(resp, new Date(t0.getTime() + 4_000));
        },
        permitidas: ['darDeBaja', 'registrar'],
        nombreEsperado: 'No Recibida',
      },
      {
        setup: (doc, resp, t0) => {
          doc.remitir(resp, new Date(t0.getTime() + 1_000));
          doc.asociarBolsin(resp, new Date(t0.getTime() + 2_000));
          doc.enviar(resp, new Date(t0.getTime() + 3_000));
          doc.redirigir(resp, new Date(t0.getTime() + 4_000));
        },
        permitidas: ['aceptar', 'rechazar'],
        nombreEsperado: 'Para Redirigir',
      },
      {
        setup: (doc, resp, t0) => {
          doc.remitir(resp, new Date(t0.getTime() + 1_000));
          doc.asociarBolsin(resp, new Date(t0.getTime() + 2_000));
          doc.enviar(resp, new Date(t0.getTime() + 3_000));
          doc.rechazar(resp, new Date(t0.getTime() + 4_000));
        },
        permitidas: ['registrar'],
        nombreEsperado: 'Recibida y Rechazada',
      },
      {
        setup: (doc, resp, t0) => {
          doc.remitir(resp, new Date(t0.getTime() + 1_000));
          doc.asociarBolsin(resp, new Date(t0.getTime() + 2_000));
          doc.enviar(resp, new Date(t0.getTime() + 3_000));
          doc.aceptar(resp, new Date(t0.getTime() + 4_000));
        },
        permitidas: [],
        nombreEsperado: 'Recibida y Aceptada',
      },
      {
        setup: (doc, resp, t0) => {
          doc.remitir(resp, new Date(t0.getTime() + 1_000));
          doc.asociarBolsin(resp, new Date(t0.getTime() + 2_000));
          doc.enviar(resp, new Date(t0.getTime() + 3_000));
          doc.noRecibir(resp, new Date(t0.getTime() + 4_000));
          doc.darDeBaja(resp, new Date(t0.getTime() + 5_000));
        },
        permitidas: [],
        nombreEsperado: 'De Baja',
      },
    ];

    for (const caso of casos) {
      const invalidas = TODAS_LAS_ACCIONES.filter((a) => !caso.permitidas.includes(a));
      for (const accionInvalida of invalidas) {
        const { doc, empOrigen, t0 } = crearContextoPrueba();
        caso.setup(doc, empOrigen, t0);

        const estadoAntes = doc.getEstadoActual();
        const cantidadAntes = doc.getCambiosEstado().length;

        expect(() => paso(doc, accionInvalida, empOrigen, new Date(t0.getTime() + 99_000))).toThrowError(
          TransicionInvalidaError,
        );

        try {
          paso(doc, accionInvalida, empOrigen, new Date(t0.getTime() + 99_000));
        } catch (err) {
          expect(err).toBeInstanceOf(TransicionInvalidaError);
          const transErr = err as TransicionInvalidaError;
          expect(transErr.estadoActual).toBe(caso.nombreEsperado);
          expect(transErr.accion).toBe(accionInvalida);
        }

        expect(doc.getEstadoActual()).toBe(estadoAntes);
        expect(doc.getCambiosEstado()).toHaveLength(cantidadAntes);
      }
    }
  });

  it('respeta exactamente la secuencia de mensajes de 2.vista-dinamica.puml en EnBolsinEnviado.aceptar()', () => {
    const { doc, empOrigen, empDestino, t0 } = crearContextoPrueba();
    doc.remitir(empOrigen, new Date(t0.getTime() + 1_000));
    doc.asociarBolsin(empOrigen, new Date(t0.getTime() + 2_000));
    doc.enviar(empOrigen, new Date(t0.getTime() + 3_000));

    const estadoActual = doc.getEstadoActual();
    expect(estadoActual).toBeInstanceOf(EnBolsinEnviado);
    const estadoEnviado = estadoActual as EnBolsinEnviado;
    const cambioActual = doc.getCambiosEstado()[doc.getCambiosEstado().length - 1];

    const ordenLlamadas: string[] = [];

    vi.spyOn(estadoEnviado, 'cambiarEstado').mockImplementation(function (
      this: EnBolsinEnviado,
      fechaHoraActual,
      historial,
      responsable,
    ) {
      ordenLlamadas.push('cambiarEstado');
      return EnBolsinEnviado.prototype.cambiarEstado.call(
        this,
        fechaHoraActual,
        historial,
        responsable,
      );
    });
    vi.spyOn(cambioActual, 'sosActual').mockImplementation(function () {
      ordenLlamadas.push('sosActual');
      return Object.getPrototypeOf(cambioActual).sosActual.call(this);
    });
    vi.spyOn(cambioActual, 'setFechaHoraFin').mockImplementation(function (fecha) {
      ordenLlamadas.push('setFechaHoraFin');
      return Object.getPrototypeOf(cambioActual).setFechaHoraFin.call(this, fecha);
    });
    vi.spyOn(estadoEnviado, 'crearEstado').mockImplementation(function () {
      ordenLlamadas.push('crearEstado');
      return EnBolsinEnviado.prototype.crearEstado.call(this);
    });
    vi.spyOn(estadoEnviado, 'crearCambioEstado').mockImplementation(function (
      this: EnBolsinEnviado,
      fechaHoraInicio,
      estado,
      responsable,
    ) {
      ordenLlamadas.push('crearCambioEstado');
      return EnBolsinEnviado.prototype.crearCambioEstado.call(
        this,
        fechaHoraInicio,
        estado,
        responsable,
      );
    });
    vi.spyOn(doc, 'setEstadoActual').mockImplementation(function (estado) {
      ordenLlamadas.push('setEstadoActual');
      return Documentacion.prototype.setEstadoActual.call(this, estado);
    });
    vi.spyOn(doc, 'agregarCambioEstado').mockImplementation(function (cambio) {
      ordenLlamadas.push('agregarCambioEstado');
      return Documentacion.prototype.agregarCambioEstado.call(this, cambio);
    });

    const fechaAceptacion = new Date(t0.getTime() + 10_000);
    doc.aceptar(empDestino, fechaAceptacion);

    expect(ordenLlamadas).toEqual([
      'cambiarEstado',
      'sosActual',
      'setFechaHoraFin',
      'crearEstado',
      'crearCambioEstado',
      'setEstadoActual',
      'agregarCambioEstado',
    ]);
    expect(doc.getEstadoActual()).toBeInstanceOf(RecibidaYAceptada);
  });
});
