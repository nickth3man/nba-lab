"use client";

export function getEdgeLookupKey(source: string, target: string): string {
  return source < target ? `${source}::${target}` : `${target}::${source}`;
}
