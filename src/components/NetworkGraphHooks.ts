"use client";

import { useEffect, useRef, useCallback } from "react";
import { debounce, createViewportCuller, createLODManager } from "@/lib/performance";
import type { SigmaInstance } from "@/lib/performance";

export function useDebouncedHandler<T extends (...args: unknown[]) => void>(
  handler: T,
  delay: number,
): T {
  const handlerRef = useRef<T>(handler);
  const debouncedRef = useRef<T | null>(null);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const debounced = debounce((...args: unknown[]) => {
      handlerRef.current?.(...(args as Parameters<T>));
    }, delay) as unknown as T;

    debouncedRef.current = debounced;

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (debounced as any).cancel?.();
    };
  }, [delay]);

  return useCallback((...args: unknown[]) => {
    debouncedRef.current?.(...(args as Parameters<T>));
  }, []) as T;
}

export function useViewportCulling(sigma: SigmaInstance | null) {
  const cullerRef = useRef<ReturnType<typeof createViewportCuller> | null>(null);

  useEffect(() => {
    if (sigma) {
      cullerRef.current = createViewportCuller(sigma);
    }
  }, [sigma]);

  const getVisibleNodes = useCallback(() => {
    return cullerRef.current?.getVisibleNodes() || [];
  }, []);

  const getVisibleEdges = useCallback(() => {
    return cullerRef.current?.getVisibleEdges() || [];
  }, []);

  return { getVisibleNodes, getVisibleEdges };
}

export function useLODManagement(
  sigma: SigmaInstance | null,
  lodRef: React.MutableRefObject<ReturnType<typeof createLODManager> | null>,
) {
  useEffect(() => {
    if (sigma) {
      lodRef.current = createLODManager(sigma);
    }
  }, [sigma, lodRef]);

  const updateLOD = useCallback(() => {
    if (lodRef.current) {
      lodRef.current.update();
      return lodRef.current.getLevel();
    }
    return "HIGH" as const;
  }, [lodRef]);

  const getLODLevel = useCallback(() => {
    if (lodRef.current) {
      return lodRef.current.getLevel();
    }
    return "HIGH" as const;
  }, [lodRef]);

  return { updateLOD, getLODLevel };
}
