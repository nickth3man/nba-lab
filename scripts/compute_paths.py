"""
Pre-compute Shortest Paths for NBA Teammate Network

Computes BFS shortest paths from top 100 players (by degree centrality) to all reachable nodes.
Output: data/paths.json with structure {source_player: {target_player: [path]}}

Run as part of build pipeline before npm run build.
"""

import json
import os
import sys

import networkx as nx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from build_graph import build_graph
from compute_metrics import compute_centrality


def compute_paths(G, top_n=100, max_path_length=10):
    """
    Compute BFS shortest paths from top N players to all reachable nodes.

    Args:
        G: NetworkX Graph with player nodes
        top_n: Number of top players to use as path sources
        max_path_length: Maximum path length to consider

    Returns:
        dict: {source_player: {target_player: [path_nodes]}}
    """
    metrics = compute_centrality(G)
    sorted_players = sorted(metrics.items(), key=lambda x: x[1]["degree"], reverse=True)
    top_players = [player_id for player_id, _ in sorted_players[:top_n]]

    paths_data = {}

    print(f"Computing paths from {len(top_players)} source players...")

    for i, source in enumerate(top_players):
        if (i + 1) % 10 == 0:
            print(f"  Progress: {i + 1}/{len(top_players)} sources processed")

        paths_from_source = {}

        try:
            lengths = nx.single_source_shortest_path_length(G, source, cutoff=max_path_length)

            for target, length in lengths.items():
                if target != source and length > 0:
                    try:
                        path = nx.shortest_path(G, source, target)
                        paths_from_source[target] = path
                    except nx.NetworkXNoPath:
                        pass
        except Exception as e:
            print(f"  Warning: Error computing paths from {source}: {e}")

        if paths_from_source:
            paths_data[source] = paths_from_source

    print(f"Computed paths for {len(paths_data)} source players")
    return paths_data


def main():
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(data_dir, exist_ok=True)
    output_path = os.path.join(data_dir, "paths.json")

    print("Building graph...")
    G = build_graph()
    print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    print("Computing shortest paths...")
    paths_data = compute_paths(G, top_n=100, max_path_length=10)

    print(f"Writing paths to {output_path}...")
    with open(output_path, "w") as f:
        json.dump(paths_data, f)

    print(f"Done! Wrote {len(paths_data)} source players with paths.")

    total_paths = sum(len(targets) for targets in paths_data.values())
    print(f"Total path entries: {total_paths}")


if __name__ == "__main__":
    main()
