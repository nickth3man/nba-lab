"""
TDD Tests for JSON Export + Schema Validation

Tests export_graph_data(G, metrics, layout) function that:
- Combines graph nodes, edges, metrics, and layout into GraphData format
- Exports to data/nodes.json, data/edges.json
- Exports metadata to data/metadata.json
- Runs schema validation against schemas
- Reports file sizes (must be <50MB gzipped total)

Edge id format: "{source}--{target}" (alphabetically ordered)
Edge size: derived from weight (normalize weight to 0.1-5 range)
"""

import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data"
SCHEMAS_DIR = PROJECT_ROOT / "schemas"


class TestNodeExport:
    """Test that nodes are exported correctly."""

    def test_nodes_file_exists(self):
        """data/nodes.json should exist after export."""
        nodes_path = DATA_DIR / "nodes.json"
        assert nodes_path.exists(), f"nodes.json not found at {nodes_path}"

    def test_nodes_file_is_valid_json(self):
        """nodes.json should be valid JSON."""
        nodes_path = DATA_DIR / "nodes.json"
        with open(nodes_path) as f:
            data = json.load(f)
        assert isinstance(data, list), "nodes.json should contain an array"

    def test_nodes_count_matches_graph(self, nba_graph):
        """Number of exported nodes should match graph node count."""
        nodes_path = DATA_DIR / "nodes.json"
        with open(nodes_path) as f:
            nodes = json.load(f)
        assert len(nodes) == nba_graph.number_of_nodes(), (
            f"Expected {nba_graph.number_of_nodes()} nodes, got {len(nodes)}"
        )

    def test_each_node_has_required_fields(self):
        """Each node should have all required fields per schema."""
        nodes_path = DATA_DIR / "nodes.json"
        with open(nodes_path) as f:
            nodes = json.load(f)

        required_fields = [
            "id",
            "label",
            "x",
            "y",
            "size",
            "color",
            "position",
            "era",
            "is_active",
            "hof",
            "degree",
            "betweenness",
            "community",
        ]

        for node in nodes:
            for field in required_fields:
                assert field in node, f"Node {node.get('id', 'unknown')} missing field: {field}"

    def test_node_id_is_string(self):
        """Node id should be a string."""
        nodes_path = DATA_DIR / "nodes.json"
        with open(nodes_path) as f:
            nodes = json.load(f)

        for node in nodes:
            assert isinstance(node["id"], str), f"Node id should be string, got {type(node['id'])}"

    def test_node_label_is_string(self):
        """Node label should be a string."""
        nodes_path = DATA_DIR / "nodes.json"
        with open(nodes_path) as f:
            nodes = json.load(f)

        for node in nodes:
            assert isinstance(node["label"], str), "Node label should be string"

    def test_node_coordinates_are_numeric(self):
        """Node x, y should be numeric."""
        nodes_path = DATA_DIR / "nodes.json"
        with open(nodes_path) as f:
            nodes = json.load(f)

        for node in nodes:
            assert isinstance(node["x"], (int, float)), f"Node {node['id']} x should be numeric"
            assert isinstance(node["y"], (int, float)), f"Node {node['id']} y should be numeric"

    def test_node_color_is_valid_hex(self):
        """Node color should be valid hex color."""
        nodes_path = DATA_DIR / "nodes.json"
        with open(nodes_path) as f:
            nodes = json.load(f)

        for node in nodes:
            color = node["color"]
            assert isinstance(color, str), "Node color should be string"
            assert color.startswith("#"), "Node color should start with #"
            assert len(color) == 7, "Node color should be 7 chars (e.g., #RRGGBB)"

    def test_node_boolean_fields(self):
        """Node is_active and hof should be booleans."""
        nodes_path = DATA_DIR / "nodes.json"
        with open(nodes_path) as f:
            nodes = json.load(f)

        for node in nodes:
            assert isinstance(node["is_active"], bool), "Node is_active should be boolean"
            assert isinstance(node["hof"], bool), "Node hof should be boolean"

    def test_node_centrality_values_in_range(self):
        """Node degree, betweenness should be in valid range."""
        nodes_path = DATA_DIR / "nodes.json"
        with open(nodes_path) as f:
            nodes = json.load(f)

        for node in nodes:
            assert node["degree"] >= 0, "Node degree should be >= 0"
            assert 0 <= node["betweenness"] <= 1, "Node betweenness should be between 0 and 1"


