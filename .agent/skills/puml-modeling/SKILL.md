---
name: puml-modeling
description: >-
  Guidelines and constraints for modeling PlantUML class and sequence diagrams,
  ensuring they respect the domain model in docs/ and maintain consistency.
---

# PlantUML Modeling Guidelines

## Overview
This skill outlines the rules and guidelines for creating and modifying PlantUML class and sequence diagrams under `entrega-n/` folders. It ensures that delivery diagrams are aligned with the immutable domain model defined in `docs/` and are internally consistent.

## Dependencies
None.

## Quick Start
Consult these guidelines before making any changes or additions to `.puml` files in the project.

## Modeling Guidelines and Constraints

### 1. The Domain Model is Immutable
- The `docs/` folder contains the domain model (e.g., `docs/modelo_dominio_bolsines.puml`), which is the single source of truth for all domain entities.
- **NEVER** overwrite or edit files inside the `docs/` folder (unless explicitly requested by the user to fix a transcription error from the SOT).
- Any entity class utilized in an `entrega-n/` diagram must match its definition in `docs/`. However, you are **allowed to add new methods** not present in the domain model to these entity classes, provided they are explicitly declared in the corresponding `entrega-n/` class diagram.
- > [!IMPORTANT]
  > **Method and Attribute Removal Criteria**:
  > - The domain model in `docs/` is the reference for the base attributes and methods that MUST be included in the delivery diagrams (if the class is present).
  > - However, the domain model is NOT justification to remove additional methods or attributes from delivery diagrams (`entrega-n/`).
  > - Instead, the sole evidence to remove or keep a method/attribute in a delivery class diagram is whether it is used in that delivery's other diagrams (e.g., sequence diagrams or state machines). If a method or attribute is NOT used in the diagrams within the `entrega-n` folder, it MUST be removed. If it is used, it MUST be kept, even if it does not exist in `docs/`.

### 2. Participant Members and Omission
- Diagrams in `entrega-n/` do not need to show all classes or all attributes/methods of a class. It is expected to only include the participant members of the specific functionality being described.
- Classes from the domain model that do not participate in the functionality can be omitted entirely.

### 3. Non-Entity Classes
- Non-entity classes (e.g. boundary classes like screens/menus, control classes like use case gestores, or session-related classes) can be added freely in the `entrega-n/` diagrams.
- These classes do not need to exist in the `docs/` folder.

### 4. Folder-Level Consistency
All `.puml` files in the same `entrega-n/` directory must be perfectly consistent.
- **Class Names**: Use exact matching names across diagrams. Class names must be written in **CamelCase** (PascalCase, e.g., `GestorRegRecepBolsin`, `CambioEstadoDocumentacion`). Avoid lowercase names like `cambioEstadoDocumentacion`.
- **Methods and Attributes**: Every method call depicted in a sequence diagram must be declared on the target class in the corresponding class diagram (or defined in `docs/` for domain entities if omitted from the local class diagram).
- **Naming Style**: Maintain identical casing and characters. Method names **must not contain spaces** (e.g., write `esAmbitoRemito()` instead of `es AmbitoRemito()`). Mismatches such as `esTuCMdestino` vs `esTuCMDestino` are discrepancies and must be avoided.

## Common Mistakes
- **Method Discrepancy on Domain Entities**: Inventing helper methods on domain entities (like `esTuUsuario()` on `Empleado` or `getCMOrigen()` on `Bolsin`) instead of navigating relationships or using the existing API defined in `docs/`.
- **Controller/Boundary Renaming**: Using different names for control/boundary classes in sequence diagrams vs. class diagrams.
- **Typographical Mismatches**: Subtle casing differences or including spaces in method names in sequence diagrams.
