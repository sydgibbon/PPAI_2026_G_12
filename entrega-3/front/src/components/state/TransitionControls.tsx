import { ACCIONES_META, TRANSICIONES_META } from '../../data/stateMachineMeta';
import type {
  AccionEstadoDocumentacion,
  DocumentacionDto,
  EmpleadoDto,
} from '../../types/api';

interface TransitionControlsProps {
  documentacion: DocumentacionDto;
  empleados: EmpleadoDto[];
  emailResponsable: string;
  fechaHoraManual: string;
  loading: boolean;
  onChangeResponsable: (email: string) => void;
  onChangeFechaHora: (value: string) => void;
  onEjecutarTransicion: (accion: AccionEstadoDocumentacion) => void;
}

export function TransitionControls({
  documentacion,
  empleados,
  emailResponsable,
  fechaHoraManual,
  loading,
  onChangeResponsable,
  onChangeFechaHora,
  onEjecutarTransicion,
}: TransitionControlsProps) {
  const claseActual = documentacion.estadoActual.clase;
  const transicionesValidas = TRANSICIONES_META.filter((t) => t.desde === claseActual);
  const accionesValidasSet = new Set(transicionesValidas.map((t) => t.accion));
  const accionesInvalidas = (Object.keys(ACCIONES_META) as AccionEstadoDocumentacion[]).filter(
    (a) => !accionesValidasSet.has(a),
  );

  return (
    <section aria-labelledby="transitions-heading" className="card">
      <div className="card__header">
        <div>
          <h3 id="transitions-heading">Invocar Métodos sobre Documentacion</h3>
          <p className="card__subtitle">
            <code>Documentacion</code> delega en{' '}
            <code>this.estadoActual.&lt;accion&gt;(this, fechaHoraActual, this.cambioEstado, responsable)</code>{' '}
            sin condicionales <code>if/switch</code>.
          </p>
        </div>
      </div>

      <div className="controls-context-grid">
        <div className="form-field">
          <label htmlFor="trans-responsable">Empleado responsable</label>
          <select
            id="trans-responsable"
            value={emailResponsable}
            onChange={(e) => onChangeResponsable(e.target.value)}
          >
            {empleados.map((emp) => (
              <option key={emp.email} value={emp.email}>
                {emp.apellido}, {emp.nombre} — {emp.comisionMedica}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="trans-fecha">Fecha/Hora de transición (opcional)</label>
          <input
            id="trans-fecha"
            type="datetime-local"
            value={fechaHoraManual}
            aria-describedby="trans-fecha-help"
            onChange={(e) => onChangeFechaHora(e.target.value)}
          />
          <span id="trans-fecha-help" className="field-hint">
            Si queda vacío, el gestor usa la fecha y hora actual del servidor.
          </span>
        </div>
      </div>

      <div className="transitions-block">
        <h4>Transiciones válidas desde {claseActual}</h4>
        {transicionesValidas.length === 0 ? (
          <p className="empty-note">
            <strong>{claseActual}</strong> es un estado terminal (final). No admite transiciones
            salientes.
          </p>
        ) : (
          <div className="transition-buttons">
            {transicionesValidas.map((t) => (
              <button
                key={t.id}
                type="button"
                className="btn-transition"
                disabled={loading}
                onClick={() => onEjecutarTransicion(t.accion)}
              >
                <span className="btn-transition__method">
                  {t.accion}() → {t.hacia}
                </span>
                <span className="btn-transition__meta">
                  {t.cu}
                  {t.guarda ? ` [${t.guarda}]` : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <details className="polymorphism-details">
        <summary>
          Probar polimorfismo: invocar cualquiera de los otros métodos ({accionesInvalidas.length}{' '}
          transiciones inválidas desde {claseActual})
        </summary>
        <div className="polymorphism-details__body">
          <p className="field-hint">
            Estos botones envían la acción real al backend. El objeto <code>{claseActual}</code>{' '}
            hereda el comportamiento por defecto de <code>EstadoDocumentacion</code> y lanza{' '}
            <code>TransicionInvalidaError</code> (HTTP 400) sin mutar el historial.
          </p>
          <div className="invalid-buttons-grid">
            {accionesInvalidas.map((accion) => (
              <button
                key={accion}
                type="button"
                className="btn-invalid-transition"
                disabled={loading}
                onClick={() => onEjecutarTransicion(accion)}
              >
                <code>{ACCIONES_META[accion].etiqueta}</code>
                <span>{ACCIONES_META[accion].descripcion}</span>
              </button>
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}
