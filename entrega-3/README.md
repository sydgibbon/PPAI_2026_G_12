# Entrega 3 — Implementación TypeScript del Patrón State (CU 28) y Visualizador Frontend

Implementación académica en **TypeScript** del **Patrón State** aplicado a la entidad `Documentacion` dentro del **CU 28 — Registrar recepción de bolsín**, respetando como única fuente de verdad (SOT) los diagramas definitivos:

- `entrega-3/1.vista-estatica.puml`
- `entrega-3/2.vista-dinamica.puml`
- `entrega-1/3.maquina-estados.puml` (máquina completa de 9 estados y 14 transiciones)

La arquitectura de capas y el flujo REST paso a paso siguen las convenciones de [`LiberaeMentis/dsi-implementaciones-uc`](https://github.com/LiberaeMentis/dsi-implementaciones-uc).

---

## Estructura del Proyecto

```text
entrega-3/
├── backend/                     # API REST Express + TypeScript (en memoria, puerto 8080)
│   ├── src/
│   │   ├── boundaries/          # Límites REST (boundary): PantallaRegRecepBolsin.ts
│   │   ├── controller/          # Controlador de caso de uso: GestorRegRecepBolsin.ts
│   │   ├── models/              # Entidades de dominio (Context + State + Bolsín/Remito)
│   │   │   └── estados/         # EstadoDocumentacion (abstracta) + 9 estados concretos
│   │   ├── dtos/                # DTOs de request/response
│   │   ├── app.ts
│   │   └── index.ts
│   └── tests/                   # Tests unitarios y E2E con Vitest
├── front/                       # Frontend React + TypeScript + Vite (puerto 3000)
│   └── src/
│       ├── components/cu28/     # Wizard paso a paso del CU 28
│       ├── components/state/    # Diagrama SVG interactivo, controles polimórficos e historial
│       └── services/            # Cliente REST hacia /recepcion-bolsin y /documentaciones
└── README.md
```

---

## Cómo se implementa el Patrón State Académico

A diferencia de variantes donde el Contexto calcula el siguiente estado o los métodos de transición no reciben historial, esta implementación sigue estrictamente el diseño de la cátedra definido en `1.vista-estatica.puml` y `2.vista-dinamica.puml`:

1. **`Documentacion` (`<<Context>>`)** mantiene:
   - `estadoActual: EstadoDocumentacion` (inicializado en el constructor con `new Registrada()`).
   - `cambioEstado: CambioEstadoDocumentacion[]` (con el primer cambio creado al instanciarse).
   - Los 11 métodos públicos (`remitir`, `quitarDeRemito`, `asociarBolsin`, `desasociarBolsin`, `enviar`, `aceptar`, `rechazar`, `redirigir`, `noRecibir`, `darDeBaja`, `registrar`) con firma `(responsable: Empleado, fechaHoraActual: Date)`, delegando sin condicionales a `this.estadoActual.<metodo>(this, fechaHoraActual, this.cambioEstado, responsable)`.
   - Callbacks `setEstadoActual(estado)` y `agregarCambioEstado(cambioEstado)` invocados por el estado concreto.

2. **`EstadoDocumentacion` (`<<abstract>> <<State>>`)** define:
   - Implementación por defecto de los 11 métodos de transición lanzando `TransicionInvalidaError`.
   - `cambiarEstado(fechaHoraActual, historial, responsable)`: recorre el arreglo buscando el `CambioEstadoDocumentacion` donde `sosActual() === true` y le invoca `setFechaHoraFin(fechaHoraActual)`.
   - `crearCambioEstado(fechaHoraActual, estado, responsable)`: instancia el nuevo `CambioEstadoDocumentacion`.

3. **Los 9 Estados Concretos**:
   - `Registrada`, `EnRemito`, `EnBolsinSaliente`, `EnBolsinEnviado`, `NoRecibida`, `ParaRedirigir`, `RecibidaYRechazada`, `RecibidaYAceptada` (final) y `DeBaja` (final).
   - En `EnBolsinEnviado.aceptar(...)` se ejecuta la secuencia exacta del diagrama:
     `cambiarEstado(...)` → `crearEstado()` (`new RecibidaYAceptada()`) → `crearCambioEstado(...)` → `documentacion.setEstadoActual(...)` → `documentacion.agregarCambioEstado(...)`.

4. **Rediseño del Gestor en el CU 28**:
   - `GestorRegRecepBolsin` solo busca `EstadoBolsin` (`buscarEstadoRecibido()`) y `EstadoRemito` (`buscarEstadoRecibidoYAceptado()`). Ya no busca estados de `Documentacion`: delega al agregado `Bolsin.recibir(...)` → `Remito.recibirAceptar(...)` → `DetalleRemito.aceptarDocumentacion(...)` → `Documentacion.aceptar(...)`.

---

## Instalación, Tests y Ejecución

### Terminal 1 — Backend TypeScript (puerto 8080)

```bash
cd entrega-3/backend
pnpm install
pnpm run typecheck
pnpm run build
pnpm test
pnpm run dev
```

### Terminal 2 — Frontend React + Vite (puerto 3000)

```bash
cd entrega-3/front
pnpm install
pnpm run build
pnpm run dev
```

Luego abrí la aplicación en tu navegador (el proxy de Vite redirige `/recepcion-bolsin/*` y `/documentaciones/*` hacia `http://localhost:8080`):

- **`http://localhost:3000/`** — Aplicación limpia del caso de uso (**CU 28: Registrar recepción de bolsín**), sin ruido técnico ni trazas.
- **`http://localhost:3000/debug`** — Panel técnico de la **Entrega 3**: visualizador SVG interactivo del Patrón State, pruebas de polimorfismo (transiciones válidas e inválidas), historial `CambioEstadoDocumentacion`, traza del último CU 28 confirmado y reinicio de datos demo.
