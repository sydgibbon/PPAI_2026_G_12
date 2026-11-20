import { ESTADOS_VISUAL_META, TRANSICIONES_META } from '../../data/stateMachineMeta';
import type { AccionEstadoDocumentacion, DocumentacionDto, EstadoClase } from '../../types/api';

interface StateMachineSvgProps {
  documentacion: DocumentacionDto;
  disabled: boolean;
  onTransicionar: (accion: AccionEstadoDocumentacion) => void;
}

interface Point {
  x: number;
  y: number;
}

function centroNodo(clase: EstadoClase): Point {
  const m = ESTADOS_VISUAL_META[clase];
  return { x: m.x + m.width / 2, y: m.y + m.height / 2 };
}

function calcularPuntoBorde(desde: Point, hacia: Point, claseDestino: EstadoClase): Point {
  const m = ESTADOS_VISUAL_META[claseDestino];
  const hw = m.width / 2 + 4;
  const hh = m.height / 2 + 4;
  const dx = hacia.x - desde.x;
  const dy = hacia.y - desde.y;
  if (dx === 0 && dy === 0) return hacia;
  const scaleX = Math.abs(dx) > 0 ? hw / Math.abs(dx) : Infinity;
  const scaleY = Math.abs(dy) > 0 ? hh / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return {
    x: hacia.x - dx * scale,
    y: hacia.y - dy * scale,
  };
}

