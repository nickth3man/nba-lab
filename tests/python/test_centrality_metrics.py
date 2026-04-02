"""
TDD Tests for Centrality Metrics Computation
Tests compute_centrality(G) function that computes:
- Degree centrality for all nodes
- Betweenness centrality (with sampling for large graphs)
- Connected components
"""

import os
import sys

# Add scripts directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts"))

from build_graph import build_graph
from compute_metrics import compute_centrality


class TestDegreeCentralityValues:
    """Test that degree centrality values are valid (between 0 and 1)."""

    def test_degree_centrality_all_values_between_0_and_1(self):
        """All degree centrality values should be between 0 and 1."""
        G = build_graph()
        metrics = compute_centrality(G)

        for player_id, data in metrics.items():
            degree_cent = data["degree"]
            assert 0 <= degree_cent <= 1, (
                f"Player {player_id} has degree centrality {degree_cent}, "
                f"which is not between 0 and 1"
            )

    def test_degree_centrality_sum_reasonable(self):
        """Sum of degree centralities should be reasonable for the graph size."""
        G = build_graph()
        metrics = compute_centrality(G)

        total_degree_cent = sum(data["degree"] for data in metrics.values())
        n = G.number_of_nodes()
        m = G.number_of_edges()
        # NetworkX degree_centrality = degree(v) / (n-1)
        # Sum = sum(degree(v)/(n-1)) = 2*m/(n-1)
        expected_sum = (2 * m) / (n - 1) if n > 1 else 0

        assert abs(total_degree_cent - expected_sum) < 0.01, (
            f"Sum of degree centralities {total_degree_cent} differs significantly "
            f"from expected {expected_sum}"
        )


class TestBetweennessCentralityValues:
    """Test that betweenness centrality values are valid (between 0 and 1)."""

    def test_betweenness_centrality_all_values_between_0_and_1(self):
        """All betweenness centrality values should be between 0 and 1."""
        G = build_graph()
        metrics = compute_centrality(G)

        for player_id, data in metrics.items():
            betweenness_cent = data["betweenness"]
            assert 0 <= betweenness_cent <= 1, (
                f"Player {player_id} has betweenness centrality {betweenness_cent}, "
                f"which is not between 0 and 1"
            )

    def test_betweenness_centrality_sum_positive(self):
        """Sum of betweenness centralities should be positive for connected graphs."""
        G = build_graph()
        metrics = compute_centrality(G)

        total_betweenness = sum(data["betweenness"] for data in metrics.values())
        # Sum should be positive for a graph with edges
        assert total_betweenness > 0, (
            f"Sum of betweenness centralities should be positive, got {total_betweenness}"
        )


class TestConnectedComponents:
    """Test that connected components are properly identified."""

    def test_all_nodes_have_component_id(self):
        """All nodes should have a component_id assigned."""
        G = build_graph()
        metrics = compute_centrality(G)

        for player_id in G.nodes():
            assert player_id in metrics, f"Player {player_id} missing from metrics"
            assert "component_id" in metrics[player_id], (
                f"Player {player_id} missing component_id"
            )

    def test_most_nodes_in_main_component(self):
        """Most players should be in one giant connected component."""
        G = build_graph()
        metrics = compute_centrality(G)

        # Count nodes per component
        component_counts = {}
        for data in metrics.values():
            comp_id = data["component_id"]
            component_counts[comp_id] = component_counts.get(comp_id, 0) + 1

        # Find the largest component
        largest_component_size = max(component_counts.values())
        total_nodes = G.number_of_nodes()

        # At least 90% of nodes should be in the largest component
        assert largest_component_size / total_nodes >= 0.9, (
            f"Only {largest_component_size}/{total_nodes} nodes in largest component. "
            f"Isolates or fragmented graph detected."
        )

    def test_component_ids_are_integers(self):
        """Component IDs should be integers (0-indexed)."""
        G = build_graph()
        metrics = compute_centrality(G)

        for player_id, data in metrics.items():
            assert isinstance(data["component_id"], int), (
                f"Player {player_id} has non-integer component_id: "
                f"{type(data['component_id'])}"
            )


class TestTopDegreeCentralityPlayers:
    """Test that top degree centrality players are reasonable (journeymen/long careers)."""

    def test_top_10_degree_centrality_players_exist(self):
        """Top 10 degree centrality players should exist and have valid data."""
        G = build_graph()
        metrics = compute_centrality(G)

        # Sort by degree centrality descending
        sorted_players = sorted(
            metrics.items(), key=lambda x: x[1]["degree"], reverse=True
        )
        top_10 = sorted_players[:10]

        assert len(top_10) == 10, "Should have at least 10 players"
        for player_id, data in top_10:
            assert data["degree"] > 0, (
                f"Top player {player_id} has zero degree centrality"
            )

    def test_top_degree_players_have_high_degree(self):
        """Top degree centrality players should have higher degree than average."""
        G = build_graph()
        metrics = compute_centrality(G)

        # Get average degree
        avg_degree = sum(data["degree"] for data in metrics.values()) / len(metrics)

        # Sort by degree centrality descending
        sorted_players = sorted(
            metrics.items(), key=lambda x: x[1]["degree"], reverse=True
        )
        top_10 = sorted_players[:10]

        # All top 10 should have above-average degree
        for player_id, data in top_10:
            assert data["degree"] > avg_degree, (
                f"Player {player_id} in top 10 but degree {data['degree']} "
                f"not above average {avg_degree}"
            )

    def test_top_degree_centrality_values_decrease(self):
        """Degree centrality should decrease as we go down the ranking."""
        G = build_graph()
        metrics = compute_centrality(G)

        # Sort by degree centrality descending
        sorted_players = sorted(
            metrics.items(), key=lambda x: x[1]["degree"], reverse=True
        )
        top_10 = sorted_players[:10]

        # Values should be in non-increasing order
        for i in range(len(top_10) - 1):
            current_degree = top_10[i][1]["degree"]
            next_degree = top_10[i + 1][1]["degree"]
            assert current_degree >= next_degree, (
                f"Degree centrality not decreasing: "
                f"{top_10[i][0]}={current_degree} < {top_10[i + 1][0]}={next_degree}"
            )


class TestMetricsComputationPerformance:
    """Test that computation completes within acceptable time."""

    def test_computation_completes_under_5_minutes(self):
        """Centrality computation should complete in under 5 minutes."""
        import time

        G = build_graph()
        start_time = time.time()
        metrics = compute_centrality(G)
        elapsed_time = time.time() - start_time

        assert elapsed_time < 300, (
            f"Computation took {elapsed_time:.2f} seconds, exceeds 5 minute limit"
        )
        print(f"\nComputation completed in {elapsed_time:.2f} seconds")

    def test_returns_dict_with_all_nodes(self):
        """Result should be a dict with all nodes."""
        G = build_graph()
        metrics = compute_centrality(G)

        assert isinstance(metrics, dict), "Result should be a dictionary"
        assert len(metrics) == G.number_of_nodes(), (
            f"Metrics has {len(metrics)} nodes, graph has {G.number_of_nodes()}"
        )
