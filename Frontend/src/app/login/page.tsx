import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1500px] px-5 py-6 sm:px-8 lg:px-10 xl:px-14 2xl:px-20">
      <section className="grid flex-1 gap-6 lg:grid-cols-[1.05fr_0.95fr] xl:grid-cols-[1.18fr_0.82fr] xl:gap-10 2xl:gap-14">
        <div className="relative overflow-hidden rounded-[2.2rem] border border-[rgba(246,196,79,0.14)] bg-[linear-gradient(145deg,rgba(32,24,21,0.98),rgba(27,19,17,0.96),rgba(20,14,12,0.98))] p-7 text-stone-100 shadow-[0_28px_90px_rgba(24,16,13,0.28)] backdrop-blur md:p-10 xl:p-12 2xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,196,79,0.14),transparent_24%),radial-gradient(circle_at_78%_18%,rgba(109,71,42,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_40%)]" />

          <div className="relative flex h-full flex-col justify-between gap-10 xl:gap-14">
            <div className="space-y-6 xl:space-y-8">
              <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/6 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-stone-300 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                Acceso web
              </span>
              <div className="max-w-3xl space-y-4 xl:space-y-5">
                <h1 className="text-4xl font-semibold leading-tight text-stone-50 sm:text-5xl xl:max-w-4xl xl:text-6xl 2xl:text-[4.5rem] 2xl:leading-[0.98]">
                  Login inicial conectado al backend real.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-stone-300 sm:text-lg xl:text-[1.1rem] xl:leading-9 2xl:max-w-3xl">
                  Este paso deja resuelto el contrato mas delicado de auth: el navegador hace la peticion al backend, el backend valida las credenciales y escribe la cookie httpOnly para la sesion web.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:max-w-4xl xl:gap-4">
                <article className="rounded-[1.45rem] border border-white/8 bg-white/5 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)] xl:p-5">
                  <p className="text-[0.7rem] uppercase tracking-[0.24em] text-stone-400">Sesion</p>
                  <p className="mt-3 text-lg font-semibold text-stone-100 xl:text-xl">Cookie httpOnly</p>
                </article>

                <article className="rounded-[1.45rem] border border-white/8 bg-white/5 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)] xl:p-5">
                  <p className="text-[0.7rem] uppercase tracking-[0.24em] text-stone-400">Canal</p>
                  <p className="mt-3 text-lg font-semibold text-stone-100 xl:text-xl">Backend real</p>
                </article>

                <article className="rounded-[1.45rem] border border-white/8 bg-white/5 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)] xl:p-5">
                  <p className="text-[0.7rem] uppercase tracking-[0.24em] text-stone-400">Respuesta</p>
                  <p className="mt-3 text-lg font-semibold text-stone-100 xl:text-xl">Acceso persistente</p>
                </article>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] 2xl:gap-5">
              <article className="rounded-[1.6rem] border border-white/8 bg-white/5 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.18)] xl:p-6">
                <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
                  Endpoint
                </p>
                <p className="mt-3 text-xl font-semibold text-stone-100 xl:text-2xl">POST /api/auth/login</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-stone-300 xl:text-[0.98rem] xl:leading-7">
                  El backend responde con payload de usuario y deja la cookie de sesion.
                </p>
              </article>

              <article className="rounded-[1.6rem] border border-white/8 bg-white/5 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.18)] xl:p-6">
                <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
                  Transporte
                </p>
                <p className="mt-3 text-xl font-semibold text-stone-100 xl:text-2xl">credentials: include</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-stone-300 xl:text-[0.98rem] xl:leading-7">
                  Sin eso, el navegador no acepta la cookie que envía el backend.
                </p>
              </article>
            </div>

            <Link className="text-sm font-medium text-accent-strong underline-offset-4 hover:underline xl:text-base" href="/">
              Volver al panel inicial
            </Link>
          </div>
        </div>

        <aside className="rounded-[2.2rem] border border-line bg-[linear-gradient(180deg,#201815,#17100e)] p-6 text-stone-100 shadow-[0_28px_90px_rgba(24,16,13,0.2)] md:p-8 xl:p-9 2xl:sticky 2xl:top-10 2xl:self-start">
          <div className="space-y-5 xl:space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-stone-400">
                Formulario
              </p>
              <h2 className="mt-2 text-2xl font-semibold xl:text-[2rem]">Prueba de autenticacion</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-stone-400 xl:text-[0.98rem]">
                Disenado para verse compacto en movil y con mejor presencia, aire y lectura en pantallas amplias.
              </p>
            </div>

            <LoginForm />
          </div>
        </aside>
      </section>
    </main>
  );
}