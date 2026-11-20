import { useEffect, useState } from 'react';
import type { TrazaPasoDto } from '../../types/api';
import { TracePanel } from '../common/TracePanel';
import { StateExplorer } from '../state/StateExplorer';

export const LAST_CU28_TRACE_STORAGE_KEY = 'ppai_last_cu28_trace';

export interface UltimaTrazaCu28 {
  numeroBolsin: number;
  numeroPrecinto: number;
  fechaRegistroIso: string;
  traza: TrazaPasoDto[];
}

interface DebugPageProps {
  refreshSignal: number;
  onNotify: (msg: { type: 'success' | 'error'; text: string }) => void;
}

function leerUltimaTraza(): UltimaTrazaCu28 | null {
  try {
    const raw = window.localStorage.getItem(LAST_CU28_TRACE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UltimaTrazaCu28;
    if (!parsed || !Array.isArray(parsed.traza)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function DebugPage({ refreshSignal, onNotify }: DebugPageProps) {
  const [ultimaTraza, setUltimaTraza] = useState<UltimaTrazaCu28 | null>(() =>
    leerUltimaTraza(),
  );

  useEffect(() => {
    setUltimaTraza(leerUltimaTraza());
  }, [refreshSignal]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LAST_CU28_TRACE_STORAGE_KEY) {
        setUltimaTraza(leerUltimaTraza());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <div className="debug-stack">
      <section aria-labelledby="debug-cu28-trace-h" className="card">
        <div className="card__header">
          <div>
            <h2 id="debug-cu28-trace-h">
              Última traza ejecutada del CU 28 (2.vista-dinamica.puml)
            </h2>
            <p className="card__subtitle">
              Cada vez que confirmás una recepción desde la pantalla principal (<code>/</code>), la
              secuencia exacta de mensajes ejecutada en el backend queda disponible acá para su
              inspección técnica.
            </p>
          </div>
          {ultimaTraza && (
            <span className="muted-pill">
              Bolsín #{ultimaTraza.numeroBolsin} · Precinto {ultimaTraza.numeroPrecinto}
            </span>
          )}
        </div>

        {ultimaTraza ? (
          <TracePanel
            titulo={`Secuencia ejecutada al confirmar Bolsín #${ultimaTraza.numeroBolsin} (${new Date(
              ultimaTraza.fechaRegistroIso,
            ).toLocaleString('es-AR')})`}
            traza={ultimaTraza.traza}
          />
        ) : (
          <p className="debug-banner-note">
            Todavía no se confirmó ninguna recepción en esta sesión. Confirmá un bolsín en{' '}
            <code>/</code> para ver acá la traza paso a paso de <code>Bolsin.recibir()</code> →{' '}
            <code>EnBolsinEnviado.aceptar()</code>.
          </p>
        )}
      </section>

      <StateExplorer refreshSignal={refreshSignal} onNotify={onNotify} />
    </div>
  );
}
