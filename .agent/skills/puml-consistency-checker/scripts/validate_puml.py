#!/usr/bin/env python3
import os
import sys
import re
import json
import argparse
from typing import Dict, Set, List, Tuple, Optional

# Regex patterns for parsing PlantUML
class_header_re = re.compile(
    r'^class\s+"?([a-zA-Z0-9_.-]+)"?(?:\s+<<([a-zA-Z0-9_]+)>>)?(?:\s+#[a-zA-Z0-9_]+)?\s*(\{)?'
)
inline_member_re = re.compile(r'^([a-zA-Z0-9_.-]+)\s*:\s*(.*)')
participant_re = re.compile(
    r'^(actor|boundary|control|entity|participant)\s+(?:"([^"]+)"|([a-zA-Z0-9_.:-]+))(?:\s+as\s+([a-zA-Z0-9_.-]+))?'
)
message_re = re.compile(
    r'^([a-zA-Z0-9_.-]+)\s*(?:->|-->|->>)\s*([a-zA-Z0-9_.-]+)(?:\s*\*\*)?\s*:\s*(.*)'
)

# Relationships in class diagrams: ClassA ... ClassB
relationship_re = re.compile(
    r'^([a-zA-Z0-9_.-]+)\s+(?:"[^"]*"\s+)?(?:[-.]+>|[-.]{2,}|<[-.]+)\s+(?:"[^"]*"\s+)?([a-zA-Z0-9_.-]+)'
)

def clean_method_name(method_str: str) -> Optional[str]:
    # Remove formatting characters like //*//, bold, italics, stereotypes, etc.
    cleaned = re.sub(r'[/\\*]+', '', method_str).strip()
    cleaned = re.sub(r'<<[^>]+>>', '', cleaned).strip()
    
    # Find method name before (
    m = re.match(r'^([a-zA-Z0-9_ ]+)\s*\(', cleaned)
    if m:
        return m.group(1).strip()
    return None

def get_class_from_participant_name(name: str) -> str:
    name = name.strip('"')
    if ':' in name:
        parts = name.split(':')
        # e.g. logueado:Empleado -> Empleado, or :Empleado -> Empleado
        return parts[-1].strip()
    return name.strip()

class ClassData:
    def __init__(self, name: str, stereotype: Optional[str] = None):
        self.name = name
        self.stereotype = stereotype
        self.attributes: Set[str] = set()
        self.methods: Set[str] = set()

