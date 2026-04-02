import os
import sqlite3
import networkx as nx
from collections import defaultdict


DB_PATH = os.path.join(os.path.dirname(__file__), "..", "db", "nba_raw_data.db")


def get_db_connection(db_path=None):
    if db_path is None:
        db_path = DB_PATH
    return sqlite3.connect(db_path)


def compute_era(first_year, last_year):
    if first_year is None or last_year is None:
        return "Unknown"

    decades = []
    for year in range(first_year, last_year + 1):
        decade = (year // 10) * 10
        if decade not in decades:
            decades.append(decade)

    if len(decades) == 1:
        return f"{decades[0]}s"
    elif len(decades) == 2:
        return f"{decades[0]}s-{decades[1]}s"
    else:
        return f"{decades[0]}s-{decades[-1]}s"


def get_player_career_span(conn, player_id):
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT MIN(start_year), MAX(end_year)
        FROM fact_roster fr
        JOIN dim_season ds ON fr.season_id = ds.season_id
        WHERE fr.player_id = ?
    """,
        (player_id,),
    )
    result = cursor.fetchone()
    if result and result[0] and result[1]:
        return result[0], result[1]
    return None, None


def build_graph(db_path=None):
    if db_path is None:
        db_path = DB_PATH

    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    G = nx.Graph()

    cursor.execute(
        "SELECT player_id, full_name, position, is_active, hof, draft_year FROM dim_player"
    )
    players = cursor.fetchall()

    for player_id, full_name, position, is_active, hof, draft_year in players:
        first_year, last_year = get_player_career_span(conn, player_id)
        era = compute_era(first_year, last_year)

        G.add_node(
            player_id,
            id=player_id,
            label=full_name,
            position=position or "Unknown",
            era=era,
            is_active=bool(is_active),
            hof=bool(hof),
            draft_year=draft_year,
        )

    cursor.execute(
        "SELECT team_id, abbreviation, full_name, color_primary FROM dim_team"
    )
    teams = {
        row[0]: {"abbreviation": row[1], "full_name": row[2], "color_primary": row[3]}
        for row in cursor.fetchall()
    }

    cursor.execute("""
        SELECT 
            player_a_id,
            player_b_id,
            team_id,
            COUNT(DISTINCT season_id) AS seasons_together,
            SUM(overlap_days) AS total_overlap_days,
            GROUP_CONCAT(DISTINCT season_id) as season_ids
        FROM teammate_overlaps
        GROUP BY player_a_id, player_b_id, team_id
    """)

    edge_agg = defaultdict(lambda: {"weight": 0, "total_days": 0, "teams": []})

    for row in cursor.fetchall():
        player_a, player_b, team_id, seasons_together, total_overlap, season_ids_str = (
            row
        )
        edge_key = (min(player_a, player_b), max(player_a, player_b))

        edge_agg[edge_key]["weight"] += seasons_together
        edge_agg[edge_key]["total_days"] += total_overlap

        team_info = teams.get(team_id, {"abbreviation": "UNK", "full_name": "Unknown"})

        season_ids = season_ids_str.split(",") if season_ids_str else []

        edge_agg[edge_key]["teams"].append(
            {
                "team_id": team_id,
                "team_name": team_info["full_name"],
                "team_abbreviation": team_info["abbreviation"],
                "seasons": season_ids,
                "overlap_days": total_overlap,
            }
        )

    for (player_a, player_b), data in edge_agg.items():
        G.add_edge(
            player_a,
            player_b,
            weight=data["weight"],
            teams=data["teams"],
            total_days=data["total_days"],
        )

    conn.close()
    return G


if __name__ == "__main__":
    G = build_graph()
    print(f"Graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
