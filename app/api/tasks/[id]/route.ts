import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Task } from "@/lib/types";

const TYPES = ["video", "short", "live", "community_post", "otro"];
const STATUSES = ["pending", "in_progress", "done"];

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const { id } = await params;

  const body = (await request.json()) as Partial<Task>;
  if (body.type && !TYPES.includes(body.type)) {
    return Response.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (body.status && !STATUSES.includes(body.status)) {
    return Response.json({ error: "Estado inválido" }, { status: 400 });
  }
  if (body.title !== undefined && !body.title?.trim()) {
    return Response.json({ error: "El título es obligatorio" }, { status: 400 });
  }

  const fields: string[] = [];
  const values: (string | null)[] = [];
  for (const key of ["title", "description", "due_date", "status", "type"] as const) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(body[key] as string | null);
    }
  }
  if (fields.length === 0) {
    return Response.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const db = await getDb();
  const result = await db
    .prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`)
    .bind(...values, id, session.user.id)
    .run();

  if (result.meta.changes === 0) {
    return Response.json({ error: "Tarea no encontrada" }, { status: 404 });
  }

  const task = await db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .bind(id, session.user.id)
    .first<Task>();

  return Response.json({ task });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const { id } = await params;

  const db = await getDb();
  const result = await db
    .prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
    .bind(id, session.user.id)
    .run();

  if (result.meta.changes === 0) {
    return Response.json({ error: "Tarea no encontrada" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
