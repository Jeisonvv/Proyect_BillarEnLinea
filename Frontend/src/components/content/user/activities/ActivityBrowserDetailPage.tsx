"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api/client";
import { ActivityDetailView } from "@/components/content/user/activities";
import { getActivityDetailById, getActivityNumbers, type MyActivityNumber } from "@/lib/api/public-content/activities";

export function ActivityBrowserDetailPage({ slug }: { slug: string }) {
  const [state, setState] = useState<{
    loading: boolean;
    activity: Awaited<ReturnType<typeof getActivityDetailById>>;
    numbers: NonNullable<Awaited<ReturnType<typeof getActivityNumbers>>>["numbers"];
    myNumbers: MyActivityNumber[];
  }>({ loading: true, activity: null, numbers: [], myNumbers: [] });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const activity = await getActivityDetailById(slug);
        if (!activity) {
          if (active) setState({ loading: false, activity: null, numbers: [], myNumbers: [] });
          return;
        }

        const isFreeActivity = activity.isFree === true || activity.ticketPrice === 0;
        const [numbersResponse, myNumbersResponse] = await Promise.all([
          isFreeActivity ? Promise.resolve(null) : getActivityNumbers(activity.id, 1000),
          fetch(`${API_BASE_URL}/api/activities/${encodeURIComponent(activity.id)}/my-numbers`, {
            credentials: "include",
            cache: "no-store",
          })
            .then(async (response) => {
              if (!response.ok) return [] as MyActivityNumber[];
              const payload = await response.json().catch(() => null);
              return Array.isArray(payload?.data?.numbers) ? payload.data.numbers : [];
            })
            .catch(() => [] as MyActivityNumber[]),
        ]);

        if (!active) return;
        setState({
          loading: false,
          activity,
          numbers: numbersResponse?.numbers ?? [],
          myNumbers: myNumbersResponse,
        });
      } catch {
        if (!active) return;
        setState({ loading: false, activity: null, numbers: [], myNumbers: [] });
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [slug]);

  if (state.loading) {
    return <main className="grid w-full gap-6 py-6 text-sm text-white/64">Cargando actividad...</main>;
  }

  if (!state.activity) {
    return <main className="grid w-full gap-6 py-6 text-sm text-white/64">No encontramos la actividad solicitada.</main>;
  }

  return <ActivityDetailView activity={state.activity} initialNumbers={state.numbers} myNumbers={state.myNumbers} />;
}
