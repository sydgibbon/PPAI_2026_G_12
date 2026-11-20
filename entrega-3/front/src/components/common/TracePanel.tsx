import type { TrazaPasoDto } from '../../types/api';

interface TracePanelProps {
  titulo: string;
  traza: TrazaPasoDto[];
  esError?: boolean;
}

export function TracePanel({ titulo, traza, esError = false }: TracePanelProps) {
  if (traza.length === 0) {
    return null;
  }

  const captionId = esError ? 'traza-error-caption' : 'traza-ok-caption';
  const textoTraza = traza
    .map(
      (paso) =>
        `${String(paso.orden).padStart(2, '0')}. ${paso.origen} -> ${paso.destino} : ${paso.mensaje}${
          paso.detalle ? `\n    // ${paso.detalle}` : ''
        }`,
    )
    .join('\n');

  return (
    <figure className={`trace-figure ${esError ? 'trace-figure--error' : ''}`}>
      <figcaption id={captionId} className="trace-figure__caption">
        <span aria-hidden="true">{esError ? '✕ ' : '⇄ '}</span>
        {titulo}
      </figcaption>
      <pre role="region" aria-labelledby={captionId} tabIndex={0} className="trace-figure__pre">
        <code>{textoTraza}</code>
      </pre>
    </figure>
  );
}
