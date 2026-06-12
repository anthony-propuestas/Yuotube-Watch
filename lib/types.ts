export type TaskStatus = "pending" | "in_progress" | "done";
export type TaskType = "video" | "short" | "live" | "community_post" | "otro";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null; // ISO 8601 (YYYY-MM-DD)
  status: TaskStatus;
  type: TaskType | null;
  created_at: string;
}

export interface Channel {
  id: string;
  user_id: string;
  channel_id: string;
  channel_name: string | null;
  thumbnail_url: string | null;
  subscribers: number | null;
  total_views: number | null;
  video_count: number | null;
  last_synced_at: string | null;
}
