"use client"
import { Calendar, Clock, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import axios from "axios";

interface Interview {
    company: string;
    role: string;
    date: string;
    time: string;
    interviewer: string;
}

export function UpcomingInterviewCard(){
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
        const getData = async () => {
            try {
                // TODO: Fix endpoint
                setLoading(true);
                const res = await api.get("/api/rooms?status=pending&type=participant");
                const data = res.data.map(async (room: any) => {
                    const interviewer = await api.get(`/api/users/${room.owner_id}`);
                    return {
                    company: room.company,
                    role: room.role,
                    date: new Date(room.start_time).toLocaleDateString(),
                    time: new Date(room.start_time).toLocaleTimeString(),
                    interviewer: interviewer.data.username,
                }})
                setInterviews(await Promise.all(data));
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    setError(error.response?.data.error || "An error occurred");
                }
            } finally {
                setLoading(false);
            }
        }
    useEffect(() => {
        getData();
    }, [])
    return (

                <div className="flex flex-col gap-4">
        {loading ? 
        <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div> 
        :
        error ? 
        <div className="flex justify-center items-center"><p className="text-(--text-secondary) text-sm! m-auto">An error occurred while fetching interviews.</p><button className="text-(--text-secondary) text-sm m-auto cursor-pointer hover:underline" onClick={() => {getData(); setError(null)}}>Retry</button></div> 
        :
        interviews && interviews.length > 0 ? interviews.map((interview, index) => (
        <div key={index} className="flex justify-between items-center gap-4 py-4 px-6 border-(--border) border rounded-lg">
            <div className="flex flex-col gap-4">
                <div className="flex gap-2 items-center flex-wrap"><h5>{interview.company}</h5> <div className="w-1 h-1 rounded-full bg-white/50"></div> <p className="text-sm! ">{interview.role}</p></div>
                <div className="flex gap-2 flex-wrap">
                    <p className="text-sm!  flex items-center gap-2"><Calendar className="w-4 h-4"/>{interview.date}</p>
                    <p className="text-sm!  flex items-center gap-2"><Clock className="w-4 h-4"/>{interview.time}</p>
                <p className="text-sm!  ml-4">with {interview.interviewer}</p>
                </div>
            </div>
            <button className="cursor-pointer px-4 py-2 bg-(--bg-cta-darker) hover:bg-(--bg-cta-hover) text-(--text-primary) rounded-lg md:block hidden">Join Interview</button>
        </div>)) : <div className="flex justify-center items-center text-(--text-secondary)">You have no upcoming interviews.</div>}
        </div>
    )
}

export function PastInterviewCard(){ 
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const getData = async () => {
        try {
            // TODO: Fix endpoint
            setLoading(true);
            const res = await api.get("/api/rooms?status=completed&type=participant");
            console.log("past interviews: ",res.data)
                const data = res.data.map(async (room: any) => {
                    const interviewer = await api.get(`/api/users/${room.owner_id}`);
                    return {
                    company: room.company,
                    role: room.role,
                    date: new Date(room.started_at.Time).toLocaleDateString(),
                    time: new Date(room.started_at.Time).toLocaleTimeString(),
                    interviewer: interviewer.data.username,
                }})
            setInterviews(await Promise.all(data));
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data.error || "An error occurred");
            }
        } finally {
            setLoading(false);
            }
        }
    useEffect(() => {
        getData();
    }, [])

    return (
        <div className="flex justify-center items-center gap-4 py-4 md:px-6 px-2 border-(--border)  rounded-lg">
                    {
        loading ? <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div> : error ? <div className="flex justify-center items-center"><p className="text-(--text-secondary) text-sm! m-auto">An error occurred while fetching interviews.</p><button className="text-(--text-secondary) text-sm m-auto cursor-pointer hover:underline" onClick={() => {getData(); setError(null)}}>Retry</button></div> : 
                        interviews && interviews.length > 0 ? 
            <Table className="border border-(--border)">
                <TableHeader>
                    <TableRow className="border-(--border) border bg-(--bg-muted)">
                        <TableHead className="">Company</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Interviewer</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                        {interviews.map((interview, index) => (
                            <TableRow className="border-(--border)" key={index}>
                                <TableCell className="font-light!">{interview.company}</TableCell>
                                <TableCell className="font-light!">{interview.role}</TableCell>
                                <TableCell className="font-light!">{interview.date}</TableCell>
                                <TableCell className="font-light!">{interview.time}</TableCell>
                                <TableCell className="font-light!">{interview.interviewer}</TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
            : <div className="flex justify-center items-center text-center text-(--text-secondary)">You have no past interviews.</div>
        }
        </div>
    )
}