class DiagramParser:
    @staticmethod
    def parse_class_diagram(filepath: str) -> Dict[str, ClassData]:
        classes: Dict[str, ClassData] = {}
        current_class: Optional[ClassData] = None
        
        if not os.path.exists(filepath):
            return classes

        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line_str = line.strip()
                if not line_str or line_str.startswith("'"):
                    continue
                
                # Check for class header block start
                match_header = class_header_re.match(line_str)
                if match_header:
                    class_name = match_header.group(1)
                    stereotype = match_header.group(2)
                    has_bracket = match_header.group(3) == '{'
                    
                    if class_name not in classes:
                        classes[class_name] = ClassData(class_name, stereotype)
                    
                    if has_bracket:
                        current_class = classes[class_name]
                    continue
                
                # Check for block end
                if line_str == '}' and current_class:
                    current_class = None
                    continue
                
                # Check for inline member definitions: ClassName : member
                match_inline = inline_member_re.match(line_str)
                if match_inline:
                    class_name = match_inline.group(1)
                    member_def = match_inline.group(2).strip()
                    
                    if class_name not in classes:
                        classes[class_name] = ClassData(class_name)
                    
                    if '(' in member_def:
                        meth = clean_method_name(member_def)
                        if meth:
                            classes[class_name].methods.add(meth)
                    else:
                        # Attribute
                        attr_match = re.match(r'^([a-zA-Z0-9_]+)', member_def)
                        if attr_match:
                            classes[class_name].attributes.add(attr_match.group(1))
                    continue
                
                # Inside class block parsing
                if current_class:
                    if '(' in line_str:
                        meth = clean_method_name(line_str)
                        if meth:
                            current_class.methods.add(meth)
                    else:
                        attr_match = re.match(r'^([a-zA-Z0-9_]+)', line_str)
                        if attr_match:
                            current_class.attributes.add(attr_match.group(1))
                            
        return classes

    @staticmethod
    def parse_sequence_diagram(filepath: str) -> Tuple[Dict[str, str], Dict[str, Set[str]], List[Tuple[str, str, str]], Set[str]]:
        # Maps participant alias -> class name
        alias_to_class: Dict[str, str] = {}
        # Methods invoked per class
        class_methods: Dict[str, Set[str]] = {}
        # Message list: (source_class, target_class, method_name)
        messages: List[Tuple[str, str, str]] = []
        # Actor classes to ignore in software class diagram checks
        actor_classes: Set[str] = set()
        
        if not os.path.exists(filepath):
            return alias_to_class, class_methods, messages, actor_classes

        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line_str = line.strip()
                if not line_str or line_str.startswith("'"):
                    continue
                
                # Parse participant/actor declarations
                match_part = participant_re.match(line_str)
                if match_part:
                    ptype = match_part.group(1)
                    pname = match_part.group(2) or match_part.group(3)
                    alias = match_part.group(4) or pname
                    
                    class_name = get_class_from_participant_name(pname)
                    alias_to_class[alias] = class_name
                    if ptype == 'actor':
                        actor_classes.add(class_name)
                    continue
                
                # Parse message transmissions
                match_msg = message_re.match(line_str)
                if match_msg:
                    source_alias = match_msg.group(1)
                    target_alias = match_msg.group(2)
                    msg_content = match_msg.group(3)
                    
                    method_name = clean_method_name(msg_content)
                    if method_name:
                        # Resolve alias classes
                        source_class = alias_to_class.get(source_alias, source_alias)
                        target_class = alias_to_class.get(target_alias, target_alias)
                        
                        if target_class not in class_methods:
                            class_methods[target_class] = set()
                        class_methods[target_class].add(method_name)
                        messages.append((source_class, target_class, method_name))
                        
        return alias_to_class, class_methods, messages, actor_classes


def find_similar_names(name: str, options: List[str]) -> List[str]:
    # Simple similarity check: substring match or lowercased match
    similar = []
    name_lower = name.lower().replace('_', '').replace('-', '')
    for opt in options:
        opt_lower = opt.lower().replace('_', '').replace('-', '')
        if name_lower in opt_lower or opt_lower in name_lower:
            similar.append(opt)
    return similar


