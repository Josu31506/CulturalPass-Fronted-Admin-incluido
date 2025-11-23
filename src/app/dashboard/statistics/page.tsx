// src/app/dashboard/statistics/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getMonthlyUsersEnrolled,
  getPendingEvents,
  getYearlyEvents,
  getMonthlyRevenue,
  getMonthlyEnrollmentRecord,
} from "@src/services/admin/statistics";

// Recharts
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type DailyRec = { date: string; enrollments: number };

export default function AdminStatisticsPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    users: { totalUsers: number };
    pending: { totalPendingEvents: number };
    yearly: { totalEvents: number };
    revenue: { totalRevenue: number; totalEnrollments: number };
    record: {
      month: number;
      year: number;
      totalEnrollments: number;
      dailyRecords: DailyRec[];
    };
  } | null>(null);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [users, pending, yearly, revenue, record] = await Promise.all([
          getMonthlyUsersEnrolled(token, month, year),
          getPendingEvents(token),
          getYearlyEvents(token, year),
          getMonthlyRevenue(token, month, year),
          getMonthlyEnrollmentRecord(token, month, year),
        ]);
        setStats({ users, pending, yearly, revenue, record });
      } catch (e: any) {
        setErr(e.message ?? "No se pudo cargar la analítica");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, month, year]);

  // Normaliza datos para la tabla/gráfica
  const dailyData = useMemo(() => {
    if (!stats?.record?.dailyRecords) return [];
    return stats.record.dailyRecords.map((d: any) => ({
      key: d.date,
      dateLabel: new Date(d.date).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
      }),
      enrollments: Number(d.enrollments ?? 0),
    }));
  }, [stats]);

  const currency = (n: number | undefined) =>
    (Number(n ?? 0)).toLocaleString("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Estadísticas (admin)</h1>
          <p className="text-xs opacity-70">
            Resumen del mes {month.toString().padStart(2, "0")}/{year}
          </p>
        </div>
      </header>

      {/* Estados */}
      {loading && (
        <div className="rounded-xl bg-background-secondary p-4 animate-pulse">
          Cargando…
        </div>
      )}
      {err && (
        <div className="rounded-xl border border-red-400/40 bg-red-900/20 p-4 text-sm text-red-200">
          {err}
        </div>
      )}

      {/* KPIs */}
      {!!stats && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Usuarios inscritos este mes"
            value={stats.users?.totalUsers ?? 0}
            hint="Únicos que obtuvieron token"
          />
          <KpiCard
            label="Eventos pendientes"
            value={stats.pending?.totalPendingEvents ?? 0}
            hint="Con fecha de fin > hoy"
          />
          <KpiCard
            label="Eventos programados (año)"
            value={stats.yearly?.totalEvents ?? 0}
            hint={`${year}`}
          />
          <KpiCard
            label="Recaudación mensual"
            value={currency(stats.revenue?.totalRevenue)}
            hint={`${stats.revenue?.totalEnrollments ?? 0} inscripciones`}
          />
        </section>
      )}

      {/* Gráfica */}
      {!!stats && dailyData.length > 0 && (
        <section className="rounded-2xl bg-background-secondary/95 backdrop-blur p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">
            Gráfica de inscripciones por día
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ left: 8, right: 16, top: 10 }}>
                <defs>
                  <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  width={32}
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(23, 23, 23, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    backdropFilter: "blur(4px)",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  itemStyle={{ color: "#fbbf24" }}
                  labelStyle={{ color: "#9ca3af", marginBottom: "0.25rem" }}
                  labelFormatter={(l) => `Fecha: ${l}`}
                  formatter={(v) => [`${v} inscripciones`, "Total"]}
                />
                <Area
                  type="monotone"
                  dataKey="enrollments"
                  stroke="#d97706"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorEnrollments)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------- UI helpers ---------- */

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-background-secondary/95 backdrop-blur p-4 shadow-sm border border-white/5">
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-3xl leading-tight font-semibold mt-1 tabular-nums">
        {value}
      </p>
      {hint && <p className="text-[11px] opacity-60 mt-1">{hint}</p>}
    </div>
  );
}
