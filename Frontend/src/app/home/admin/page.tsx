import { redirect } from "next/navigation";
export default async function HomeAdminPage() {
  redirect("/admin");
}