class TestEdgeExport:
    """Test that edges are exported correctly."""

    def test_edges_file_exists(self):
        """data/edges.json should exist after export."""
        edges_path = DATA_DIR / "edges.json"
        assert edges_path.exists(), f"edges.json not found at {edges_path}"

    def test_edges_file_is_valid_json(self):
        """edges.json should be valid JSON."""
        edges_path = DATA_DIR / "edges.json"
        with open(edges_path) as f:
            data = json.load(f)
        assert isinstance(data, list), "edges.json should contain an array"

    def test_edges_count_matches_graph(self, nba_graph):
        """Number of exported edges should match graph edge count."""
        edges_path = DATA_DIR / "edges.json"
        with open(edges_path) as f:
            edges = json.load(f)
        assert len(edges) == nba_graph.number_of_edges(), (
            f"Expected {nba_graph.number_of_edges()} edges, got {len(edges)}"
        )

    def test_each_edge_has_required_fields(self):
        """Each edge should have all required fields per schema."""
        edges_path = DATA_DIR / "edges.json"
        with open(edges_path) as f:
            edges = json.load(f)

        required_fields = ["id", "source", "target", "weight", "teams", "total_days", "size"]

        for edge in edges:
            for field in required_fields:
                assert field in edge, f"Edge {edge.get('id', 'unknown')} missing field: {field}"

    def test_edge_id_format(self):
        """Edge id should be '{source}--{target}' alphabetically ordered."""
        edges_path = DATA_DIR / "edges.json"
        with open(edges_path) as f:
            edges = json.load(f)

        for edge in edges:
            edge_id = edge["id"]
            source, target = edge["source"], edge["target"]
            expected_id = f"{min(source, target)}--{max(source, target)}"
            assert edge_id == expected_id, f"Edge id should be '{expected_id}', got '{edge_id}'"

    def test_edge_size_in_range(self):
        """Edge size should be in range 0.1-5 (normalized from weight)."""
        edges_path = DATA_DIR / "edges.json"
        with open(edges_path) as f:
            edges = json.load(f)

        for edge in edges:
            size = edge["size"]
            assert 0.1 <= size <= 5, f"Edge {edge['id']} size={size} outside range [0.1, 5]"

    def test_edge_weight_is_positive(self):
        """Edge weight should be non-negative."""
        edges_path = DATA_DIR / "edges.json"
        with open(edges_path) as f:
            edges = json.load(f)

        for edge in edges:
            assert edge["weight"] >= 0, f"Edge {edge['id']} weight should be >= 0"

    def test_edge_teams_is_array(self):
        """Edge teams should be an array."""
        edges_path = DATA_DIR / "edges.json"
        with open(edges_path) as f:
            edges = json.load(f)

        for edge in edges:
            assert isinstance(edge["teams"], list), f"Edge {edge['id']} teams should be an array"

    def test_edge_teams_have_required_fields(self):
        """Each team tenure should have required fields."""
        edges_path = DATA_DIR / "edges.json"
        with open(edges_path) as f:
            edges = json.load(f)

        team_required = ["team_id", "team_name", "team_abbreviation", "seasons", "overlap_days"]

        for edge in edges:
            for team in edge["teams"]:
                for field in team_required:
                    assert field in team, f"Edge {edge['id']} team missing field: {field}"


class TestMetadataExport:
    """Test that metadata is exported correctly."""

    def test_metadata_file_exists(self):
        """data/metadata.json should exist after export."""
        metadata_path = DATA_DIR / "metadata.json"
        assert metadata_path.exists(), f"metadata.json not found at {metadata_path}"

    def test_metadata_file_is_valid_json(self):
        """metadata.json should be valid JSON."""
        metadata_path = DATA_DIR / "metadata.json"
        with open(metadata_path) as f:
            data = json.load(f)
        assert isinstance(data, dict), "metadata.json should contain an object"

    def test_metadata_contains_export_info(self):
        """metadata.json should contain export information."""
        metadata_path = DATA_DIR / "metadata.json"
        with open(metadata_path) as f:
            metadata = json.load(f)

        # Should have at least these fields
        assert "node_count" in metadata, "metadata should contain node_count"
        assert "edge_count" in metadata, "metadata should contain edge_count"
        assert "file_sizes" in metadata, "metadata should contain file_sizes"


