import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Channel } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const db = await getDb();
  const channel = await db
    .prepare("SELECT * FROM channels WHERE user_id = ? LIMIT 1")
    .bind(session.user.id)
    .first<Channel>();

  return Response.json({ channel: channel ?? null });
}
