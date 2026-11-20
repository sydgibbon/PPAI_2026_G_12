import cors from 'cors';
import express, { type Express } from 'express';
import { PantallaRegRecepBolsin } from './controller/PantallaRegRecepBolsin.js';
import { GestorRegRecepBolsin } from './service/GestorRegRecepBolsin.js';

export function createApp(): { app: Express; gestor: GestorRegRecepBolsin } {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const gestor = new GestorRegRecepBolsin();
  const pantalla = new PantallaRegRecepBolsin(gestor);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'cu28-state-backend' });
  });

  app.use('/', pantalla.router);

  return { app, gestor };
}
