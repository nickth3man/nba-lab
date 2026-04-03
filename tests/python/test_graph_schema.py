"""
Test suite for JSON Schema validation of NBA graph data.
"""

import json
import sys
from pathlib import Path

from jsonschema import Draft7Validator

from scripts.validate_json_schema import validate_edges, validate_nodes

# Ensure project root is in path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))


class TestNodesSchema:
    """Test suite for nodes JSON schema validation."""

    @property
    def nodes_schema_path(self) -> Path:
        return project_root / "schemas" / "nodes.schema.json"

    @property
    def sample_nodes_path(self) -> Path:
        return project_root / "data" / "sample_nodes.json"

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
        # Get the item schema from the array
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
        return project_root / "data" / "sample_edges.json"

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
                # Missing 'id' and other required fields
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
                "color": "not-a-hex-color",  # Invalid
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
                "weight": -1,  # Invalid - should be >= 0
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
