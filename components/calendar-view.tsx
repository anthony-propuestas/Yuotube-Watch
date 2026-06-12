"use client";

import { useCallback, useEffect, useState } from "react";
import type { Task } from "@/lib/types";
import { TYPE_COLORS } from "@/lib/labels";
import { TaskModal } from "./task-modal";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function toISODate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modal, setModal] = useState<{
    open: boolean;
    task: Task | null;
    date?: string;
  }>({ open: false, task: null });

  const load = useCallback(async () => {
    const res = await fetch("/api/tasks");
    if (res.ok) {
      const data = (await res.json()) as { tasks: Task[] };
      setTasks(data.tasks);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  function move(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay(): 0=domingo → convertir a semana que empieza en lunes
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const todayISO = toISODate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const byDate = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.due_date) continue;
    const list = byDate.get(task.due_date) ?? [];
    list.push(task);
    byDate.set(task.due_date, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => move(-1)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm transition hover:bg-zinc-800"
          >
            ←
          </button>
          <span className="min-w-40 text-center font-medium">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={() => move(1)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm transition hover:bg-zinc-800"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-zinc-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="-mt-4 grid grid-cols-7 gap-1">
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const iso = toISODate(year, month, day);
          const dayTasks = byDate.get(iso) ?? [];
          const isToday = iso === todayISO;
          return (
            <div
              key={iso}
              onClick={() => setModal({ open: true, task: null, date: iso })}
              className={`flex min-h-24 cursor-pointer flex-col gap-1 rounded-lg border p-1.5 transition hover:border-zinc-500 ${
                isToday
                  ? "border-red-700 bg-red-950/20"
                  : "border-zinc-800 bg-zinc-900/30"
              }`}
            >
              <span
                className={`text-xs ${
                  isToday ? "font-bold text-red-400" : "text-zinc-500"
                }`}
              >
                {day}
              </span>
              {dayTasks.slice(0, 3).map((task) => (
                <button
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setModal({ open: true, task });
                  }}
                  className={`truncate rounded px-1.5 py-0.5 text-left text-xs ${
                    task.type
                      ? TYPE_COLORS[task.type]
                      : "bg-zinc-500/15 text-zinc-400"
                  } ${task.status === "done" ? "line-through opacity-60" : ""}`}
                  title={task.title}
                >
                  {task.title}
                </button>
              ))}
              {dayTasks.length > 3 && (
                <span className="text-xs text-zinc-500">
                  +{dayTasks.length - 3} más
                </span>
              )}
            </div>
          );
        })}
      </div>

      {modal.open && (
        <TaskModal
          task={modal.task}
          defaultDate={modal.date}
          onClose={() => setModal({ open: false, task: null })}
          onChanged={load}
        />
      )}
    </div>
  );
}
