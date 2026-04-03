import os
import sqlite3


def test_db_connection():
    db_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "db", "nba_raw_data.db"
    )
    db_path = os.path.abspath(db_path)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    conn.close()

    assert len(tables) > 0, "Database should have tables"
