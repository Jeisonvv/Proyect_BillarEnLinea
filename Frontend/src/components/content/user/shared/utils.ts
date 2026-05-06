export function humanizeToken(value: string | null) {
  if (!value) {
    return "Disponible pronto";
  }

  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Fecha por anunciar";
  }

  const dateFormatter = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateFormatter.format(parsed);
}

export function formatMoney(value: number | null) {
  if (value === null) {
    return "Consulta precio";
  }

  if (value <= 0) {
    return "Entrada libre";
  }

  const moneyFormatter = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

  return moneyFormatter.format(value);
}