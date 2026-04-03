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

from scripts.compute_layout import compute_layout


class TestCommunityDetection:
    """Test that Louvain community detection works correctly."""

    def test_community_count_between_5_and_50(self, nba_layout):
        """Community count should be between 5 and 50."""
        community_ids = set(node["community"] for node in nba_layout.values())
        num_communities = len(community_ids)

        assert 5 <= num_communities <= 50, f"Expected 5-50 communities, got {num_communities}"

    def test_all_nodes_have_community_id(self, nba_graph, nba_layout):
        """All nodes should have a community ID assigned."""
        for node_id in nba_graph.nodes():
            assert node_id in nba_layout, f"Node {node_id} missing from layout data"
            assert "community" in nba_layout[node_id], f"Node {node_id} missing community attribute"

    def test_all_communities_are_non_empty(self, nba_layout):
        """All communities should contain at least one node."""
        # Count nodes per community
        community_counts = {}
        for node_data in nba_layout.values():
            comm_id = node_data["community"]
            community_counts[comm_id] = community_counts.get(comm_id, 0) + 1

        # All communities should have at least one node
        for comm_id, count in community_counts.items():
            assert count > 0, f"Community {comm_id} is empty"

    def test_community_ids_are_integers(self, nba_layout):
        """Community IDs should be integers."""
        for node_id, node_data in nba_layout.items():
            assert isinstance(node_data["community"], int), (
                f"Node {node_id} has non-integer community: {type(node_data['community'])}"
            )


class TestNodeCoordinates:
    """Test that x, y coordinates are properly assigned."""

    def test_all_nodes_have_x_coordinate(self, nba_layout):
        """All nodes should have an x coordinate."""
        for node_id, node_data in nba_layout.items():
            assert "x" in node_data, f"Node {node_id} missing x coordinate"
            assert isinstance(node_data["x"], (int, float)), f"Node {node_id} x should be numeric"

    def test_all_nodes_have_y_coordinate(self, nba_layout):
        """All nodes should have a y coordinate."""
        for node_id, node_data in nba_layout.items():
            assert "y" in node_data, f"Node {node_id} missing y coordinate"
            assert isinstance(node_data["y"], (int, float)), f"Node {node_id} y should be numeric"

    def test_all_nodes_have_xy_coordinates(self, nba_graph, nba_layout):
        """All nodes should have both x and y coordinates."""
        assert len(nba_layout) == nba_graph.number_of_nodes(), (
            f"Layout data has {len(nba_layout)} nodes, graph has {nba_graph.number_of_nodes()}"
        )

        for node_id, node_data in nba_layout.items():
            assert "x" in node_data and "y" in node_data, f"Node {node_id} missing x or y coordinate"


class TestCoordinateBounds:
    """Test that coordinates are within reasonable bounds (-1000 to 1000)."""

    def test_x_coordinates_within_bounds(self, nba_layout):
        """All x coordinates should be between -1000 and 1000."""
        for node_id, node_data in nba_layout.items():
            x = node_data["x"]
            assert -1000 <= x <= 1000, f"Node {node_id} has x={x}, outside bounds [-1000, 1000]"

    def test_y_coordinates_within_bounds(self, nba_layout):
        """All y coordinates should be between -1000 and 1000."""
        for node_id, node_data in nba_layout.items():
            y = node_data["y"]
            assert -1000 <= y <= 1000, f"Node {node_id} has y={y}, outside bounds [-1000, 1000]"

    def test_coordinates_are_finite(self, nba_layout):
        """All coordinates should be finite numbers (not inf or nan)."""
        import math

        for node_id, node_data in nba_layout.items():
            x = node_data["x"]
            y = node_data["y"]
            assert math.isfinite(x), f"Node {node_id} has non-finite x={x}"
            assert math.isfinite(y), f"Node {node_id} has non-finite y={y}"


class TestNodeSize:
    """Test that node sizes are properly computed based on degree centrality."""

    def test_all_nodes_have_size(self, nba_layout):
        """All nodes should have a size attribute."""
        for node_id, node_data in nba_layout.items():
            assert "size" in node_data, f"Node {node_id} missing size attribute"

    def test_size_values_in_range(self, nba_layout):
        """Node sizes should be in range 3-15."""
        for node_id, node_data in nba_layout.items():
            size = node_data["size"]
            assert 3 <= size <= 15, f"Node {node_id} has size={size}, outside range [3, 15]"

    def test_size_is_numeric(self, nba_layout):
        """Node sizes should be numeric."""
        for node_id, node_data in nba_layout.items():
            size = node_data["size"]
            assert isinstance(size, (int, float)), f"Node {node_id} size should be numeric, got {type(size)}"


class TestNodeColor:
    """Test that node colors are assigned based on community."""

    def test_all_nodes_have_color(self, nba_layout):
        """All nodes should have a color attribute."""
        for node_id, node_data in nba_layout.items():
            assert "color" in node_data, f"Node {node_id} missing color attribute"

    def test_color_is_valid_hex(self, nba_layout):
        """Colors should be valid hex color strings."""
        for node_id, node_data in nba_layout.items():
            color = node_data["color"]
            assert isinstance(color, str), f"Node {node_id} color should be string"
            assert color.startswith("#"), f"Node {node_id} color should start with #"
            assert len(color) == 7, f"Node {node_id} color should be 7 chars (e.g., #RRGGBB)"
            # Check hex digits
            hex_part = color[1:]
            assert all(c in "0123456789ABCDEFabcdef" for c in hex_part), (
                f"Node {node_id} color has invalid hex digits: {color}"
            )

    def test_same_community_same_color(self, nba_layout):
        """Nodes in the same community should have the same color."""
        # Group by community
        community_colors = {}
        for _node_id, node_data in nba_layout.items():
            comm_id = node_data["community"]
            color = node_data["color"]
            if comm_id in community_colors:
                assert community_colors[comm_id] == color, (
                    f"Nodes in community {comm_id} have different colors: {community_colors[comm_id]} vs {color}"
                )
            else:
                community_colors[comm_id] = color


class TestLayoutPerformance:
    """Test that layout computation completes within acceptable time."""

    def test_computation_completes_under_5_minutes(self, nba_graph):
        """Layout computation should complete in under 5 minutes."""
        import time

        start_time = time.time()
        compute_layout(nba_graph)
        elapsed_time = time.time() - start_time

        assert elapsed_time < 300, f"Layout computation took {elapsed_time:.2f} seconds, exceeds 5 minute limit"
        print(f"\nLayout computation completed in {elapsed_time:.2f} seconds")

    def test_returns_dict_with_all_nodes(self, nba_graph, nba_layout):
        """Result should be a dict with all nodes."""
        assert isinstance(nba_layout, dict), "Result should be a dictionary"
        assert len(nba_layout) == nba_graph.number_of_nodes(), (
            f"Layout data has {len(nba_layout)} nodes, graph has {nba_graph.number_of_nodes()}"
        )
