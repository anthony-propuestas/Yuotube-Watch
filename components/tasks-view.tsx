"use client";

import { useCallback, useEffect, useState } from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { STATUS_LABELS, TYPE_COLORS, TYPE_LABELS } from "@/lib/labels";
import { TaskModal } from "./task-modal";

const COLUMNS: TaskStatus[] = ["pending", "in_progress", "done"];

export function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; task: Task | null }>({
    open: false,
    task: null,
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/tasks");
    if (res.ok) {
      const data = (await res.json()) as { tasks: Task[] };
      setTasks(data.tasks);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  async function setStatus(task: Task, status: TaskStatus) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status } : t))
    );
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (loading) {
    return <p className="py-20 text-center text-zinc-500">Cargando tareas…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Tareas</h1>
        <button
          onClick={() => setModal({ open: true, task: null })}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium transition hover:bg-red-500"
        >
          + Nueva tarea
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((status) => {
          const items = tasks.filter((t) => t.status === status);
          return (
            <section
              key={status}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4"
            >
              <h2 className="flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-zinc-400">
                {STATUS_LABELS[status]}
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs">
                  {items.length}
                </span>
              </h2>
              {items.length === 0 && (
                <p className="py-4 text-center text-sm text-zinc-600">
                  Sin tareas
                </p>
              )}
              {items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => setModal({ open: true, task })}
                  onStatus={(s) => setStatus(task, s)}
                />
              ))}
            </section>
          );
        })}
      </div>

      {modal.open && (
        <TaskModal
          task={modal.task}
          onClose={() => setModal({ open: false, task: null })}
          onChanged={load}
        />
      )}
    </div>
  );
}

function TaskCard({
  task,
  onEdit,
  onStatus,
}: {
  task: Task;
  onEdit: () => void;
  onStatus: (s: TaskStatus) => void;
}) {
  const overdue =
    task.due_date && task.status !== "done"
      ? task.due_date < new Date().toISOString().slice(0, 10)
      : false;

  return (
    <div
      onClick={onEdit}
      className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition hover:border-zinc-600"
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={`font-medium ${
            task.status === "done" ? "text-zinc-500 line-through" : ""
          }`}
        >
          {task.title}
        </p>
        {task.status !== "done" ? (
          <button
            title="Marcar como hecha"
            onClick={(e) => {
              e.stopPropagation();
              onStatus("done");
            }}
            className="rounded-md border border-zinc-700 px-1.5 text-sm text-zinc-400 transition hover:bg-green-900/40 hover:text-green-400"
          >
            ✓
          </button>
        ) : (
          <button
            title="Reabrir"
            onClick={(e) => {
              e.stopPropagation();
              onStatus("pending");
            }}
            className="rounded-md border border-zinc-700 px-1.5 text-sm text-zinc-500 transition hover:bg-zinc-800"
          >
            ↺
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {task.type && (
          <span className={`rounded-full px-2 py-0.5 ${TYPE_COLORS[task.type]}`}>
            {TYPE_LABELS[task.type]}
          </span>
        )}
        {task.due_date && (
          <span className={overdue ? "text-red-400" : "text-zinc-500"}>
            📅 {task.due_date}
            {overdue && " (vencida)"}
          </span>
        )}
      </div>
    </div>
  );
}
