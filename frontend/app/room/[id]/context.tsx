"use client"
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { Room } from "@/lib/types";
import { notFound, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { isAxiosError } from "axios";
import { initRoom, type Room as RoomInstance } from "./room";

type Interview = Room & {
    is_owner: boolean;
    is_participant: boolean;
}
const DataContext = createContext<{room: Interview | null, loading: boolean, refetchRoom: () => Promise<void>, roomInstance: RoomInstance | null}>({loading: true, room: null, refetchRoom: () => Promise.resolve(), roomInstance: null})

export function RoomDataProvider({ children }: { children: React.ReactNode }) {
    const [room, setRoom] = useState<Interview | null>(null);
    const [roomInstance, setRoomInstance] = useState<RoomInstance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const roomId = params.id as string;
    const fetchRoom = useCallback(async () => {
        try {
            const response = await api.get<Interview>(`/api/rooms/${roomId}`);
            const roomInstance = await initRoom();
            setRoom(response.data);
            setRoomInstance(roomInstance);
        } catch (error: error) {
            if (isAxiosError(error)) {
                    setError(error.response?.data.message);
                }
            } finally {
                setLoading(false);
            }
        }, [roomId]);
    useEffect(() => {
        fetchRoom();
    }, [fetchRoom]);
    if (error) {
        notFound()
    }
    if (room && !room.is_owner && !room.is_participant) {
        notFound()
    }
    return <DataContext value={useMemo(() => ({room, roomInstance, loading, refetchRoom: fetchRoom}), [room, roomInstance, loading, fetchRoom])}>{children}</DataContext>;
}

export function useRoom(): {room: Interview | null, roomInstance: RoomInstance | null, loading: boolean, refetchRoom: () => Promise<void>}{
    const context = useContext(DataContext);
    return context;
}