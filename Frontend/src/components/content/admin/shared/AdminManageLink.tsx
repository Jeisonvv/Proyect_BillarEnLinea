import Link from "next/link";

type AdminManageLinkProps = {
  href: string;
  label?: string;
};

export function AdminManageLink({ href, label = "Administrar" }: AdminManageLinkProps) {
  return (
    <Link
      className="inline-flex items-center justify-center rounded-full border border-[rgba(246,196,79,0.28)] bg-[rgba(246,196,79,0.12)] px-4 py-2 text-sm font-semibold text-[#f6c44f] transition hover:border-[rgba(246,196,79,0.4)] hover:bg-[rgba(246,196,79,0.18)] hover:text-white"
      href={href}
    >
      {label}
    </Link>
  );
}