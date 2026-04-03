"""
JSON Export for NBA Teammate Graph

Exports graph data to JSON files with schema validation.
"""

import gzip
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "db" / "nba_raw_data.db"
SCHEMAS_DIR = Path(__file__).parent.parent / "schemas"
DATA_DIR = Path(__file__).parent.parent / "data"


def normalize_edge_size(weight, min_weight=1.0, max_weight=20.0):
    """Normalize edge weight to size in range [0.1, 5]."""
    if weight <= min_weight:
        return 0.1
    if weight >= max_weight:
        return 5.0
    normalized = (weight - min_weight) / (max_weight - min_weight)
    return 0.1 + normalized * 4.9


def export_graph_data(G, metrics, layout):
    """Export graph data to JSON files.

    Args:
        G: NetworkX Graph with player nodes
        metrics: dict from compute_centrality(G)
        layout: dict from compute_layout(G)

    Returns:
        dict: metadata about the export
    """
    nodes = []
    edges = []

    min_weight = float("inf")
    max_weight = float("-inf")
    for u, v, data in G.edges(data=True):
        weight = data.get("weight", 1)
        min_weight = min(min_weight, weight)
        max_weight = max(max_weight, weight)

    for node_id in G.nodes():
        node_data = G.nodes[node_id]

        x = layout.get(node_id, {}).get("x", 0.0)
        y = layout.get(node_id, {}).get("y", 0.0)
        size = layout.get(node_id, {}).get("size", 5.0)
        color = layout.get(node_id, {}).get("color", "#808080")
        community = layout.get(node_id, {}).get("community", -1)

        node_metrics = metrics.get(node_id, {})
        degree = node_metrics.get("degree", 0)
        betweenness = node_metrics.get("betweenness", 0.0)

        nodes.append(
            {
                "id": node_id,
                "label": node_data.get("label", ""),
                "x": float(x),
                "y": float(y),
                "size": float(size),
                "color": color,
                "position": node_data.get("position", "Unknown"),
                "era": node_data.get("era", "Unknown"),
                "is_active": node_data.get("is_active", False),
                "hof": node_data.get("hof", False),
                "draft_year": node_data.get("draft_year"),
                "degree": int(degree * G.degree(node_id)) if isinstance(degree, float) else degree,
                "betweenness": float(betweenness),
                "community": int(community),
            }
        )

    for u, v, data in G.edges(data=True):
        source = min(u, v)
        target = max(u, v)

        weight = data.get("weight", 1)
        size = normalize_edge_size(weight, min_weight, max_weight)

        edges.append(
            {
                "id": f"{source}--{target}",
                "source": source,
                "target": target,
                "weight": float(weight),
                "teams": data.get("teams", []),
                "total_days": int(data.get("total_days", 0)),
                "size": size,
            }
        )

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    nodes_path = DATA_DIR / "nodes.json"
    edges_path = DATA_DIR / "edges.json"
    metadata_path = DATA_DIR / "metadata.json"

    with open(nodes_path, "w") as f:
        json.dump(nodes, f)

    with open(edges_path, "w") as f:
        json.dump(edges, f)

    nodes_bytes = nodes_path.stat().st_size
    edges_bytes = edges_path.stat().st_size
    total_bytes = nodes_bytes + edges_bytes

    metadata = {
        "exported_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "node_count": len(nodes),
        "edge_count": len(edges),
        "file_sizes": {
            "nodes_bytes": nodes_bytes,
            "edges_bytes": edges_bytes,
            "total_bytes": total_bytes,
            "total_mb": round(total_bytes / 1024 / 1024, 2),
        },
        "weight_range": {"min": int(min_weight), "max": int(max_weight)},
    }

    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Exported {len(nodes)} nodes to {nodes_path}")
    print(f"Exported {len(edges)} edges to {edges_path}")
    print(f"Metadata written to {metadata_path}")
    print(f"Total JSON size: {total_bytes / 1024 / 1024:.2f} MB")

    valid, errors = validate_output()
    if valid:
        print("[PASS] Schema validation passed")
    else:
        print("[FAIL] Schema validation failed:")
        for err in errors[:10]:
            print(f"  - {err}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more errors")

    return metadata


def validate_output():
    """Validate exported JSON against schemas."""
    from jsonschema import Draft7Validator

    nodes_path = DATA_DIR / "nodes.json"
    edges_path = DATA_DIR / "edges.json"

    with open(SCHEMAS_DIR / "nodes.schema.json") as f:
        nodes_schema = json.load(f)
    with open(SCHEMAS_DIR / "edges.schema.json") as f:
        edges_schema = json.load(f)

    with open(nodes_path) as f:
        nodes_data = json.load(f)
    with open(edges_path) as f:
        edges_data = json.load(f)

    nodes_validator = Draft7Validator(nodes_schema)
    edges_validator = Draft7Validator(edges_schema)

    nodes_errors = [str(e.message) for e in nodes_validator.iter_errors(nodes_data)]
    edges_errors = [str(e.message) for e in edges_validator.iter_errors(edges_data)]

    all_errors = nodes_errors + edges_errors
    return len(all_errors) == 0, all_errors


def estimate_gzipped_size():
    """Estimate gzipped size of JSON files."""
    nodes_path = DATA_DIR / "nodes.json"
    edges_path = DATA_DIR / "edges.json"

    total_gzipped = 0
    for path in [nodes_path, edges_path]:
        with open(path, "rb") as f:
            gzipped = gzip.compress(f.read())
        total_gzipped += len(gzipped)
        print(f"{path.name}: {len(gzipped) / 1024 / 1024:.2f} MB gzipped")

    print(f"Total gzipped: {total_gzipped / 1024 / 1024:.2f} MB")
    return total_gzipped


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).parent))

    print("Building graph...")
    from build_graph import build_graph

    G = build_graph()
    print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    print("Computing metrics...")
    from compute_metrics import compute_centrality

    metrics = compute_centrality(G)

    print("Computing layout...")
    from compute_layout import compute_layout

    layout = compute_layout(G)

    print("Exporting to JSON...")
    metadata = export_graph_data(G, metrics, layout)

    print("\nEstimating gzipped size...")
    estimate_gzipped_size()
