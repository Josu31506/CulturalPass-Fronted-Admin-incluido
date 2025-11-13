// src/app/dashboard/events/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getAllEvents, deleteEvent } from "@src/services/admin/events";
import type { Event } from "@src/interfaces/event/Event";

export default function AdminEventsPage() {
  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const list = await getAllEvents(token);
        setEvents(list);
      } catch (e: any) {
        setErr(e.message ?? "Error cargando eventos");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("¿Eliminar evento?")) return;
    try {
      await deleteEvent(token, id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (e: any) {
      alert(e.message ?? "No se pudo eliminar");
    }
  };

  if (status === "loading") return <div className="p-6">Cargando…</div>;
  if (!token) return <div className="p-6">Debes iniciar sesión como administrador.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Eventos (admin)</h1>

        {/* Botón único -> formulario de creación */}
        <Link
          href="/dashboard/events/create"
          className="px-4 py-2 rounded-2xl bg-background-little-1 text-white text-sm"
          aria-label="Crear evento"
        >
          Crear evento
        </Link>
      </div>

      {loading && <div>Cargando eventos…</div>}
      {err && <div className="text-red-500 text-sm">{err}</div>}

      <div className="overflow-x-auto rounded-xl bg-background-secondary">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Inicio</th>
              <th className="px-4 py-3">Entrada</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {events.map(ev => (
              <tr key={ev.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-4 py-2">{ev.id}</td>
                <td className="px-4 py-2 max-w-xs truncate">{ev.title}</td>
                <td className="px-4 py-2">{ev.type}</td>
                <td className="px-4 py-2">{ev.status}</td>
                <td className="px-4 py-2">
                  {new Date(ev.startDate).toLocaleString("es-PE", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </td>
                <td className="px-4 py-2">
                  {ev.costEntry > 0 ? `S/ ${ev.costEntry.toFixed(2)}` : "Libre"}
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  <Link
                    href={`/dashboard/events/${ev.id}/edit`}
                    className="text-xs px-2 py-1 rounded-full border border-white/30"
                  >
                    Editar
                  </Link>
                  <button
                    className="text-xs px-2 py-1 rounded-full border border-red-400 text-red-300"
                    onClick={() => handleDelete(ev.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {events.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  No hay eventos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