def validate(docs_dir: str, entrega_dir: str) -> Dict[str, List[str]]:
    discrepancies: List[str] = []
    warnings: List[str] = []
    
    # 1. Parse Domain Model in Docs
    docs_classes: Dict[str, ClassData] = {}
    if os.path.exists(docs_dir):
        for filename in os.listdir(docs_dir):
            if filename.endswith('.puml'):
                path = os.path.join(docs_dir, filename)
                docs_classes.update(DiagramParser.parse_class_diagram(path))
    
    # Identify domain entity names
    entity_names = set(docs_classes.keys())
    
    # 2. Find PUML files in target entrega folder
    if not os.path.exists(entrega_dir):
        discrepancies.append(f"Directory not found: {entrega_dir}")
        return {"errors": discrepancies, "warnings": warnings}
        
    puml_files = [os.path.join(entrega_dir, f) for f in os.listdir(entrega_dir) if f.endswith('.puml')]
    
    # Separate class diagrams from sequence diagrams
    class_diagrams: List[str] = []
    sequence_diagrams: List[str] = []
    state_machines: List[str] = []
    
    for filepath in puml_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'class ' in content:
                class_diagrams.append(filepath)
            elif 'actor ' in content or 'boundary ' in content or 'control ' in content or 'entity ' in content:
                sequence_diagrams.append(filepath)
            elif 'state ' in content or '[*]' in content:
                state_machines.append(filepath)
                
    # Parse state machines to find referenced transition methods
    state_machine_methods: Set[str] = set()
    transition_method_re = re.compile(r'/([a-zA-Z0-9_]+)\s*(?:\(\))?')
    for sm in state_machines:
        with open(sm, 'r', encoding='utf-8') as f:
            for line in f:
                line_str = line.strip()
                if not line_str or line_str.startswith("'"):
                    continue
                # Extract methods from state transition actions
                matches = transition_method_re.findall(line_str)
                for match in matches:
                    state_machine_methods.add(match)
                
    # 3. Parse diagrams inside the delivery folder
    delivery_classes: Dict[str, ClassData] = {}
    for cd in class_diagrams:
        delivery_classes.update(DiagramParser.parse_class_diagram(cd))
        
    seq_alias_to_class: Dict[str, str] = {}
    seq_class_methods: Dict[str, Set[str]] = {}
    seq_messages: List[Tuple[str, str, str]] = []
    seq_actors: Set[str] = set()
    for sd in sequence_diagrams:
        aliases, methods, msgs, actors = DiagramParser.parse_sequence_diagram(sd)
        seq_alias_to_class.update(aliases)
        seq_messages.extend(msgs)
        seq_actors.update(actors)
        for cls, meths in methods.items():
            if cls not in seq_class_methods:
                seq_class_methods[cls] = set()
            seq_class_methods[cls].update(meths)
            
    # All classes active/referenced in the sequence diagram
    seq_classes = set(seq_alias_to_class.values())
    
    # 4. Check 1: Entity classes consistency with docs/ and class diagram
    # Validate attributes defined in local class diagram on domain entities
    for class_name, c_data in delivery_classes.items():
        if class_name in entity_names:
            doc_c = docs_classes[class_name]
            for attr in c_data.attributes:
                if attr not in doc_c.attributes:
                    discrepancies.append(
                        f"Domain Entity Violation: Class '{class_name}' in class diagram defines attribute '{attr}' "
                        f"which does not exist in the domain model '{docs_dir}'."
                    )
            # Extra methods are allowed in delivery class diagram, so we do NOT check methods here.

    # Check CamelCase class names and spaces in methods
    for cls in (set(delivery_classes.keys()) | seq_classes):
        if cls.startswith("29 ") or cls.endswith("CU") or cls.lower() in ("actor", "boundary", "control", "entity", "participant"):
            continue
        if not re.match(r'^[A-Z][a-zA-Z0-9]*$', cls):
            discrepancies.append(
                f"Naming Violation: Class name '{cls}' must be in CamelCase (PascalCase) and start with an uppercase letter."
            )

    for target_class, methods in seq_class_methods.items():
        for meth in methods:
            if ' ' in meth:
                discrepancies.append(
                    f"Method Naming Violation: Method '{meth}()' called on '{target_class}' contains spaces. Spaces must be removed."
                )

    for class_name, c_data in delivery_classes.items():
        for meth in c_data.methods:
            if ' ' in meth:
                discrepancies.append(
                    f"Method Naming Violation: Method '{meth}()' defined on class '{class_name}' in class diagram contains spaces."
                )

    # Validate method calls in sequence diagram on domain entities
    for class_name, methods in seq_class_methods.items():
        if class_name in entity_names:
            doc_c = docs_classes[class_name]
            for meth in methods:
                # If the entity is declared in the local class diagram, the method must be defined there.
                # If not declared in local class diagram (omitted), it must exist in the domain model.
                if class_name in delivery_classes:
                    local_c = delivery_classes[class_name]
                    if meth not in local_c.methods:
                        discrepancies.append(
                            f"Method Mismatch: Method '{meth}()' is called on domain entity '{class_name}' in sequence diagram "
                            f"but is not defined in the local class diagram."
                        )
                else:
                    if meth not in doc_c.methods:
                        discrepancies.append(
                            f"Domain Entity Violation: Sequence diagram calls method '{meth}()' on domain entity '{class_name}' "
                            f"(omitted from class diagram) which does not exist in the domain model '{docs_dir}'."
                        )

    # 5. Check 2: Naming consistency between sequence diagram and class diagram
    # Focus on non-entity classes (boundaries and controls) which are defined locally
    # Find classes in sequence diagram that are not defined in class diagram
    for seq_class in seq_classes:
        # Ignore use cases/actors like "29 Notificar Recepción de Bolsin" or specific human actors
        if seq_class.startswith("29 ") or seq_class.endswith("CU") or seq_class.lower() == "actor" or seq_class in seq_actors:
            continue
            
        if seq_class not in delivery_classes:
            # If it is a known domain entity, it's fine to omit it from the class diagram
            if seq_class in entity_names:
                continue
                
            # If it's a boundary or control class, this is a discrepancy!
            similar = find_similar_names(seq_class, list(delivery_classes.keys()))
            sim_str = f" (did you mean: {', '.join(similar)}?)" if similar else ""
            discrepancies.append(
                f"Class Name Discrepancy: Class '{seq_class}' is used in the sequence diagram "
                f"but is not declared in the class diagram{sim_str}."
            )
            
    # Conversely, check if non-entity classes in the class diagram are missing from the sequence diagram
    for del_class in delivery_classes.keys():
        if del_class not in entity_names:
            if del_class not in seq_classes:
                warnings.append(
                    f"Class '{del_class}' is defined in the class diagram but never referenced in the sequence diagram."
                )

    # 6. Check 3: Method calls consistency between sequence diagram and class diagram
    for target_class, methods in seq_class_methods.items():
        if target_class in delivery_classes:
            del_c = delivery_classes[target_class]
            for meth in methods:
                # Check for exact match
                if meth not in del_c.methods:
                    # Check if there is a spelling/casing match
                    similar = [m for m in del_c.methods if m.lower().replace(' ', '') == meth.lower().replace(' ', '')]
                    if similar:
                        discrepancies.append(
                            f"Method Mismatch: Method '{meth}()' is called on class '{target_class}' in sequence diagram "
                            f"but it is defined as '{similar[0]}()' in the class diagram."
                        )
                    else:
                        discrepancies.append(
                            f"Method Mismatch: Method '{meth}()' is called on class '{target_class}' in sequence diagram "
                            f"but is not defined on '{target_class}' in the class diagram."
                        )
                        
    # 7. Check 4: Unused methods (defined in class diagram but never called/used in sequence or state machine diagrams)
    for class_name, c_data in delivery_classes.items():
        if class_name in seq_actors:
            continue
        for meth in c_data.methods:
            if meth == 'new':
                continue
            is_used_in_seq = class_name in seq_class_methods and meth in seq_class_methods[class_name]
            is_used_in_sm = meth in state_machine_methods
            if not is_used_in_seq and not is_used_in_sm:
                discrepancies.append(
                    f"Unused Method: Method '{meth}()' of class '{class_name}' is defined in the class diagram "
                    f"but is never used in the sequence diagrams or state machine diagrams."
                )
                        
    return {"errors": discrepancies, "warnings": warnings}


