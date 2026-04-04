"""
Test suite for JSON Schema validation of NBA graph data.
"""

import json
import sys
from pathlib import Path

import pytest
from jsonschema import Draft7Validator

from scripts.validate_json_schema import validate_edges, validate_nodes

# Ensure project root is in path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))


# Sample data constants
SAMPLE_NODES = [
    {
        "id": "player_001",
        "label": "Test Player 1",
        "x": 100.0,
        "y": 200.0,
        "size": 15,
        "color": "#FF5733",
        "position": "PG",
        "era": "2020s",
        "is_active": True,
        "hof": False,
        "draft_year": 2020,
        "degree": 25,
        "betweenness": 0.15,
        "community": 1,
    },
    {
        "id": "player_002",
        "label": "Test Player 2",
        "x": 150.0,
        "y": 250.0,
        "size": 12,
        "color": "#33FF57",
        "position": "SG",
        "era": "2010s",
        "is_active": False,
        "hof": True,
        "draft_year": 2015,
        "degree": 18,
        "betweenness": 0.08,
        "community": 2,
    },
]

SAMPLE_EDGES = [
    {
        "id": "edge_001",
        "source": "player_001",
        "target": "player_002",
        "weight": 3.5,
        "teams": [
            {
                "team_id": "LAL",
                "team_name": "Los Angeles Lakers",
                "team_abbreviation": "LAL",
                "seasons": ["2020-21", "2021-22", "2022-23"],
                "overlap_days": 365,
            },
        ],
        "total_days": 365,
        "size": 8,
    },
]


class TestNodesSchema:
    """Test suite for nodes JSON schema validation."""

    @property
    def nodes_schema_path(self) -> Path:
        return project_root / "schemas" / "nodes.schema.json"

    @property
    def sample_nodes_path(self) -> Path:
        data_path = project_root / "data" / "sample_nodes.json"
        if data_path.exists():
            return data_path
        raise FileNotFoundError(f"Sample nodes not found: {data_path}")

    def test_schema_file_exists(self):
        """Schema file should exist."""
        assert self.nodes_schema_path.exists(), f"Schema not found: {self.nodes_schema_path}"

    def test_schema_is_valid_json(self):
        """Schema file should be valid JSON."""
        with open(self.nodes_schema_path) as f:
            data = json.load(f)
        assert isinstance(data, dict), "Schema should be a JSON object"
        assert "$schema" in data, "Schema should have $schema key"

    def test_sample_nodes_exist(self):
        """Sample nodes data should exist."""
        assert self.sample_nodes_path.exists(), f"Sample nodes not found: {self.sample_nodes_path}"

    def test_valid_nodes_pass_validation(self):
        """Valid nodes should pass validation."""
        valid, errors = validate_nodes(self.sample_nodes_path, self.nodes_schema_path)
        assert valid, f"Valid nodes should pass validation. Errors: {errors}"

    def test_nodes_schema_requires_id(self):
        """Nodes schema should require id field."""
        with open(self.nodes_schema_path) as f:
            schema = json.load(f)
        item_schema = schema.get("items", {})
        required = item_schema.get("required", [])
        assert "id" in required, "id should be required"

    def test_nodes_schema_requires_position(self):
        """Nodes schema should require position field."""
        with open(self.nodes_schema_path) as f:
            schema = json.load(f)
        item_schema = schema.get("items", {})
        required = item_schema.get("required", [])
        assert "position" in required, "position should be required"

    def test_nodes_schema_validates_color_format(self):
        """Nodes schema should validate color as hex format."""
        with open(self.nodes_schema_path) as f:
            schema = json.load(f)
        item_schema = schema.get("items", {})
        properties = item_schema.get("properties", {})
        color_schema = properties.get("color", {})
        assert "pattern" in color_schema, "color should have a pattern"


