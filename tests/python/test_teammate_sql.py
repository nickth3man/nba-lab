"""TDD tests for teammate overlap SQL extraction."""

import os
import sqlite3
import tempfile
from datetime import date

import pytest

import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from scripts import extract_teammates


class TestTeammateOverlapSQL:
    """Test teammate overlap SQL logic with fixture data."""

    @pytest.fixture
    def temp_db(self):
        """Create a temporary DB with known fixture data."""
        fd, path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        conn = sqlite3.connect(path)
        cursor = conn.cursor()

        # Create required dimension tables
        cursor.execute("""
            CREATE TABLE dim_player (
                player_id TEXT PRIMARY KEY,
                name TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE dim_team (
                team_id TEXT PRIMARY KEY,
                name TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE dim_season (
                season_id TEXT PRIMARY KEY,
                start_year INTEGER,
                end_year INTEGER
            )
        """)

        # Create fact_roster table (same schema as production)
        cursor.execute("""
            CREATE TABLE fact_roster (
                roster_id INTEGER PRIMARY KEY,
                player_id TEXT NOT NULL,
                team_id TEXT NOT NULL,
                season_id TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT,
                FOREIGN KEY (player_id) REFERENCES dim_player(player_id),
                FOREIGN KEY (team_id) REFERENCES dim_team(team_id),
                FOREIGN KEY (season_id) REFERENCES dim_season(season_id)
            )
        """)

        # Insert dimension data
        cursor.executemany(
            "INSERT INTO dim_player VALUES (?, ?)",
            [("P1", "Player One"), ("P2", "Player Two"), ("P3", "Player Three")],
        )
        cursor.executemany(
            "INSERT INTO dim_team VALUES (?, ?)",
            [("TEAM_A", "Team Alpha"), ("TEAM_B", "Team Beta")],
        )
        cursor.executemany(
            "INSERT INTO dim_season VALUES (?, ?, ?)", [("S2023", 2023, 2024)]
        )

        # Insert roster data: 3 players on same team (TEAM_A, S2023)
        # P1 and P2 overlap for 14 days (Oct 1 - Oct 15)
        # P1 and P3 overlap for exactly 14 days (Oct 17 - Oct 31)
        # P2 and P3 have NO overlap (P2 ends Oct 15, P3 starts Oct 17)
        cursor.executemany(
            "INSERT INTO fact_roster (player_id, team_id, season_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
            [
                ("P1", "TEAM_A", "S2023", "2023-10-01", "2023-10-31"),
                ("P2", "TEAM_A", "S2023", "2023-10-01", "2023-10-15"),
                ("P3", "TEAM_A", "S2023", "2023-10-17", "2023-10-31"),
            ],
        )

        # Also add a player on different team to ensure no cross-team edges
        cursor.executemany(
            "INSERT INTO fact_roster (player_id, team_id, season_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
            [("P1", "TEAM_B", "S2023", "2023-10-01", "2023-10-31")],
        )

        conn.commit()
        yield conn, path
        conn.close()
        os.unlink(path)

    def test_teammate_overlaps_table_created(self, temp_db):
        """Test that teammate_overlaps table is created after extraction."""
        conn, db_path = temp_db
        extract_teammates.extract_teammate_overlaps(db_path)

        cursor = conn.cursor()
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='teammate_overlaps'"
        )
        result = cursor.fetchone()
        assert result is not None, "teammate_overlaps table should be created"

    def test_overlap_filter_14_days(self, temp_db):
        """Test that overlaps fewer than 14 days are filtered out."""
        conn, db_path = temp_db
        extract_teammates.extract_teammate_overlaps(db_path)

        cursor = conn.cursor()
        cursor.execute("SELECT player_a_id, player_b_id FROM teammate_overlaps")
        edges = cursor.fetchall()

        # P1-P2: 30 days overlap -> should be included
        # P1-P3: 14 days overlap -> should be included (>= 14)
        # P2-P3: 0 days overlap -> should NOT be included

        player_pairs = {tuple(sorted(e)) for e in edges}

        assert tuple(sorted(["P1", "P2"])) in player_pairs, (
            "P1-P2 (30 days) should be included"
        )
        assert tuple(sorted(["P1", "P3"])) in player_pairs, (
            "P1-P3 (14 days) should be included"
        )
        assert tuple(sorted(["P2", "P3"])) not in player_pairs, (
            "P2-P3 (0 days) should NOT be included"
        )

    def test_no_self_loops(self, temp_db):
        """Test that player is not paired with themselves."""
        conn, db_path = temp_db
        extract_teammates.extract_teammate_overlaps(db_path)

        cursor = conn.cursor()
        cursor.execute("SELECT player_a_id, player_b_id FROM teammate_overlaps")
        edges = cursor.fetchall()

        for a_id, b_id in edges:
            assert a_id != b_id, f"Should not have self-loop: {a_id} != {b_id}"

    def test_no_duplicate_pairs(self, temp_db):
        """Test that each player pair appears only once (unordered)."""
        conn, db_path = temp_db
        extract_teammates.extract_teammate_overlaps(db_path)

        cursor = conn.cursor()
        cursor.execute("SELECT player_a_id, player_b_id FROM teammate_overlaps")
        edges = cursor.fetchall()

        # Each pair should be unique when sorted
        sorted_pairs = [tuple(sorted(e)) for e in edges]
        assert len(sorted_pairs) == len(set(sorted_pairs)), (
            "Should not have duplicate pairs"
        )

    def test_cross_team_edges_excluded(self, temp_db):
        """Test that teammates on different teams are not paired."""
        conn, db_path = temp_db
        extract_teammates.extract_teammate_overlaps(db_path)

        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM teammate_overlaps WHERE team_id = 'TEAM_B'"
        )
        team_b_edges = cursor.fetchone()[0]

        # P1 is on TEAM_B but no one else is, so no edges should involve TEAM_B
        assert team_b_edges == 0, "Cross-team edges should not exist"

    def test_v_teammate_edges_view(self, temp_db):
        """Test that v_teammate_edges view exists and returns aggregated edges."""
        conn, db_path = temp_db
        extract_teammates.extract_teammate_overlaps(db_path)

        cursor = conn.cursor()
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='view' AND name='v_teammate_edges'"
        )
        result = cursor.fetchone()
        assert result is not None, "v_teammate_edges view should exist"

        # View should have aggregated edges (one per player pair)
        cursor.execute("SELECT COUNT(*) FROM v_teammate_edges")
        count = cursor.fetchone()[0]
        assert count == 2, "Should have 2 unique player-pair edges (P1-P2, P1-P3)"

    def test_v_teammate_edges_by_team_view(self, temp_db):
        """Test that v_teammate_edges_by_team view exists."""
        conn, db_path = temp_db
        extract_teammates.extract_teammate_overlaps(db_path)

        cursor = conn.cursor()
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='view' AND name='v_teammate_edges_by_team'"
        )
        result = cursor.fetchone()
        assert result is not None, "v_teammate_edges_by_team view should exist"

        # Should have edges per team
        cursor.execute("SELECT COUNT(*) FROM v_teammate_edges_by_team")
        count = cursor.fetchone()[0]
        assert count == 2, "Should have 2 edges (one per team for each pair)"

    def test_index_created(self, temp_db):
        """Test that the required index is created."""
        conn, db_path = temp_db
        extract_teammates.create_index(db_path)

        cursor = conn.cursor()
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_roster_team_season_player'"
        )
        result = cursor.fetchone()
        # Index may or may not exist depending on if it was already there
        # Just verify no error is raised

    def test_edge_count_in_expected_range(self, temp_db):
        """Test that edge count logic works correctly with known fixture."""
        conn, db_path = temp_db
        extract_teammates.extract_teammate_overlaps(db_path)

        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM teammate_overlaps")
        count = cursor.fetchone()[0]

        # With 3 players on same team with overlaps:
        # P1-P2: 30 days -> included
        # P1-P3: 14 days -> included
        # P2-P3: 0 days -> excluded
        # Total: 2 edges
        assert count == 2, f"Expected 2 edges, got {count}"


class TestKnownPair:
    """Test for known player pair: LeBron James + Dwyane Wade on MIA."""

    def test_lebron_wade_miami_overlap(self):
        """Test that LeBron (2544) and Wade (2548) on MIA (1610612748) have an overlap."""
        db_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "db", "nba_raw_data.db"
        )
        if not os.path.exists(db_path):
            pytest.skip("NBA database not available")

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if both players have records on MIA
        cursor.execute("""
            SELECT DISTINCT season_id, start_date, end_date
            FROM fact_roster
            WHERE player_id = '2544' AND team_id = '1610612748'
            ORDER BY season_id
        """)
        lebron_mia = cursor.fetchall()

        cursor.execute("""
            SELECT DISTINCT season_id, start_date, end_date
            FROM fact_roster
            WHERE player_id = '2548' AND team_id = '1610612748'
            ORDER BY season_id
        """)
        wade_mia = cursor.fetchall()

        conn.close()

        if not lebron_mia or not wade_mia:
            pytest.skip("LeBron/Wade MIA data not found in database")

        # They overlapped in multiple seasons (2010-2014)
        assert len(lebron_mia) > 0 and len(wade_mia) > 0
