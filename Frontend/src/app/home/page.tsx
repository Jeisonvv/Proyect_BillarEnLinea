import { cookies } from "next/headers";
import { getLandingTournaments } from "@/lib/api/public-content";




export default async function PageHome() {
  let userName = "";
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;
  const torneos = await getLandingTournaments();
  console.log("contenido del snapshot", torneos);

  if (authToken) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001"}/api/auth/me`, {
        headers: {
          Cookie: `auth_token=${authToken}`,
        },
        credentials: "include",
        cache: "no-store",
      });
      const session = await res.json();
      userName = session.user?.name || session.user?.email || "";
      

    } catch {}
  }

  return (
    
    <main>
      <h2>¡Hola, {userName ? userName : "visitante"}!</h2>
      <p>Puedes editar este archivo para personalizar tu contenido.</p>
      
      
    </main>
  );
}