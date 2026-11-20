import { Router, type Request, type Response } from 'express';
import type { AccionEstadoDocumentacion } from '../dtos/documentacionDto.js';
import { TransicionInvalidaError } from '../models/estados/TransicionInvalidaError.js';
import {
  DominioError,
  GestorRegRecepBolsin,
  TransicionConTrazaError,
} from '../controller/GestorRegRecepBolsin.js';

export class PantallaRegRecepBolsin {
  public readonly router: Router;
  private readonly gestor: GestorRegRecepBolsin;

  constructor(gestor: GestorRegRecepBolsin) {
    this.gestor = gestor;
    this.router = Router();
    this.registrarRutas();
  }

  private registrarRutas(): void {
    // Flujo CU 28 — Registrar recepción de bolsín
    this.router.post('/recepcion-bolsin/iniciar', (_req, res) =>
      this.opcionRegRecepBolsin(res),
    );
    this.router.post('/recepcion-bolsin/seleccionar-bolsin', (req, res) =>
      this.tomarSelecBolsin(req, res),
    );
    this.router.post('/recepcion-bolsin/seleccionar-opcion', (req, res) =>
      this.tomarOpcionContenidoOK(req, res),
    );
    this.router.post('/recepcion-bolsin/confirmar', (req, res) =>
      this.tomarConfirmacion(req, res),
    );
    this.router.post('/recepcion-bolsin/reiniciar', (_req, res) =>
      this.reiniciarDatos(res),
    );

    // Endpoints para el Visualizador del Patrón State (Documentacion)
    this.router.get('/documentaciones/catalogos', (_req, res) =>
      this.obtenerCatalogos(res),
    );
    this.router.get('/documentaciones', (_req, res) =>
      this.listarDocumentaciones(res),
    );
    this.router.get('/documentaciones/:numero', (req, res) =>
      this.obtenerDocumentacion(req, res),
    );
    this.router.post('/documentaciones', (req, res) =>
      this.crearDocumentacion(req, res),
    );
    this.router.post('/documentaciones/:numero/transicion', (req, res) =>
      this.ejecutarTransicion(req, res),
    );
  }

  private opcionRegRecepBolsin(res: Response): void {
    this.manejarError(res, () => {
      const resultado = this.gestor.regRecepBolsin();
      res.status(200).json(resultado);
    });
  }

  private tomarSelecBolsin(req: Request, res: Response): void {
    this.manejarError(res, () => {
      const numeroBolsin = Number(req.body?.numeroBolsin);
      if (!Number.isInteger(numeroBolsin) || numeroBolsin <= 0) {
        res.status(400).json({ error: 'Debe indicar un numeroBolsin entero positivo.' });
        return;
      }
      const resultado = this.gestor.tomarSelecBolsin(numeroBolsin);
      res.status(200).json(resultado);
    });
  }

  private tomarOpcionContenidoOK(req: Request, res: Response): void {
    this.manejarError(res, () => {
      const opcion = req.body?.opcion !== undefined ? Number(req.body.opcion) : 1;
      if (!Number.isInteger(opcion)) {
        res.status(400).json({ error: 'El código de opción debe ser numérico.' });
        return;
      }
      const resultado = this.gestor.tomarOpcionContenidoOK(opcion);
      res.status(200).json(resultado);
    });
  }

  private tomarConfirmacion(req: Request, res: Response): void {
    this.manejarError(res, () => {
      let fechaHoraManual: Date | undefined;
      if (req.body?.fechaHoraActual) {
        fechaHoraManual = new Date(req.body.fechaHoraActual);
        if (Number.isNaN(fechaHoraManual.getTime())) {
          res.status(400).json({ error: 'fechaHoraActual no tiene formato ISO válido.' });
          return;
        }
      }
      const resultado = this.gestor.tomarConfirmacion(fechaHoraManual);
      res.status(200).json(resultado);
    });
  }

  private reiniciarDatos(res: Response): void {
    this.manejarError(res, () => {
      this.gestor.reiniciarDatos();
      res.status(200).json({ mensaje: 'Datos en memoria reiniciados correctamente.' });
    });
  }

  private obtenerCatalogos(res: Response): void {
    this.manejarError(res, () => {
      res.status(200).json(this.gestor.getCatalogos());
    });
  }

  private listarDocumentaciones(res: Response): void {
    this.manejarError(res, () => {
      res.status(200).json(this.gestor.listarDocumentaciones());
    });
  }

  private obtenerDocumentacion(req: Request, res: Response): void {
    this.manejarError(res, () => {
      const numero = Number(req.params.numero);
      if (!Number.isInteger(numero) || numero <= 0) {
        res.status(400).json({ error: 'El número de documentación debe ser un entero positivo.' });
        return;
      }
      res.status(200).json(this.gestor.obtenerDocumentacion(numero));
    });
  }

  private crearDocumentacion(req: Request, res: Response): void {
    this.manejarError(res, () => {
      const { asunto, fechaPase, tipoDocumento, cmOrigen, emailResponsable } = req.body ?? {};
      if (!asunto || !tipoDocumento || !cmOrigen) {
        res.status(400).json({
          error: 'Los campos "asunto", "tipoDocumento" y "cmOrigen" son obligatorios.',
        });
        return;
      }
      const creada = this.gestor.crearDocumentacion({
        asunto: String(asunto),
        fechaPase: fechaPase ? String(fechaPase) : undefined,
        tipoDocumento: String(tipoDocumento),
        cmOrigen: String(cmOrigen),
        emailResponsable: emailResponsable ? String(emailResponsable) : undefined,
      });
      res.status(201).json(creada);
    });
  }

  private ejecutarTransicion(req: Request, res: Response): void {
    this.manejarError(res, () => {
      const numero = Number(req.params.numero);
      if (!Number.isInteger(numero) || numero <= 0) {
        res.status(400).json({ error: 'El número de documentación debe ser un entero positivo.' });
        return;
      }
      const accion = req.body?.accion as AccionEstadoDocumentacion | undefined;
      if (!accion) {
        res.status(400).json({ error: 'Debe especificar el campo "accion".' });
        return;
      }
      const emailResponsable = req.body?.emailResponsable
        ? String(req.body.emailResponsable)
        : undefined;
      const fechaHoraActual = req.body?.fechaHoraActual
        ? String(req.body.fechaHoraActual)
        : undefined;

      const resultado = this.gestor.ejecutarTransicion(
        numero,
        accion,
        emailResponsable,
        fechaHoraActual,
      );
      res.status(200).json(resultado);
    });
  }

  private manejarError(res: Response, fn: () => void): void {
    try {
      fn();
    } catch (error) {
      if (error instanceof TransicionConTrazaError) {
        res.status(400).json({
          error: error.message,
          estadoActual: error.estadoActual,
          accion: error.accion,
          traza: error.traza,
        });
        return;
      }
      if (error instanceof TransicionInvalidaError) {
        res.status(400).json({
          error: error.message,
          estadoActual: error.estadoActual,
          accion: error.accion,
        });
        return;
      }
      if (error instanceof DominioError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      res.status(500).json({ error: message });
    }
  }
}
