"use client";

import { useCallback, useEffect, useState } from "react";
import type { Channel } from "@/lib/types";

const numberFormat = new Intl.NumberFormat("es");

export function DashboardView() {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube/sync", { method: "POST" });
      const data = (await res.json()) as { channel?: Channel; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al sincronizar");
      } else if (data.channel) {
        setChannel((prev) => ({ ...prev, ...data.channel }) as Channel);
      }
    } catch {
      setError("Error de red al sincronizar");
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/channel");
        const data = (await res.json()) as { channel: Channel | null };
        if (data.channel) {
          setChannel(data.channel);
        } else {
          // Primera visita: sincronizar automáticamente
          await sync();
        }
      } catch {
        setError("No se pudo cargar el canal");
      } finally {
        setLoading(false);
      }
    })();
  }, [sync]);

  if (loading) {
    return <p className="py-20 text-center text-zinc-500">Cargando canal…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={sync}
          disabled={syncing}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium transition hover:bg-red-500 disabled:opacity-60"
        >
          {syncing ? "Sincronizando…" : "Actualizar datos"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {channel ? (
        <>
          <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            {channel.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={channel.thumbnail_url}
                alt={channel.channel_name ?? "Canal"}
                className="h-16 w-16 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold">{channel.channel_name}</h2>
              {channel.last_synced_at && (
                <p className="text-sm text-zinc-500">
                  Última sincronización:{" "}
                  {new Date(channel.last_synced_at).toLocaleString("es")}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="Suscriptores"
              value={channel.subscribers}
              icon="👥"
            />
            <MetricCard
              label="Vistas totales"
              value={channel.total_views}
              icon="👁️"
            />
            <MetricCard
              label="Videos publicados"
              value={channel.video_count}
              icon="🎬"
            />
          </div>
        </>
      ) : (
        !syncing && (
          <p className="py-12 text-center text-zinc-500">
            Aún no hay datos del canal. Pulsa «Actualizar datos» para
            sincronizar con YouTube.
          </p>
        )
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | null;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <p className="flex items-center gap-2 text-sm text-zinc-400">
        <span>{icon}</span> {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums">
        {value !== null ? numberFormat.format(value) : "—"}
      </p>
    </div>
  );
}