class TestSchemaValidation:
    """Test that exported JSON passes schema validation."""

    def test_nodes_pass_schema_validation(self):
        """nodes.json should pass schema validation."""
        from jsonschema import Draft7Validator

        nodes_path = DATA_DIR / "nodes.json"
        schema_path = SCHEMAS_DIR / "nodes.schema.json"

        with open(schema_path) as f:
            schema = json.load(f)

        with open(nodes_path) as f:
            nodes = json.load(f)

        validator = Draft7Validator(schema)
        errors = [str(e.message) for e in validator.iter_errors(nodes)]

        assert len(errors) == 0, "Nodes schema validation failed:\n" + "\n".join(errors)

    def test_edges_pass_schema_validation(self):
        """edges.json should pass schema validation."""
        from jsonschema import Draft7Validator

        edges_path = DATA_DIR / "edges.json"
        schema_path = SCHEMAS_DIR / "edges.schema.json"

        with open(schema_path) as f:
            schema = json.load(f)

        with open(edges_path) as f:
            edges = json.load(f)

        validator = Draft7Validator(schema)
        errors = [str(e.message) for e in validator.iter_errors(edges)]

        assert len(errors) == 0, "Edges schema validation failed:\n" + "\n".join(errors)


class TestFileSizeBudget:
    """Test that total file size is within budget."""

    def test_total_json_size_within_budget(self):
        """Total JSON size should be under 50MB (raw)."""
        nodes_path = DATA_DIR / "nodes.json"
        edges_path = DATA_DIR / "edges.json"

        nodes_size = os.path.getsize(nodes_path)
        edges_size = os.path.getsize(edges_path)
        total_size = nodes_size + edges_size

        max_size = 50 * 1024 * 1024  # 50MB

        assert total_size < max_size, f"Total JSON size {total_size / 1024 / 1024:.1f}MB exceeds budget of 50MB"

    def test_file_sizes_reported(self):
        """File sizes should be reported in metadata."""
        metadata_path = DATA_DIR / "metadata.json"
        with open(metadata_path) as f:
            metadata = json.load(f)

        assert "file_sizes" in metadata, "metadata should contain file_sizes"

        file_sizes = metadata["file_sizes"]
        assert "nodes_bytes" in file_sizes, "file_sizes should contain nodes_bytes"
        assert "edges_bytes" in file_sizes, "file_sizes should contain edges_bytes"
        assert "total_bytes" in file_sizes, "file_sizes should contain total_bytes"


class TestGraphDataIntegrity:
    """Test that exported data maintains graph integrity."""

    def test_all_node_ids_match_graph(self, nba_graph):
        """All node IDs in export should exist in graph."""
        nodes_path = DATA_DIR / "nodes.json"
        with open(nodes_path) as f:
            nodes = json.load(f)

        graph_node_ids = set(nba_graph.nodes())
        export_node_ids = set(node["id"] for node in nodes)

        missing = graph_node_ids - export_node_ids
        extra = export_node_ids - graph_node_ids

        assert len(missing) == 0, f"Nodes in graph but not in export: {missing}"
        assert len(extra) == 0, f"Nodes in export but not in graph: {extra}"

    def test_all_edge_ids_valid(self, nba_graph):
        """All edge IDs should have valid source/target in graph."""
        edges_path = DATA_DIR / "edges.json"
        with open(edges_path) as f:
            edges = json.load(f)

        graph_nodes = set(nba_graph.nodes())

        for edge in edges:
            assert edge["source"] in graph_nodes, f"Edge {edge['id']} has invalid source"
            assert edge["target"] in graph_nodes, f"Edge {edge['id']} has invalid target"

    def test_known_edge_exists(self):
        """Known edge (LeBron-Wade) should exist in export."""
        edges_path = DATA_DIR / "edges.json"
        with open(edges_path) as f:
            edges = json.load(f)

        # LeBron (2544) and Wade (2548) were teammates
        lebron_wade_id = "2544--2548"

        edge_ids = {edge["id"] for edge in edges}
        assert lebron_wade_id in edge_ids, f"Known edge {lebron_wade_id} (LeBron-Wade) not found"
