import { ESTADOS_VISUAL_META } from '../../data/stateMachineMeta';
import type { EstadoClase } from '../../types/api';

interface EstadoBadgeProps {
  clase: EstadoClase;
  nombre?: string;
  esFinal?: boolean;
}

export function EstadoBadge({ clase, nombre, esFinal }: EstadoBadgeProps) {
  const meta = ESTADOS_VISUAL_META[clase];
  const label = nombre ?? meta.etiqueta;

  return (
    <span className={`state-badge state-badge--${meta.tone}`}>
      <span aria-hidden="true" className="state-badge__icon">
        {meta.simbolo}
      </span>
      <span>{label}</span>
      {esFinal && <span className="state-badge__final">Final</span>}
    </span>
  );
}
