import { useCallback, useEffect, useState } from 'react';
import { Cu28Wizard } from './components/cu28/Cu28Wizard';
import { DebugPage, LAST_CU28_TRACE_STORAGE_KEY } from './components/debug/DebugPage';
import { reiniciarDatosDemo } from './services/bolsinesService';

function esRutaDebug(pathname: string): boolean {
  return pathname === '/debug' || pathname.startsWith('/debug/');
}

export function App() {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [reiniciando, setReiniciando] = useState(false);
  const [notificacion, setNotificacion] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const enDebug = esRutaDebug(pathname);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
      setNotificacion(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    document.title = enDebug
      ? 'Debug — Entrega 3 · Patrón State (CU 28)'
      : 'Recepción de Bolsines — Sistema de Gestión de Bolsines';
  }, [enDebug]);

  const navegarA = (destino: '/' | '/debug') => {
    if (window.location.pathname !== destino) {
      window.history.pushState(null, '', destino);
      setPathname(destino);
      setNotificacion(null);
    }
  };

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
    try {
      window.localStorage.removeItem(LAST_CU28_TRACE_STORAGE_KEY);
    } catch {
      // Ignorar si storage no está disponible
    }
    setRefreshSignal((s) => s + 1);
    setNotificacion({
      type: 'success',
      text: 'Datos en memoria reiniciados al estado inicial de la demostración.',
    });
  };

  return (
    <div className="app-shell">
      <header className={`app-header ${enDebug ? 'app-header--debug' : ''}`}>
        <div className="app-header__inner">
          <div className="brand">
            <span className="brand__badge" aria-hidden="true">
              {enDebug ? 'SRT · DSI 2026' : 'SRT'}
            </span>
            <div>
              <strong className="brand__title">
                {enDebug ? 'Panel Técnico / Debug' : 'Sistema de Gestión de Bolsines'}
              </strong>
              <span className="brand__sub">
                {enDebug
                  ? 'Entrega 3 · Patrón State (CU 28)'
                  : 'Comisiones Médicas · Gestión de Recepción'}
              </span>
            </div>
          </div>

          {enDebug && (
            <div className="debug-header-actions">
              <nav aria-label="Navegación técnica">
                <a
                  href="/"
                  className="nav-tab nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    navegarA('/');
                  }}
                >
                  ← Volver a la aplicación
                </a>
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
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="page-intro">
          <h1>
            {enDebug
              ? 'Panel Técnico — Patrón State y Trazas (Entrega 3)'
              : 'Registrar Recepción de Bolsín'}
          </h1>
          <p>
            {enDebug
              ? 'Visualizador interactivo de EstadoDocumentacion, pruebas de polimorfismo, historial CambioEstadoDocumentacion y traza de ejecución del último CU 28.'
              : 'Verificá el contenido de los bolsines recibidos por correo en tu Comisión Médica y registrá su recepción.'}
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

        {enDebug ? (
          <DebugPage refreshSignal={refreshSignal} onNotify={handleNotify} />
        ) : (
          <Cu28Wizard refreshSignal={refreshSignal} onNotify={handleNotify} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          {enDebug ? (
            <>
              PPAI 2026 — Grupo 12 · Implementación fiel a{' '}
              <code>1.vista-estatica.puml</code> y{' '}
              <code>2.vista-dinamica.puml</code>.
            </>
          ) : (
            'Sistema de Gestión de Bolsines — Organismo Controlador · Comisiones Médicas'
          )}
        </p>
      </footer>
    </div>
  );
}

export default App;
