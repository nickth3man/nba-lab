#!/usr/bin/env python3
"""
JSON Schema Validator for NBA Graph Data

Validates nodes and edges JSON files against their respective JSON schemas.
"""

import argparse
import json
import sys
from pathlib import Path

from jsonschema import Draft7Validator


def validate_nodes(json_path: Path, schema_path: Path) -> tuple[bool, list[str]]:
    with open(schema_path) as f:
        schema = json.load(f)

    with open(json_path) as f:
        data = json.load(f)

    validator = Draft7Validator(schema)
    errors = [str(e.message) for e in validator.iter_errors(data)]
    return len(errors) == 0, errors


def validate_edges(json_path: Path, schema_path: Path) -> tuple[bool, list[str]]:
    with open(schema_path) as f:
        schema = json.load(f)

    with open(json_path) as f:
        data = json.load(f)

    validator = Draft7Validator(schema)
    errors = [str(e.message) for e in validator.iter_errors(data)]
    return len(errors) == 0, errors


def main():
    parser = argparse.ArgumentParser(
        description="Validate NBA graph JSON files against schemas"
    )
    parser.add_argument("--nodes", type=str, help="Path to nodes JSON file")
    parser.add_argument("--edges", type=str, help="Path to edges JSON file")
    parser.add_argument(
        "--nodes-schema",
        type=str,
        default="schemas/nodes.schema.json",
        help="Path to nodes schema",
    )
    parser.add_argument(
        "--edges-schema",
        type=str,
        default="schemas/edges.schema.json",
        help="Path to edges schema",
    )
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")

    args = parser.parse_args()

    project_root = Path(__file__).parent.parent
    nodes_schema_path = project_root / args.nodes_schema
    edges_schema_path = project_root / args.edges_schema

    success = True

    if args.nodes:
        nodes_path = project_root / args.nodes
        valid, errors = validate_nodes(nodes_path, nodes_schema_path)
        if valid:
            print(f"[PASS] Nodes validation passed: {nodes_path}")
        else:
            print(f"[FAIL] Nodes validation failed: {nodes_path}")
            for err in errors:
                print(f"  - {err}")
            success = False

    if args.edges:
        edges_path = project_root / args.edges
        valid, errors = validate_edges(edges_path, edges_schema_path)
        if valid:
            print(f"[PASS] Edges validation passed: {edges_path}")
        else:
            print(f"[FAIL] Edges validation failed: {edges_path}")
            for err in errors:
                print(f"  - {err}")
            success = False

    if args.verbose and success:
        print("All validations passed!")

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
