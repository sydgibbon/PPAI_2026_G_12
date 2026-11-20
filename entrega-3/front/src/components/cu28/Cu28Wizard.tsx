import { useEffect, useMemo, useRef, useState } from 'react';
import {
  confirmarRecepcionBolsin,
  iniciarRecepcionBolsin,
  seleccionarBolsin,
  seleccionarOpcionRecepcion,
} from '../../services/bolsinesService';
import type {
  BolsinDetalleDto,
  BolsinResumenDto,
  ConfirmacionRecepcionResponse,
  EmpleadoDto,
  OpcionRecepcionDto,
} from '../../types/api';
import { EstadoBadge } from '../common/EstadoBadge';
import { TracePanel } from '../common/TracePanel';

interface Cu28WizardProps {
  refreshSignal: number;
  onNotify: (msg: { type: 'success' | 'error'; text: string }) => void;
  onVerEnStateExplorer: (numeroDoc: number) => void;
}

const STEPS = [
  { id: 1, title: 'CM y Bolsines Enviados', desc: 'Seleccionar bolsín por precinto/origen' },
  { id: 2, title: 'Remitos y Opción', desc: 'Inspeccionar contenido y elegir resultado' },
  { id: 3, title: 'Confirmar Recepción', desc: 'Validar actualización de estados' },
  { id: 4, title: 'Resultado y Traza State', desc: 'Estado actualizado + Diagrama de secuencia' },
];

