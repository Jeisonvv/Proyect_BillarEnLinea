import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getServerSession } from "@/lib/auth/server-session";

function getIntentMessage(intent?: string) {
  switch (intent) {
    case "torneos":
      return "Para ver los torneos primero debes iniciar sesion o registrarte.";
    case "eventos":
      return "Para entrar a los eventos primero debes iniciar sesion o registrarte.";
    case "rifas":
      return "Para participar en las rifas primero debes iniciar sesion o registrarte.";
    case "tienda":
      return "Para continuar hacia la tienda primero debes iniciar sesion o registrarte.";
    default:
      return "Para continuar primero debes iniciar sesion o registrarte.";
  }
}

export const metadata: Metadata = {
  title: "Iniciar sesion",
  description: "Accede a Billar en Linea para gestionar tu cuenta, seguir torneos, descubrir eventos y continuar tu experiencia en la plataforma.",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; intent?: string }>;
}) {
  const { next, intent } = await searchParams;
  const nextHref = next && next.startsWith("/") ? next : "/home";
  const session = await getServerSession();

  if (session) {
    redirect(nextHref);
  }

  const accessPrompt = intent ? getIntentMessage(intent) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1500px] px-5 py-6 sm:px-8 lg:px-10 xl:px-14 2xl:px-20">
      <section className="grid flex-1 gap-6 lg:grid-cols-[1.05fr_0.95fr] xl:grid-cols-[1.18fr_0.82fr] xl:gap-10 2xl:gap-14">
        <div className="relative overflow-hidden rounded-[2.2rem] border border-[rgba(246,196,79,0.14)] bg-[linear-gradient(145deg,rgba(32,24,21,0.98),rgba(27,19,17,0.96),rgba(20,14,12,0.98))] text-stone-100 shadow-[0_28px_90px_rgba(24,16,13,0.28)] backdrop-blur">
          <Image
            src="/img_login.png"
            alt="Portada de Billar en Linea"
            fill
            priority
            sizes="(min-width: 1280px) 55vw, (min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,8,7,0.08),rgba(10,8,7,0.38)_44%,rgba(10,8,7,0.8)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,196,79,0.16),transparent_24%),radial-gradient(circle_at_80%_16%,rgba(109,71,42,0.2),transparent_28%)]" />

          <div className="relative flex h-full min-h-[28rem] flex-col justify-end px-7 pb-7 pt-24 md:min-h-[34rem] md:px-10 md:pb-10 md:pt-28 xl:min-h-full xl:px-12 xl:pb-12 xl:pt-24 2xl:px-14 2xl:pb-16 2xl:pt-28">
            <div className="max-w-xl space-y-4 rounded-[1.7rem] border border-white/10 bg-[rgba(15,11,10,0.38)] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.22)] backdrop-blur-md sm:p-6 xl:ml-6 xl:p-7 2xl:ml-8">
              <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/62">Billar en Linea</p>
              <h1 className="font-display text-3xl leading-[0.95] text-white sm:text-5xl xl:text-6xl">
                Entra y no te pirdas nada del mundo del billar.
              </h1>
              <Link className="inline-flex rounded-full border border-white/14 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10" href="/">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>

        <aside className="rounded-[2.2rem] border border-line bg-[linear-gradient(180deg,#201815,#17100e)] p-6 text-stone-100 shadow-[0_28px_90px_rgba(24,16,13,0.2)] md:p-8 xl:p-9 2xl:sticky 2xl:top-10 2xl:self-start">
          <div className="space-y-5 xl:space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-stone-400">
                Formulario
              </p>
              <h2 className="mt-2 text-2xl font-semibold xl:text-[2rem]">Accede a tu cuenta</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-stone-400 xl:text-[0.98rem]">
                Usa tu correo y contraseña para continuar con tu recorrido dentro de Billar en Linea.
              </p>
            </div>

            {accessPrompt ? (
              <article className="rounded-[1.5rem] border border-[rgba(246,196,79,0.22)] bg-[rgba(246,196,79,0.08)] px-4 py-4 text-sm leading-7 text-stone-100">
                <p className="text-[0.7rem] uppercase tracking-[0.24em] text-[rgba(246,196,79,0.82)]">Acceso requerido</p>
                <p className="mt-2">{accessPrompt}</p>
              </article>
            ) : null}

            <LoginForm />
          </div>
        </aside>
      </section>
    </main>
  );
}