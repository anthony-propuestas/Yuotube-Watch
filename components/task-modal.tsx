"use client";

import { useEffect, useState } from "react";
import type { Task, TaskStatus, TaskType } from "@/lib/types";
import { STATUS_LABELS, TYPE_LABELS } from "@/lib/labels";

export function TaskModal({
  task,
  defaultDate,
  onClose,
  onChanged,
}: {
  task: Task | null; // null = crear
  defaultDate?: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [type, setType] = useState<TaskType>(task?.type ?? "video");
  const [dueDate, setDueDate] = useState(task?.due_date ?? defaultDate ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "pending");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: title.trim(),
      type,
      due_date: dueDate || null,
      description: description.trim() || null,
      status,
    };
    const res = await fetch(task ? `/api/tasks/${task.id}` : "/api/tasks", {
      method: task ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Error al guardar");
      return;
    }
    onChanged();
    onClose();
  }

  async function remove() {
    if (!task) return;
    setSaving(true);
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    setSaving(false);
    if (res.ok) {
      onChanged();
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
      >
        <h2 className="text-lg font-semibold">
          {task ? "Editar tarea" : "Nueva tarea"}
        </h2>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Título *</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-500"
            placeholder="Ej.: Grabar video de unboxing"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-400">Tipo</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TaskType)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-500"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-400">Fecha límite</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-500"
            />
          </label>
        </div>

        {task && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-400">Estado</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-500"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Descripción</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-500"
            placeholder="Notas, guion, enlaces…"
          />
        </label>

        <div className="mt-2 flex items-center justify-between">
          {task ? (
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              className="rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-950/50 disabled:opacity-60"
            >
              Eliminar
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm transition hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium transition hover:bg-red-500 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
