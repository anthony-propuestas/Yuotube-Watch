import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Task } from "@/lib/types";

const TYPES = ["video", "short", "live", "community_post", "otro"];
const STATUSES = ["pending", "in_progress", "done"];

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const db = await getDb();
  const { results } = await db
    .prepare(
      "SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date IS NULL, due_date ASC, created_at DESC"
    )
    .bind(session.user.id)
    .all<Task>();

  return Response.json({ tasks: results });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<Task>;
  const title = body.title?.trim();
  if (!title) {
    return Response.json({ error: "El título es obligatorio" }, { status: 400 });
  }
  if (body.type && !TYPES.includes(body.type)) {
    return Response.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (body.status && !STATUSES.includes(body.status)) {
    return Response.json({ error: "Estado inválido" }, { status: 400 });
  }

  const db = await getDb();
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO tasks (id, user_id, title, description, due_date, status, type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      session.user.id,
      title,
      body.description ?? null,
      body.due_date ?? null,
      body.status ?? "pending",
      body.type ?? null
    )
    .run();

  const task = await db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .bind(id, session.user.id)
    .first<Task>();

  return Response.json({ task }, { status: 201 });
}
