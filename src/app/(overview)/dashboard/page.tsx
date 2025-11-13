// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getAllEvents,
  deleteEvent,
  type EventPayload,
  createEvent,
} from "@src/services/admin/events";
import {
  getMonthlyUsersEnrolled,
  getPendingEvents,
  getYearlyEvents,
  getMonthlyRevenue,
  getMonthlyEnrollmentRecord,
} from "@src/services/admin/statistics";
import type { Event } from "@src/interfaces/event/Event";

export default function DashboardPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<any | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        setError(null);
        setLoadingEvents(true);
        setLoadingStats(true);

        const [eventsList, users, pending, yearly, revenue, record] =
          await Promise.all([
            getAllEvents(token),
            getMonthlyUsersEnrolled(token, currentMonth, currentYear),
            getPendingEvents(token),
            getYearlyEvents(token, currentYear),
            getMonthlyRevenue(token, currentMonth, currentYear),
            getMonthlyEnrollmentRecord(token, currentMonth, currentYear),
          ]);

        setEvents(eventsList);
        setStats({ users, pending, yearly, revenue, record });
      } catch (e: any) {
        setError(e.message ?? "Error cargando datos");
      } finally {
        setLoadingEvents(false);
        setLoadingStats(false);
      }
    };

    loadData();
  }, [token, currentMonth, currentYear]);

  const handleDeleteEvent = async (id: number) => {
    if (!token) return;
    if (!confirm("¿Seguro que deseas eliminar este evento?")) return;

    try {
      await deleteEvent(token, id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      alert(e.message ?? "No se pudo eliminar el evento");
    }
  };

  const handleQuickCreate = async () => {
    if (!token) return;

    const payload: EventPayload = {
      title: "Nuevo evento",
      description: "Descripción pendiente",
      imageUrl: "",
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
      location: "Centro Cultural",
      type: "CONCIERTO",
      status: "APERTURADO",
      capacity: 50,
      costEntry: 0,
      tags: [],
    };

    try {
      const created = await createEvent(token, payload);
      setEvents((prev) => [created, ...prev]);
    } catch (e: any) {
      alert(e.message ?? "No se pudo crear el evento");
    }
  };

  if (!token) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Panel de administración</h1>
        <p>Debes iniciar sesión como administrador.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-2">Panel de administración</h1>
      <p className="text-sm text-gray-300">
        Desde aquí puedes gestionar los eventos y revisar las estadísticas
        principales del Cultural Pass.
      </p>

      {/* Estadísticas */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Analítica rápida</h2>

        {loadingStats && <div>Cargando estadísticas...</div>}

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-background-secondary p-4">
              <p className="text-xs text-gray-400">
                Usuarios inscritos este mes
              </p>
              <p className="text-2xl font-bold">
                {stats.users.totalUsers ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-background-secondary p-4">
              <p className="text-xs text-gray-400">Eventos pendientes</p>
              <p className="text-2xl font-bold">
                {stats.pending.totalPending ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-background-secondary p-4">
              <p className="text-xs text-gray-400">Eventos programados año</p>
              <p className="text-2xl font-bold">
                {stats.yearly.totalEvents ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-background-secondary p-4">
              <p className="text-xs text-gray-400">
                Recaudación mensual (S/)
              </p>
              <p className="text-2xl font-bold">
                {stats.revenue.totalRevenue?.toFixed(2) ?? "0.00"}
              </p>
            </div>

            <div className="rounded-xl bg-background-secondary p-4 sm:col-span-2 md:col-span-1">
              <p className="text-xs text-gray-400">
                Record diario de inscripciones
              </p>
              <p className="text-lg font-semibold">
                {stats.record.maxEnrollmentsInADay ?? 0} inscripciones
              </p>
              <p className="text-xs text-gray-400">
                Fecha:{" "}
                {stats.record.dateOfRecord &&
                  new Date(stats.record.dateOfRecord).toLocaleDateString(
                    "es-PE"
                  )}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Gestión de eventos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Gestión de eventos</h2>
          <button
            onClick={handleQuickCreate}
            className="px-4 py-2 rounded-2xl bg-background-little-1 text-white text-sm"
          >
            Crear evento rápido
          </button>
        </div>

        {loadingEvents && <div>Cargando eventos...</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}

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
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="border-t border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-2">{event.id}</td>
                  <td className="px-4 py-2 max-w-xs truncate">
                    {event.title}
                  </td>
                  <td className="px-4 py-2">{event.type}</td>
                  <td className="px-4 py-2">{event.status}</td>
                  <td className="px-4 py-2">
                    {new Date(event.startDate).toLocaleString("es-PE", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2">
                    {event.costEntry > 0
                      ? `S/ ${event.costEntry.toFixed(2)}`
                      : "Libre"}
                  </td>
                  <td className="px-4 py-2 text-right space-x-2">
                    {/* Aquí luego puedes mandar a /dashboard/create?id=... para edición completa */}
                    <button
                      className="text-xs px-2 py-1 rounded-full border border-white/30"
                      onClick={() =>
                        alert(
                          "Para editar más campos crea luego una página específica /dashboard/create?id=ID"
                        )
                      }
                    >
                      Editar
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded-full border border-red-400 text-red-300"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {events.length === 0 && !loadingEvents && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    No hay eventos registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
