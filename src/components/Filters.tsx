'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { filterByEra, filterByTeam, filterByPosition } from '@/lib/graph-data';
import { TEAM_COLORS } from '@/config/team-colors';
import type { GraphData } from '@/lib/graph-types';

const ERA_BUCKETS = ['1940s-1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
const POSITION_OPTIONS = ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F'];

interface FiltersProps {
  data: GraphData;
  onFilterChange: (filteredData: GraphData) => void;
}

export default function Filters({ data, onFilterChange }: FiltersProps) {
  const [selectedEra, setSelectedEra] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());

  const applyFilters = useCallback(() => {
    let result = data;

    if (selectedEra) {
      result = filterByEra(result, selectedEra);
    }

    if (selectedTeam) {
      result = filterByTeam(result, selectedTeam);
    }

    if (selectedPositions.size > 0) {
      const positionArray = Array.from(selectedPositions);
      positionArray.forEach(pos => {
        result = filterByPosition(result, pos);
      });
    }

    onFilterChange(result);
  }, [data, selectedEra, selectedTeam, selectedPositions, onFilterChange]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleEraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEra(e.target.value);
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam(e.target.value);
  };

  const handlePositionToggle = (position: string) => {
    setSelectedPositions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(position)) {
        newSet.delete(position);
      } else {
        newSet.add(position);
      }
      return newSet;
    });
  };

  const handleReset = () => {
    setSelectedEra('');
    setSelectedTeam('');
    setSelectedPositions(new Set());
  };

  return (
    <div style={containerStyle}>
      <div style={filterGroupStyle}>
        <label htmlFor="era-filter" style={labelStyle}>Era</label>
        <select
          id="era-filter"
          value={selectedEra}
          onChange={handleEraChange}
          style={selectStyle}
        >
          <option value="">All Eras</option>
          {ERA_BUCKETS.map(era => (
            <option key={era} value={era}>{era}</option>
          ))}
        </select>
      </div>

      <div style={filterGroupStyle}>
        <label htmlFor="team-filter" style={labelStyle}>Team</label>
        <select
          id="team-filter"
          value={selectedTeam}
          onChange={handleTeamChange}
          style={selectStyle}
        >
          <option value="">All Teams</option>
          {TEAM_COLORS.map(team => (
            <option key={team.team_id} value={team.abbreviation}>
              {team.abbreviation}
            </option>
          ))}
        </select>
      </div>

      <div style={filterGroupStyle}>
        <span id="position-label" style={labelStyle}>Position</span>
        <fieldset style={checkboxGroupStyle} aria-labelledby="position-label">
          <legend className="sr-only">Position</legend>
          {POSITION_OPTIONS.map(pos => (
            <label key={pos} style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={selectedPositions.has(pos)}
                onChange={() => handlePositionToggle(pos)}
                style={checkboxStyle}
              />
              {pos}
            </label>
          ))}
        </fieldset>
      </div>

      <button
        onClick={handleReset}
        style={resetButtonStyle}
        type="button"
      >
        Reset All
      </button>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  alignItems: 'flex-start',
  padding: '12px 16px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
};

const filterGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#555',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: '14px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  backgroundColor: '#fff',
  minWidth: '140px',
  cursor: 'pointer',
};

const checkboxGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px 16px',
  marginTop: '4px',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '14px',
  cursor: 'pointer',
};

const checkboxStyle: React.CSSProperties = {
  cursor: 'pointer',
};

const resetButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#666',
  backgroundColor: '#fff',
  border: '1px solid #ccc',
  borderRadius: '6px',
  cursor: 'pointer',
  marginTop: '22px',
  transition: 'background-color 0.2s',
};
