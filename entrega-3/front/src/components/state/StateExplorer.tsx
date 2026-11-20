import { useEffect, useMemo, useState } from 'react';
import {
  crearDocumentacion,
  ejecutarTransicionDocumentacion,
  listarDocumentaciones,
  obtenerCatalogos,
} from '../../services/bolsinesService';
import type {
  AccionEstadoDocumentacion,
  CatalogosResponse,
  DocumentacionDto,
  TrazaPasoDto,
} from '../../types/api';
import { EstadoBadge } from '../common/EstadoBadge';
import { TracePanel } from '../common/TracePanel';
import { HistorialTable } from './HistorialTable';
import { NewDocumentacionDialog } from './NewDocumentacionDialog';
import { StateMachineSvg } from './StateMachineSvg';
import { TransitionControls } from './TransitionControls';

interface StateExplorerProps {
  selectedDocNumeroInicial?: number | null;
  refreshSignal: number;
  onNotify: (msg: { type: 'success' | 'error'; text: string }) => void;
}

export function StateExplorer({
  selectedDocNumeroInicial,
  refreshSignal,
  onNotify,
}: StateExplorerProps) {
  const [catalogos, setCatalogos] = useState<CatalogosResponse | null>(null);
  const [documentaciones, setDocumentaciones] = useState<DocumentacionDto[]>([]);
  const [selectedNumero, setSelectedNumero] = useState<number | null>(
    selectedDocNumeroInicial ?? null,
  );
  const [filtro, setFiltro] = useState('');
  const [emailResponsable, setEmailResponsable] = useState('');
  const [fechaHoraManual, setFechaHoraManual] = useState('');
  const [traza, setTraza] = useState<TrazaPasoDto[]>([]);
  const [trazaError, setTrazaError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const cargar = async () => {
      setLoading(true);
      const [catRes, docsRes] = await Promise.all([
        obtenerCatalogos(),
        listarDocumentaciones(),
      ]);
      if (!active) return;

      if (catRes.success) {
        setCatalogos(catRes.data);
        setEmailResponsable((prev) => prev || catRes.data.empleados[0]?.email || '');
      } else {
        onNotify({ type: 'error', text: catRes.message });
      }

      if (docsRes.success) {
        setDocumentaciones(docsRes.data);
        setSelectedNumero((prev) => {
          if (selectedDocNumeroInicial) return selectedDocNumeroInicial;
          if (prev && docsRes.data.some((d) => d.numero === prev)) return prev;
          return docsRes.data[0]?.numero ?? null;
        });
      } else {
        onNotify({ type: 'error', text: docsRes.message });
      }
      setLoading(false);
    };
    void cargar();
    return () => {
      active = false;
    };
  }, [refreshSignal, selectedDocNumeroInicial, onNotify]);

  const docsFiltradas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return documentaciones;
    return documentaciones.filter(
      (d) =>
        String(d.numero).includes(q) ||
        d.asunto.toLowerCase().includes(q) ||
        d.estadoActual.nombre.toLowerCase().includes(q) ||
        d.cmOrigen.toLowerCase().includes(q),
    );
  }, [documentaciones, filtro]);

  const docSeleccionada = useMemo(
    () => documentaciones.find((d) => d.numero === selectedNumero) ?? null,
    [documentaciones, selectedNumero],
  );

  const handleCreateDoc = async (payload: {
    asunto: string;
    fechaPase: string;
    tipoDocumento: string;
    cmOrigen: string;
    emailResponsable: string;
  }): Promise<boolean> => {
    setLoading(true);
    const res = await crearDocumentacion(payload);
    setLoading(false);

    if (!res.success) {
      onNotify({ type: 'error', text: res.message });
      return false;
    }

    setDocumentaciones((prev) => [res.data, ...prev]);
    setSelectedNumero(res.data.numero);
    setTraza([
      {
        orden: 1,
        origen: ':VisualizadorState',
        destino: `:Documentacion (#${res.data.numero})`,
        mensaje: `new("${res.data.asunto}", fechaPase, ${res.data.numero}, tipoDocumento, cmOrigen, fechaHoraActual, responsable)`,
        detalle: 'Estado inicial asignado en el constructor: Registrada',
      },
    ]);
    setTrazaError(false);
    onNotify({
      type: 'success',
      text: `Documentación #${res.data.numero} creada en estado Registrada.`,
    });
    return true;
  };

  const handleTransicionar = async (accion: AccionEstadoDocumentacion) => {
    if (!docSeleccionada) return;
    setLoading(true);
    const res = await ejecutarTransicionDocumentacion(docSeleccionada.numero, {
      accion,
      emailResponsable,
      fechaHoraActual: fechaHoraManual ? new Date(fechaHoraManual).toISOString() : undefined,
    });
    setLoading(false);

    if (!res.success) {
      setTraza(res.traza ?? []);
      setTrazaError(true);
      onNotify({ type: 'error', text: res.message });
      return;
    }

    setDocumentaciones((prev) =>
      prev.map((d) => (d.numero === res.data.documentacion.numero ? res.data.documentacion : d)),
    );
    setTraza(res.data.traza);
    setTrazaError(false);
    onNotify({ type: 'success', text: res.data.mensaje });
  };

  return (
    <div className="explorer-layout">
      <aside aria-label="Listado de documentaciones" className="explorer-sidebar card">
        <div className="card__header">
          <h2>Documentaciones</h2>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setDialogOpen(true)}
            disabled={!catalogos}
          >
            + Nueva
          </button>
        </div>

        <search className="search-box">
          <label htmlFor="doc-search" className="visually-hidden">
            Filtrar documentaciones por número, asunto o estado
          </label>
          <input
            id="doc-search"
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar #nro, asunto o estado..."
          />
        </search>

        <ul className="doc-list">
          {docsFiltradas.map((doc) => {
            const isSelected = doc.numero === selectedNumero;
            return (
              <li key={doc.numero}>
                <button
                  type="button"
                  className={`doc-list__item ${isSelected ? 'doc-list__item--selected' : ''}`}
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => {
                    setSelectedNumero(doc.numero);
                    setTraza([]);
                    setTrazaError(false);
                  }}
                >
                  <div className="doc-list__top">
                    <strong>Doc #{doc.numero}</strong>
                    <span className="doc-list__type">{doc.tipoDocumento}</span>
                  </div>
                  <span className="doc-list__asunto">{doc.asunto}</span>
                  <div className="doc-list__footer">
                    <EstadoBadge
                      clase={doc.estadoActual.clase}
                      nombre={doc.estadoActual.nombre}
                      esFinal={doc.estadoActual.esFinal}
                    />
                  </div>
                </button>
              </li>
            );
          })}
          {docsFiltradas.length === 0 && (
            <li className="empty-note">No hay documentaciones que coincidan con el filtro.</li>
          )}
        </ul>
      </aside>

      <div className="explorer-main">
        {!docSeleccionada ? (
          <section className="card">
            <h2>Seleccioná una documentación</h2>
            <p className="card__subtitle">
              Elegí una documentación del panel izquierdo o creá una nueva para inspeccionar su
              máquina de estados y probar las transiciones polimórficas.
            </p>
          </section>
        ) : (
          <>
            <section aria-labelledby="doc-detail-heading" className="card doc-hero">
              <div className="doc-hero__top">
                <div>
                  <span className="doc-hero__eyebrow">
                    Context &lt;&lt;entity&gt;&gt; Documentacion #{docSeleccionada.numero}
                  </span>
                  <h2 id="doc-detail-heading">{docSeleccionada.asunto}</h2>
                </div>
                <EstadoBadge
                  clase={docSeleccionada.estadoActual.clase}
                  nombre={docSeleccionada.estadoActual.nombre}
                  esFinal={docSeleccionada.estadoActual.esFinal}
                />
              </div>

              <dl className="doc-meta-grid">
                <div>
                  <dt>Tipo de documento</dt>
                  <dd>{docSeleccionada.tipoDocumento}</dd>
                </div>
                <div>
                  <dt>CM Origen</dt>
                  <dd>{docSeleccionada.cmOrigen}</dd>
                </div>
                <div>
                  <dt>Fecha de pase</dt>
                  <dd>
                    {new Date(docSeleccionada.fechaPase).toLocaleDateString('es-AR')}
                  </dd>
                </div>
                <div>
                  <dt>Clase concreta en estadoActual</dt>
                  <dd>
                    <code>{docSeleccionada.estadoActual.clase}</code>
                  </dd>
                </div>
              </dl>
              <p className="doc-hero__desc">{docSeleccionada.estadoActual.descripcion}</p>
            </section>

            <StateMachineSvg
              documentacion={docSeleccionada}
              disabled={loading}
              onTransicionar={handleTransicionar}
            />

            {catalogos && (
              <TransitionControls
                documentacion={docSeleccionada}
                empleados={catalogos.empleados}
                emailResponsable={emailResponsable}
                fechaHoraManual={fechaHoraManual}
                loading={loading}
                onChangeResponsable={setEmailResponsable}
                onChangeFechaHora={setFechaHoraManual}
                onEjecutarTransicion={handleTransicionar}
              />
            )}

            <TracePanel
              titulo={
                trazaError
                  ? 'Traza de rechazo polimórfico (EstadoDocumentacion)'
                  : 'Traza de ejecución del Patrón State'
              }
              traza={traza}
              esError={trazaError}
            />

            <HistorialTable
              numeroDoc={docSeleccionada.numero}
              cambiosEstado={docSeleccionada.cambiosEstado}
            />
          </>
        )}
      </div>

      {catalogos && (
        <NewDocumentacionDialog
          open={dialogOpen}
          catalogos={catalogos}
          submitting={loading}
          onClose={() => setDialogOpen(false)}
          onCreate={handleCreateDoc}
        />
      )}
    </div>
  );
}
