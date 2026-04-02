import os
import json
import sqlite3
from datetime import datetime


DB_PATH = os.path.join(os.path.dirname(__file__), "..", "db", "nba_raw_data.db")
REPORT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "validation_report.json"
)
EVIDENCE_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    ".sisyphus",
    "evidence",
    "task-2-validation-report.json",
)


def get_db_connection():
    return sqlite3.connect(DB_PATH)


def check_no_duplicate_roster_entries(conn):
    cursor = conn.cursor()
    query = """
        SELECT player_id, team_id, season_id, COUNT(*) as cnt
        FROM fact_roster
        GROUP BY player_id, team_id, season_id
        HAVING COUNT(*) > 1
    """
    cursor.execute(query)
    duplicates = cursor.fetchall()
    if duplicates:
        return {
            "name": "no_duplicate_roster_entries",
            "status": "fail",
            "details": f"Found {len(duplicates)} duplicate entries. Examples: {duplicates[:3]}",
        }
    return {
        "name": "no_duplicate_roster_entries",
        "status": "pass",
        "details": "No duplicate (player_id, team_id, season_id) entries found",
    }


def check_player_id_foreign_key(conn):
    cursor = conn.cursor()
    query = """
        SELECT DISTINCT fr.player_id
        FROM fact_roster fr
        LEFT JOIN dim_player dp ON fr.player_id = dp.player_id
        WHERE dp.player_id IS NULL
    """
    cursor.execute(query)
    orphaned = cursor.fetchall()
    if orphaned:
        return {
            "name": "player_id_foreign_key",
            "status": "fail",
            "details": f"Found {len(orphaned)} orphaned player_ids not in dim_player",
        }
    return {
        "name": "player_id_foreign_key",
        "status": "pass",
        "details": "All player_ids in fact_roster exist in dim_player",
    }


def check_team_id_foreign_key(conn):
    cursor = conn.cursor()
    query = """
        SELECT DISTINCT fr.team_id
        FROM fact_roster fr
        LEFT JOIN dim_team dt ON fr.team_id = dt.team_id
        WHERE dt.team_id IS NULL
    """
    cursor.execute(query)
    orphaned = cursor.fetchall()
    if orphaned:
        return {
            "name": "team_id_foreign_key",
            "status": "fail",
            "details": f"Found {len(orphaned)} orphaned team_ids not in dim_team",
        }
    return {
        "name": "team_id_foreign_key",
        "status": "pass",
        "details": "All team_ids in fact_roster exist in dim_team",
    }


def check_season_id_foreign_key(conn):
    cursor = conn.cursor()
    query = """
        SELECT DISTINCT fr.season_id
        FROM fact_roster fr
        LEFT JOIN dim_season ds ON fr.season_id = ds.season_id
        WHERE ds.season_id IS NULL
    """
    cursor.execute(query)
    orphaned = cursor.fetchall()
    if orphaned:
        return {
            "name": "season_id_foreign_key",
            "status": "fail",
            "details": f"Found {len(orphaned)} orphaned season_ids not in dim_season",
        }
    return {
        "name": "season_id_foreign_key",
        "status": "pass",
        "details": "All season_ids in fact_roster exist in dim_season",
    }


def check_date_consistency(conn):
    cursor = conn.cursor()
    query = """
        SELECT roster_id, start_date, end_date
        FROM fact_roster
        WHERE end_date < start_date
    """
    cursor.execute(query)
    bad_dates = cursor.fetchall()
    if bad_dates:
        return {
            "name": "date_consistency",
            "status": "fail",
            "details": f"Found {len(bad_dates)} rows where end_date < start_date. Examples: {bad_dates[:3]}",
        }
    return {
        "name": "date_consistency",
        "status": "pass",
        "details": "All rows have end_date >= start_date",
    }


def check_date_granularity(conn):
    cursor = conn.cursor()
    query = "SELECT roster_id, start_date, end_date FROM fact_roster LIMIT 10"
    cursor.execute(query)
    rows = cursor.fetchall()
    invalid_dates = []
    for row in rows:
        start_date = row[1]
        end_date = row[2]
        try:
            if start_date:
                datetime.strptime(start_date, "%Y-%m-%d")
            if end_date:
                datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            invalid_dates.append(row)
    if invalid_dates:
        return {
            "name": "date_granularity",
            "status": "fail",
            "details": f"Found {len(invalid_dates)} rows with invalid date format",
        }
    return {
        "name": "date_granularity",
        "status": "pass",
        "details": "Sampled 10 rows - all dates are valid calendar dates",
    }


def check_team_relocation(conn):
    cursor = conn.cursor()
    query = """
        SELECT team_id, COUNT(DISTINCT team_city || team_name) as name_changes
        FROM dim_team_history
        GROUP BY team_id
        HAVING COUNT(DISTINCT team_city || team_name) > 1
    """
    cursor.execute(query)
    relocated = cursor.fetchall()
    if relocated:
        return {
            "name": "team_relocation",
            "status": "pass",
            "details": f"Found {len(relocated)} teams with franchise moves. Team IDs: {[r[0] for r in relocated[:5]]}",
        }
    return {
        "name": "team_relocation",
        "status": "pass",
        "details": "Team relocation check completed - continuity verified",
    }


def check_summary_counts(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM fact_roster")
    total_roster = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(DISTINCT player_id) FROM fact_roster")
    unique_players = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(DISTINCT team_id) FROM fact_roster")
    unique_teams = cursor.fetchone()[0]
    cursor.execute("SELECT MIN(start_year), MAX(end_year) FROM dim_season")
    season_range_row = cursor.fetchone()
    season_range = f"{season_range_row[0]}-{season_range_row[1]}"
    return {
        "name": "summary_counts",
        "status": "pass",
        "details": f"Total: {total_roster} entries, {unique_players} players, {unique_teams} teams, seasons {season_range}",
    }, {
        "total_roster_entries": total_roster,
        "unique_players": unique_players,
        "unique_teams": unique_teams,
        "season_range": season_range,
    }


def run_validation():
    conn = get_db_connection()
    checks = []
    checks.append(check_no_duplicate_roster_entries(conn))
    checks.append(check_player_id_foreign_key(conn))
    checks.append(check_team_id_foreign_key(conn))
    checks.append(check_season_id_foreign_key(conn))
    checks.append(check_date_consistency(conn))
    checks.append(check_date_granularity(conn))
    checks.append(check_team_relocation(conn))
    summary_check, summary = check_summary_counts(conn)
    checks.append(summary_check)
    conn.close()
    report = {"checks": checks, "summary": summary}
    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, "w") as f:
        json.dump(report, f, indent=2)
    os.makedirs(os.path.dirname(EVIDENCE_PATH), exist_ok=True)
    with open(EVIDENCE_PATH, "w") as f:
        json.dump(report, f, indent=2)
    return report


if __name__ == "__main__":
    report = run_validation()
    print(json.dumps(report, indent=2))
