"use client";

import { FormEvent, Fragment, useEffect, useMemo, useState, useTransition } from "react";
import { AdminSectionScaffold, formatAdminDate, getErrorMessage, humanizeAdminToken } from "@/components/content/admin/shared";
import {
  IDENTITY_DOCUMENT_TYPES,
  PLAYER_CATEGORIES,
  USER_ROLES,
  USER_STATUSES,
  type AdminUser,
  type IdentityDocumentType,
  type PlayerCategory,
  type UpdateUserAdminInput,
  type UserRole,
  type UserStatus,
  listUsersAdmin,
  updateUserAdmin,
} from "@/lib/api/admin-users";

type FeedbackState = {
  kind: "idle" | "success" | "error";
  message?: string;
};

type EditDraft = {
  name: string;
  phone: string;
  identityDocument: string;
  identityDocumentType: IdentityDocumentType;
  role: UserRole;
  status: UserStatus;
  playerCategory: PlayerCategory;
};

const PHONE_REGEX = /^[1-9]\d{9,14}$/;
const PHONE_FORMAT_ERROR = "Formato incorrecto. Usa codigo de pais + numero (10 a 15 digitos), sin espacios ni guiones.";
const USERS_PAGE_SIZE = 20;

function sanitizePhone(value: string) {
  return value.replace(/\D+/g, "");
}

function isValidPhone(value: string) {
  return PHONE_REGEX.test(value);
}

function toEditDraft(user: AdminUser): EditDraft {
  return {
    name: user.name ?? "",
    phone: sanitizePhone(user.phone ?? ""),
    identityDocument: user.identityDocument ?? "",
    identityDocumentType: user.identityDocumentType ?? "CEDULA_CIUDADANIA",
    role: user.role ?? "CUSTOMER",
    status: user.status ?? "NEW",
    playerCategory: user.playerCategory ?? "SIN_DEFINIR",
  };
}

