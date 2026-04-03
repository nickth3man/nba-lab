"""
TDD Tests for Centrality Metrics Computation
Tests compute_centrality(G) function that computes:
- Degree centrality for all nodes
- Betweenness centrality (with sampling for large graphs)
- Connected components
"""

from scripts.compute_metrics import compute_centrality


class TestDegreeCentralityValues:
    """Test that degree centrality values are valid (between 0 and 1)."""

    def test_degree_centrality_all_values_between_0_and_1(self, nba_centrality):
        """All degree centrality values should be between 0 and 1."""
        for player_id, data in nba_centrality.items():
            degree_cent = data["degree"]
            assert 0 <= degree_cent <= 1, (
                f"Player {player_id} has degree centrality {degree_cent}, which is not between 0 and 1"
            )

    def test_degree_centrality_sum_reasonable(self, nba_graph, nba_centrality):
        """Sum of degree centralities should be reasonable for the graph size."""
        total_degree_cent = sum(data["degree"] for data in nba_centrality.values())
        n = nba_graph.number_of_nodes()
        m = nba_graph.number_of_edges()
        # NetworkX degree_centrality = degree(v) / (n-1)
        # Sum = sum(degree(v)/(n-1)) = 2*m/(n-1)
        expected_sum = (2 * m) / (n - 1) if n > 1 else 0

        assert abs(total_degree_cent - expected_sum) < 0.01, (
            f"Sum of degree centralities {total_degree_cent} differs significantly from expected {expected_sum}"
        )


class TestBetweennessCentralityValues:
    """Test that betweenness centrality values are valid (between 0 and 1)."""

    def test_betweenness_centrality_all_values_between_0_and_1(self, nba_centrality):
        """All betweenness centrality values should be between 0 and 1."""
        for player_id, data in nba_centrality.items():
            betweenness_cent = data["betweenness"]
            assert 0 <= betweenness_cent <= 1, (
                f"Player {player_id} has betweenness centrality {betweenness_cent}, which is not between 0 and 1"
            )

    def test_betweenness_centrality_sum_positive(self, nba_centrality):
        """Sum of betweenness centralities should be positive for connected graphs."""
        total_betweenness = sum(data["betweenness"] for data in nba_centrality.values())
        # Sum should be positive for a graph with edges
        assert total_betweenness > 0, f"Sum of betweenness centralities should be positive, got {total_betweenness}"


class TestConnectedComponents:
    """Test that connected components are properly identified."""

    def test_all_nodes_have_component_id(self, nba_graph, nba_centrality):
        """All nodes should have a component_id assigned."""
        for player_id in nba_graph.nodes():
            assert player_id in nba_centrality, f"Player {player_id} missing from metrics"
            assert "component_id" in nba_centrality[player_id], f"Player {player_id} missing component_id"

    def test_most_nodes_in_main_component(self, nba_graph, nba_centrality):
        """Most players should be in one giant connected component."""
        # Count nodes per component
        component_counts = {}
        for data in nba_centrality.values():
            comp_id = data["component_id"]
            component_counts[comp_id] = component_counts.get(comp_id, 0) + 1

        # Find the largest component
        largest_component_size = max(component_counts.values())
        total_nodes = nba_graph.number_of_nodes()

        # At least 90% of nodes should be in the largest component
        assert largest_component_size / total_nodes >= 0.9, (
            f"Only {largest_component_size}/{total_nodes} nodes in largest component. "
            f"Isolates or fragmented graph detected."
        )

    def test_component_ids_are_integers(self, nba_centrality):
        """Component IDs should be integers (0-indexed)."""
        for player_id, data in nba_centrality.items():
            assert isinstance(data["component_id"], int), (
                f"Player {player_id} has non-integer component_id: {type(data['component_id'])}"
            )


class TestTopDegreeCentralityPlayers:
    """Test that top degree centrality players are reasonable (journeymen/long careers)."""

    def test_top_10_degree_centrality_players_exist(self, nba_centrality):
        """Top 10 degree centrality players should exist and have valid data."""
        # Sort by degree centrality descending
        sorted_players = sorted(nba_centrality.items(), key=lambda x: x[1]["degree"], reverse=True)
        top_10 = sorted_players[:10]

        assert len(top_10) == 10, "Should have at least 10 players"
        for player_id, data in top_10:
            assert data["degree"] > 0, f"Top player {player_id} has zero degree centrality"

    def test_top_degree_players_have_high_degree(self, nba_centrality):
        """Top degree centrality players should have higher degree than average."""
        # Get average degree
        avg_degree = sum(data["degree"] for data in nba_centrality.values()) / len(nba_centrality)

        # Sort by degree centrality descending
        sorted_players = sorted(nba_centrality.items(), key=lambda x: x[1]["degree"], reverse=True)
        top_10 = sorted_players[:10]

        # All top 10 should have above-average degree
        for player_id, data in top_10:
            assert data["degree"] > avg_degree, (
                f"Player {player_id} in top 10 but degree {data['degree']} not above average {avg_degree}"
            )

    def test_top_degree_centrality_values_decrease(self, nba_centrality):
        """Degree centrality should decrease as we go down the ranking."""
        # Sort by degree centrality descending
        sorted_players = sorted(nba_centrality.items(), key=lambda x: x[1]["degree"], reverse=True)
        top_10 = sorted_players[:10]

        # Values should be in non-increasing order
        for i in range(len(top_10) - 1):
            current_degree = top_10[i][1]["degree"]
            next_degree = top_10[i + 1][1]["degree"]
            assert current_degree >= next_degree, (
                f"Degree centrality not decreasing: {top_10[i][0]}={current_degree} < {top_10[i + 1][0]}={next_degree}"
            )


class TestMetricsComputationPerformance:
    """Test that computation completes within acceptable time."""

    def test_computation_completes_under_5_minutes(self, nba_graph):
        """Centrality computation should complete in under 5 minutes."""
        import time

        start_time = time.time()
        compute_centrality(nba_graph)
        elapsed_time = time.time() - start_time

        assert elapsed_time < 300, f"Computation took {elapsed_time:.2f} seconds, exceeds 5 minute limit"
        print(f"\nComputation completed in {elapsed_time:.2f} seconds")

    def test_returns_dict_with_all_nodes(self, nba_graph, nba_centrality):
        """Result should be a dict with all nodes."""
        assert isinstance(nba_centrality, dict), "Result should be a dictionary"
        assert len(nba_centrality) == nba_graph.number_of_nodes(), (
            f"Metrics has {len(nba_centrality)} nodes, graph has {nba_graph.number_of_nodes()}"
        )
