"use client";
import { EventResponse } from "@src/interfaces/event/EventResponse";
import { getThemeTypeEvent } from "@src/utils/themeGetter";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { EventType } from "@src/interfaces/event/enums";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";



export const TimeLeftCounter = ({
    startDate,
    className,
}: {
    startDate: string;
    className?: string;
}) => {
    const calculateTimeLeft = useCallback(() => {
        const eventMs = new Date(startDate).getTime(); // ISO con Z → UTC correcto
        const nowMs = Date.now();

        let diff = eventMs - nowMs;
        if (diff <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
        }

        const days = Math.floor(diff / 86_400_000); // 24*60*60*1000
        diff -= days * 86_400_000;

        const hours = Math.floor(diff / 3_600_000);
        diff -= hours * 3_600_000;

        const minutes = Math.floor(diff / 60_000);
        diff -= minutes * 60_000;

        const seconds = Math.floor(diff / 1_000);

        return { days, hours, minutes, seconds, totalMs: eventMs - nowMs };
    }, [startDate]);

    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        totalMs: number;
    } | null>(null);

    useEffect(() => {
        const tick = () => setTimeLeft(calculateTimeLeft());
        tick(); // primera actualización al montar
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [calculateTimeLeft]);

    if (!timeLeft) {
        return (
            <div className={className ?? "flex flex-col items-center my-4"}>
                <p>Comienza en: </p>
                <p>—</p>
            </div>
        );
    }

    const { days, hours, minutes, seconds, totalMs } = timeLeft;

    // Helper para ocultar unidades 0 pero no dejar vacío
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}D`);
    if (hours > 0 || days > 0) parts.push(`${hours}H`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
    // Siempre mostramos segundos si queda < 1h, así el usuario siente “movimiento”
    if (days === 0 && hours === 0) parts.push(`${seconds}s`);

    const display = totalMs > 0 ? parts.join(" ") : "0m";

    return (
        <div className={className ?? "flex flex-col items-center my-4"}>
            <p className="mr-1">Comienza en:</p>
            <p>{display}</p>
        </div>
    );
};

export const TimeToCloseEvent = ({
    endDate,
    className,
}: {
    endDate: string;
    className?: string;
}) => {
    const calculateTimeLeft = useCallback(() => {
        const eventMs = new Date(endDate).getTime();
        const nowMs = Date.now();
        let diff = eventMs - nowMs;
        if (diff <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
        }
        const days = Math.floor(diff / 86_400_000); // 24*60*60*1000
        diff -= days * 86_400_000;
        const hours = Math.floor(diff / 3_600_000);
        diff -= hours * 3_600_000;
        const minutes = Math.floor(diff / 60_000);
        diff -= minutes * 60_000;
        const seconds = Math.floor(diff / 1_000);
        return { days, hours, minutes, seconds, totalMs: eventMs - nowMs };
    }, [endDate]);
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        totalMs: number;
    } | null>(null);
    useEffect(() => {
        const tick = () => setTimeLeft(calculateTimeLeft());
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [calculateTimeLeft]);
    if (!timeLeft) {
        return (
            <div className={className ?? "flex flex-col items-center my-4"}>
                <p>Termina en: </p>
                <p>—</p>
            </div>
        );
    }
    const { days, hours, minutes, seconds, totalMs } = timeLeft;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}D`);
    if (hours > 0 || days > 0) parts.push(`${hours}H`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
    if (days === 0 && hours === 0) parts.push(`${seconds}s`);
    const display = totalMs > 0 ? parts.join(" ") : "0m";
    return (
        <div className={className ?? "flex flex-col items-center my-4"}>
            <p className="mr-1">Termina en:</p>
            <p>{display}</p>
        </div>
    );
}

