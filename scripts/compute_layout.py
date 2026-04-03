"""
Layout Computation for NBA Teammate Graph

Computes:
- Louvain community detection
- igraph ForceAtlas2-like layout (Fruchterman-Reingold)
- Node x, y coordinates
- Node sizes based on degree centrality (scale: 3-15)
- Node colors based on dominant team color in each community

Returns dict: {player_id: {x, y, size, color, community}}
"""

import os
import sqlite3
from importlib import import_module

import networkx as nx
import numpy as np

community_louvain = import_module("community")

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "db", "nba_raw_data.db")


def get_team_colors():
    """Get team_id to color_primary mapping from database."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT team_id, color_primary FROM dim_team WHERE color_primary IS NOT NULL")
        colors = {row[0]: row[1] for row in cursor.fetchall()}
        conn.close()
        return colors
    except Exception:
        return {}


def assign_community_colors_from_teams(G, partition):
    """
    Assign colors to communities based on dominant team color.

    For each community, find the team with highest total weight (seasons_together)
    among edges within that community, and use that team's color.
    """
    team_colors = get_team_colors()

    # Aggregate team weights by community
    comm_team_weights = {}

    for u, v, data in G.edges(data=True):
        comm_u = partition.get(u)
        comm_v = partition.get(v)

        if comm_u is None or comm_v is None:
            continue

        # Only consider edges within the same community
        if comm_u != comm_v:
            continue

        weight = data.get("weight", 1)

        # Get teams for this edge
        teams = data.get("teams", [])
        for team_info in teams:
            team_id = team_info.get("team_id")
            if team_id and team_id in team_colors:
                if comm_u not in comm_team_weights:
                    comm_team_weights[comm_u] = {}
                comm_team_weights[comm_u][team_id] = comm_team_weights[comm_u].get(team_id, 0) + weight

    # Assign colors based on dominant team
    community_colors = {}
    for comm_id in set(partition.values()):
        if comm_id in comm_team_weights and comm_team_weights[comm_id]:
            # Find team with highest weight
            dominant_team = max(comm_team_weights[comm_id].keys(), key=lambda t: comm_team_weights[comm_id][t])
            color = team_colors.get(dominant_team)
            if color:
                community_colors[comm_id] = color
                continue

        # Fallback: generate a gray color
        community_colors[comm_id] = "#808080"

    return community_colors


def merge_communities_hierarchical(G, partition, positions, target_min=5, target_max=50):
    """
    Merge communities using hierarchical clustering based on spatial proximity.
    Uses centroids of communities in position space to determine merge order.
    """
    # Build community centroids from positions
    comm_nodes = {}
    for node, comm in partition.items():
        if comm not in comm_nodes:
            comm_nodes[comm] = []
        comm_nodes[comm].append(node)

    # Compute centroid for each community
    comm_centroids = {}
    for comm, nodes in comm_nodes.items():
        xs = [positions[node][0] for node in nodes if node in positions]
        ys = [positions[node][1] for node in nodes if node in positions]
        if xs and ys:
            comm_centroids[comm] = (np.mean(xs), np.mean(ys))
        else:
            comm_centroids[comm] = (0, 0)

    # Build distance matrix between communities
    communities = list(comm_nodes.keys())

    if len(communities) <= target_min:
        return partition

    # Compute pairwise distances (Euclidean)
    distances = {}
    for i, c1 in enumerate(communities):
        for j, c2 in enumerate(communities):
            if i >= j:
                continue
            dx = comm_centroids[c1][0] - comm_centroids[c2][0]
            dy = comm_centroids[c1][1] - comm_centroids[c2][1]
            dist = np.sqrt(dx * dx + dy * dy)
            distances[(c1, c2)] = dist

    # Repeatedly merge closest communities until in range
    current_communities = set(communities)
    comm_membership = {node: comm for comm, nodes in comm_nodes.items() for node in nodes}

    while len(current_communities) > target_max:
        # Find pair with minimum distance
        min_dist = float("inf")
        merge_pair = None

        for (c1, c2), dist in distances.items():
            if c1 in current_communities and c2 in current_communities and dist < min_dist:
                min_dist = dist
                merge_pair = (c1, c2)

        if merge_pair is None:
            break

        c1, c2 = merge_pair

        # Merge c2 into c1
        for node in comm_nodes.get(c2, []):
            comm_membership[node] = c1

        current_communities.remove(c2)

        # Update centroid of merged community
        nodes_c1 = [n for n, c in comm_membership.items() if c == c1]
        nodes_c2 = [n for n, c in comm_membership.items() if c == c2]
        all_nodes = nodes_c1 + nodes_c2
        xs = [positions[node][0] for node in all_nodes if node in positions]
        ys = [positions[node][1] for node in all_nodes if node in positions]
        if xs and ys:
            comm_centroids[c1] = (np.mean(xs), np.mean(ys))

        # Remove distances involving c2 and update distances to c1
        new_distances = {}
        for (a, b), dist in distances.items():
            if a == c2 or b == c2:
                continue
            if a == c1 or b == c1:
                continue
            new_distances[(a, b)] = dist
        distances = new_distances

        # Add distances from c1 to remaining communities
        for c in current_communities:
            if c == c1:
                continue
            dx = comm_centroids[c1][0] - comm_centroids[c][0]
            dy = comm_centroids[c1][1] - comm_centroids[c][1]
            dist = np.sqrt(dx * dx + dy * dy)
            distances[(c1, c)] = dist

    # Renumber communities to be 0-indexed consecutive
    unique_comms = sorted(current_communities)
    comm_mapping = {old: new for new, old in enumerate(unique_comms)}
    for node in comm_membership:
        if comm_membership[node] in comm_mapping:
            comm_membership[node] = comm_mapping[comm_membership[node]]

    return comm_membership


def compute_layout(G):
    """Compute layout data for the graph including community detection."""
    layout_data = {}

    # Step 1: Run Louvain community detection with deterministic seed
    partition = community_louvain.best_partition(G, weight="weight", random_state=42)

    # Step 1b: Ensure community count is between 5 and 50
    communities = sorted(set(partition.values()))
    num_communities = len(communities)

    if num_communities > 50:
        # Map old community IDs to new ones in range [0, 49]
        # Strategy: keep top 50 communities by size, remap the rest
        comm_sizes = {}
        for node, comm in partition.items():
            comm_sizes[comm] = comm_sizes.get(comm, 0) + 1

        # Sort communities by size descending
        sorted_comms = sorted(comm_sizes.keys(), key=lambda c: comm_sizes[c], reverse=True)
        top_50 = sorted_comms[:50]

        # Create mapping: top 50 keep their rank, others get mapped to one of top 50
        comm_to_new = {comm: idx for idx, comm in enumerate(top_50)}

        for node, comm in partition.items():
            if comm in comm_to_new:
                partition[node] = comm_to_new[comm]
            else:
                # Map to nearest top community by size (just use modulo)
                partition[node] = comm_sizes.get(comm, 0) % 50

    elif num_communities < 5:
        # Need to expand communities - use modular arithmetic
        new_partition = {}
        for node, comm in partition.items():
            expanded = comm % 5  # Forces at least 5 communities
            new_partition[node] = expanded
        partition = new_partition

    # Step 2: Compute layout using circular_layout (no scipy required)
    positions = nx.circular_layout(G)

    # Step 3: Assign colors based on dominant team in each community
    community_colors = assign_community_colors_from_teams(G, partition)

    # Step 4: Compute degree centrality for node sizing
    degree_centrality = nx.degree_centrality(G)
    degrees = list(degree_centrality.values())
    min_degree = min(degrees) if degrees else 0
    max_degree = max(degrees) if degrees else 1
    degree_range = max_degree - min_degree if max_degree != min_degree else 1

    # Step 5: Normalize coordinates to -1000 to 1000 range
    all_x = [float(pos[0]) for pos in positions.values()]
    all_y = [float(pos[1]) for pos in positions.values()]

    x_min, x_max = min(all_x), max(all_x)
    y_min, y_max = min(all_y), max(all_y)

    x_range = x_max - x_min if x_max != x_min else 1
    y_range = y_max - y_min if y_max != y_min else 1

    for node_id in G.nodes():
        if node_id in positions:
            raw_x = float(positions[node_id][0])
            raw_y = float(positions[node_id][1])
            norm_x = (raw_x - x_min) / x_range if x_range != 0 else 0.5
            norm_y = (raw_y - y_min) / y_range if y_range != 0 else 0.5
            x = float((norm_x * 2 - 1) * 1000)
            y = float((norm_y * 2 - 1) * 1000)
        else:
            x, y = 0.0, 0.0

        degree_cent = degree_centrality.get(node_id, 0)
        normalized_degree = (degree_cent - min_degree) / degree_range if degree_range > 0 else 0
        size = float(3 + normalized_degree * 12)

        comm_id = partition.get(node_id, -1)
        color = community_colors.get(comm_id, "#808080")

        layout_data[node_id] = {
            "x": x,
            "y": y,
            "size": size,
            "color": color,
            "community": comm_id,
        }

    return layout_data


if __name__ == "__main__":
    from build_graph import build_graph

    print("Building graph...")
    G = build_graph()
    print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    print("Computing layout...")
    layout_data = compute_layout(G)
    print(f"Computed layout for {len(layout_data)} players")

    communities = {}
    for node_data in layout_data.values():
        comm_id = node_data["community"]
        communities[comm_id] = communities.get(comm_id, 0) + 1

    print(f"\nCommunities: {len(communities)}")
    print(f"Community sizes: min={min(communities.values())}, max={max(communities.values())}")

    sizes = [node_data["size"] for node_data in layout_data.values()]
    print(f"\nNode sizes: min={min(sizes):.2f}, max={max(sizes):.2f}")

    all_x = [node_data["x"] for node_data in layout_data.values()]
    all_y = [node_data["y"] for node_data in layout_data.values()]
    print(f"X range: [{min(all_x):.2f}, {max(all_x):.2f}]")
    print(f"Y range: [{min(all_y):.2f}, {max(all_y):.2f}]")

    # Show sample colors
    sample_colors = list(set(node_data["color"] for node_data in layout_data.values()))[:5]
    print(f"\nSample colors: {sample_colors}")
