"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getEventById, updateEvent, type EventPayload } from "@src/services/admin/events";

function toOffsetISO(local: string) {
  const d = new Date(local);
  const tz = -d.getTimezoneOffset();
  const sign = tz >= 0 ? "+" : "-";
  const hh = String(Math.floor(Math.abs(tz) / 60)).padStart(2, "0");
  const mm = String(Math.abs(tz) % 60).padStart(2, "0");
  const iso = new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes())
  )
    .toISOString()
    .replace("Z", `${sign}${hh}:${mm}`);
  return iso;
}

export default function EditEventPage() {
  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<EventPayload>({
    title: "",
    description: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
    location: "",
    type: "CONCIERTO",
    status: "APERTURADO",
    capacity: 0,
    costEntry: 0,
    tags: [],
  });

  useEffect(() => {
    if (!token || !params?.id) return;
    (async () => {
      try {
        setLoading(true);
        const ev = await getEventById(token, Number(params.id));
        setForm({
          title: ev.title,
          description: ev.description ?? "",
          imageUrl: ev.imageUrl ?? "",
          startDate: new Date(ev.startDate).toISOString().slice(0, 16),
          endDate: new Date(ev.endDate).toISOString().slice(0, 16),
          location: ev.location ?? "",
          type: ev.type,
          status: ev.status,
          capacity: ev.capacity ?? 0,
          costEntry: ev.costEntry ?? 0,
          tags: ev.tags ?? [],
        });
      } catch (e: any) {
        setError(e.message ?? "No se pudo cargar el evento");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, params?.id]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "capacity" || name === "costEntry") {
      setForm(f => ({ ...f, [name]: Number(value) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !params?.id) return;
    try {
      setSaving(true);
      const payload: EventPayload = {
        ...form,
        startDate: toOffsetISO(form.startDate),
        endDate: toOffsetISO(form.endDate),
      };
      await updateEvent(token, Number(params.id), payload);
      router.push("/dashboard/events");
    } catch (e: any) {
      setError(e.message ?? "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") return <div className="p-6">Cargando…</div>;
  if (!token) return <div className="p-6">Debes iniciar sesión como administrador.</div>;
  if (loading) return <div className="p-6">Cargando evento…</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Editar evento #{params.id}</h1>
      {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Título</label>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            className="w-full px-3 py-2 rounded-xl bg-background-secondary"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Descripción</label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            className="w-full px-3 py-2 rounded-xl bg-background-secondary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Inicio</label>
            <input
              type="datetime-local"
              name="startDate"
              value={form.startDate}
              onChange={onChange}
              className="w-full px-3 py-2 rounded-xl bg-background-secondary"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Fin</label>
            <input
              type="datetime-local"
              name="endDate"
              value={form.endDate}
              onChange={onChange}
              className="w-full px-3 py-2 rounded-xl bg-background-secondary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Lugar</label>
          <input
            name="location"
            value={form.location}
            onChange={onChange}
            className="w-full px-3 py-2 rounded-xl bg-background-secondary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Tipo</label>
            <select
              name="type"
              value={form.type}
              onChange={onChange}
              className="w-full px-3 py-2 rounded-xl bg-background-secondary"
            >
              <option value="CONFERENCIA">CONFERENCIA</option>
              <option value="TALLER">TALLER</option>
              <option value="EXPOSICION">EXPOSICION</option>
              <option value="CONCIERTO">CONCIERTO</option>
              <option value="OBRA_DE_TEATRO">OBRA_DE_TEATRO</option>
              <option value="PROYECCION">PROYECCION</option>
              <option value="FERIA">FERIA</option>
              <option value="OTRO">OTRO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Estado</label>
            <select
              name="status"
              value={form.status}
              onChange={onChange}
              className="w-full px-3 py-2 rounded-xl bg-background-secondary"
            >
              <option value="APERTURADO">APERTURADO</option>
              <option value="EN_CURSO">EN_CURSO</option>
              <option value="CLAUSURADO">CLAUSURADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Capacidad</label>
            <input
              type="number"
              name="capacity"
              value={form.capacity}
              onChange={onChange}
              className="w-full px-3 py-2 rounded-xl bg-background-secondary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Entrada (S/)</label>
            <input
              type="number"
              name="costEntry"
              value={form.costEntry}
              onChange={onChange}
              className="w-full px-3 py-2 rounded-xl bg-background-secondary"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Imagen (URL)</label>
            <input
              name="imageUrl"
              value={form.imageUrl}
              onChange={onChange}
              className="w-full px-3 py-2 rounded-xl bg-background-secondary"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button disabled={saving} className="px-4 py-2 rounded-2xl bg-background-little-1 text-white text-sm">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/events")}
            className="px-4 py-2 rounded-2xl border border-white/30 text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