export function StateMachineSvg({
  documentacion,
  disabled,
  onTransicionar,
}: StateMachineSvgProps) {
  const estadoActual = documentacion.estadoActual.clase;
  const visitados = new Set(documentacion.cambiosEstado.map((c) => c.estado.clase));
  const transicionesDisponibles = new Map(
    TRANSICIONES_META.filter((t) => t.desde === estadoActual).map((t) => [t.id, t]),
  );

  return (
    <section aria-labelledby="svg-heading" className="card">
      <div className="card__header">
        <div>
          <h3 id="svg-heading">Máquina de Estados Interactiva — EstadoDocumentacion</h3>
          <p className="card__subtitle">
            Los nodos y flechas resaltadas muestran las transiciones polimórficas admitidas por{' '}
            <code>{estadoActual}</code>. Hacé clic en una flecha activa para invocar el método
            en el backend.
          </p>
        </div>
        <div className="legend-row" aria-label="Referencias visuales">
          <span className="legend-item">
            <span className="legend-swatch legend-swatch--actual" aria-hidden="true" />
            Estado actual
          </span>
          <span className="legend-item">
            <span className="legend-swatch legend-swatch--visited" aria-hidden="true" />
            Ya visitado
          </span>
          <span className="legend-item">
            <span className="legend-swatch legend-swatch--final" aria-hidden="true" />
            Estado final
          </span>
        </div>
      </div>

      <div className="svg-scroll">
        <svg
          viewBox="0 0 1100 570"
          className="state-svg"
          role="img"
          aria-labelledby="svg-title svg-desc"
        >
          <title id="svg-title">
            Máquina de estados de Documentacion — Estado actual: {estadoActual}
          </title>
          <desc id="svg-desc">
            Diagrama con los 9 estados concretos de EstadoDocumentacion y sus 14 transiciones
            definidas en el modelo de dominio. Estado activo actual: {estadoActual}.
          </desc>

          <defs>
            <marker
              id="arrow-idle"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f5ea8" />
            </marker>
          </defs>

          {/* Pseudostate inicial [*] -> Registrada */}
          <circle cx="32" cy="147" r="11" fill="#12355b" />
          <line
            x1="43"
            y1="147"
            x2="86"
            y2="147"
            stroke="#475569"
            strokeWidth="2"
            markerEnd="url(#arrow-idle)"
          />
          <text x="48" y="135" className="svg-edge-label">
            /new()
          </text>

          {/* Pseudostates finales [*] */}
          <line
            x1="1030"
            y1="257"
            x2="1062"
            y2="257"
            stroke="#475569"
            strokeWidth="2"
            markerEnd="url(#arrow-idle)"
          />
          <circle cx="1075" cy="257" r="12" fill="none" stroke="#1e293b" strokeWidth="2" />
          <circle cx="1075" cy="257" r="7" fill="#1e293b" />

          <line
            x1="255"
            y1="512"
            x2="302"
            y2="512"
            stroke="#475569"
            strokeWidth="2"
            markerEnd="url(#arrow-idle)"
          />
          <circle cx="315" cy="512" r="12" fill="none" stroke="#1e293b" strokeWidth="2" />
          <circle cx="315" cy="512" r="7" fill="#1e293b" />

          {/* Aristas de transición */}
          {TRANSICIONES_META.map((edge) => {
            const p1 = centroNodo(edge.desde);
            const p2 = centroNodo(edge.hacia);
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy) || 1;
            const nx = -dy / dist;
            const ny = dx / dist;
            const curve = edge.curveOffset ?? 0;

            const ctrl = {
              x: (p1.x + p2.x) / 2 + nx * curve,
              y: (p1.y + p2.y) / 2 + ny * curve,
            };

            const inicio = calcularPuntoBorde(ctrl, p1, edge.desde);
            const fin = calcularPuntoBorde(ctrl, p2, edge.hacia);
            const d =
              curve === 0
                ? `M ${inicio.x} ${inicio.y} L ${fin.x} ${fin.y}`
                : `M ${inicio.x} ${inicio.y} Q ${ctrl.x} ${ctrl.y} ${fin.x} ${fin.y}`;

            const midX = (inicio.x + 2 * ctrl.x + fin.x) / 4 + (edge.labelOffset?.dx ?? 0);
            const midY = (inicio.y + 2 * ctrl.y + fin.y) / 4 + (edge.labelOffset?.dy ?? 0);
            const esActiva = transicionesDisponibles.has(edge.id);

            return (
              <g
                key={edge.id}
                className={esActiva && !disabled ? 'svg-edge svg-edge--active' : 'svg-edge'}
                onClick={() => {
                  if (esActiva && !disabled) {
                    onTransicionar(edge.accion);
                  }
                }}
              >
                <path
                  d={d}
                  fill="none"
                  stroke={esActiva ? '#0f5ea8' : '#cbd5e1'}
                  strokeWidth={esActiva ? 2.8 : 1.7}
                  markerEnd={esActiva ? 'url(#arrow-active)' : 'url(#arrow-idle)'}
                />
                {esActiva && (
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                  />
                )}
                <rect
                  x={midX - 54}
                  y={midY - 11}
                  width="108"
                  height="20"
                  rx="6"
                  fill={esActiva ? '#e0f2fe' : '#f8fafc'}
                  stroke={esActiva ? '#0f5ea8' : '#e2e8f0'}
                  strokeWidth="1"
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  className={`svg-edge-label ${esActiva ? 'svg-edge-label--active' : ''}`}
                >
                  /{edge.accion}()
                </text>
              </g>
            );
          })}

          {/* Nodos de los 9 estados */}
          {Object.values(ESTADOS_VISUAL_META).map((nodo) => {
            const esActual = nodo.clase === estadoActual;
            const fueVisitado = visitados.has(nodo.clase);

            return (
              <g key={nodo.clase}>
                <rect
                  x={nodo.x}
                  y={nodo.y}
                  width={nodo.width}
                  height={nodo.height}
                  rx="12"
                  className={[
                    'svg-node',
                    `svg-node--${nodo.tone}`,
                    esActual ? 'svg-node--actual' : '',
                    !esActual && fueVisitado ? 'svg-node--visited' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
                <text
                  x={nodo.x + nodo.width / 2}
                  y={nodo.y + (esActual || nodo.esFinal ? 24 : 31)}
                  textAnchor="middle"
                  className="svg-node__title"
                >
                  {nodo.simbolo} {nodo.etiqueta}
                </text>
                {esActual && (
                  <text
                    x={nodo.x + nodo.width / 2}
                    y={nodo.y + 42}
                    textAnchor="middle"
                    className="svg-node__badge"
                  >
                    ESTADO ACTUAL
                  </text>
                )}
                {!esActual && nodo.esFinal && (
                  <text
                    x={nodo.x + nodo.width / 2}
                    y={nodo.y + 42}
                    textAnchor="middle"
                    className="svg-node__sub"
                  >
                    Estado Final
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
