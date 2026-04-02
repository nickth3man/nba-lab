"""
TDD Tests for Layout Computation (Community Detection + ForceAtlas2 Layout)
Tests compute_layout(G) function that:
- Runs Louvain community detection
- Assigns community IDs to nodes
- Runs ForceAtlas2 layout (or spring_layout fallback)
- Assigns x, y coordinates to nodes
- Computes node size based on degree centrality (scale: 3-15)
- Assigns color based on community
"""

import os
import sys

# Add scripts directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts"))

from build_graph import build_graph
from compute_layout import compute_layout


class TestCommunityDetection:
    """Test that Louvain community detection works correctly."""

    def test_community_count_between_5_and_50(self):
        """Community count should be between 5 and 50."""
        G = build_graph()
        layout_data = compute_layout(G)

        community_ids = set(node["community"] for node in layout_data.values())
        num_communities = len(community_ids)

        assert 5 <= num_communities <= 50, (
            f"Expected 5-50 communities, got {num_communities}"
        )

    def test_all_nodes_have_community_id(self):
        """All nodes should have a community ID assigned."""
        G = build_graph()
        layout_data = compute_layout(G)

        for node_id in G.nodes():
            assert node_id in layout_data, f"Node {node_id} missing from layout data"
            assert "community" in layout_data[node_id], (
                f"Node {node_id} missing community attribute"
            )

    def test_all_communities_are_non_empty(self):
        """All communities should contain at least one node."""
        G = build_graph()
        layout_data = compute_layout(G)

        # Count nodes per community
        community_counts = {}
        for node_data in layout_data.values():
            comm_id = node_data["community"]
            community_counts[comm_id] = community_counts.get(comm_id, 0) + 1

        # All communities should have at least one node
        for comm_id, count in community_counts.items():
            assert count > 0, f"Community {comm_id} is empty"

    def test_community_ids_are_integers(self):
        """Community IDs should be integers."""
        G = build_graph()
        layout_data = compute_layout(G)

        for node_id, node_data in layout_data.items():
            assert isinstance(node_data["community"], int), (
                f"Node {node_id} has non-integer community: "
                f"{type(node_data['community'])}"
            )


class TestNodeCoordinates:
    """Test that x, y coordinates are properly assigned."""

    def test_all_nodes_have_x_coordinate(self):
        """All nodes should have an x coordinate."""
        G = build_graph()
        layout_data = compute_layout(G)

        for node_id, node_data in layout_data.items():
            assert "x" in node_data, f"Node {node_id} missing x coordinate"
            assert isinstance(node_data["x"], (int, float)), (
                f"Node {node_id} x should be numeric"
            )

    def test_all_nodes_have_y_coordinate(self):
        """All nodes should have a y coordinate."""
        G = build_graph()
        layout_data = compute_layout(G)

        for node_id, node_data in layout_data.items():
            assert "y" in node_data, f"Node {node_id} missing y coordinate"
            assert isinstance(node_data["y"], (int, float)), (
                f"Node {node_id} y should be numeric"
            )

    def test_all_nodes_have_xy_coordinates(self):
        """All nodes should have both x and y coordinates."""
        G = build_graph()
        layout_data = compute_layout(G)

        assert len(layout_data) == G.number_of_nodes(), (
            f"Layout data has {len(layout_data)} nodes, graph has {G.number_of_nodes()}"
        )

        for node_id, node_data in layout_data.items():
            assert "x" in node_data and "y" in node_data, (
                f"Node {node_id} missing x or y coordinate"
            )


