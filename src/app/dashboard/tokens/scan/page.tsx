"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import loaderEnv from "@src/utils/loaderEnv";

const API_BASE = loaderEnv("BACKEND_URL");

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false }
);

export default function ScanTokensPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  const [scanning, setScanning] = useState(true);
  const [locked, setLocked] = useState(false);
  const [info, setInfo] = useState<any | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);

  const [errors, setErrors] = useState<string[]>([]);
  const [frames, setFrames] = useState(0);
  const t0 = useRef<number>(0);
  const videoWrapRef = useRef<HTMLDivElement | null>(null);

  const COOLDOWN_MS = 1500;

  // Descubrir cámaras
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch { }
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        const cams = list.filter((d) => d.kind === "videoinput");
        if (!mounted) return;
        setDevices(cams);
        const back = cams.find((d) => /back|rear|environment/i.test(d.label));
        setDeviceId(back?.deviceId ?? cams[0]?.deviceId);
      } catch {
        setErrors((p) => p.concat("No se pudieron enumerar cámaras."));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);



  // Límites “soft” para evitar OverconstrainedError
  const softVideoLimits: MediaTrackConstraints = {
    width: { min: 320, ideal: 640, max: 1920 },
    height: { min: 240, ideal: 480, max: 1080 },
    frameRate: { ideal: 24, max: 30 },
  };

  const getConstraints = (): MediaTrackConstraints =>
    deviceId ? { ...softVideoLimits, deviceId: { exact: deviceId } as any }
      : { ...softVideoLimits, facingMode: { ideal: "environment" } as any };

  // Backend
  const validateToken = async (raw: string) => {
    if (!token) {
      setBanner("No hay sesión de admin.");
      return;
    }
    try {
      setBanner(null);
      const res = await fetch(`${API_BASE}/api/token/validate/${encodeURIComponent(raw)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        if (res.status === 409) {
          setBanner("⚠️ Este código QR ya fue validado anteriormente. No se puede escanear de nuevo.");
        } else {
          const txt = await res.text();
          setBanner(`HTTP ${res.status}${txt ? `: ${txt}` : ""}`);
        }
        setInfo(null);
        return;
      }
      const json = await res.json();
      setInfo(json);
      setScanning(false); // pausa en éxito para que no siga leyendo
    } catch (e: any) {
      setBanner(e?.message ?? "Error validando token");
    }
  };

  const handleDecode = (raw: string) => {
    if (locked) return;
    setLocked(true);
    validateToken(raw).finally(() =>
      setTimeout(() => setLocked(false), COOLDOWN_MS)
    );
  };

  // API nueva: onScan -> array de códigos detectados
  const onScan = (codes: { rawValue: string }[]) => {
    setFrames((f) => f + 1);
    const text = codes?.[0]?.rawValue ?? "";
    if (text) handleDecode(text);
  };

  // Manejo de errores del scanner
  const onError = (err?: unknown) => {
    const name =
      (err as any)?.name ||
      (err as any)?.toString?.() ||
      (err instanceof Error ? err.name : "");
    const msg =
      typeof err === "string"
        ? err
        : err instanceof Error
          ? err.message
          : "Error desconocido del lector";

    // Ignorar AbortError (interrupción de play() al desmontar/pausar)
    if (
      name === "AbortError" ||
      msg.toLowerCase().includes("interrupted") ||
      msg.toLowerCase().includes("media was removed") ||
      msg.toLowerCase().includes("play()")
    ) return;

    setErrors((prev) =>
      (prev.length > 10 ? prev.slice(-10) : prev).concat(`${name || "Error"}: ${msg}`)
    );

    // Si es Overconstrained, intenta ‘facingMode’ genérico y re-montar
    if (String(name).includes("Overconstrained") || /overconstrained/i.test(msg)) {
      setScanning(false);
      setDeviceId(undefined); // quita exact deviceId
      setTimeout(() => setScanning(true), 150);
    }
  };

  const CameraSelector = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="opacity-70">Cámara:</span>
        <select
          className="px-2 py-1 rounded-md border border-white/20 bg-background-secondary"
          value={deviceId ?? ""}
          onChange={(e) => {
            setDeviceId(e.target.value || undefined);
            setScanning(false);
            setTimeout(() => setScanning(true), 300);
          }}
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Cam ${d.deviceId.slice(0, 6)}…`}
            </option>
          ))}
        </select>
        <button
          className="px-3 py-1 rounded-md border border-white/20 hover:bg-white/10"
          onClick={async () => {
            try {
              const list = await navigator.mediaDevices.enumerateDevices();
              const cams = list.filter((d) => d.kind === "videoinput");
              setDevices(cams);
              if (!cams.find((c) => c.deviceId === deviceId)) {
                setDeviceId(cams[0]?.deviceId);
              }
              setScanning(false);
              setTimeout(() => setScanning(true), 300);
            } catch { }
          }}
        >
          Refrescar
        </button>
        <span className="opacity-70">
          {frames > 0 && t0.current
            ? `${Math.round((frames * 1000) / (performance.now() - t0.current))} fps aprox.`
            : ""}
        </span>
      </div>
    ),
    [devices, deviceId, frames]
  );

  useEffect(() => {
    if (scanning) {
      t0.current = performance.now();
      setFrames(0);
    }
  }, [scanning]);

  const forceKey = `${deviceId ?? "none"}-${scanning}`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Validación de entradas (QR)</h1>

      <div className="flex items-center justify-between text-xs">
        <div className={scanning ? "text-green-500" : "text-yellow-400"}>
          Cámara: {scanning ? "activa" : "pausada"}
        </div>
        {CameraSelector}
      </div>

      {banner && (
        <div className="rounded-xl bg-red-900/40 border border-red-600 text-red-200 px-3 py-2">
          {banner}
        </div>
      )}

      <div ref={videoWrapRef} className="rounded-2xl overflow-hidden border border-white/10 bg-background-secondary/80">
        <div className="w-full aspect-video">
          {scanning && (
            <Scanner
              key={forceKey}
              constraints={getConstraints()}
              formats={["qr_code"] as any}
              paused={false}
              allowMultiple={false}
              scanDelay={130}
              onScan={onScan}
              onError={onError}
              components={{
                finder: true,   // <- ahora es boolean
                torch: true,
                zoom: true,
              }}
              styles={{
                container: { width: "100%", height: "100%" },
                video: { width: "100%", height: "100%", objectFit: "cover" },
              }}
            />
          )}
          {!scanning && (
            <div className="h-full grid place-items-center text-sm text-gray-300">
              {deviceId ? "Cámara en pausa" : "No hay cámaras disponibles"}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <div className="rounded-xl bg-background-secondary p-4 flex flex-col justify-center">
          {info ? (
            <div className="p-2">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${info.validated ? "bg-green-500 text-white" : "bg-yellow-500 text-black"}`}>
                  {info.validated ? "✓" : "!"}
                </div>
                <div>
                  <h3 className={`font-bold text-xl ${info.validated ? "text-green-400" : "text-yellow-400"}`}>
                    {info.validated ? "Entrada Validada" : "Validación Pendiente"}
                  </h3>
                  <p className="text-xs opacity-70">
                    {info.validatedAt ? new Date(info.validatedAt).toLocaleString() : "Recién escaneado"}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-gray-400 block text-xs uppercase tracking-wider">Asistente</span>
                  <span className="font-medium text-white text-lg">{info.userName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs uppercase tracking-wider">Gmail</span>
                  <span className="font-medium text-white text-base">{info.userEmail}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs uppercase tracking-wider">Evento</span>
                  <span className="font-medium text-white text-base">{info.eventTitle}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 opacity-50">
              <p>Escanea un código para ver el resultado</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          className="px-4 py-2 rounded-2xl bg-background-little-1 text-white text-sm"
          onClick={() => {
            setInfo(null);
            setBanner(null);
            setScanning(true);
          }}
        >
          Escanear otro
        </button>
        {scanning && (
          <button
            className="px-4 py-2 rounded-2xl border border-white/30 text-sm"
            onClick={() => setScanning(false)}
          >
            Pausar
          </button>
        )}
      </div>

      {errors.length > 0 && (
        <div className="text-xs text-red-300/90 space-y-1 text-center">
          {errors.slice(-6).map((e, i) => (
            <div key={`${e}-${i}`}>• {e}</div>
          ))}
        </div>
      )}
    </div>
  );
}
