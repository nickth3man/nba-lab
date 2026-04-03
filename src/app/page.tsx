"use client";

import dynamic from "next/dynamic";
import PlayerTooltip from "@/components/PlayerTooltip";
import SearchBar from "@/components/SearchBar";
import Filters from "@/components/Filters";
import ShortestPath from "@/components/ShortestPath";
import { useNetworkPageState } from "./use-network-page-state";
import styles from "./page.module.css";

const NetworkGraph = dynamic(() => import("@/components/NetworkGraph"), {
  ssr: false,
});

export default function Home() {
  const {
    graphData,
    fullGraphData,
    displayedPlayer,
    effectiveHighlightedNode,
    handleSearchSelect,
    handleFilterChange,
    handleGraphDataLoaded,
    handlePathChange,
    handleHighlightPath,
    handleNodeHover,
    handleNodeClick,
    handleTooltipClose,
    handleHighlight,
  } = useNetworkPageState();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>NBA Teammate Network</h1>
        <p className={styles.subtitle}>
          Interactive visualization of NBA player teammate relationships (1946-2026)
        </p>
      </header>
      <main className={styles.main}>
        <div className={styles.controls}>
          <div className={styles.searchBarContainer}>
            {graphData && <SearchBar data={graphData} onSelect={handleSearchSelect} />}
          </div>
          <div className={styles.filtersContainer}>
            {fullGraphData && <Filters data={fullGraphData} onFilterChange={handleFilterChange} />}
          </div>
          <div className={styles.shortestPathContainer}>
            {graphData && (
              <ShortestPath
                data={graphData}
                onPathChange={handlePathChange}
                onHighlightPath={handleHighlightPath}
              />
            )}
          </div>
        </div>
        <div className={styles.graphContainer}>
          <NetworkGraph
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
            externalGraphData={graphData}
            onGraphDataLoaded={handleGraphDataLoaded}
            highlightedNode={effectiveHighlightedNode}
          />
        </div>
        {displayedPlayer && (
          <PlayerTooltip
            player={displayedPlayer}
            graphData={graphData}
            onClose={handleTooltipClose}
            onHighlight={handleHighlight}
          />
        )}
      </main>
    </div>
  );
}