class TestCoordinateBounds:
    """Test that coordinates are within reasonable bounds (-1000 to 1000)."""

    def test_x_coordinates_within_bounds(self):
        """All x coordinates should be between -1000 and 1000."""
        G = build_graph()
        layout_data = compute_layout(G)

        for node_id, node_data in layout_data.items():
            x = node_data["x"]
            assert -1000 <= x <= 1000, (
                f"Node {node_id} has x={x}, outside bounds [-1000, 1000]"
            )

    def test_y_coordinates_within_bounds(self):
        """All y coordinates should be between -1000 and 1000."""
        G = build_graph()
        layout_data = compute_layout(G)

        for node_id, node_data in layout_data.items():
            y = node_data["y"]
            assert -1000 <= y <= 1000, (
                f"Node {node_id} has y={y}, outside bounds [-1000, 1000]"
            )

    def test_coordinates_are_finite(self):
        """All coordinates should be finite numbers (not inf or nan)."""
        G = build_graph()
        layout_data = compute_layout(G)

        import math

        for node_id, node_data in layout_data.items():
            x = node_data["x"]
            y = node_data["y"]
            assert math.isfinite(x), f"Node {node_id} has non-finite x={x}"
            assert math.isfinite(y), f"Node {node_id} has non-finite y={y}"


class TestNodeSize:
    """Test that node sizes are properly computed based on degree centrality."""

    def test_all_nodes_have_size(self):
        """All nodes should have a size attribute."""
        G = build_graph()
        layout_data = compute_layout(G)

        for node_id, node_data in layout_data.items():
            assert "size" in node_data, f"Node {node_id} missing size attribute"

    def test_size_values_in_range(self):
        """Node sizes should be in range 3-15."""
        G = build_graph()
        layout_data = compute_layout(G)

        for node_id, node_data in layout_data.items():
            size = node_data["size"]
            assert 3 <= size <= 15, (
                f"Node {node_id} has size={size}, outside range [3, 15]"
            )

    def test_size_is_numeric(self):
        """Node sizes should be numeric."""
        G = build_graph()
        layout_data = compute_layout(G)

        for node_id, node_data in layout_data.items():
            size = node_data["size"]
            assert isinstance(size, (int, float)), (
                f"Node {node_id} size should be numeric, got {type(size)}"
            )


class TestNodeColor:
    """Test that node colors are assigned based on community."""

    def test_all_nodes_have_color(self):
        """All nodes should have a color attribute."""
        G = build_graph()
        layout_data = compute_layout(G)

        for node_id, node_data in layout_data.items():
            assert "color" in node_data, f"Node {node_id} missing color attribute"

    def test_color_is_valid_hex(self):
        """Colors should be valid hex color strings."""
        G = build_graph()
        layout_data = compute_layout(G)

        for node_id, node_data in layout_data.items():
            color = node_data["color"]
            assert isinstance(color, str), f"Node {node_id} color should be string"
            assert color.startswith("#"), f"Node {node_id} color should start with #"
            assert len(color) == 7, (
                f"Node {node_id} color should be 7 chars (e.g., #RRGGBB)"
            )
            # Check hex digits
            hex_part = color[1:]
            assert all(c in "0123456789ABCDEFabcdef" for c in hex_part), (
                f"Node {node_id} color has invalid hex digits: {color}"
            )

    def test_same_community_same_color(self):
        """Nodes in the same community should have the same color."""
        G = build_graph()
        layout_data = compute_layout(G)

        # Group by community
        community_colors = {}
        for node_id, node_data in layout_data.items():
            comm_id = node_data["community"]
            color = node_data["color"]
            if comm_id in community_colors:
                assert community_colors[comm_id] == color, (
                    f"Nodes in community {comm_id} have different colors: "
                    f"{community_colors[comm_id]} vs {color}"
                )
            else:
                community_colors[comm_id] = color


class TestLayoutPerformance:
    """Test that layout computation completes within acceptable time."""

    def test_computation_completes_under_5_minutes(self):
        """Layout computation should complete in under 5 minutes."""
        import time

        G = build_graph()
        start_time = time.time()
        layout_data = compute_layout(G)
        elapsed_time = time.time() - start_time

        assert elapsed_time < 300, (
            f"Layout computation took {elapsed_time:.2f} seconds, exceeds 5 minute limit"
        )
        print(f"\nLayout computation completed in {elapsed_time:.2f} seconds")

    def test_returns_dict_with_all_nodes(self):
        """Result should be a dict with all nodes."""
        G = build_graph()
        layout_data = compute_layout(G)

        assert isinstance(layout_data, dict), "Result should be a dictionary"
        assert len(layout_data) == G.number_of_nodes(), (
            f"Layout data has {len(layout_data)} nodes, graph has {G.number_of_nodes()}"
        )
