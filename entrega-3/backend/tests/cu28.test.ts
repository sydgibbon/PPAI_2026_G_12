import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { DominioError, GestorRegRecepBolsin } from '../src/service/GestorRegRecepBolsin.js';

describe('CU 28 — GestorRegRecepBolsin y API REST', () => {
  const serversToClose: Array<ReturnType<ReturnType<typeof createApp>['app']['listen']>> = [];

  afterEach(async () => {
    for (const srv of serversToClose.splice(0)) {
      await new Promise<void>((resolve, reject) => {
        srv.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  it('ejecuta el flujo completo del CU 28 en GestorRegRecepBolsin actualizando Bolsin, Remito y Documentacion', () => {
    const gestor = new GestorRegRecepBolsin();

    const inicio = gestor.regRecepBolsin();
    expect(inicio.cmEmpleado).toContain('Comisión Médica Central');
    expect(inicio.bolsinesEnviados).toHaveLength(2);
    expect(inicio.bolsinesEnviados[0].numeroBolsin).toBe(501);

    const seleccion = gestor.tomarSelecBolsin(501);
    expect(seleccion.bolsin.remitos).toHaveLength(2);
    expect(seleccion.opcionesRecepcion).toHaveLength(4);
    expect(seleccion.bolsin.remitos[0].detalles[0].documentacion.estadoActual.clase).toBe(
      'EnBolsinEnviado',
    );

    // Opciones alternativas 2, 3, 4 informan que no están habilitadas para confirmación masiva
    expect(() => gestor.tomarOpcionContenidoOK(2)).toThrowError(DominioError);

    const opcion = gestor.tomarOpcionContenidoOK(1);
    expect(opcion.opcionSeleccionada.codigo).toBe(1);

    const fechaConfirmacion = new Date('2026-11-20T15:30:00Z');
    const confirmacion = gestor.tomarConfirmacion(fechaConfirmacion);

    expect(confirmacion.bolsin.estadoActual).toBe('Recibido en CM destino');
    expect(confirmacion.bolsin.cambiosEstado.at(-1)?.esActual).toBe(true);
    expect(confirmacion.bolsin.cambiosEstado.at(-2)?.fechaHoraFin).toBe(
      fechaConfirmacion.toISOString(),
    );

    for (const remito of confirmacion.bolsin.remitos) {
      expect(remito.estado.nombre).toBe('Recibido y Aceptado');
      for (const detalle of remito.detalles) {
        expect(detalle.documentacion.estadoActual.clase).toBe('RecibidaYAceptada');
        expect(detalle.documentacion.cambiosEstado.at(-1)?.esActual).toBe(true);
        expect(detalle.documentacion.cambiosEstado.at(-1)?.responsable.email).toBe(
          'maria.gonzalez@srt.gob.ar',
        );
      }
    }

    expect(confirmacion.notificacionesCu29).toHaveLength(1);
    expect(confirmacion.notificacionesCu29[0].cantidadDocumentos).toBe(3);
    expect(confirmacion.traza.length).toBeGreaterThan(10);

    // Ya no debe aparecer el Bolsín #501 entre los pendientes enviados
    const nuevoInicio = gestor.regRecepBolsin();
    expect(nuevoInicio.bolsinesEnviados.map((b) => b.numeroBolsin)).toEqual([502]);
  });

  it('expone correctamente los endpoints REST del CU 28 y del Visualizador de State', async () => {
    const { app } = createApp();
    const server = app.listen(0);
    serversToClose.push(server);
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;

    // 1. Iniciar CU 28
    const resInicio = await fetch(`${baseUrl}/recepcion-bolsin/iniciar`, { method: 'POST' });
    expect(resInicio.status).toBe(200);
    const inicioJson = (await resInicio.json()) as {
      bolsinesEnviados: Array<{ numeroBolsin: number }>;
    };
    expect(inicioJson.bolsinesEnviados.some((b) => b.numeroBolsin === 501)).toBe(true);

    // 2. Seleccionar bolsín
    const resBolsin = await fetch(`${baseUrl}/recepcion-bolsin/seleccionar-bolsin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeroBolsin: 501 }),
    });
    expect(resBolsin.status).toBe(200);

    // 3. Seleccionar opción 1
    const resOpcion = await fetch(`${baseUrl}/recepcion-bolsin/seleccionar-opcion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opcion: 1 }),
    });
    expect(resOpcion.status).toBe(200);

    // 4. Confirmar recepción
    const resConfirmar = await fetch(`${baseUrl}/recepcion-bolsin/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(resConfirmar.status).toBe(200);
    const confJson = (await resConfirmar.json()) as {
      bolsin: { estadoActual: string };
    };
    expect(confJson.bolsin.estadoActual).toBe('Recibido en CM destino');

    // 5. Crear nueva Documentación (entra en Registrada)
    const resCrear = await fetch(`${baseUrl}/documentaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asunto: 'EXP-TEST-999 — Prueba HTTP State',
        tipoDocumento: 'Expediente',
        cmOrigen: 'Comisión Médica Córdoba',
      }),
    });
    expect(resCrear.status).toBe(201);
    const docCreada = (await resCrear.json()) as {
      numero: number;
      estadoActual: { clase: string };
    };
    expect(docCreada.estadoActual.clase).toBe('Registrada');

    // 6. Transición válida: remitir() -> EnRemito
    const resValida = await fetch(`${baseUrl}/documentaciones/${docCreada.numero}/transicion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'remitir' }),
    });
    expect(resValida.status).toBe(200);
    const validaJson = (await resValida.json()) as {
      estadoAnterior: string;
      estadoNuevo: string;
    };
    expect(validaJson.estadoAnterior).toBe('Registrada');
    expect(validaJson.estadoNuevo).toBe('EnRemito');

    // 7. Transición inválida: aceptar() desde EnRemito -> HTTP 400
    const resInvalida = await fetch(`${baseUrl}/documentaciones/${docCreada.numero}/transicion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'aceptar' }),
    });
    expect(resInvalida.status).toBe(400);
    const invalidaJson = (await resInvalida.json()) as {
      error: string;
      estadoActual: string;
      accion: string;
      traza: unknown[];
    };
    expect(invalidaJson.estadoActual).toBe('En Remito');
    expect(invalidaJson.accion).toBe('aceptar');
    expect(invalidaJson.traza.length).toBeGreaterThan(0);
  });
});
