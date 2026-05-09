"use client";

import { startTransition, useEffect, useState } from "react";
import type { LandingTournament } from "@/lib/api/public-content";
import { ShowcaseCard } from "../shared";
import { getTournamentShowcaseProps } from "./getTournamentShowcaseProps";

type ProgressiveTournamentListProps = {
  tournaments: LandingTournament[];
  initialOffset?: number;
  batchSize?: number;
};

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void) => number;
  cancelIdleCallback?: (id: number) => void;
};

export function ProgressiveTournamentList({
  tournaments,
  initialOffset = 2,
  batchSize = 2,
}: ProgressiveTournamentListProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (tournaments.length === 0) {
      return undefined;
    }

    const idleWindow = window as IdleWindow;
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const revealNextBatch = () => {
      startTransition(() => {
        setVisibleCount((current) => {
          if (current >= tournaments.length) {
            return current;
          }

          return Math.min(current + batchSize, tournaments.length);
        });
      });
    };

    const queueReveal = () => {
      if (idleWindow.requestIdleCallback) {
        idleId = idleWindow.requestIdleCallback(() => {
          revealNextBatch();
        });
        return;
      }

      timeoutId = window.setTimeout(() => {
        revealNextBatch();
      }, 250);
    };

    queueReveal();

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (idleId !== null && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleId);
      }
    };
  }, [batchSize, tournaments.length]);

  useEffect(() => {
    if (visibleCount === 0 || visibleCount >= tournaments.length) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      startTransition(() => {
        setVisibleCount((current) => Math.min(current + batchSize, tournaments.length));
      });
    }, 220);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [batchSize, tournaments.length, visibleCount]);

  const visibleItems = tournaments.slice(0, visibleCount);

  return (
    <>
      {visibleItems.map((tournament, index) => (
        <ShowcaseCard
          key={tournament.id}
          {...getTournamentShowcaseProps(tournament, initialOffset + index < 2)}
        />
      ))}
    </>
  );
}