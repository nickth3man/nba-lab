"""
TDD Tests for Graph Construction
Tests build_graph() function that creates NetworkX graph from SQLite data
"""

import os
import sqlite3
import networkx as nx


DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "db", "nba_raw_data.db")
DB_PATH = os.path.abspath(DB_PATH)


def get_db_connection():
    return sqlite3.connect(DB_PATH)


class TestGraphConstruction:
    """Test suite for build_graph() function"""

    def test_build_graph_import(self):
        """Test that build_graph function can be imported"""
        import sys

        sys.path.insert(
            0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts")
        )
        from build_graph import build_graph

        assert callable(build_graph), "build_graph should be a callable function"

    def test_graph_has_expected_node_count(self):
        """Graph should have ~5,115 nodes (±10 for data quality)"""
        import sys

        sys.path.insert(
            0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts")
        )
        from build_graph import build_graph

        G = build_graph()
        node_count = G.number_of_nodes()
        # ~5,115 players in the database
        assert 5105 <= node_count <= 5125, f"Expected ~5115 nodes, got {node_count}"

    def test_graph_has_expected_edge_count(self):
        """Graph should have 60,000-120,000 edges (actual v_teammate_edges has 111,483)"""
        import sys

        sys.path.insert(
            0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts")
        )
        from build_graph import build_graph

        G = build_graph()
        edge_count = G.number_of_edges()
        assert 60000 <= edge_count <= 120000, (
            f"Expected 60K-120K edges, got {edge_count}"
        )
        from build_graph import build_graph

        G = build_graph()
        edge_count = G.number_of_edges()
        assert 60000 <= edge_count <= 120000, (
            f"Expected 60K-120K edges, got {edge_count}"
        )

    def test_nodes_have_required_attributes(self):
        """Every node should have: id, label, position, era, is_active, hof"""
        import sys

        sys.path.insert(
            0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts")
        )
        from build_graph import build_graph

        G = build_graph()

        required_node_attrs = ["id", "label", "position", "era", "is_active", "hof"]

        for node_id in G.nodes():
            attrs = G.nodes[node_id]
            for attr in required_node_attrs:
                assert attr in attrs, f"Node {node_id} missing attribute '{attr}'"

    def test_edges_have_required_attributes(self):
        """Every edge should have: weight, teams[], total_days"""
        import sys

        sys.path.insert(
            0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts")
        )
        from build_graph import build_graph

        G = build_graph()

        required_edge_attrs = ["weight", "teams", "total_days"]

        for u, v in G.edges():
            attrs = G[u][v]
            for attr in required_edge_attrs:
                assert attr in attrs, f"Edge ({u}, {v}) missing attribute '{attr}'"
            # teams should be a list
            assert isinstance(attrs["teams"], list), (
                f"Edge ({u}, {v}) 'teams' should be a list"
            )

    def test_lebron_wade_edge_exists(self):
        """Known edge: LeBron (2544) + Wade (2548) should exist"""
        import sys

        sys.path.insert(
            0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts")
        )
        from build_graph import build_graph

        G = build_graph()

        lebron_id = "2544"
        wade_id = "2548"

        assert G.has_edge(lebron_id, wade_id), f"Edge LeBron-Wade should exist"

        edge_data = G[lebron_id][wade_id]
        assert edge_data["weight"] == 3, (
            f"LeBron-Wade should have weight 3 (seasons_together), got {edge_data['weight']}"
        )
        assert edge_data["total_days"] > 0, (
            f"LeBron-Wade should have positive total_days"
        )

    def test_jordan_pippen_edge_exists(self):
        """Known edge: Jordan (893) + Pippen (937) should exist"""
        import sys

        sys.path.insert(
            0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts")
        )
        from build_graph import build_graph

        G = build_graph()

        jordan_id = "893"
        pippen_id = "937"

        assert G.has_edge(jordan_id, pippen_id), f"Edge Jordan-Pippen should exist"

        edge_data = G[jordan_id][pippen_id]
        assert edge_data["weight"] == 10, (
            f"Jordan-Pippen should have weight 10 (seasons_together), got {edge_data['weight']}"
        )
        assert edge_data["total_days"] > 50000, (
            f"Jordan-Pippen should have ~122K total_days, got {edge_data['total_days']}"
        )

    def test_era_attribute_computation(self):
        """Nodes should have era attribute based on career span"""
        import sys

        sys.path.insert(
            0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts")
        )
        from build_graph import build_graph

        G = build_graph()

        # Jordan played in 1980s-1990s
        jordan_id = "893"
        jordan_era = G.nodes[jordan_id].get("era", "")
        assert "1990" in jordan_era or "1980" in jordan_era, (
            f"Jordan era should reference 1980s-1990s, got '{jordan_era}'"
        )

        # LeBron played in 2000s-2010s
        lebron_id = "2544"
        lebron_era = G.nodes[lebron_id].get("era", "")
        assert "2000" in lebron_era or "2010" in lebron_era, (
            f"LeBron era should reference 2000s-2010s, got '{lebron_era}'"
        )

    def test_isolated_nodes_exist(self):
        """Test that isolated nodes exist (players with no teammates meeting 14-day threshold)"""
        import sys

        sys.path.insert(
            0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts")
        )
        from build_graph import build_graph

        G = build_graph()

        # Count isolated nodes (degree == 0)
        isolated = [n for n in G.nodes() if G.degree(n) == 0]

        # Some players should be isolated - those who only played briefly
        # and never overlapped 14+ days with any other player
        assert len(isolated) > 0, "Graph should have some isolated nodes"

    def test_team_tenure_structure(self):
        """Edge teams attribute should be list of TeamTenure dicts"""
        import sys

        sys.path.insert(
            0, os.path.join(os.path.dirname(__file__), "..", "..", "scripts")
        )
        from build_graph import build_graph

        G = build_graph()

        # LeBron-Wade edge should have teams info
        lebron_id = "2544"
        wade_id = "2548"

        if G.has_edge(lebron_id, wade_id):
            edge_data = G[lebron_id][wade_id]
            teams = edge_data["teams"]

            assert len(teams) > 0, (
                "LeBron-Wade edge should have at least one team tenure"
            )

            # Each team tenure should have required fields
            for tenure in teams:
                assert "team_id" in tenure, "TeamTenure should have team_id"
                assert "team_abbreviation" in tenure, (
                    "TeamTenure should have team_abbreviation"
                )
                assert "seasons" in tenure, "TeamTenure should have seasons"
                assert "overlap_days" in tenure, "TeamTenure should have overlap_days"
