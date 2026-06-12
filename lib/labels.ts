import type { TaskStatus, TaskType } from "./types";

export const TYPE_LABELS: Record<TaskType, string> = {
  video: "Video",
  short: "Short",
  live: "Live",
  community_post: "Post de comunidad",
  otro: "Otro",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  done: "Hecho",
};

export const TYPE_COLORS: Record<TaskType, string> = {
  video: "bg-red-500/15 text-red-400",
  short: "bg-purple-500/15 text-purple-400",
  live: "bg-rose-500/15 text-rose-400",
  community_post: "bg-sky-500/15 text-sky-400",
  otro: "bg-zinc-500/15 text-zinc-400",
};
