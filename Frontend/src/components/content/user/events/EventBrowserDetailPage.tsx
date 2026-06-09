"use client";

import { useEffect, useState } from "react";
import { EventDetailView } from "@/components/content/user/events";
import { getEventDetailBySlug } from "@/lib/api/public-content";

export function EventBrowserDetailPage({ slug }: { slug: string }) {
  const [state, setState] = useState<{
    loading: boolean;
    error: boolean;
    event: Awaited<ReturnType<typeof getEventDetailBySlug>>;
  }>({ loading: true, error: false, event: null });

  useEffect(() => {
    let active = true;

    void getEventDetailBySlug(slug)
      .then((event) => {
        if (!active) return;
        setState({ loading: false, error: !event, event });
      })
      .catch(() => {
        if (!active) return;
        setState({ loading: false, error: true, event: null });
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (state.loading) {
    return <main className="grid gap-6 py-6 text-sm text-white/64">Cargando evento...</main>;
  }

  if (!state.event || state.error) {
    return <main className="grid gap-6 py-6 text-sm text-white/64">No encontramos el evento solicitado.</main>;
  }

  return <EventDetailView event={state.event} />;
}
