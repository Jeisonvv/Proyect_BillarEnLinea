


import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <section>
      <nav>Bienvenido</nav>
      <div>{children}</div>
    </section>
  );
}
