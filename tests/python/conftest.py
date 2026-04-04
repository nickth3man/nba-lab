import json
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = PROJECT_ROOT / "scripts"

VALID_SAMPLE_NODES = [
    {
        "id": "player_001",
        "label": "Test Player 1",
        "x": 100.0,
        "y": 200.0,
        "size": 15,
        "color": "#FF5733",
        "position": "PG",
        "era": "2020s",
        "is_active": True,
        "hof": False,
        "draft_year": 2020,
        "degree": 25,
        "betweenness": 0.15,
        "community": 1,
    },
    {
        "id": "player_002",
        "label": "Test Player 2",
        "x": 150.0,
        "y": 250.0,
        "size": 12,
        "color": "#33FF57",
        "position": "SG",
        "era": "2010s",
        "is_active": False,
        "hof": True,
        "draft_year": 2015,
        "degree": 18,
        "betweenness": 0.08,
        "community": 2,
    },
]

VALID_SAMPLE_EDGES = [
    {
        "id": "edge_001",
        "source": "player_001",
        "target": "player_002",
        "weight": 3.5,
        "teams": [
            {
                "team_id": "LAL",
                "team_name": "Los Angeles Lakers",
                "team_abbreviation": "LAL",
                "seasons": ["2020-21", "2021-22", "2022-23"],
                "overlap_days": 365,
            },
        ],
        "total_days": 365,
        "size": 8,
    },
]

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


@pytest.fixture(scope="function")
def sample_data_dir(tmp_path: Path) -> Path:
    """Create sample nodes and edges JSON files in temp directory."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()

    nodes_file = data_dir / "sample_nodes.json"
    nodes_file.write_text(json.dumps(VALID_SAMPLE_NODES, indent=2))

    edges_file = data_dir / "sample_edges.json"
    edges_file.write_text(json.dumps(VALID_SAMPLE_EDGES, indent=2))

    return data_dir
