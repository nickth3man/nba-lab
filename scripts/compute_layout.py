"""
Layout Computation for NBA Teammate Graph

Computes:
- Louvain community detection
- ForceAtlas2 layout (or NetworkX spring_layout fallback)
- Node x, y coordinates
- Node sizes based on degree centrality (scale: 3-15)
- Node colors based on community

Returns dict: {player_id: {x, y, size, color, community}}
"""

import networkx as nx
import community as community_louvain


def generate_community_colors(num_communities):
    """
    Generate distinct hex colors for each community using HSL color space.

    Args:
        num_communities: Number of distinct colors needed

    Returns:
        dict: {community_id: hex_color_string}
    """
    colors = {}
    for i in range(num_communities):
        # Use HSL to generate evenly spaced hues
        # Hue: 0-360 degrees, Saturation: 70%, Lightness: 55%
        hue = (i * 360) / max(num_communities, 1)
        saturation = 70
        lightness = 55

        # Convert HSL to RGB
        h = hue / 360
        s = saturation / 100
        l = lightness / 100

        def hue_to_rgb(p, q, t):
            if t < 0:
                t += 1
            if t > 1:
                t -= 1
            if t < 1 / 6:
                return p + (q - p) * 6 * t
            if t < 1 / 2:
                return q
            if t < 2 / 3:
                return p + (q - p) * (2 / 3 - t) * 6
            return p

        q_val = l * (1 + s) if l < 0.5 else l + s - l * s
        p_val = 2 * l - q_val

        r = hue_to_rgb(p_val, q_val, h + 1 / 3)
        g = hue_to_rgb(p_val, q_val, h)
        b = hue_to_rgb(p_val, q_val, h - 1 / 3)

        # Convert to hex
        def to_hex(val):
            return f"{int(val * 255):02X}"

        colors[i] = f"#{to_hex(r)}{to_hex(g)}{to_hex(b)}"

    return colors


def merge_small_communities(G, partition, target_min=5, target_max=50):
    """
    Merge small communities into larger ones to achieve target community count.

    Args:
        G: NetworkX Graph
        partition: dict {node_id: community_id}
        target_min: Minimum desired communities
        target_max: Maximum desired communities

    Returns:
        dict: {node_id: merged_community_id}
    """
    # Count nodes per community
    community_nodes = {}
    for node, comm in partition.items():
        if comm not in community_nodes:
            community_nodes[comm] = []
        community_nodes[comm].append(node)

    # Keep merging smallest communities until we reach target
    while len(community_nodes) < target_min or len(community_nodes) > target_max:
        if len(community_nodes) <= target_min:
            break

        # Find smallest community
        smallest_comm = min(
            community_nodes.keys(), key=lambda c: len(community_nodes[c])
        )
        smallest_nodes = community_nodes[smallest_comm]

        if len(smallest_nodes) == 0:
            break

        # Count edges from smallest community to each other community
        edge_counts = {}
        for node in smallest_nodes:
            for neighbor in G.neighbors(node):
                neighbor_comm = partition.get(neighbor)
                if neighbor_comm is not None and neighbor_comm != smallest_comm:
                    edge_counts[neighbor_comm] = edge_counts.get(neighbor_comm, 0) + 1

        # Find neighbor with most edges
        if edge_counts:
            neighbor_comm = max(edge_counts.keys(), key=lambda c: edge_counts[c])
        else:
            # No edges to other communities - pick any other community
            for c in community_nodes:
                if c != smallest_comm and len(community_nodes[c]) > 0:
                    neighbor_comm = c
                    break
            else:
                break

        if neighbor_comm is None or neighbor_comm not in community_nodes:
            break

        # Merge smallest into neighbor
        for node in smallest_nodes:
            partition[node] = neighbor_comm

        del community_nodes[smallest_comm]

    # Renumber communities to be 0-indexed consecutive
    unique_comms = sorted(set(partition.values()))
    comm_mapping = {old: new for new, old in enumerate(unique_comms)}
    for node in partition:
        partition[node] = comm_mapping[partition[node]]

    return partition


def compute_layout(G):
    """
    Compute layout data for the graph including community detection,
    layout coordinates, node sizes, and colors.

    Args:
        G: NetworkX Graph with player nodes

    Returns:
        dict: {player_id: {x, y, size, color, community}}
    """
    layout_data = {}

    # Step 1: Run Louvain community detection
    partition = community_louvain.best_partition(G)

    # Step 1b: Merge small communities to get 5-50 communities
    partition = merge_small_communities(G, partition, target_min=5, target_max=50)

    # Get unique communities and generate colors
    unique_communities = set(partition.values())
    community_colors = generate_community_colors(len(unique_communities))

    # Step 2: Compute degree centrality for node sizing
    degree_centrality = nx.degree_centrality(G)
    max_degree_cent = max(degree_centrality.values()) if degree_centrality else 1
    min_degree_cent = min(degree_centrality.values()) if degree_centrality else 0
    degree_range = (
        max_degree_cent - min_degree_cent if max_degree_cent != min_degree_cent else 1
    )

    # Step 3: Use spectral layout (fast, no scipy required)
    # Fall back to random layout if that fails
    try:
        positions = nx.spectral_layout(G)
    except Exception:
        positions = nx.random_layout(G, seed=42)

    # Normalize coordinates to -1000 to 1000 range
    if positions:
        # Get all x and y values
        all_x = [pos[0] for pos in positions.values()]
        all_y = [pos[1] for pos in positions.values()]

        x_min, x_max = min(all_x), max(all_x)
        y_min, y_max = min(all_y), max(all_y)

        x_range = x_max - x_min if x_max != x_min else 1
        y_range = y_max - y_min if y_max != y_min else 1
        max_range = max(x_range, y_range)

        for node_id in G.nodes():
            if node_id in positions:
                raw_x, raw_y = positions[node_id]

                # Normalize to -1000 to 1000
                # First normalize to 0-1, then scale to -1000 to 1000
                norm_x = (raw_x - x_min) / x_range if x_range != 0 else 0.5
                norm_y = (raw_y - y_min) / y_range if y_range != 0 else 0.5

                # Scale to -1000 to 1000
                x = (norm_x * 2 - 1) * 1000
                y = (norm_y * 2 - 1) * 1000
            else:
                x, y = 0, 0

            # Compute node size (scale degree centrality to 3-15)
            degree_cent = degree_centrality.get(node_id, 0)
            normalized_degree = (degree_cent - min_degree_cent) / degree_range
            size = 3 + normalized_degree * 12  # Scale 3-15

            # Get community and color
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
    # Test with build_graph
    from build_graph import build_graph

    print("Building graph...")
    G = build_graph()
    print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    print("Computing layout...")
    layout_data = compute_layout(G)
    print(f"Computed layout for {len(layout_data)} players")

    # Show community statistics
    communities = {}
    for node_data in layout_data.values():
        comm_id = node_data["community"]
        communities[comm_id] = communities.get(comm_id, 0) + 1

    print(f"\nCommunities: {len(communities)}")
    print(
        f"Community sizes: min={min(communities.values())}, max={max(communities.values())}"
    )

    # Show size statistics
    sizes = [node_data["size"] for node_data in layout_data.values()]
    print(f"\nNode sizes: min={min(sizes):.2f}, max={max(sizes):.2f}")

    # Show coordinate ranges
    all_x = [node_data["x"] for node_data in layout_data.values()]
    all_y = [node_data["y"] for node_data in layout_data.values()]
    print(f"X range: [{min(all_x):.2f}, {max(all_x):.2f}]")
    print(f"Y range: [{min(all_y):.2f}, {max(all_y):.2f}]")
