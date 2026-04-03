export interface TeamColorEntry {
  team_id: string;
  abbreviation: string;
  full_name: string;
  color_primary: string;
}

export const TEAM_COLORS: TeamColorEntry[] = [
  {
    team_id: "1610612737",
    abbreviation: "ATL",
    full_name: "Atlanta Hawks",
    color_primary: "#E03A3E",
  },
  {
    team_id: "1610612738",
    abbreviation: "BOS",
    full_name: "Boston Celtics",
    color_primary: "#007A33",
  },
  {
    team_id: "1610612739",
    abbreviation: "CLE",
    full_name: "Cleveland Cavaliers",
    color_primary: "#860038",
  },
  {
    team_id: "1610612740",
    abbreviation: "NOP",
    full_name: "New Orleans Pelicans",
    color_primary: "#0C2C56",
  },
  {
    team_id: "1610612741",
    abbreviation: "CHI",
    full_name: "Chicago Bulls",
    color_primary: "#CE1141",
  },
  {
    team_id: "1610612742",
    abbreviation: "DAL",
    full_name: "Dallas Mavericks",
    color_primary: "#002B5C",
  },
  {
    team_id: "1610612743",
    abbreviation: "DEN",
    full_name: "Denver Nuggets",
    color_primary: "#0E2240",
  },
  {
    team_id: "1610612744",
    abbreviation: "GSW",
    full_name: "Golden State Warriors",
    color_primary: "#1D428A",
  },
  {
    team_id: "1610612745",
    abbreviation: "HOU",
    full_name: "Houston Rockets",
    color_primary: "#CE1141",
  },
  {
    team_id: "1610612746",
    abbreviation: "LAC",
    full_name: "Los Angeles Clippers",
    color_primary: "#C60C30",
  },
  {
    team_id: "1610612747",
    abbreviation: "LAL",
    full_name: "Los Angeles Lakers",
    color_primary: "#552582",
  },
  { team_id: "1610612748", abbreviation: "MIA", full_name: "Miami Heat", color_primary: "#98002E" },
  {
    team_id: "1610612749",
    abbreviation: "MIL",
    full_name: "Milwaukee Bucks",
    color_primary: "#00471B",
  },
  {
    team_id: "1610612750",
    abbreviation: "MIN",
    full_name: "Minnesota Timberwolves",
    color_primary: "#0C2340",
  },
  {
    team_id: "1610612751",
    abbreviation: "BKN",
    full_name: "Brooklyn Nets",
    color_primary: "#000000",
  },
  {
    team_id: "1610612752",
    abbreviation: "NYK",
    full_name: "New York Knicks",
    color_primary: "#006BB6",
  },
  {
    team_id: "1610612753",
    abbreviation: "ORL",
    full_name: "Orlando Magic",
    color_primary: "#0077C0",
  },
  {
    team_id: "1610612754",
    abbreviation: "IND",
    full_name: "Indiana Pacers",
    color_primary: "#002D62",
  },
  {
    team_id: "1610612755",
    abbreviation: "PHI",
    full_name: "Philadelphia 76ers",
    color_primary: "#006BB6",
  },
  {
    team_id: "1610612756",
    abbreviation: "TOR",
    full_name: "Toronto Raptors",
    color_primary: "#CE1141",
  },
  { team_id: "1610612757", abbreviation: "UTA", full_name: "Utah Jazz", color_primary: "#002B5C" },
  {
    team_id: "1610612758",
    abbreviation: "POR",
    full_name: "Portland Trail Blazers",
    color_primary: "#E03A3E",
  },
  {
    team_id: "1610612759",
    abbreviation: "SAC",
    full_name: "Sacramento Kings",
    color_primary: "#5A2D82",
  },
  {
    team_id: "1610612760",
    abbreviation: "SAS",
    full_name: "San Antonio Spurs",
    color_primary: "#C4CED4",
  },
  {
    team_id: "1610612761",
    abbreviation: "OKC",
    full_name: "Oklahoma City Thunder",
    color_primary: "#EF3B24",
  },
  {
    team_id: "1610612762",
    abbreviation: "PHX",
    full_name: "Phoenix Suns",
    color_primary: "#1D1160",
  },
  {
    team_id: "1610612763",
    abbreviation: "MEM",
    full_name: "Memphis Grizzlies",
    color_primary: "#5D76A9",
  },
  {
    team_id: "1610612764",
    abbreviation: "CHA",
    full_name: "Charlotte Hornets",
    color_primary: "#1D1160",
  },
  {
    team_id: "1610612765",
    abbreviation: "DET",
    full_name: "Detroit Pistons",
    color_primary: "#C8102E",
  },
  {
    team_id: "1610612766",
    abbreviation: "WAS",
    full_name: "Washington Wizards",
    color_primary: "#002B5C",
  },
];

export function getTeamColor(abbreviation: string): string | null {
  const team = TEAM_COLORS.find((t) => t.abbreviation.toUpperCase() === abbreviation.toUpperCase());
  return team?.color_primary ?? null;
}

export function getTeamByAbbreviation(abbreviation: string): TeamColorEntry | null {
  return (
    TEAM_COLORS.find((t) => t.abbreviation.toUpperCase() === abbreviation.toUpperCase()) ?? null
  );
}
