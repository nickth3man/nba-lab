import os
import sqlite3
import time


DB_PATH = os.path.join(os.path.dirname(__file__), "..", "db", "nba_raw_data.db")


def get_db_connection(db_path=None):
    if db_path is None:
        db_path = DB_PATH
    return sqlite3.connect(db_path)


def create_index(db_path=None):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_roster_team_season_player
        ON fact_roster(team_id, season_id, player_id)
    """)
    conn.commit()
    conn.close()


def extract_teammate_overlaps(db_path=None):
    if db_path is None:
        db_path = DB_PATH

    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    # Drop views first (they depend on the table), then drop the table
    cursor.execute("DROP VIEW IF EXISTS v_teammate_edges_by_team")
    cursor.execute("DROP VIEW IF EXISTS v_teammate_edges")
    cursor.execute("DROP TABLE IF EXISTS teammate_overlaps")
    conn.commit()
    conn.close()

    # Reopen connection to refresh schema cache
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE teammate_overlaps AS
        WITH normalized AS (
            SELECT
                player_id,
                team_id,
                season_id,
                start_date,
                COALESCE(end_date, DATE('now')) AS end_date
            FROM fact_roster
        )
        SELECT
            a.player_id AS player_a_id,
            b.player_id AS player_b_id,
            a.team_id,
            a.season_id,
            MAX(a.start_date, b.start_date) AS overlap_start,
            MIN(a.end_date, b.end_date) AS overlap_end,
            CAST(JULIANDAY(MIN(a.end_date, b.end_date))
               - JULIANDAY(MAX(a.start_date, b.start_date)) AS INTEGER) AS overlap_days
        FROM normalized a
        JOIN normalized b
            ON a.team_id = b.team_id
           AND a.season_id = b.season_id
           AND a.player_id < b.player_id
        WHERE MAX(a.start_date, b.start_date) < MIN(a.end_date, b.end_date)
          AND CAST(JULIANDAY(MIN(a.end_date, b.end_date))
               - JULIANDAY(MAX(a.start_date, b.start_date)) AS INTEGER) >= 14
    """)

    cursor.execute("""
        CREATE VIEW IF NOT EXISTS v_teammate_edges AS
        SELECT
            player_a_id,
            player_b_id,
            COUNT(DISTINCT team_id || '-' || season_id) AS seasons_together,
            SUM(overlap_days) AS total_overlap_days
        FROM teammate_overlaps
        GROUP BY player_a_id, player_b_id
    """)

    cursor.execute("""
        CREATE VIEW IF NOT EXISTS v_teammate_edges_by_team AS
        SELECT
            player_a_id,
            player_b_id,
            team_id,
            COUNT(DISTINCT season_id) AS seasons_together,
            SUM(overlap_days) AS total_overlap_days
        FROM teammate_overlaps
        GROUP BY player_a_id, player_b_id, team_id
    """)

    conn.commit()
    conn.close()


def main():
    start_time = time.time()

    create_index()
    extract_teammate_overlaps()

    elapsed = time.time() - start_time

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM teammate_overlaps")
    total_overlaps = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM v_teammate_edges")
    unique_edges = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM v_teammate_edges_by_team")
    team_edges = cursor.fetchone()[0]

    conn.close()

    print(f"Teammate extraction completed in {elapsed:.2f} seconds")
    print(f"Total overlaps (>=14 days): {total_overlaps}")
    print(f"Unique player-pair edges: {unique_edges}")
    print(f"Player-pair-team edges: {team_edges}")

    if elapsed > 30:
        print("WARNING: Extraction took longer than 30 seconds")

    return {
        "elapsed_seconds": elapsed,
        "total_overlaps": total_overlaps,
        "unique_edges": unique_edges,
        "team_edges": team_edges,
    }


if __name__ == "__main__":
    main()
