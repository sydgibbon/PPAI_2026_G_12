import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { CatalogosResponse } from '../../types/api';

interface NewDocumentacionDialogProps {
  open: boolean;
  catalogos: CatalogosResponse;
  submitting: boolean;
  onClose: () => void;
  onCreate: (payload: {
    asunto: string;
    fechaPase: string;
    tipoDocumento: string;
    cmOrigen: string;
    emailResponsable: string;
  }) => Promise<boolean>;
}

interface FieldErrors {
  asunto?: string;
  fechaPase?: string;
  tipoDocumento?: string;
  cmOrigen?: string;
  emailResponsable?: string;
}

export function NewDocumentacionDialog({
  open,
  catalogos,
  submitting,
  onClose,
  onCreate,
}: NewDocumentacionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const asuntoRef = useRef<HTMLInputElement | null>(null);
  const fechaRef = useRef<HTMLInputElement | null>(null);
  const tipoRef = useRef<HTMLSelectElement | null>(null);
  const cmRef = useRef<HTMLSelectElement | null>(null);
  const respRef = useRef<HTMLSelectElement | null>(null);

  const hoy = new Date().toISOString().slice(0, 10);

  const [asunto, setAsunto] = useState('');
  const [fechaPase, setFechaPase] = useState(hoy);
  const [tipoDocumento, setTipoDocumento] = useState(catalogos.tiposDocumento[0] ?? '');
  const [cmOrigen, setCmOrigen] = useState(catalogos.comisionesMedicas[1] ?? catalogos.comisionesMedicas[0] ?? '');
  const [emailResponsable, setEmailResponsable] = useState(catalogos.empleados[0]?.email ?? '');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setAsunto('');
      setFechaPase(hoy);
      setTipoDocumento(catalogos.tiposDocumento[0] ?? '');
      setCmOrigen(catalogos.comisionesMedicas[1] ?? catalogos.comisionesMedicas[0] ?? '');
      setEmailResponsable(catalogos.empleados[0]?.email ?? '');
      setTouched({});
      setErrors({});
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, catalogos, hoy]);

  const validateField = (name: keyof FieldErrors, value: string): string | undefined => {
    if (name === 'asunto') {
      const trimmed = value.trim();
      if (!trimmed) return 'Ingresá un asunto descriptivo para la documentación.';
      if (trimmed.length < 5) return 'El asunto debe tener al menos 5 caracteres.';
    }
    if (name === 'fechaPase' && !value) {
      return 'Seleccioná una fecha de pase válida.';
    }
    if (name === 'tipoDocumento' && !value) {
      return 'Seleccioná un tipo de documento.';
    }
    if (name === 'cmOrigen' && !value) {
      return 'Seleccioná la Comisión Médica de origen.';
    }
    if (name === 'emailResponsable' && !value) {
      return 'Seleccioná un empleado responsable.';
    }
    return undefined;
  };

  const handleBlur = (name: keyof FieldErrors, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nextErrors: FieldErrors = {
      asunto: validateField('asunto', asunto),
      fechaPase: validateField('fechaPase', fechaPase),
      tipoDocumento: validateField('tipoDocumento', tipoDocumento),
      cmOrigen: validateField('cmOrigen', cmOrigen),
      emailResponsable: validateField('emailResponsable', emailResponsable),
    };

    setTouched({
      asunto: true,
      fechaPase: true,
      tipoDocumento: true,
      cmOrigen: true,
      emailResponsable: true,
    });
    setErrors(nextErrors);

    if (nextErrors.asunto) {
      asuntoRef.current?.focus();
      return;
    }
    if (nextErrors.fechaPase) {
      fechaRef.current?.focus();
      return;
    }
    if (nextErrors.tipoDocumento) {
      tipoRef.current?.focus();
      return;
    }
    if (nextErrors.cmOrigen) {
      cmRef.current?.focus();
      return;
    }
    if (nextErrors.emailResponsable) {
      respRef.current?.focus();
      return;
    }

    const ok = await onCreate({
      asunto: asunto.trim(),
      fechaPase,
      tipoDocumento,
      cmOrigen,
      emailResponsable,
    });
    if (ok) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="nueva-doc-title"
      className="modal-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="modal-dialog__header">
        <h2 id="nueva-doc-title">Nueva Documentación (estado inicial: Registrada)</h2>
        <button
          type="button"
          className="btn-icon-close"
          onClick={onClose}
          aria-label="Cerrar ventana"
        >
          ✕ Cerrar
        </button>
      </div>

      <p className="modal-dialog__intro">
        Invoca <code>new Documentacion(...)</code>: el constructor instancia{' '}
        <code>Registrada</code> como <code>estadoActual</code> y crea el primer{' '}
        <code>CambioEstadoDocumentacion</code>.
      </p>

      <form onSubmit={handleSubmit} noValidate className="modal-form">
        <div className="form-field">
          <label htmlFor="doc-asunto">
            Asunto <span aria-hidden="true">*</span>
          </label>
          <input
            ref={asuntoRef}
            id="doc-asunto"
            name="asunto"
            type="text"
            required
            minLength={5}
            value={asunto}
            aria-invalid={touched.asunto && errors.asunto ? 'true' : undefined}
            aria-describedby="doc-asunto-help doc-asunto-error"
            onChange={(e) => {
              const val = e.target.value;
              setAsunto(val);
              if (errors.asunto && !validateField('asunto', val)) {
                setErrors((prev) => ({ ...prev, asunto: undefined }));
              }
            }}
            onBlur={(e) => handleBlur('asunto', e.target.value)}
            placeholder="Ej.: EXP-2026-70410 — Dictamen Comisión Médica"
          />
          <span id="doc-asunto-help" className="field-hint">
            Mínimo 5 caracteres. Identifica la documentación dentro del remito y bolsín.
          </span>
          {touched.asunto && errors.asunto && (
            <span id="doc-asunto-error" role="alert" className="field-error">
              {errors.asunto}
            </span>
          )}
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="doc-fecha">
              Fecha de pase <span aria-hidden="true">*</span>
            </label>
            <input
              ref={fechaRef}
              id="doc-fecha"
              name="fechaPase"
              type="date"
              required
              value={fechaPase}
              aria-invalid={touched.fechaPase && errors.fechaPase ? 'true' : undefined}
              aria-describedby={errors.fechaPase ? 'doc-fecha-error' : undefined}
              onChange={(e) => {
                const val = e.target.value;
                setFechaPase(val);
                if (errors.fechaPase && !validateField('fechaPase', val)) {
                  setErrors((prev) => ({ ...prev, fechaPase: undefined }));
                }
              }}
              onBlur={(e) => handleBlur('fechaPase', e.target.value)}
            />
            {touched.fechaPase && errors.fechaPase && (
              <span id="doc-fecha-error" role="alert" className="field-error">
                {errors.fechaPase}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="doc-tipo">
              Tipo de documento <span aria-hidden="true">*</span>
            </label>
            <select
              ref={tipoRef}
              id="doc-tipo"
              name="tipoDocumento"
              required
              value={tipoDocumento}
              aria-invalid={touched.tipoDocumento && errors.tipoDocumento ? 'true' : undefined}
              onChange={(e) => setTipoDocumento(e.target.value)}
              onBlur={(e) => handleBlur('tipoDocumento', e.target.value)}
            >
              {catalogos.tiposDocumento.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="doc-cm">
              Comisión Médica origen <span aria-hidden="true">*</span>
            </label>
            <select
              ref={cmRef}
              id="doc-cm"
              name="cmOrigen"
              required
              value={cmOrigen}
              aria-invalid={touched.cmOrigen && errors.cmOrigen ? 'true' : undefined}
              onChange={(e) => setCmOrigen(e.target.value)}
              onBlur={(e) => handleBlur('cmOrigen', e.target.value)}
            >
              {catalogos.comisionesMedicas.map((cm) => (
                <option key={cm} value={cm}>
                  {cm}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="doc-resp">
              Empleado responsable <span aria-hidden="true">*</span>
            </label>
            <select
              ref={respRef}
              id="doc-resp"
              name="emailResponsable"
              required
              value={emailResponsable}
              aria-invalid={touched.emailResponsable && errors.emailResponsable ? 'true' : undefined}
              onChange={(e) => setEmailResponsable(e.target.value)}
              onBlur={(e) => handleBlur('emailResponsable', e.target.value)}
            >
              {catalogos.empleados.map((emp) => (
                <option key={emp.email} value={emp.email}>
                  {emp.apellido}, {emp.nombre} ({emp.comisionMedica})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-form__actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Registrando...' : 'Crear Documentación'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