export function UsersAdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [feedbackByUser, setFeedbackByUser] = useState<Record<string, FeedbackState>>({});
  const [closingFeedbackByUser, setClosingFeedbackByUser] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const roleCount = useMemo(() => users.filter((user) => user.role === "CUSTOMER").length, [users]);
  const webEmailCount = useMemo(() => users.filter((user) => Boolean(user.webAuth?.email)).length, [users]);

  async function refreshUsers(options?: { searchTerm?: string; pageNumber?: number }) {
    const searchTerm = options?.searchTerm ?? search;
    const pageNumber = options?.pageNumber ?? page;

    setLoading(true);
    setLoadError(null);

    try {
      const response = await listUsersAdmin({
        page: pageNumber,
        limit: USERS_PAGE_SIZE,
        search: searchTerm.trim() || undefined,
      });
      setUsers(response.data ?? []);
      setTotal(response.pagination?.total ?? (response.data?.length ?? 0));
      setPage(response.pagination?.page ?? pageNumber);
      setTotalPages(response.pagination?.totalPages ?? Math.max(1, Math.ceil((response.pagination?.total ?? 0) / (response.pagination?.limit ?? USERS_PAGE_SIZE))));
    } catch (error) {
      setLoadError(getErrorMessage(error, "No se pudieron cargar los usuarios."));
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshUsers({ searchTerm: "", pageNumber: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timers = Object.entries(feedbackByUser)
      .filter(([, feedback]) => feedback.kind === "success")
      .flatMap(([userId]) => {
        const closeTimer = window.setTimeout(() => {
          setClosingFeedbackByUser((current) => ({ ...current, [userId]: true }));
        }, 3000);

        const removeTimer = window.setTimeout(() => {
          setFeedbackByUser((current) => {
            if (current[userId]?.kind !== "success") {
              return current;
            }

            const next = { ...current };
            delete next[userId];
            return next;
          });

          setClosingFeedbackByUser((current) => {
            if (!(userId in current)) {
              return current;
            }

            const next = { ...current };
            delete next[userId];
            return next;
          });
        }, 3300);

        return [closeTimer, removeTimer];
      });

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [feedbackByUser]);

  function openEditor(user: AdminUser) {
    setExpandedUserId(user._id);
    setDraft(toEditDraft(user));
    setFeedbackByUser((current) => ({
      ...current,
      [user._id]: { kind: "idle" },
    }));
  }

  function closeEditor() {
    setExpandedUserId(null);
    setDraft(null);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    void refreshUsers({ searchTerm: search, pageNumber: 1 });
  }

  function changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || loading) {
      return;
    }

    setPage(nextPage);
    void refreshUsers({ searchTerm: search, pageNumber: nextPage });
  }

  function handleUpdateUserSubmit(event: FormEvent<HTMLFormElement>, userId: string) {
    event.preventDefault();

    if (!draft) {
      return;
    }

    const phone = sanitizePhone(draft.phone);
    if (!isValidPhone(phone)) {
      setFeedbackByUser((current) => ({
        ...current,
        [userId]: { kind: "error", message: PHONE_FORMAT_ERROR },
      }));
      return;
    }

    const payload: UpdateUserAdminInput = {
      name: draft.name.trim(),
      phone,
      identityDocument: draft.identityDocument.trim(),
      identityDocumentType: draft.identityDocumentType,
      role: draft.role,
      status: draft.status,
      playerCategory: draft.playerCategory,
    };

    startTransition(async () => {
      try {
        setActiveUserId(userId);
        const response = await updateUserAdmin(userId, payload);
        const updatedUser = response.data;

        setUsers((current) => current.map((user) => (
          user._id === userId
            ? {
                ...user,
                ...updatedUser,
              }
            : user
        )));

        setFeedbackByUser((current) => ({
          ...current,
          [userId]: { kind: "success", message: "Usuario actualizado." },
        }));
        setClosingFeedbackByUser((current) => ({
          ...current,
          [userId]: false,
        }));
        closeEditor();
      } catch (error) {
        setFeedbackByUser((current) => ({
          ...current,
          [userId]: { kind: "error", message: getErrorMessage(error) },
        }));
        setClosingFeedbackByUser((current) => {
          if (!(userId in current)) {
            return current;
          }

          const next = { ...current };
          delete next[userId];
          return next;
        });
      } finally {
        setActiveUserId(null);
      }
    });
  }

  return (
    <AdminSectionScaffold
      kicker="Admin usuarios"
      title="Gestion de usuarios en una sola tabla"
      description="Revisa datos de contacto y estado del usuario. Usa el boton de actualizar para abrir un formulario por fila y editar campos permitidos por el endpoint administrativo."
      primaryAction={{ label: "Actualizar listado", href: "/admin/usuarios" }}
      secondaryAction={{ label: "Dashboard", href: "/admin" }}
      metrics={[
        { label: "Total", value: String(total), helper: loadError ?? "Usuarios activos encontrados." },
        { label: "En tabla", value: String(users.length), helper: "Filas cargadas en la vista actual." },
        { label: "Clientes", value: String(roleCount), helper: "Usuarios con rol customer." },
        { label: "Con email web", value: String(webEmailCount), helper: "Cuentas con credencial web." },
      ]}
    >
      <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-64 flex-1 gap-2">
            <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Buscar usuario</span>
            <input
              className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Nombre, telefono o documento"
            />
          </label>
          <button
            type="submit"
            className="rounded-full border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/82 transition hover:bg-white/10 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setPage(1);
              void refreshUsers({ searchTerm: "", pageNumber: 1 });
            }}
            className="rounded-full border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/82 transition hover:bg-white/10 disabled:opacity-60"
            disabled={loading}
          >
            Limpiar
          </button>
        </form>

        <div className="mt-5 max-w-full overflow-x-auto">
          <table className="min-w-260 table-auto text-sm">
            <thead className="text-left text-[0.7rem] uppercase tracking-[0.18em] text-white/52">
              <tr>
                <th className="whitespace-nowrap px-3 py-2">Nombre</th>
                <th className="whitespace-nowrap px-3 py-2">Email</th>
                <th className="whitespace-nowrap px-3 py-2">Telefono</th>
                <th className="whitespace-nowrap px-3 py-2">Ciudad</th>
                <th className="whitespace-nowrap px-3 py-2">Documento</th>
                <th className="whitespace-nowrap px-3 py-2">Rol</th>
                <th className="whitespace-nowrap px-3 py-2">Estado</th>
                <th className="whitespace-nowrap px-3 py-2">Categoria</th>
                <th className="whitespace-nowrap px-3 py-2">Creado</th>
                <th className="whitespace-nowrap px-3 py-2">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {users.map((user) => (
                <Fragment key={user._id}>
                  <tr className="text-white/82">
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-white">{user.name ?? "Sin nombre"}</td>
                    <td className="whitespace-nowrap px-3 py-3">{user.webAuth?.email ?? "Sin email"}</td>
                    <td className="whitespace-nowrap px-3 py-3">{user.phone ?? "Sin telefono"}</td>
                    <td className="whitespace-nowrap px-3 py-3">{user.ciudad ?? "Sin ciudad"}</td>
                    <td className="whitespace-nowrap px-3 py-3">{user.identityDocument ?? "Sin documento"}</td>
                    <td className="whitespace-nowrap px-3 py-3">{humanizeAdminToken(user.role ?? null)}</td>
                    <td className="whitespace-nowrap px-3 py-3">{humanizeAdminToken(user.status ?? null)}</td>
                    <td className="whitespace-nowrap px-3 py-3">{humanizeAdminToken(user.playerCategory ?? null)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-white/64">{formatAdminDate(user.createdAt ?? null)}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <button
                        type="button"
                        onClick={() => openEditor(user)}
                        className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/82 transition hover:bg-white/10"
                      >
                        Actualizar
                      </button>
                    </td>
                  </tr>

                  {expandedUserId === user._id && draft ? (
                    <tr key={`${user._id}-editor`}>
                      <td colSpan={10} className="px-3 py-4">
                        <form
                          onSubmit={(event) => handleUpdateUserSubmit(event, user._id)}
                          className="grid gap-3 rounded-[1.2rem] border border-white/10 bg-black/16 p-4 md:grid-cols-2 xl:grid-cols-4"
                        >
                          <label className="grid gap-2 text-sm text-white/72">
                            Nombre
                            <input
                              className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-white outline-none focus:border-accent"
                              value={draft.name}
                              onChange={(event) => {
                                const value = event.currentTarget.value;
                                setDraft((current) => (current ? { ...current, name: value } : current));
                              }}
                              required
                            />
                          </label>

                          <label className="grid gap-2 text-sm text-white/72">
                            Telefono
                            <input
                              className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-white outline-none focus:border-accent"
                              type="tel"
                              value={draft.phone}
                              onChange={(event) => {
                                const value = sanitizePhone(event.currentTarget.value);
                                setDraft((current) => (current ? { ...current, phone: value } : current));
                              }}
                              inputMode="numeric"
                              pattern="[1-9][0-9]{9,14}"
                              title={PHONE_FORMAT_ERROR}
                              minLength={10}
                              maxLength={15}
                              required
                            />
                          </label>

                          <label className="grid gap-2 text-sm text-white/72">
                            Documento
                            <input
                              className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-white outline-none focus:border-accent"
                              value={draft.identityDocument}
                              onChange={(event) => {
                                const value = event.currentTarget.value;
                                setDraft((current) => (current ? { ...current, identityDocument: value } : current));
                              }}
                              required
                            />
                          </label>

                          <label className="grid gap-2 text-sm text-white/72">
                            Tipo de documento
                            <select
                              className="rounded-xl border border-white/10 bg-[#17191d] px-3 py-2 text-white outline-none focus:border-accent"
                              value={draft.identityDocumentType}
                              onChange={(event) => {
                                const value = event.currentTarget.value as IdentityDocumentType;
                                setDraft((current) => (current ? { ...current, identityDocumentType: value } : current));
                              }}
                            >
                              {IDENTITY_DOCUMENT_TYPES.map((item) => (
                                <option key={item} value={item} className="bg-[#0b0d12]">{humanizeAdminToken(item)}</option>
                              ))}
                            </select>
                          </label>

                          <label className="grid gap-2 text-sm text-white/72">
                            Rol
                            <select
                              className="rounded-xl border border-white/10 bg-[#17191d] px-3 py-2 text-white outline-none focus:border-accent"
                              value={draft.role}
                              onChange={(event) => {
                                const value = event.currentTarget.value as UserRole;
                                setDraft((current) => (current ? { ...current, role: value } : current));
                              }}
                            >
                              {USER_ROLES.map((item) => (
                                <option key={item} value={item} className="bg-[#0b0d12]">{humanizeAdminToken(item)}</option>
                              ))}
                            </select>
                          </label>

                          <label className="grid gap-2 text-sm text-white/72">
                            Estado
                            <select
                              className="rounded-xl border border-white/10 bg-[#17191d] px-3 py-2 text-white outline-none focus:border-accent"
                              value={draft.status}
                              onChange={(event) => {
                                const value = event.currentTarget.value as UserStatus;
                                setDraft((current) => (current ? { ...current, status: value } : current));
                              }}
                            >
                              {USER_STATUSES.map((item) => (
                                <option key={item} value={item} className="bg-[#0b0d12]">{humanizeAdminToken(item)}</option>
                              ))}
                            </select>
                          </label>

                          <label className="grid gap-2 text-sm text-white/72">
                            Categoria
                            <select
                              className="rounded-xl border border-white/10 bg-[#17191d] px-3 py-2 text-white outline-none focus:border-accent"
                              value={draft.playerCategory}
                              onChange={(event) => {
                                const value = event.currentTarget.value as PlayerCategory;
                                setDraft((current) => (current ? { ...current, playerCategory: value } : current));
                              }}
                            >
                              {PLAYER_CATEGORIES.map((item) => (
                                <option key={item} value={item} className="bg-[#0b0d12]">{humanizeAdminToken(item)}</option>
                              ))}
                            </select>
                          </label>

                          <div className="flex items-end gap-2 xl:col-span-4">
                            <button
                              type="submit"
                              disabled={isPending && activeUserId === user._id}
                              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isPending && activeUserId === user._id ? "Guardando..." : "Guardar"}
                            </button>
                            <button
                              type="button"
                              onClick={closeEditor}
                              className="rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-white/82 transition hover:bg-white/8"
                            >
                              Cancelar
                            </button>
                          </div>

                          {feedbackByUser[user._id]?.kind === "error" ? (
                            <p className="xl:col-span-4 rounded-xl border border-rose-300/24 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
                              {feedbackByUser[user._id]?.message}
                            </p>
                          ) : null}
                        </form>
                      </td>
                    </tr>
                  ) : null}

                  {feedbackByUser[user._id]?.kind === "success" ? (
                    <tr key={`${user._id}-feedback`}>
                      <td colSpan={10} className="px-3 pb-3">
                        <p className={`rounded-xl border border-emerald-300/24 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100 transition-all duration-300 ease-out ${closingFeedbackByUser[user._id] ? "translate-y-1 scale-[0.98] opacity-0" : "opacity-100"}`}>
                          {feedbackByUser[user._id]?.message}
                        </p>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && users.length === 0 ? (
          <p className="mt-4 rounded-[1.3rem] border border-dashed border-white/10 bg-black/12 px-4 py-4 text-sm leading-7 text-white/62">
            {loadError ?? "No hay usuarios para mostrar con el filtro actual."}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-4 rounded-[1.3rem] border border-dashed border-white/10 bg-black/12 px-4 py-4 text-sm leading-7 text-white/62">
            Cargando usuarios...
          </p>
        ) : null}

        {!loading && totalPages > 1 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.3rem] border border-white/10 bg-black/12 px-4 py-3 text-sm text-white/72">
            <p>
              Pagina {page} de {totalPages} · {total} usuarios encontrados
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => changePage(page - 1)}
                disabled={loading || page <= 1}
                className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 font-medium text-white/82 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => changePage(page + 1)}
                disabled={loading || page >= totalPages}
                className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 font-medium text-white/82 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </AdminSectionScaffold>
  );
}
