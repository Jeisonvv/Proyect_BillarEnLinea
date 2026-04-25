import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const resolvedSearchParams = await searchParams;
  const tokenValue = resolvedSearchParams?.token;
  const token = typeof tokenValue === "string" ? tokenValue.trim() : "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl px-6 py-8 sm:px-10 lg:px-12">
      <section className="grid flex-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <div className="rounded-[2rem] border border-line bg-surface p-8 shadow-[0_24px_80px_rgba(53,34,23,0.12)] backdrop-blur md:p-10">
          <div className="flex h-full flex-col justify-between gap-10">
            <div className="space-y-5">
              <span className="inline-flex w-fit items-center rounded-full border border-line bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                Nueva contraseña
              </span>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                  Define una nueva contraseña para tu cuenta.
                </h1>
                <p className="max-w-xl text-base leading-8 text-muted sm:text-lg">
                  Esta ruta espera un token de recuperacion en la URL y lo envía al backend junto con la nueva contraseña. Si el token expiró o es inválido, el backend devuelve el error estructurado y la UI lo muestra.
                </p>
              </div>
            </div>

            <Link className="text-sm font-medium text-accent-strong underline-offset-4 hover:underline" href="/login">
              Volver al login
            </Link>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-line bg-[#201815] p-6 text-stone-100 shadow-[0_24px_80px_rgba(24,16,13,0.18)] md:p-8">
          <div className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-stone-400">
                Formulario
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Restablecer password</h2>
            </div>

            <ResetPasswordForm token={token} />
          </div>
        </aside>
      </section>
    </main>
  );
}