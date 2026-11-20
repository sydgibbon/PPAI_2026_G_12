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
import { LAST_CU28_TRACE_STORAGE_KEY, type UltimaTrazaCu28 } from '../debug/DebugPage';

interface Cu28WizardProps {
  refreshSignal: number;
  onNotify: (msg: { type: 'success' | 'error'; text: string }) => void;
}

const STEPS = [
  { id: 1, title: 'Bolsines enviados', desc: 'Seleccionar bolsín recibido' },
  { id: 2, title: 'Contenido y opción', desc: 'Controlar remitos y documentación' },
  { id: 3, title: 'Confirmación', desc: 'Revisar datos antes de registrar' },
  { id: 4, title: 'Comprobante', desc: 'Recepción registrada y notificaciones' },
];

export function Cu28Wizard({ refreshSignal, onNotify }: Cu28WizardProps) {
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

    try {
      const registroTraza: UltimaTrazaCu28 = {
        numeroBolsin: res.data.bolsin.numeroBolsin,
        numeroPrecinto: res.data.bolsin.numeroPrecinto,
        fechaRegistroIso: new Date().toISOString(),
        traza: res.data.traza,
      };
      window.localStorage.setItem(LAST_CU28_TRACE_STORAGE_KEY, JSON.stringify(registroTraza));
    } catch {
      // Ignorar si storage no está disponible
    }

    setConfirmacion(res.data);
    setBolsinDetalle(res.data.bolsin);
    marcarCompletadoYIr(3, 4);
    onNotify({ type: 'success', text: res.data.mensaje });
  };

  return (
    <div className="wizard-layout">
      <aside aria-label="Pasos de recepción" className="wizard-sidebar card">
        <div className="wizard-sidebar__header">
          <h2>Recepción de Bolsines</h2>
          <p className="card__subtitle">Paso {step} de {STEPS.length}</p>
        </div>

        <nav aria-label="Pasos del registro">
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
            <strong>Encargado de Bolsines</strong>
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
              1. Bolsines enviados pendientes de recepción
            </h2>
            <p className="card__subtitle">
              Comisión Médica destino: <strong>{cmEmpleado || '—'}</strong>. Seleccioná el bolsín
              recibido por correo o filtrá por número de precinto o CM de origen.
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
                  No hay bolsines pendientes en estado <strong>Enviado</strong> para esta Comisión
                  Médica.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void cargarInicio()}
                  disabled={loading}
                >
                  Actualizar listado
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
                      Seleccionar bolsín
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
              2. Remitos y Documentación — Bolsín #{bolsinDetalle.numeroBolsin} (Precinto{' '}
              {bolsinDetalle.numeroPrecinto})
            </h2>
            <p className="card__subtitle">
              Verificá que los remitos y la documentación física coincidan con lo registrado e
              indicá la situación de recepción.
            </p>

            <div className="remitos-list">
              {bolsinDetalle.remitos.map((rem) => (
                <article key={rem.numero} className="remito-box">
                  <div className="remito-box__header">
                    <h3>
                      Remito #{rem.numero} — Origen: {rem.origen}
                    </h3>
                    <span className="status-chip">{rem.estado.nombre}</span>
                  </div>
                  <ul className="remito-docs">
                    {rem.detalles.map((det) => (
                      <li key={det.documentacion.numero} className="remito-doc-item">
                        <div>
                          <strong>
                            {det.documentacion.tipoDocumento} · Doc #{det.documentacion.numero}
                          </strong>
                          <p>{det.documentacion.asunto}</p>
                          <small>Área destino: {det.areaCMDestino || 'Mesa de Entradas'}</small>
                        </div>
                        <span className="status-chip">{det.documentacion.estadoActual.nombre}</span>
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
                  ← Volver al listado
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Continuar →
                </button>
              </div>
            </form>
          </section>
        )}

        {step === 3 && bolsinDetalle && (
          <section aria-labelledby="cu28-step3-h" className="card">
            <h2 id="cu28-step3-h" ref={stepHeadingRef} tabIndex={-1}>
              3. Confirmar recepción del Bolsín #{bolsinDetalle.numeroBolsin}
            </h2>
            <p className="card__subtitle">
              Revisá los cambios que se registrarán al confirmar la recepción conforme del bolsín
              con precinto <strong>{bolsinDetalle.numeroPrecinto}</strong>:
            </p>

            <ul className="impact-list">
              <li>
                <strong>Bolsín #{bolsinDetalle.numeroBolsin}:</strong> pasará de{' '}
                <strong>{bolsinDetalle.estadoActual}</strong> a{' '}
                <strong>Recibido en CM destino</strong>.
              </li>
              <li>
                <strong>{bolsinDetalle.remitos.length} Remito(s):</strong> pasarán al estado{' '}
                <strong>Recibido y Aceptado</strong>.
              </li>
              <li>
                <strong>{bolsinDetalle.cantidadDocumentaciones} Documentación(es):</strong>{' '}
                pasarán al estado <strong>Recibida y Aceptada</strong>.
              </li>
              {empleado && (
                <li>
                  <strong>Responsable del registro:</strong> {empleado.apellido},{' '}
                  {empleado.nombre} ({cmEmpleado}).
                </li>
              )}
            </ul>

            <div className="step-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(2)}
                disabled={loading}
              >
                ← Modificar selección
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleConfirmar()}
                disabled={loading}
              >
                {loading ? 'Registrando...' : '✓ Confirmar recepción'}
              </button>
            </div>
          </section>
        )}

        {step === 4 && confirmacion && (
          <section aria-labelledby="cu28-step4-h" className="card">
            <div className="card__header">
              <div>
                <h2 id="cu28-step4-h" ref={stepHeadingRef} tabIndex={-1}>
                  4. Recepción registrada — Bolsín #{confirmacion.bolsin.numeroBolsin}
                </h2>
                <p className="card__subtitle">{confirmacion.mensaje}</p>
              </div>
              <span className="actual-pill actual-pill--true">
                ✓ {confirmacion.bolsin.estadoActual}
              </span>
            </div>

            <h3>Remitos y documentación recibida</h3>
            <ul className="remito-docs">
              {confirmacion.bolsin.remitos.flatMap((remito) =>
                remito.detalles.map((det) => (
                  <li key={det.documentacion.numero} className="remito-doc-item">
                    <div>
                      <strong>
                        Remito #{remito.numero} ({remito.estado.nombre}) ·{' '}
                        {det.documentacion.tipoDocumento} #{det.documentacion.numero}
                      </strong>
                      <p>{det.documentacion.asunto}</p>
                    </div>
                    <span className="actual-pill actual-pill--true">
                      ✓ {det.documentacion.estadoActual.nombre}
                    </span>
                  </li>
                )),
              )}
            </ul>

            <h3>Notificaciones enviadas a las Comisiones Médicas de origen</h3>
            <ul className="notif-list">
              {confirmacion.notificacionesCu29.map((n) => (
                <li key={n.cmOrigen}>
                  <strong>{n.cmOrigen}</strong> ({n.destinatario}): {n.asunto} —{' '}
                  {n.cantidadDocumentos} documento(s) en estado{' '}
                  <strong>{n.estadoNotificado}</strong>.
                </li>
              ))}
            </ul>

            <div className="step-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void cargarInicio()}
              >
                Registrar otro bolsín
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
