"use client";

import { useEffect, useState } from "react";
import { PostCard } from "@/components/content/user/posts";
import { getLandingPosts } from "@/lib/api/public-content";

type BrowserState = {
  loading: boolean;
  error: string | null;
  items: Awaited<ReturnType<typeof getLandingPosts>>["items"];
};

export function PostsBrowserPage() {
  const [state, setState] = useState<BrowserState>({
    loading: true,
    error: null,
    items: [],
  });

  useEffect(() => {
    let active = true;

    void getLandingPosts(12, { cache: "no-store" })
      .then((result) => {
        if (!active) return;
        setState({ loading: false, error: result.error, items: result.items });
      })
      .catch((error) => {
        if (!active) return;
        setState({
          loading: false,
          error: error instanceof Error ? error.message : "No fue posible cargar las noticias.",
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
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Noticias</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Cobertura y novedades</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">Cargando noticias...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Noticias</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Cobertura y novedades</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Mantiene al cliente conectado con anuncios, resultados, contexto editorial y movimientos importantes dentro de la comunidad del billar.
        </p>
      </section>

      {state.items.length > 0 ? (
        <section className="grid gap-4">
          {state.items.map((post) => (
            <PostCard key={post.id} item={post} />
          ))}
        </section>
      ) : state.error ? (
        <section className="rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-7 text-white/64">
          No fue posible cargar las noticias en este momento. {state.error}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-7 text-white/64">
          Todavia no hay noticias publicadas. Esta seccion quedo lista para mostrarlas cuando el contenido llegue.
        </section>
      )}
    </main>
  );
}