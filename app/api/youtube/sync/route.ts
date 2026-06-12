import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { headers } from "next/headers";

interface YouTubeChannelsResponse {
  items?: {
    id: string;
    snippet: {
      title: string;
      thumbnails?: { default?: { url?: string } };
    };
    statistics: {
      subscriberCount?: string;
      viewCount?: string;
      videoCount?: string;
    };
  }[];
}

export async function POST() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const userId = session.user.id;

  // Token de Google (Better Auth lo refresca si expiró)
  let accessToken: string | null | undefined;
  try {
    const token = await auth.api.getAccessToken({
      body: { providerId: "google", userId },
    });
    accessToken = token.accessToken;
  } catch {
    return Response.json(
      { error: "No hay cuenta de Google vinculada. Vuelve a iniciar sesión." },
      { status: 400 }
    );
  }
  if (!accessToken) {
    return Response.json(
      { error: "Token de Google no disponible. Vuelve a iniciar sesión." },
      { status: 400 }
    );
  }

  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const detail = await res.text();
    return Response.json(
      { error: "Error de la API de YouTube", detail },
      { status: 502 }
    );
  }

  const data = (await res.json()) as YouTubeChannelsResponse;
  const item = data.items?.[0];
  if (!item) {
    return Response.json(
      { error: "Esta cuenta de Google no tiene canal de YouTube" },
      { status: 404 }
    );
  }

  const db = await getDb();
  const now = new Date().toISOString();
  const channel = {
    channel_id: item.id,
    channel_name: item.snippet.title,
    thumbnail_url: item.snippet.thumbnails?.default?.url ?? null,
    subscribers: Number(item.statistics.subscriberCount ?? 0),
    total_views: Number(item.statistics.viewCount ?? 0),
    video_count: Number(item.statistics.videoCount ?? 0),
    last_synced_at: now,
  };

  const existing = await db
    .prepare("SELECT id FROM channels WHERE user_id = ? AND channel_id = ?")
    .bind(userId, channel.channel_id)
    .first<{ id: string }>();

  if (existing) {
    await db
      .prepare(
        `UPDATE channels SET channel_name = ?, thumbnail_url = ?, subscribers = ?,
         total_views = ?, video_count = ?, last_synced_at = ?
         WHERE id = ? AND user_id = ?`
      )
      .bind(
        channel.channel_name,
        channel.thumbnail_url,
        channel.subscribers,
        channel.total_views,
        channel.video_count,
        channel.last_synced_at,
        existing.id,
        userId
      )
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO channels (id, user_id, channel_id, channel_name, thumbnail_url,
         subscribers, total_views, video_count, last_synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        userId,
        channel.channel_id,
        channel.channel_name,
        channel.thumbnail_url,
        channel.subscribers,
        channel.total_views,
        channel.video_count,
        channel.last_synced_at
      )
      .run();
  }

  return Response.json({ channel });
}
