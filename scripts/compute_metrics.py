"""
Centrality Metrics Computation for NBA Teammate Graph

Computes:
- Degree centrality for all nodes
- Betweenness centrality (with sampling for large graphs >5K nodes)
- Connected components

Returns dict: {player_id: {degree, betweenness, component_id}}
"""

import networkx as nx


def compute_centrality(G):
    """
    Compute centrality metrics for all nodes in the graph.

    Args:
        G: NetworkX Graph with player nodes

    Returns:
        dict: {player_id: {degree, betweenness, component_id}}
    """
    metrics = {}

    # Compute degree centrality for all nodes
    degree_centrality = nx.degree_centrality(G)

    # Compute betweenness centrality
    # Use sampling for large graphs (>5K nodes) for performance
    # Reduced k for speed - betweenness is approximate anyway
    num_nodes = G.number_of_nodes()
    betweenness_centrality = nx.betweenness_centrality(G, k=100) if num_nodes > 3000 else nx.betweenness_centrality(G)

    # Compute connected components
    # Components are sorted by size (largest first), assign component_id by size rank
    connected_components = list(nx.connected_components(G))
    # Sort by size descending (largest component first)
    connected_components.sort(key=len, reverse=True)

    # Create mapping from node to component_id (0 = largest, 1 = second largest, etc.)
    node_to_component = {}
    for component_id, component in enumerate(connected_components):
        for node in component:
            node_to_component[node] = component_id

    # Build metrics dict for each node
    for node in G.nodes():
        metrics[node] = {
            "degree": degree_centrality[node],
            "betweenness": betweenness_centrality[node],
            "component_id": node_to_component[node],
        }

    return metrics


if __name__ == "__main__":
    # Test with build_graph
    import os
    import sys

    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
    from build_graph import build_graph

    print("Building graph...")
    G = build_graph()
    print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    print("Computing centrality metrics...")
    metrics = compute_centrality(G)
    print(f"Computed metrics for {len(metrics)} players")

    # Show top 10 by degree centrality
    sorted_by_degree = sorted(metrics.items(), key=lambda x: x[1]["degree"], reverse=True)[:10]

    print("\nTop 10 by Degree Centrality:")
    for player_id, data in sorted_by_degree:
        print(
            f"  {player_id}: degree={data['degree']:.4f}, "
            f"betweenness={data['betweenness']:.4f}, component={data['component_id']}"
        )
