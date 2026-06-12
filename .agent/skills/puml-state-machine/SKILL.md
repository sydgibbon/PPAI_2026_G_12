---
name: puml-state-machine
description: >-
  Guidelines and constraints for modeling PlantUML state machine diagrams,
  deriving states from the domain description, linking transitions to use cases
  and methods, and keeping the vista-analisis class diagram in sync.
---

# PlantUML State Machine Modeling Guidelines

## Overview
This skill defines the rules for creating and modifying PlantUML **state machine diagrams** (`@startuml` … `@enduml`) inside `entrega-n/` folders. It ensures states come exclusively from the domain description, transitions reference proper methods and use cases, and the class diagram (`1.vista-analisis.puml`) stays consistent.

## Dependencies
- **puml-modeling** — General PlantUML modeling guidelines (immutable domain model, naming conventions, consistency rules).

## Reference Files (always read before modifying a state machine)

| File | Role |
|---|---|
| `docs/descripcion_dominio.md` | **Sole source** for identifying states. |
| `docs/modelo_dominio_bolsines.puml` | Base domain model — the starting point of the system. **Never modify this file.** |
| `docs/listado_funcionalidad_sistema.md` | Use case catalog (number + name). |
| `entrega-n/1.vista-analisis.puml` | Delivery class diagram — where new methods are declared. |

> [!IMPORTANT]
> `docs/modelo_dominio_bolsines.puml` is the immutable starting point of the system. The `entrega-n/1.vista-analisis.puml` file extends it with additional methods needed for each delivery. This convention applies across all skills in this project.

---

## Rules

### 1. States — Source and Declaration

- **States MUST be identified exclusively from `docs/descripcion_dominio.md`.**
  Read the domain description to extract every state mentioned for the entity being modeled (e.g., *Registrada*, *En remito*, *En bolsín saliente*, etc.).
- **States are declared only — no descriptions are allowed.**
  Use the PlantUML `state` keyword with no body:
  ```plantuml
  state Registrada
  state EnRemito
  state EnBolsinSaliente
  ```
- **State names MUST be CamelCase** (PascalCase), with no spaces or underscores (e.g., `EnBolsinSaliente`, not `En Bolsin Saliente`).

### 2. Pseudostates

Every state machine diagram **must** include:
- An **initial pseudostate** (`[*] -->`) to mark the entry point.
- A **final pseudostate** (`--> [*]`) to mark terminal states.

**Pseudostate transitions must NOT have methods or use cases associated.**
```plantuml
[*] --> Registrada
RecibidaYAceptada --> [*]
DeBaja --> [*]
```

### 3. Transition Methods

- Every non-pseudostate transition **must** reference a method that describes the action being performed.
- Methods must be **descriptive of the transition/action** they represent. Examples of good method names:
  - `remitar()`, `cancelar()`, `asociarBolsin()`, `enviar()`, `aceptar()`, `rechazar()`, `redirigir()`
- **Using `setEstado()` as a transition method is NOT allowed** — it is not descriptive enough. Instead, create a method that describes the specific transition semantically.

### 4. Method Sourcing and Consistency

When identifying the method for a transition, follow this order:

1. **Check `docs/modelo_dominio_bolsines.puml` first.** If the domain model already defines a suitable method on the entity class, use it. If used, the method **must also be present** in `entrega-n/1.vista-analisis.puml` for the same class.
2. **If no suitable method exists in the domain model**, create a new descriptive method and **add it only to `entrega-n/1.vista-analisis.puml`**. Never modify `docs/modelo_dominio_bolsines.puml`.

> [!WARNING]
> If a method from the domain model is used in the state machine, verify it is declared in the delivery's `1.vista-analisis.puml`. If missing, add it there. The consistency checker will flag this as an error otherwise.

### 5. Transition Label Format

Every non-pseudostate transition label must follow this format:

```
N. UC Name /method()
```

Where:
- `N` is the use case number from `docs/listado_funcionalidad_sistema.md`
- `UC Name` is the use case name from the same file
- `method()` is the method invoked on the entity to perform the transition

**Example:**
```plantuml
Registrada --> EnRemito : 15. Generar Remito /remitar()
```

### 6. Conditional Transitions

A single method may transition to **more than one state** using guard conditions. Conditions must be written in **natural language Spanish** inside square brackets:

```plantuml
EnBolsinEnviado --> RecibidaYAceptada : 28. Registrar recepción de bolsín \n [Contenido coincide con lo registrado = SI] \n /aceptar()
EnBolsinEnviado --> NoRecibida : 28. Registrar recepción de bolsín \n [No se recibe toda la documentación asociada = SI] \n /noRecibir()
```

**Format for conditional labels:**
```
N. UC Name \n [Condición en lenguaje natural = SI] \n /method()
```

Use `\n` for line breaks to keep the diagram readable.

### 7. Pseudostate Transitions Are Bare

Initial and final pseudostate transitions **must not** include method names or use case references:

```plantuml
' ✅ Correct
[*] --> Registrada
DeBaja --> [*]

' ❌ Incorrect
[*] --> Registrada : 7. Registrar Documentación /new()
```

---

## Diagram Template

```plantuml
@startuml Maquina de Estados - [EntityName]

skinparam stateBorderColor DarkBlue
skinparam stateBackgroundColor White
skinparam arrowColor DarkBlue

' ========================
' STATES (from docs/descripcion_dominio.md — declaration only)
' ========================

state Estado1
state Estado2
state Estado3

' ========================
' TRANSITIONS
' ========================

[*] --> Estado1

Estado1 --> Estado2 : N. UC Name /method()
Estado2 --> Estado3 : N. UC Name \n [Condicion = SI] \n /method()

Estado3 --> [*]

@enduml
```

---

## Checklist (before finalizing)

- [ ] All states come from `docs/descripcion_dominio.md` only
- [ ] States are declared without descriptions (no body)
- [ ] Initial `[*] -->` and final `--> [*]` pseudostates exist
- [ ] Pseudostate transitions have no methods or use cases
- [ ] Every other transition has format `N. UC Name /method()`
- [ ] Methods are descriptive (`remitar()`, `aceptar()`, not `setEstado()`)
- [ ] Methods from `docs/modelo_dominio_bolsines.puml` are also present in `entrega-n/1.vista-analisis.puml`
- [ ] New methods (not in domain model) are added only to `entrega-n/1.vista-analisis.puml`
- [ ] Conditional transitions use `[Condición = SI]` format
- [ ] State names use CamelCase

## Common Mistakes
- **Using `setEstado()` as a transition method** — always use a descriptive action method instead.
- **Forgetting to sync methods with the vista-analisis** — if you reference `remitar()` from the domain model, it must appear on the entity class in `1.vista-analisis.puml`.
- **Adding state descriptions** — states must be declared bare, with no body content.
- **Adding methods to pseudostate transitions** — initial and final transitions are always bare arrows.
- **Inventing states not in the domain description** — every state must be traceable to `docs/descripcion_dominio.md`.
