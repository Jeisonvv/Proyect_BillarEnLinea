"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError, postJson } from "@/lib/api/client";
import { getCurrentSession } from "@/lib/api/auth";
import { getJson } from "@/lib/api/client";

type TournamentRegistrationButtonProps = {
  tournamentId: string;
  isOpen: boolean;
  isFull: boolean;
  initialRegistrationStatus?: string | null;
};

type RegistrationResponse = {
  ok: boolean;
  requiresPayment?: boolean;
  registrationStatus?: string;
  message?: string;
  data?: WompiCheckoutConfig;
};

type WompiCheckoutConfig = {
  checkoutUrl?: string;
  publicKey?: string;
  currency?: string;
  amountInCents?: number;
  reference?: string;
  redirectUrl?: string;
  expirationTime?: string;
  signature?: {
    integrity?: string;
  };
  customerData?: {
    email?: string;
    fullName?: string;
    phoneNumberPrefix?: string;
    phoneNumber?: string;
  };
};

type TournamentRegistrationsResponse = {
  data?: TournamentRegistrationItem[];
};

type TournamentRegistrationItem = {
  status?: string;
  user?: {
    _id?: string;
  } | null;
};

async function fetchRegistrationStatus(tournamentId: string) {
  const session = await getCurrentSession().catch(() => null);
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return null;
  }

  const payload = await getJson<TournamentRegistrationsResponse>(`/api/tournaments/${tournamentId}/registrations`, {
    credentials: "include",
  });

  const registrations = Array.isArray(payload.data) ? payload.data : [];
  const currentRegistration = registrations.find((registration) => registration.user?._id === currentUserId);

  return typeof currentRegistration?.status === "string" ? currentRegistration.status : null;
}

function humanizeRegistrationStatus(status: string | null) {
  switch (status) {
    case "CONFIRMED":
      return "Inscripción confirmada";
    case "PENDING":
      return "Inscripción pendiente";
    case "WAITLIST":
      return "En lista de espera";
    case "CANCELLED":
      return "Inscripción cancelada";
    default:
      return null;
  }
}

function buildWompiCheckoutUrl(config: WompiCheckoutConfig) {
  if (!config.checkoutUrl || !config.publicKey || !config.currency || !config.amountInCents || !config.reference) {
    return null;
  }

  const params = new URLSearchParams({
    "public-key": config.publicKey,
    currency: config.currency,
    "amount-in-cents": String(config.amountInCents),
    reference: config.reference,
  });

  if (config.redirectUrl) {
    params.set("redirect-url", config.redirectUrl);
  }

  if (config.expirationTime) {
    params.set("expiration-time", config.expirationTime);
  }

  if (config.signature?.integrity) {
    params.set("signature:integrity", config.signature.integrity);
  }

  if (config.customerData?.email) {
    params.set("customer-data:email", config.customerData.email);
  }

  if (config.customerData?.fullName) {
    params.set("customer-data:full-name", config.customerData.fullName);
  }

  if (config.customerData?.phoneNumberPrefix) {
    params.set("customer-data:phone-number-prefix", config.customerData.phoneNumberPrefix);
  }

  if (config.customerData?.phoneNumber) {
    params.set("customer-data:phone-number", config.customerData.phoneNumber);
  }

  return `${config.checkoutUrl}?${params.toString()}`;
}

export function TournamentRegistrationButton({
  tournamentId,
  isOpen,
  isFull,
  initialRegistrationStatus = null,
}: TournamentRegistrationButtonProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string>("");
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (initialRegistrationStatus !== null) {
      return;
    }

    let isActive = true;

    void fetchRegistrationStatus(tournamentId)
      .then((nextStatus) => {
        if (!isActive) {
          return;
        }

        setRegistrationStatus(nextStatus);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setRegistrationStatus(null);
      });

    return () => {
      isActive = false;
    };
  }, [initialRegistrationStatus, tournamentId]);

  async function syncRegistrationState(options?: { showLoadingState?: boolean }) {
    if (options?.showLoadingState) {
      setIsCheckingStatus(true);
    }

    try {
      const nextStatus = await fetchRegistrationStatus(tournamentId);
      setRegistrationStatus(nextStatus);
    } catch {
      setRegistrationStatus(null);
    } finally {
      setIsCheckingStatus(false);
    }
  }

  const effectiveRegistrationStatus = registrationStatus ?? initialRegistrationStatus;
  const hasActiveRegistration = effectiveRegistrationStatus === "PENDING"
    || effectiveRegistrationStatus === "CONFIRMED"
    || effectiveRegistrationStatus === "WAITLIST";
  const disabled = !isOpen || isFull || isPending || isCheckingStatus || hasActiveRegistration;

  function getIdleLabel() {
    if (effectiveRegistrationStatus === "CONFIRMED") {
      return "Ya estás inscrito";
    }

    if (effectiveRegistrationStatus === "PENDING") {
      return "Inscripción pendiente";
    }

    if (effectiveRegistrationStatus === "WAITLIST") {
      return "En lista de espera";
    }

    if (!isOpen) {
      return "Inscripciones cerradas";
    }

    if (isFull) {
      return "Cupos agotados";
    }

    return "Inscribirme al torneo";
  }

  function handleRegister() {
    if (disabled) {
      return;
    }

    setFeedback("");

    startTransition(async () => {
      try {
        const response = await postJson<RegistrationResponse, Record<string, never>>(
          `/api/tournaments/${tournamentId}/register-self`,
          {},
          { credentials: "include" },
        );

        if (response.requiresPayment) {
          const wompiUrl = buildWompiCheckoutUrl(response.data ?? {});

          if (!wompiUrl) {
            setFeedback("Tu inscripción fue creada, pero no se pudo preparar la redirección al pago.");
            setRegistrationStatus(response.registrationStatus ?? "PENDING");
            return;
          }

          window.location.assign(wompiUrl);
          return;
        } else {
          setRegistrationStatus(response.registrationStatus ?? null);
          setFeedback(response.message ?? "Inscripción realizada correctamente.");
        }

        router.refresh();
        await syncRegistrationState({ showLoadingState: true });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.push("/login");
          return;
        }

        if (error instanceof ApiError && error.message.includes("ya está inscrito en este torneo")) {
          await syncRegistrationState({ showLoadingState: true });
        }

        setFeedback(
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "No fue posible completar la inscripción.",
        );
      }
    });
  }

  return (
    <div className="grid gap-3">
      <button
        className="inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#0b0b0d] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45"
        type="button"
        disabled={disabled}
        onClick={handleRegister}
      >
        {isPending ? "Procesando inscripción..." : getIdleLabel()}
      </button>

      {feedback ? (
        <p className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-white/76">
          {feedback}
        </p>
      ) : null}

      {effectiveRegistrationStatus ? (
        <p className="rounded-[1.2rem] border border-[rgba(246,196,79,0.16)] bg-[rgba(246,196,79,0.08)] px-4 py-3 text-sm leading-7 text-[rgba(255,245,214,0.92)]">
          Estado actual: {humanizeRegistrationStatus(effectiveRegistrationStatus) ?? effectiveRegistrationStatus}
        </p>
      ) : null}
    </div>
  );
}