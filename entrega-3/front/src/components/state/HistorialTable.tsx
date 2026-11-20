import type { CambioEstadoDocumentacionDto } from '../../types/api';
import { EstadoBadge } from '../common/EstadoBadge';

interface HistorialTableProps {
  numeroDoc: number;
  cambiosEstado: CambioEstadoDocumentacionDto[];
}

function formatearFecha(iso: string | null): string {
  if (!iso) {
    return 'En curso (null)';
  }
  return new Date(iso).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

export function HistorialTable({ numeroDoc, cambiosEstado }: HistorialTableProps) {
  const ordenados = [...cambiosEstado].reverse();

  return (
    <section aria-labelledby="historial-caption" className="card">
      <div className="card__header">
        <h3 id="historial-heading">Historial de CambioEstadoDocumentacion</h3>
        <span className="muted-pill">{cambiosEstado.length} registro(s)</span>
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-labelledby="historial-caption"
        className="table-wrapper"
      >
        <table className="historial-table">
          <caption id="historial-caption">
            Trazabilidad completa de estados de la documentación #{numeroDoc}
          </caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Estado</th>
              <th scope="col">Fecha/Hora Inicio</th>
              <th scope="col">Fecha/Hora Fin</th>
              <th scope="col">Responsable</th>
              <th scope="col">sosActual()</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((cambio, idx) => {
              const numeroPaso = ordenados.length - idx;
              return (
                <tr key={`${cambio.estado.clase}-${cambio.fechaHoraInicio}-${numeroPaso}`}>
                  <th scope="row">{numeroPaso}</th>
                  <td>
                    <EstadoBadge
                      clase={cambio.estado.clase}
                      nombre={cambio.estado.nombre}
                      esFinal={cambio.estado.esFinal}
                    />
                  </td>
                  <td>{formatearFecha(cambio.fechaHoraInicio)}</td>
                  <td>{formatearFecha(cambio.fechaHoraFin)}</td>
                  <td>
                    {cambio.responsable.apellido}, {cambio.responsable.nombre}
                    <span className="cell-subtext">{cambio.responsable.comisionMedica}</span>
                  </td>
                  <td>
                    {cambio.esActual ? (
                      <span className="actual-pill actual-pill--true">✓ true (Actual)</span>
                    ) : (
                      <span className="actual-pill actual-pill--false">false</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
