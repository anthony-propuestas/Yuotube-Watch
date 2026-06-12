import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignInButton } from "@/components/sign-in-button";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-2xl">
          ▶
        </span>
        <h1 className="text-4xl font-bold tracking-tight">YouTube Watch</h1>
      </div>
      <p className="max-w-md text-lg text-zinc-400">
        Conecta tu canal de YouTube, mira tus métricas clave y organiza tu
        contenido en un calendario.
      </p>
      <SignInButton />
      <ul className="mt-4 grid max-w-2xl gap-4 text-sm text-zinc-500 sm:grid-cols-3">
        <li className="rounded-xl border border-zinc-800 p-4">
          📊 Suscriptores, vistas y videos de tu canal
        </li>
        <li className="rounded-xl border border-zinc-800 p-4">
          🗓️ Calendario mensual de publicaciones
        </li>
        <li className="rounded-xl border border-zinc-800 p-4">
          ✅ To-do list de ideas y tareas de contenido
        </li>
      </ul>
    </main>
  );
}
