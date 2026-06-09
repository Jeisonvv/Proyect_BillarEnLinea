"use client";

import { useEffect, useState } from "react";
import { TournamentDetailView } from "@/components/content/user/tournaments";
import { getTournamentDetailBySlug } from "@/lib/api/public-content";

export function TournamentBrowserDetailPage({ slug }: { slug: string }) {
  const [state, setState] = useState<{ loading: boolean; tournament: Awaited<ReturnType<typeof getTournamentDetailBySlug>> }>({
    loading: true,
    tournament: null,
  });

  useEffect(() => {
    let active = true;

    void getTournamentDetailBySlug(slug)
      .then((tournament) => {
        if (!active) return;
        setState({ loading: false, tournament });
      })
      .catch(() => {
        if (!active) return;
        setState({ loading: false, tournament: null });
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (state.loading) {
    return <main className="grid w-full gap-6 py-6 text-sm text-white/64">Cargando torneo...</main>;
  }

  if (!state.tournament) {
    return <main className="grid w-full gap-6 py-6 text-sm text-white/64">No encontramos el torneo solicitado.</main>;
  }

  return <TournamentDetailView tournament={state.tournament} />;
}
