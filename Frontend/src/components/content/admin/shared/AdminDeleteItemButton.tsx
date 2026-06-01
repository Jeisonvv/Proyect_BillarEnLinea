"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { deleteJson } from "@/lib/api/client";
import { AdminDeleteConfirmationButton } from "./AdminDeleteConfirmationButton";

type AdminDeleteItemButtonProps = {
  itemLabel: string;
  itemName: string;
  deletePath: string;
  consequences?: ReactNode[];
  description?: ReactNode;
  title?: string;
  successMessage?: string;
  openLabel?: string;
  confirmLabel?: string;
  pendingOpenLabel?: string;
  pendingConfirmLabel?: string;
  redirectTo?: string;
  variant?: "pill" | "text";
  tone?: "warning" | "danger";
};

export function AdminDeleteItemButton({
  itemLabel,
  itemName,
  deletePath,
  consequences = [],
  description,
  title = `Eliminar ${itemLabel}`,
  successMessage = `${itemLabel.charAt(0).toUpperCase()}${itemLabel.slice(1)} eliminado correctamente.`,
  openLabel = `Eliminar ${itemLabel}`,
  confirmLabel = `Sí, eliminar ${itemLabel}`,
  pendingOpenLabel = "Eliminando...",
  pendingConfirmLabel = `Eliminando ${itemLabel}...`,
  redirectTo,
  variant = "pill",
  tone = "danger",
}: AdminDeleteItemButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    const response = await deleteJson<{ message?: string }>(deletePath, {
      credentials: "include",
    });

    if (redirectTo) {
      router.replace(redirectTo);
    }

    router.refresh();

    return response;
  }

  return (
    <AdminDeleteConfirmationButton
      confirmLabel={confirmLabel}
      consequences={consequences}
      description={description ?? (
        <>
          Vas a eliminar <span className="font-semibold text-white">{itemName}</span>. Esta acción no se puede deshacer.
        </>
      )}
      onDelete={handleDelete}
      openLabel={openLabel}
      pendingConfirmLabel={pendingConfirmLabel}
      pendingOpenLabel={pendingOpenLabel}
      successMessage={successMessage}
      title={title}
      variant={variant}
      tone={tone}
    />
  );
}