def main():
    parser = argparse.ArgumentParser(description="Check consistency of PlantUML files.")
    parser.add_argument("--dir", required=True, help="Directory containing delivery PUML files")
    parser.add_argument("--docs", default="docs", help="Directory containing domain model PUML files")
    parser.add_argument("--output", help="Save report to JSON file")
    
    args = parser.parse_args()
    
    result = validate(args.docs, args.dir)
    
    errors = result["errors"]
    warnings = result["warnings"]
    
    # Print results
    print("=" * 60)
    print(f"PlantUML Consistency Check Report for: {args.dir}")
    print(f"Comparing against Domain Model in: {args.docs}")
    print("=" * 60)
    
    if errors:
        print(f"\033[91mFound {len(errors)} consistency errors:\033[0m")
        for i, err in enumerate(errors, 1):
            print(f" {i}. \033[91m[ERROR]\033[0m {err}")
    else:
        print("\033[92mNo consistency errors found!\033[0m")
        
    print()
    if warnings:
        print(f"\033[93mFound {len(warnings)} warnings:\033[0m")
        for i, warn in enumerate(warnings, 1):
            print(f" {i}. \033[93m[WARNING]\033[0m {warn}")
            
    print("=" * 60)
    
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)
        print(f"Report saved to: {args.output}")
        
    if errors:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == '__main__':
    main()
