import type { Metadata } from "next";
import { RaffleCard } from "@/components/content/user/raffles";
import { getLandingRaffles } from "@/lib/api/public-content";

export const metadata: Metadata = {
  title: "Rifas",
};

export default async function HomeRifasPage() {
  const raffles = await getLandingRaffles(3);

  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Rifas</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Rifas activas y proximas</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Revisa los premios visibles, el valor por numero y la fecha del sorteo para que el cliente tenga una vista clara desde el sitio autenticado.
        </p>
      </section>

      {raffles.items.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {raffles.items.map((raffle) => (
            <RaffleCard key={raffle.id} item={raffle} />
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/12 bg-white/3 p-6 text-sm leading-7 text-white/64">
          Todavia no hay rifas publicadas. Cuando aparezcan, esta vista quedara lista para mostrarlas.
        </section>
      )}
    </main>
  );
}