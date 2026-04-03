import json
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = PROJECT_ROOT / "scripts"

if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


@pytest.fixture(scope="session")
def nba_graph():
    from scripts.build_graph import build_graph

    return build_graph()


@pytest.fixture(scope="session")
def nba_centrality(nba_graph):
    from scripts.compute_metrics import compute_centrality

    return compute_centrality(nba_graph)


@pytest.fixture(scope="session")
def nba_layout(nba_graph):
    from scripts.compute_layout import compute_layout

    return compute_layout(nba_graph)


@pytest.fixture(scope="session")
def validation_report():
    from scripts.validate_db import REPORT_PATH, run_validation

    report_path = Path(REPORT_PATH)
    if report_path.exists():
        with report_path.open() as file:
            return json.load(file)

    return run_validation()
