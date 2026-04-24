import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl px-6 py-8 sm:px-10 lg:px-12">
      <section className="grid flex-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <div className="rounded-[2rem] border border-line bg-surface p-8 shadow-[0_24px_80px_rgba(53,34,23,0.12)] backdrop-blur md:p-10">
          <div className="flex h-full flex-col justify-between gap-10">
            <div className="space-y-5">
              <span className="inline-flex w-fit items-center rounded-full border border-line bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                Acceso web
              </span>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                  Login inicial conectado al backend real.
                </h1>
                <p className="max-w-xl text-base leading-8 text-muted sm:text-lg">
                  Este paso deja resuelto el contrato mas delicado de auth: el navegador hace la peticion al backend, el backend valida las credenciales y escribe la cookie httpOnly para la sesion web.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-[1.5rem] border border-line bg-white/70 p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-muted">
                  Endpoint
                </p>
                <p className="mt-3 text-xl font-semibold">POST /api/auth/login</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  El backend responde con payload de usuario y deja la cookie de sesion.
                </p>
              </article>

              <article className="rounded-[1.5rem] border border-line bg-white/70 p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-muted">
                  Transporte
                </p>
                <p className="mt-3 text-xl font-semibold">credentials: include</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Sin eso, el navegador no acepta la cookie que envía el backend.
                </p>
              </article>
            </div>

            <Link className="text-sm font-medium text-accent-strong underline-offset-4 hover:underline" href="/">
              Volver al panel inicial
            </Link>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-line bg-[#201815] p-6 text-stone-100 shadow-[0_24px_80px_rgba(24,16,13,0.18)] md:p-8">
          <div className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-stone-400">
                Formulario
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Prueba de autenticacion</h2>
            </div>

            <LoginForm />
          </div>
        </aside>
      </section>
    </main>
  );
}