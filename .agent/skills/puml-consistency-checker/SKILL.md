---
name: puml-consistency-checker
description: >-
  Validates consistency between PlantUML class diagrams, sequence diagrams,
  and domain models within a delivery folder (entrega-n).
---

# PlantUML Consistency Checker

## Overview
This skill programmatically reviews consistency between all PlantUML files inside an `entrega-n/` folder, checking class names, attributes, methods, and relationships. It also ensures that any domain entities used in delivery folders do not violate the immutable domain model defined in `docs/`.

## Dependencies
None.

## Quick Start
To run the consistency checker on a specific delivery directory:
```bash
uv run .agent/skills/puml-consistency-checker/scripts/validate_puml.py --dir entrega-1
```

## Utility Scripts
The validation script is located at `scripts/validate_puml.py`.

### Script Options
* `--dir` (Required): Absolute or relative path to the delivery directory to validate (e.g., `entrega-1`).
* `--docs` (Optional): Path to the domain model directory (defaults to `docs`).
* `--output` (Optional): Path to a JSON file where the verification output report should be saved.

### Output format
The script prints a human-readable list of errors and warning messages detailing:
1. **Class Name Discrepancies**: Non-entity or entity classes present in one diagram but named differently or missing in another.
2. **Missing Methods or Attributes**: Methods invoked in sequence diagrams but not declared in the class diagram (or in the domain model for entities).
3. **Domain Entity Violations**: Fields or methods added to domain entities in the delivery files that are not defined in the immutable domain model.
