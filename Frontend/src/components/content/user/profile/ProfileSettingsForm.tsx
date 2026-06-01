"use client";

import { useState, useTransition } from "react";
import { ApiError } from "@/lib/api/client";
import type { AuthenticatedUser } from "@/lib/api/auth";
import { updateCurrentProfile, uploadProfileAvatar } from "@/lib/api/auth";
import { BUTTON_GHOST, BUTTON_PRIMARY, CARD_INNER, CARD_SHELL_PADDED, ADMIN_INPUT, LABEL_OVERLINE, LABEL_OVERLINE_ACCENT } from "@/components/ui/styles";
import { humanizeToken } from "@/components/content/user/shared";

type ProfileSettingsFormProps = {
  user: AuthenticatedUser;
};

type FormState = {
  kind: "idle" | "success" | "error";
  message?: string;
};

const INITIAL_STATE: FormState = { kind: "idle" };

type EditableProfileState = {
  name: string;
  phone: string;
  email: string;
  ciudad: string;
  direccion: string;
};

function getInitialFormValues(user: AuthenticatedUser): EditableProfileState {
  return {
    name: user.name ?? "",
    phone: user.phone ?? "",
    email: user.email ?? "",
    ciudad: user.ciudad ?? "",
    direccion: user.direccion ?? "",
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "No fue posible actualizar tu perfil.";
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const [formValues, setFormValues] = useState<EditableProfileState>(() => getInitialFormValues(user));
  const [savedSnapshot, setSavedSnapshot] = useState<EditableProfileState>(() => getInitialFormValues(user));
  const [status, setStatus] = useState<FormState>(INITIAL_STATE);
  const [isPending, startTransition] = useTransition();
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");

  const hasChanges = Object.entries(formValues).some(([key, value]) => value !== savedSnapshot[key as keyof EditableProfileState]);

  function updateField<Key extends keyof EditableProfileState>(field: Key, value: EditableProfileState[Key]) {
    setFormValues((current) => ({ ...current, [field]: value }));
  }

  function handleReset() {
    setFormValues(savedSnapshot);
    setStatus(INITIAL_STATE);
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setStatus(INITIAL_STATE);
    setIsAvatarUploading(true);

    try {
      const response = await uploadProfileAvatar(file);
      const nextAvatarUrl = response.user.avatarUrl ?? "";
      setAvatarUrl(nextAvatarUrl);
      setStatus({ kind: "success", message: "La foto de perfil fue actualizada correctamente." });
    } catch (error) {
      setStatus({ kind: "error", message: getErrorMessage(error) });
    } finally {
      setIsAvatarUploading(false);
      event.currentTarget.value = "";
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(INITIAL_STATE);

    startTransition(async () => {
      try {
        const payload = {
          name: formValues.name.trim(),
          phone: formValues.phone.trim(),
          email: formValues.email.trim(),
          ciudad: formValues.ciudad.trim(),
          direccion: formValues.direccion.trim(),
        };

        const response = await updateCurrentProfile(payload);
        const nextSnapshot = getInitialFormValues(response.user);
        setFormValues(nextSnapshot);
        setSavedSnapshot(nextSnapshot);
        setStatus({ kind: "success", message: "Tu perfil fue actualizado correctamente." });
      } catch (error) {
        setStatus({ kind: "error", message: getErrorMessage(error) });
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.7fr)]">
      <section className={CARD_SHELL_PADDED}>
        <p className={LABEL_OVERLINE_ACCENT}>Perfil editable</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Actualiza los datos visibles de tu cuenta</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 sm:text-base">
          Puedes mantener al día tu nombre, telefono, correo, ciudad, direccion y foto. Tu documento, tipo de documento y categoria se muestran solo como referencia.
        </p>

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className={LABEL_OVERLINE}>Nombre completo</span>
              <input
                className={ADMIN_INPUT}
                name="name"
                value={formValues.name}
                onChange={(event) => updateField("name", event.currentTarget.value)}
                placeholder="Tu nombre"
                minLength={2}
                required
              />
            </label>

            <label className="grid gap-2">
              <span className={LABEL_OVERLINE}>Telefono</span>
              <input
                className={ADMIN_INPUT}
                type="tel"
                name="phone"
                value={formValues.phone}
                onChange={(event) => updateField("phone", event.currentTarget.value)}
                placeholder="3001234567"
                minLength={7}
                required
              />
            </label>

            <label className="grid gap-2">
              <span className={LABEL_OVERLINE}>Email</span>
              <input
                className={ADMIN_INPUT}
                type="email"
                name="email"
                value={formValues.email}
                onChange={(event) => updateField("email", event.currentTarget.value)}
                placeholder="tu@email.com"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className={LABEL_OVERLINE}>Ciudad</span>
              <input
                className={ADMIN_INPUT}
                name="ciudad"
                value={formValues.ciudad}
                onChange={(event) => updateField("ciudad", event.currentTarget.value)}
                placeholder="Bogota"
                minLength={2}
                required
              />
            </label>

            <div className="grid gap-2">
              <span className={LABEL_OVERLINE}>Foto de perfil</span>
              <div className="flex min-h-34 items-center gap-4 rounded-2xl border border-white/10 bg-black/24 px-4 py-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Avatar del usuario" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs uppercase tracking-[0.18em] text-white/42">Sin foto</span>
                  )}
                </div>
                <div className="grid gap-2">
                  <label className={`${BUTTON_GHOST} cursor-pointer`}>
                    <input className="hidden" type="file" accept="image/*" onChange={handleAvatarChange} disabled={isAvatarUploading || isPending} />
                    {isAvatarUploading ? "Subiendo foto..." : avatarUrl ? "Cambiar foto" : "Subir foto"}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <label className="grid gap-2">
            <span className={LABEL_OVERLINE}>Direccion</span>
            <textarea
              className={`${ADMIN_INPUT} min-h-28 resize-y`}
              name="direccion"
              value={formValues.direccion}
              onChange={(event) => updateField("direccion", event.currentTarget.value)}
              placeholder="Direccion de residencia o entrega habitual"
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button className={BUTTON_PRIMARY} type="submit" disabled={isPending || isAvatarUploading || !hasChanges}>
              {isPending ? "Guardando cambios..." : "Guardar cambios"}
            </button>
            <button className={BUTTON_GHOST} type="button" disabled={isPending || isAvatarUploading || !hasChanges} onClick={handleReset}>
              Restaurar
            </button>
          </div>

          <div className="min-h-16 rounded-[1.2rem] border border-dashed border-white/10 bg-black/14 px-4 py-3 text-sm leading-7 text-white/68">
            {status.kind === "idle" ? (
              <p>Los cambios se guardan sobre tu cuenta actual y no afectan tu documento ni tu categoria de juego.</p>
            ) : null}
            {status.kind === "success" ? <p>{status.message}</p> : null}
            {status.kind === "error" ? <p>{status.message}</p> : null}
          </div>
        </form>
      </section>

      <aside className="grid gap-4 self-start">
        <section className={CARD_SHELL_PADDED}>
          <p className={LABEL_OVERLINE_ACCENT}>Datos protegidos</p>
          <div className="mt-4 grid gap-3">
            <div className={CARD_INNER}>
              <p className={LABEL_OVERLINE}>Tipo de documento</p>
              <p className="mt-2 text-sm font-semibold text-white">{user.identityDocumentType ? humanizeToken(user.identityDocumentType) : "Sin definir"}</p>
            </div>
            <div className={CARD_INNER}>
              <p className={LABEL_OVERLINE}>Documento</p>
              <p className="mt-2 text-sm font-semibold text-white">{user.identityDocument ?? "Sin documento registrado"}</p>
            </div>
            <div className={CARD_INNER}>
              <p className={LABEL_OVERLINE}>Categoria</p>
              <p className="mt-2 text-sm font-semibold text-white">{user.playerCategory ? humanizeToken(user.playerCategory) : "Sin definir"}</p>
            </div>
          </div>
        </section>

        <section className={CARD_SHELL_PADDED}>
          <p className={LABEL_OVERLINE_ACCENT}>Estado de cuenta</p>
          <div className="mt-4 grid gap-3">
            <div className={CARD_INNER}>
              <p className={LABEL_OVERLINE}>Rol</p>
              <p className="mt-2 text-sm font-semibold text-white">{user.role ? humanizeToken(user.role) : "Sin rol"}</p>
            </div>
            <div className={CARD_INNER}>
              <p className={LABEL_OVERLINE}>Estado CRM</p>
              <p className="mt-2 text-sm font-semibold text-white">{user.status ? humanizeToken(user.status) : "Sin estado"}</p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}