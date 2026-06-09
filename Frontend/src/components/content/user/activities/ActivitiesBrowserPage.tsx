"use client";

import { useEffect, useState } from "react";
import { ActivityCard } from "@/components/content/user/activities";
import { getLandingActivities } from "@/lib/api/public-content";

type BrowserState = {
  loading: boolean;
  error: string | null;
  items: Awaited<ReturnType<typeof getLandingActivities>>["items"];
};

export function ActivitiesBrowserPage() {
  const [state, setState] = useState<BrowserState>({
    loading: true,
    error: null,
    items: [],
  });

  useEffect(() => {
    let active = true;

    void getLandingActivities(50)
      .then((result) => {
        if (!active) return;
        setState({ loading: false, error: result.error, items: result.items });
      })
      .catch((error) => {
        if (!active) return;
        setState({
          loading: false,
          error: error instanceof Error ? error.message : "No fue posible cargar las actividades.",
          items: [],
        });
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return (
      <main className="grid gap-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Actividades</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Accede a las Mejores Oportunidades en Equipamiento de Billar Profesional</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">Cargando actividades...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Actividades</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Accede a las Mejores Oportunidades en Equipamiento de Billar Profesional</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Te damos la bienvenida a nuestra actividad especial, un espacio creado para que los apasionados de las tres bandas aprovechen las mejores oportunidades de adquirir equipo de élite. Nuestra misión es facilitar que cada jugador tenga en sus manos herramientas de calidad mundial mediante dinámicas transparentes y directas.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
        Aprovecha cada actividad vigente para renovar tu taco, mejorar tus accesorios y formar parte de una comunidad que valora la excelencia técnica. Desde tu panel de usuario, tendrás una vista clara y detallada de los incentivos disponibles, el valor de participación y las fechas clave para la entrega de resultados
        </p>
      </section>

      {state.items.length > 0 ? (
        <section className="grid gap-4">
          {state.items.map((activity) => (
            <ActivityCard key={activity.id} item={activity} />
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-7 text-white/64">
          {state.error ? `No fue posible cargar las actividades. ${state.error}` : "Todavia no hay actividades publicadas. Cuando aparezcan, esta vista quedara lista para mostrarlas."}
        </section>
      )}
    </main>
  );
}