class TestEdgesSchema:
    """Test suite for edges JSON schema validation."""

    @property
    def edges_schema_path(self) -> Path:
        return project_root / "schemas" / "edges.schema.json"

    @property
    def sample_edges_path(self) -> Path:
        data_path = project_root / "data" / "sample_edges.json"
        if data_path.exists():
            return data_path
        raise FileNotFoundError(f"Sample edges not found: {data_path}")

    def test_schema_file_exists(self):
        """Schema file should exist."""
        assert self.edges_schema_path.exists(), f"Schema not found: {self.edges_schema_path}"

    def test_schema_is_valid_json(self):
        """Schema file should be valid JSON."""
        with open(self.edges_schema_path) as f:
            data = json.load(f)
        assert isinstance(data, dict), "Schema should be a JSON object"
        assert "$schema" in data, "Schema should have $schema key"

    def test_sample_edges_exist(self):
        """Sample edges data should exist."""
        assert self.sample_edges_path.exists(), f"Sample edges not found: {self.sample_edges_path}"

    def test_valid_edges_pass_validation(self):
        """Valid edges should pass validation."""
        valid, errors = validate_edges(self.sample_edges_path, self.edges_schema_path)
        assert valid, f"Valid edges should pass validation. Errors: {errors}"

    def test_edges_schema_requires_source(self):
        """Edges schema should require source field."""
        with open(self.edges_schema_path) as f:
            schema = json.load(f)
        item_schema = schema.get("items", {})
        required = item_schema.get("required", [])
        assert "source" in required, "source should be required"

    def test_edges_schema_requires_target(self):
        """Edges schema should require target field."""
        with open(self.edges_schema_path) as f:
            schema = json.load(f)
        item_schema = schema.get("items", {})
        required = item_schema.get("required", [])
        assert "target" in required, "target should be required"

    def test_edges_schema_requires_weight(self):
        """Edges schema should require weight field."""
        with open(self.edges_schema_path) as f:
            schema = json.load(f)
        item_schema = schema.get("items", {})
        required = item_schema.get("required", [])
        assert "weight" in required, "weight should be required"


class TestInvalidData:
    """Test suite for invalid data detection."""

    @property
    def nodes_schema_path(self) -> Path:
        return project_root / "schemas" / "nodes.schema.json"

    @property
    def edges_schema_path(self) -> Path:
        return project_root / "schemas" / "edges.schema.json"

    def test_missing_required_field_fails(self):
        """Missing required field should fail validation."""
        invalid_nodes = [
            {
                "label": "Test Player",
                "x": 100,
                "y": 200,
            }
        ]

        with open(self.nodes_schema_path) as f:
            schema = json.load(f)

        validator = Draft7Validator(schema)
        errors = list(validator.iter_errors(invalid_nodes))
        assert len(errors) > 0, "Invalid data should produce validation errors"

    def test_invalid_color_format_fails(self):
        """Invalid color format should fail validation."""
        invalid_nodes = [
            {
                "id": "test",
                "label": "Test",
                "x": 100,
                "y": 200,
                "size": 10,
                "color": "not-a-hex-color",
                "position": "PG",
                "era": "2020s",
                "is_active": True,
                "hof": False,
                "draft_year": 2020,
                "degree": 5,
                "betweenness": 0.1,
                "community": 1,
            }
        ]

        with open(self.nodes_schema_path) as f:
            schema = json.load(f)

        validator = Draft7Validator(schema)
        errors = list(validator.iter_errors(invalid_nodes))
        assert len(errors) > 0, "Invalid color format should produce validation errors"

    def test_negative_weight_fails(self):
        """Negative weight should fail validation for edges."""
        invalid_edges = [
            {
                "id": "test",
                "source": "p1",
                "target": "p2",
                "weight": -1,
                "teams": [],
                "total_days": 100,
                "size": 5,
            }
        ]

        with open(self.edges_schema_path) as f:
            schema = json.load(f)

        validator = Draft7Validator(schema)
        errors = list(validator.iter_errors(invalid_edges))
        assert len(errors) > 0, "Negative weight should produce validation errors"


# Fixtures for schema validation tests
@pytest.fixture
def valid_sample_nodes_path(tmp_path: Path) -> Path:
    sample_file = tmp_path / "sample_nodes.json"
    sample_file.write_text(json.dumps(SAMPLE_NODES, indent=2))
    return sample_file


@pytest.fixture
def valid_sample_edges_path(tmp_path: Path) -> Path:
    sample_file = tmp_path / "sample_edges.json"
    sample_file.write_text(json.dumps(SAMPLE_EDGES, indent=2))
    return sample_file


@pytest.fixture(autouse=True)
def schema_test_project_root(sample_data_dir: Path, monkeypatch: pytest.MonkeyPatch):
    """Override sample_nodes_path and sample_edges_path to use temp data dir."""
    import test_graph_schema

    def patched_nodes_path(self: test_graph_schema.TestNodesSchema) -> Path:
        return sample_data_dir / "sample_nodes.json"

    def patched_edges_path(self: test_graph_schema.TestEdgesSchema) -> Path:
        return sample_data_dir / "sample_edges.json"

    monkeypatch.setattr(test_graph_schema.TestNodesSchema, "sample_nodes_path", property(patched_nodes_path))
    monkeypatch.setattr(test_graph_schema.TestEdgesSchema, "sample_edges_path", property(patched_edges_path))
