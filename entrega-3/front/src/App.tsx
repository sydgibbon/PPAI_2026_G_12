import { useCallback, useState } from 'react';
import { Cu28Wizard } from './components/cu28/Cu28Wizard';
import { StateExplorer } from './components/state/StateExplorer';
import { reiniciarDatosDemo } from './services/bolsinesService';

type VistaActiva = 'cu28' | 'state';

export function App() {
  const [vista, setVista] = useState<VistaActiva>('cu28');
  const [docSeleccionadaDesdeCu28, setDocSeleccionadaDesdeCu28] = useState<number | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [reiniciando, setReiniciando] = useState(false);
  const [notificacion, setNotificacion] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleNotify = useCallback((msg: { type: 'success' | 'error'; text: string }) => {
    setNotificacion(msg);
  }, []);

  const handleReiniciar = async () => {
    setReiniciando(true);
    const res = await reiniciarDatosDemo();
    setReiniciando(false);
    if (!res.success) {
      setNotificacion({ type: 'error', text: res.message });
      return;
    }
    setDocSeleccionadaDesdeCu28(null);
    setRefreshSignal((s) => s + 1);
    setNotificacion({
      type: 'success',
      text: 'Datos en memoria reiniciados al estado inicial de la demostración.',
    });
  };

  const handleVerEnStateExplorer = (numeroDoc: number) => {
    setDocSeleccionadaDesdeCu28(numeroDoc);
    setVista('state');
    setRefreshSignal((s) => s + 1);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="brand">
            <span className="brand__badge" aria-hidden="true">
              SRT · DSI 2026
            </span>
            <div>
              <strong className="brand__title">Gestión de Bolsines y Documentación</strong>
              <span className="brand__sub">
                Entrega 3 · TypeScript + Patrón State (CU 28)
              </span>
            </div>
          </div>

          <nav aria-label="Vistas principales" className="main-nav">
            <button
              type="button"
              className={`nav-tab ${vista === 'cu28' ? 'nav-tab--active' : ''}`}
              aria-current={vista === 'cu28' ? 'page' : undefined}
              onClick={() => setVista('cu28')}
            >
              CU 28: Recepción de Bolsín
            </button>
            <button
              type="button"
              className={`nav-tab ${vista === 'state' ? 'nav-tab--active' : ''}`}
              aria-current={vista === 'state' ? 'page' : undefined}
              onClick={() => setVista('state')}
            >
              Visualizador Patrón State
            </button>
          </nav>

          <button
            type="button"
            className="btn btn-reset"
            onClick={() => void handleReiniciar()}
            disabled={reiniciando}
          >
            {reiniciando ? 'Reiniciando...' : '↻ Reiniciar datos demo'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="page-intro">
          <h1>
            {vista === 'cu28'
              ? 'CU 28 — Registrar Recepción de Bolsín'
              : 'Visualizador Interactivo del Patrón State (Documentacion)'}
          </h1>
          <p>
            {vista === 'cu28'
              ? 'Implementación paso a paso del caso de uso 28 siguiendo la secuencia exacta de Bolsin → Remito → DetalleRemito → Documentacion → EnBolsinEnviado.'
              : 'Explorá los 9 estados concretos de EstadoDocumentacion, ejecutá cualquiera de los 11 métodos y verificá el historial de CambioEstadoDocumentacion.'}
          </p>
        </div>

        {notificacion && (
          <div
            role={notificacion.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            className={`toast-banner toast-banner--${notificacion.type}`}
          >
            <span>
              <strong aria-hidden="true">
                {notificacion.type === 'error' ? '✕ Error: ' : '✓ '}
              </strong>
              {notificacion.text}
            </span>
            <button
              type="button"
              className="toast-banner__close"
              onClick={() => setNotificacion(null)}
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        )}

        {vista === 'cu28' ? (
          <Cu28Wizard
            refreshSignal={refreshSignal}
            onNotify={handleNotify}
            onVerEnStateExplorer={handleVerEnStateExplorer}
          />
        ) : (
          <StateExplorer
            selectedDocNumeroInicial={docSeleccionadaDesdeCu28}
            refreshSignal={refreshSignal}
            onNotify={handleNotify}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          PPAI 2026 — Grupo 12 · Implementación fiel a{' '}
          <code>DiagramaDeClasesDEFINITIVO.puml</code> y{' '}
          <code>DiagramaSecuenciaDEFINITIVO.puml</code>.
        </p>
      </footer>
    </div>
  );
}

export default App;
