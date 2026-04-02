import os
import json
import sqlite3
import pytest
from datetime import datetime


def get_db_path():
    return os.path.join(os.path.dirname(__file__), "..", "..", "db", "nba_raw_data.db")


def get_report_path():
    return os.path.join(
        os.path.dirname(__file__), "..", "..", "data", "validation_report.json"
    )


def get_script_path():
    return os.path.join(
        os.path.dirname(__file__), "..", "..", "scripts", "validate_db.py"
    )


class TestValidateDB:
    """TDD tests for validate_db.py"""

    def test_script_exists(self):
        """Test that validate_db.py script exists"""
        script_path = get_script_path()
        assert os.path.exists(script_path), f"Script should exist at {script_path}"

    def test_validation_report_exists(self):
        """Test that validation report is generated"""
        report_path = get_report_path()
        # Run the script first if report doesn't exist
        if not os.path.exists(report_path):
            import subprocess

            script_path = get_script_path()
            subprocess.run(
                ["venv/Scripts/python.exe", script_path],
                cwd=os.path.join(os.path.dirname(__file__), "..", ".."),
                capture_output=True,
            )
        assert os.path.exists(report_path), "validation_report.json should exist"

    def test_validation_report_valid_json(self):
        """Test that validation report is valid JSON"""
        report_path = get_report_path()
        # Ensure report exists
        if not os.path.exists(report_path):
            import subprocess

            script_path = get_script_path()
            subprocess.run(
                ["venv/Scripts/python.exe", script_path],
                cwd=os.path.join(os.path.dirname(__file__), "..", ".."),
                capture_output=True,
            )
        with open(report_path, "r") as f:
            report = json.load(f)
        assert isinstance(report, dict), "Report should be a JSON object"

    def test_validation_report_has_checks_and_summary(self):
        """Test that report has 'checks' list and 'summary' dict"""
        report_path = get_report_path()
        if not os.path.exists(report_path):
            import subprocess

            script_path = get_script_path()
            subprocess.run(
                ["venv/Scripts/python.exe", script_path],
                cwd=os.path.join(os.path.dirname(__file__), "..", ".."),
                capture_output=True,
            )
        with open(report_path, "r") as f:
            report = json.load(f)
        assert "checks" in report, "Report should have 'checks' key"
        assert "summary" in report, "Report should have 'summary' key"
        assert isinstance(report["checks"], list), "'checks' should be a list"
        assert isinstance(report["summary"], dict), "'summary' should be a dict"

    def test_eight_checks_present(self):
        """Test that all 8 validation checks are present"""
        report_path = get_report_path()
        if not os.path.exists(report_path):
            import subprocess

            script_path = get_script_path()
            subprocess.run(
                ["venv/Scripts/python.exe", script_path],
                cwd=os.path.join(os.path.dirname(__file__), "..", ".."),
                capture_output=True,
            )
        with open(report_path, "r") as f:
            report = json.load(f)
        expected_checks = [
            "no_duplicate_roster_entries",
            "player_id_foreign_key",
            "team_id_foreign_key",
            "season_id_foreign_key",
            "date_consistency",
            "date_granularity",
            "team_relocation",
            "summary_counts",
        ]
        actual_checks = [check["name"] for check in report["checks"]]
        for expected in expected_checks:
            assert expected in actual_checks, f"Missing check: {expected}"

    def test_all_checks_have_status(self):
        """Test that each check has a 'status' field with pass or fail"""
        report_path = get_report_path()
        if not os.path.exists(report_path):
            import subprocess

            script_path = get_script_path()
            subprocess.run(
                ["venv/Scripts/python.exe", script_path],
                cwd=os.path.join(os.path.dirname(__file__), "..", ".."),
                capture_output=True,
            )
        with open(report_path, "r") as f:
            report = json.load(f)
        for check in report["checks"]:
            assert "status" in check, (
                f"Check {check.get('name', 'unknown')} missing 'status'"
            )
            assert check["status"] in ["pass", "fail"], (
                f"Check status should be 'pass' or 'fail'"
            )

    def test_summary_has_required_fields(self):
        """Test that summary contains total_roster_entries, unique_players, unique_teams, season_range"""
        report_path = get_report_path()
        if not os.path.exists(report_path):
            import subprocess

            script_path = get_script_path()
            subprocess.run(
                ["venv/Scripts/python.exe", script_path],
                cwd=os.path.join(os.path.dirname(__file__), "..", ".."),
                capture_output=True,
            )
        with open(report_path, "r") as f:
            report = json.load(f)
        summary = report["summary"]
        required_fields = [
            "total_roster_entries",
            "unique_players",
            "unique_teams",
            "season_range",
        ]
        for field in required_fields:
            assert field in summary, f"Summary should have '{field}'"

    def test_summary_values_reasonable(self):
        """Test that summary values are reasonable (database has data)"""
        report_path = get_report_path()
        if not os.path.exists(report_path):
            import subprocess

            script_path = get_script_path()
            subprocess.run(
                ["venv/Scripts/python.exe", script_path],
                cwd=os.path.join(os.path.dirname(__file__), "..", ".."),
                capture_output=True,
            )
        with open(report_path, "r") as f:
            report = json.load(f)
        summary = report["summary"]
        # We expect thousands of roster entries, hundreds of players, ~30 teams
        assert summary["total_roster_entries"] > 1000, (
            "Should have > 1000 roster entries"
        )
        assert summary["unique_players"] > 100, "Should have > 100 unique players"
        assert summary["unique_teams"] > 10, "Should have > 10 unique teams"
        # Season range should be YYYY-YYYY format
        assert "-" in summary["season_range"], "Season range should be YYYY-YYYY format"