export function Cu28Wizard({
  refreshSignal,
  onNotify,
  onVerEnStateExplorer,
}: Cu28WizardProps) {
  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);

  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const [empleado, setEmpleado] = useState<EmpleadoDto | null>(null);
  const [cmEmpleado, setCmEmpleado] = useState('');
  const [bolsines, setBolsines] = useState<BolsinResumenDto[]>([]);
  const [filtroBolsin, setFiltroBolsin] = useState('');

  const [bolsinDetalle, setBolsinDetalle] = useState<BolsinDetalleDto | null>(null);
  const [opciones, setOpciones] = useState<OpcionRecepcionDto[]>([]);
  const [opcionElegida, setOpcionElegida] = useState<number>(1);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionRecepcionResponse | null>(null);

  const cargarInicio = async () => {
    setLoading(true);
    const res = await iniciarRecepcionBolsin();
    setLoading(false);
    if (!res.success) {
      onNotify({ type: 'error', text: res.message });
      return;
    }
    setEmpleado(res.data.empleadoLogueado);
    setCmEmpleado(res.data.cmEmpleado);
    setBolsines(res.data.bolsinesEnviados);
    setBolsinDetalle(null);
    setOpciones([]);
    setConfirmacion(null);
    setStep(1);
    setCompleted([]);
  };

  useEffect(() => {
    void cargarInicio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [step]);

  const bolsinesFiltrados = useMemo(() => {
    const q = filtroBolsin.trim().toLowerCase();
    if (!q) return bolsines;
    return bolsines.filter(
      (b) =>
        String(b.numeroPrecinto).includes(q) ||
        String(b.numeroBolsin).includes(q) ||
        b.cmOrigen.toLowerCase().includes(q),
    );
  }, [bolsines, filtroBolsin]);

  const marcarCompletadoYIr = (pasoCompletado: number, siguientePaso: number) => {
    setCompleted((prev) => (prev.includes(pasoCompletado) ? prev : [...prev, pasoCompletado]));
    setStep(siguientePaso);
  };

  const handleSeleccionarBolsin = async (numeroBolsin: number) => {
    setLoading(true);
    const res = await seleccionarBolsin(numeroBolsin);
    setLoading(false);
    if (!res.success) {
      onNotify({ type: 'error', text: res.message });
      return;
    }
    setBolsinDetalle(res.data.bolsin);
    setOpciones(res.data.opcionesRecepcion);
    setOpcionElegida(1);
    marcarCompletadoYIr(1, 2);
  };

  const handleContinuarOpcion = async () => {
    setLoading(true);
    const res = await seleccionarOpcionRecepcion(opcionElegida);
    setLoading(false);
    if (!res.success) {
      onNotify({ type: 'error', text: res.message });
      return;
    }
    setBolsinDetalle(res.data.bolsin);
    marcarCompletadoYIr(2, 3);
  };

  const handleConfirmar = async () => {
    setLoading(true);
    const res = await confirmarRecepcionBolsin();
    setLoading(false);
    if (!res.success) {
      onNotify({ type: 'error', text: res.message });
      return;
    }
    setConfirmacion(res.data);
    setBolsinDetalle(res.data.bolsin);
    marcarCompletadoYIr(3, 4);
    onNotify({ type: 'success', text: res.data.mensaje });
  };

  return (
    <div className="wizard-layout">
      <aside aria-label="Progreso del Caso de Uso 28" className="wizard-sidebar card">
        <div className="wizard-sidebar__header">
          <h2>CU 28: Recepción de Bolsín</h2>
          <p className="card__subtitle">Paso {step} de {STEPS.length}</p>
        </div>

        <nav aria-label="Pasos del caso de uso">
          <ol className="step-list">
            {STEPS.map((s) => {
              const isCurrent = step === s.id;
              const isDone = completed.includes(s.id);
              const isAccessible = s.id === 1 || completed.includes(s.id - 1);

              return (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={!isAccessible || (step === 4 && s.id < 4)}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`step-btn ${isCurrent ? 'step-btn--current' : ''} ${
                      isDone ? 'step-btn--done' : ''
                    }`}
                    onClick={() => isAccessible && setStep(s.id)}
                  >
                    <span className="step-btn__num" aria-hidden="true">
                      {isDone ? '✓' : s.id}
                    </span>
                    <span className="step-btn__text">
                      <strong>{s.title}</strong>
                      <small>{s.desc}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {empleado && (
          <div className="session-box">
            <strong>Sesión activa</strong>
            <span>
              {empleado.apellido}, {empleado.nombre}
            </span>
            <small>{cmEmpleado}</small>
          </div>
        )}
      </aside>

      <div className="wizard-main">
        {step === 1 && (
          <section aria-labelledby="cu28-step1-h" className="card">
            <h2 id="cu28-step1-h" ref={stepHeadingRef} tabIndex={-1}>
              1. Bolsines en estado Enviado para {cmEmpleado || 'CM Destino'}
            </h2>
            <p className="card__subtitle">
              Flujo pasos 1–5 del CU 28: el gestor busca la CM del usuario logueado mediante{' '}
              <code>Sesion.getUsuario()</code> y filtra bolsines con{' '}
              <code>tenesEstaCMDestino()</code> y <code>sosEnviado()</code>.
            </p>

            <search className="search-box">
              <label htmlFor="filtro-bolsin">Filtrar por N° de precinto o CM origen</label>
              <input
                id="filtro-bolsin"
                type="search"
                value={filtroBolsin}
                onChange={(e) => setFiltroBolsin(e.target.value)}
                placeholder="Ej.: 90421 o Córdoba"
              />
            </search>

            {bolsinesFiltrados.length === 0 ? (
              <div className="empty-state">
                <p>
                  No quedan bolsines pendientes en estado <strong>Enviado</strong> para esta
                  Comisión Médica.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void cargarInicio()}
                  disabled={loading}
                >
                  Volver a consultar
                </button>
              </div>
            ) : (
              <div className="bolsines-grid">
                {bolsinesFiltrados.map((b) => (
                  <article key={b.numeroBolsin} className="bolsin-card">
                    <div className="bolsin-card__head">
                      <h3>Bolsín #{b.numeroBolsin}</h3>
                      <span className="status-chip">➔ {b.estadoActual}</span>
                    </div>
                    <dl className="bolsin-card__dl">
                      <div>
                        <dt>Nro. Precinto</dt>
                        <dd>
                          <strong>{b.numeroPrecinto}</strong>
                        </dd>
                      </div>
                      <div>
                        <dt>CM Origen</dt>
                        <dd>{b.cmOrigen}</dd>
                      </div>
                      <div>
                        <dt>Peso</dt>
                        <dd>{b.peso} g</dd>
                      </div>
                      <div>
                        <dt>Contenido</dt>
                        <dd>
                          {b.cantidadRemitos} remito(s) · {b.cantidadDocumentaciones} doc(s)
                        </dd>
                      </div>
                    </dl>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={loading}
                      onClick={() => void handleSeleccionarBolsin(b.numeroBolsin)}
                    >
                      Seleccionar Bolsín #{b.numeroBolsin}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {step === 2 && bolsinDetalle && (
          <section aria-labelledby="cu28-step2-h" className="card">
            <h2 id="cu28-step2-h" ref={stepHeadingRef} tabIndex={-1}>
              2. Remitos y Documentación del Bolsín #{bolsinDetalle.numeroBolsin} (Precinto{' '}
              {bolsinDetalle.numeroPrecinto})
            </h2>
            <p className="card__subtitle">
              Flujo pasos 6–8: revisá los remitos asociados y seleccioná la situación constatada al
              abrir el bolsín.
            </p>

            <div className="remitos-list">
              {bolsinDetalle.remitos.map((rem) => (
                <article key={rem.numero} className="remito-box">
                  <div className="remito-box__header">
                    <h3>
                      Remito #{rem.numero} — Origen: {rem.origen}
                    </h3>
                    <span className="status-chip">➔ {rem.estado.nombre}</span>
                  </div>
                  <ul className="remito-docs">
                    {rem.detalles.map((det) => (
                      <li key={det.documentacion.numero} className="remito-doc-item">
                        <div>
                          <strong>
                            Doc #{det.documentacion.numero} ({det.documentacion.tipoDocumento})
                          </strong>
                          <p>{det.documentacion.asunto}</p>
                          <small>Área destino: {det.areaCMDestino || 'General'}</small>
                        </div>
                        <EstadoBadge
                          clase={det.documentacion.estadoActual.clase}
                          nombre={det.documentacion.estadoActual.nombre}
                        />
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleContinuarOpcion();
              }}
              className="options-form"
            >
              <fieldset className="options-fieldset">
                <legend>Opciones de recepción del bolsín</legend>
                {opciones.map((opc) => (
                  <label
                    key={opc.codigo}
                    className={`option-radio ${
                      !opc.habilitadaEnCu28 ? 'option-radio--alt' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="opcionRecepcion"
                      value={opc.codigo}
                      checked={opcionElegida === opc.codigo}
                      onChange={() => setOpcionElegida(opc.codigo)}
                    />
                    <span>
                      <strong>
                        {opc.codigo}. {opc.titulo}
                      </strong>
                      <small>{opc.descripcion}</small>
                    </span>
                  </label>
                ))}
              </fieldset>

              <div className="step-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  ← Volver a bolsines
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Continuar a Confirmación →
                </button>
              </div>
            </form>
          </section>
        )}

        {step === 3 && bolsinDetalle && (
          <section aria-labelledby="cu28-step3-h" className="card">
            <h2 id="cu28-step3-h" ref={stepHeadingRef} tabIndex={-1}>
              3. Confirmar Recepción del Bolsín #{bolsinDetalle.numeroBolsin}
            </h2>
            <p className="card__subtitle">
              Al confirmar, el gestor ejecutará{' '}
              <code>bolsinSeleccionado.recibir(...)</code> siguiendo exactamente{' '}
              <code>DiagramaSecuenciaDEFINITIVO.puml</code>:
            </p>

            <ul className="impact-list">
              <li>
                <strong>Bolsín #{bolsinDetalle.numeroBolsin}:</strong> pasa de{' '}
                <code>{bolsinDetalle.estadoActual}</code> a{' '}
                <code>Recibido en CM destino</code> (cierra <code>CambioEstadoBolsin</code> actual
                y crea uno nuevo).
              </li>
              <li>
                <strong>{bolsinDetalle.remitos.length} Remito(s):</strong> pasan a estado{' '}
                <code>Recibido y Aceptado</code> mediante <code>recibirAceptar()</code>.
              </li>
              <li>
                <strong>{bolsinDetalle.cantidadDocumentaciones} Documentación(es):</strong>{' '}
                delegan en su objeto State <code>EnBolsinEnviado.aceptar(...)</code>, que invoca{' '}
                <code>crearEstado()</code> para instanciar <code>RecibidaYAceptada</code> y registra
                un nuevo <code>CambioEstadoDocumentacion</code> con el empleado responsable.
              </li>
            </ul>

            <div className="step-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(2)}
                disabled={loading}
              >
                ← Volver a opciones
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleConfirmar()}
                disabled={loading}
              >
                {loading ? 'Confirmando...' : '✓ Confirmar Recepción (Ejecutar Patrón State)'}
              </button>
            </div>
          </section>
        )}

        {step === 4 && confirmacion && (
          <div className="result-stack">
            <section aria-labelledby="cu28-step4-h" className="card">
              <div className="card__header">
                <div>
                  <h2 id="cu28-step4-h" ref={stepHeadingRef} tabIndex={-1}>
                    4. Recepción Confirmada — Bolsín #{confirmacion.bolsin.numeroBolsin}
                  </h2>
                  <p className="card__subtitle">{confirmacion.mensaje}</p>
                </div>
                <span className="actual-pill actual-pill--true">
                  ✓ {confirmacion.bolsin.estadoActual}
                </span>
              </div>

              <h3>Documentaciones actualizadas vía Patrón State</h3>
              <ul className="remito-docs">
                {confirmacion.bolsin.remitos.flatMap((remito) =>
                  remito.detalles.map((det) => (
                    <li key={det.documentacion.numero} className="remito-doc-item">
                      <div>
                        <strong>
                          Remito #{remito.numero} ({remito.estado.nombre}) · Doc #
                          {det.documentacion.numero}
                        </strong>
                        <p>{det.documentacion.asunto}</p>
                      </div>
                      <div className="remito-doc-item__right">
                        <EstadoBadge
                          clase={det.documentacion.estadoActual.clase}
                          nombre={det.documentacion.estadoActual.nombre}
                          esFinal={det.documentacion.estadoActual.esFinal}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onVerEnStateExplorer(det.documentacion.numero)}
                        >
                          Ver en Visualizador State →
                        </button>
                      </div>
                    </li>
                  )),
                )}
              </ul>

              <h3>Inclusión CU 29 — Notificar recepción de bolsín</h3>
              <ul className="notif-list">
                {confirmacion.notificacionesCu29.map((n) => (
                  <li key={n.cmOrigen}>
                    <strong>{n.cmOrigen}</strong> ({n.destinatario}): {n.asunto} —{' '}
                    {n.cantidadDocumentos} documento(s) en estado{' '}
                    <code>{n.estadoNotificado}</code>.
                  </li>
                ))}
              </ul>

              <div className="step-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void cargarInicio()}
                >
                  Procesar otro bolsín
                </button>
              </div>
            </section>

            <TracePanel
              titulo="Traza ejecutada según DiagramaSecuenciaDEFINITIVO.puml"
              traza={confirmacion.traza}
            />
          </div>
        )}
      </div>
    </div>
  );
}