export const TimeLeftCounterNoSSR = dynamic(() => Promise.resolve(TimeLeftCounter), { ssr: false });
export const TimeToCloseEventNoSSR = dynamic(() => Promise.resolve(TimeToCloseEvent), { ssr: false });
export const EventCard = ({ data }: { data: EventResponse }) => {
    const isEventStarted = new Date(data.startDate).getTime() <= Date.now();
    const isEventEnded = new Date(data.endDate).getTime() < Date.now();
    return (
        <div className="border-2 p-4 rounded-3xl border-background-secondary flex flex-col justify-between w-full overflow-y-hidden group relative min-w-60">
            <div className="flex w-11/12 mx-auto my-1">
                <TypeMiniCard type={data.type} />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.imageUrl} alt={`image_${data.id}`} className="w-10/12 mx-auto rounded-xl" />
            <Link href={`/event/${data.id}`} className="text-xl font-semibold my-2 text-center ">{data.title}</Link>
            {isEventEnded ? (
                <span className="text-red-600 font-semibold text-center my-7">Evento finalizado</span>
            ) : isEventStarted ? (
                <TimeToCloseEventNoSSR endDate={data.endDate} />
            ) : (
                <TimeLeftCounterNoSSR startDate={data.startDate} />
            )}
            <div className="bg-background-secondary text-white absolute -bottom-24 left-0 w-full text-center rounded-b-3xl border-background-secondary group-hover:-bottom-1 transition-all duration-300">
                <Link href={`/event/${data.id}`} className="block py-7">Ver evento</Link>
            </div>
        </div>
    );
}





export const TypeMiniCard = ({ type }: { type: EventType }) => {
    return (
        <div className={`px-2 py-1 rounded-sm text-sm ${getThemeTypeEvent(type.toString())}`}>
            {type}
        </div>
    )
}


export const TagsList = ({ tags }: { tags: string[] }) => {
    return (
        <div className="flex flex-row gap-2 flex-wrap my-2">
            {tags.map((tag, index) => (
                <span key={index} className="bg-background text-black font-bold px-3 py-1 rounded-full text-sm">
                    #{tag}
                </span>
            ))}
        </div>
    )
}



export const MiniBannerCard = ({ data }: { data: EventResponse }) => {
    return (
        <div className=" rounded-3xl p-8 md:p-12 shadow-lg bg-gradient-to-br  from-[#d2a36d]  to-[#B87A50]  flex  flex-col md:flex-row">
            <div className="w-full md:w-2/3">
                <h2 className="text-2xl md:text-3xl xl:text-5xl font-bold mb-4 text-white">Descubre experiencias culturales únicas en el Centro Cultural Amador Ballumbrosio</h2>
                <p className="text-white mb-6 text-xl ">Evento destacado: <span className="font-bold">{data.title}</span></p>

                <Link href={`/event/${data.id}`} className="inline-block bg-white text-black font-semibold px-6 py-3 rounded-full hover:bg-gray-200 transition">
                    Ver evento
                </Link>
            </div>
            <div className="w-full md:w-1/3">
                <Image src={data.imageUrl} alt={`image_${data.id}`} width={400} height={200} className="mt-4 mx-auto rounded-xl object-cover" />
            </div>

        </div>
    )
}


export const SmallEventItem = ({ data }: { data: EventResponse }) => {
    const router = useRouter();
    const isComingSoon = new Date(data.startDate).getTime() > Date.now();
    const isEventEnded = new Date(data.endDate).getTime() < Date.now();
    return (
        <div className="bg-bg-alternative rounded-3xl my-6 w-full mx-auto border  border-background-secondary overflow-hidden shadow-md flex flex-col justify-between">
            <div className="flex flex-row p-4">
                <div className="w-2/5">
                    <Image src={data.imageUrl} alt={`image_${data.id}`} width={400} height={200} className="mt-4 rounded-xl object-cover" />
                </div>
                <div className="w-3/5 flex flex-col items-center justify-center">
                    <h3 className="text-xl font-semibold my-2 px-4">{data.title}</h3>
                    <TagsList tags={data.tags} />
                    {isComingSoon ? <TimeLeftCounterNoSSR startDate={data.startDate} className="px-4 mb-4" /> : <p className={`px-4 mb-4 font-semibold ${isEventEnded ? 'text-red-600' : 'text-green-600'}`}>El evento {isEventEnded ? 'ya ha terminado' : 'ya ha comenzado'}</p>}
                </div>
            </div>

            <div>
                <button onClick={() => router.push(`/myevents/${data.id}`)} disabled={isEventEnded} className={`w-full bg-background-secondary text-white font-semibold py-3 rounded-b-3xl hover:bg-primary-dark transition ${isEventEnded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    Ver mi inscripción
                </button>
            </div>
        </div>
    )
}