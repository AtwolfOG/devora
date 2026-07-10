import { useRoomData } from "./context";
import { Clock } from "lucide-react";
import Image from "next/image";
import { useMemo, useState, useEffect } from "react";

export default function Header(){
    const {room} = useRoomData();
    if (!room) return null;
    const startTime = new Date(room.started_at.Time);
    return (
        <header className="flex justify-between py-3 px-8 bg-(--bg-light) border border-(--border) rounded">
            <div className="max-md:hidden"><h4>Devora</h4></div>
            <div><h4 className="max-md:text-xl!">{room.role}</h4></div>
            <div className="flex items-center gap-2">
                <TimeDisplay startTime={startTime} started={room.status === "live"} />
                <div className="relative size-9 rounded-full overflow-hidden"><Image fill className="object-cover" src={"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"} alt="Michael" /></div>
            </div>
        </header>
    )
}

function TimeDisplay({startTime, started}: {startTime: Date, started: boolean}){
    const [time, setTime] = useState<number>(new Date().getTime() - startTime.getTime());
    const timeString = useMemo(() => {
      if (!started) return "00:00";
        const minutes = Math.floor(time / (1000 * 60)) % 60;
        const seconds = Math.floor(time / 1000) % 60;
        const hours = Math.floor(time / (1000 * 60 * 60)) % 24;
        const minutesString = minutes < 10 ? `0${minutes}` : minutes;
        const secondsString = seconds < 10 ? `0${seconds}` : seconds;
        const hoursString = hours < 10 ? `0${hours}` : hours;
        if (hours > 0) {
            return `${hoursString}:${minutesString}:${secondsString}`;
        }
        return `${minutesString}:${secondsString}`;
    }, [time, started]);
    useEffect(() => {
        if (!started) return;
        const interval = setInterval(() => {
            setTime(new Date().getTime() - startTime.getTime());
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime, started]);
    return (
        <div className="flex items-center gap-1 border border-(--bg-cta)/80! text-(--border) px-4 py-1 rounded-2xl cursor-pointer"><Clock className="text-(--bg-cta)/80!" size={16} /><p className="text-sm text-(--bg-cta)/80!">{timeString}</p></div>
    )
}