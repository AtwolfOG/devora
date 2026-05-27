"use client"
import customToast from "@/components/customToast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import copyToClipboard from "@/lib/copyToClipBoard";
import { Room } from "@/lib/types";
import axios from "axios";
import { Ellipsis, Loader2, Pencil, Share, Trash } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface yourInterview {
    id: string;
    company: string;
    role: string;
    date: string;
    time: string;
    candidate: string;
    status: string;
}
interface otherInterview {
    id: string;
    interviewer: string;
    role: string;
    date: string;
    time: string;
    company: string;
    status: string;
}

export function YourInterviews(){
    const [interviews, setInterviews] = useState<yourInterview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sharedUrl, setSharedUrl] = useState("");
        const getData = async () => {
            try {
                // TODO: Fix endpoint
                setLoading(true);
                const res = await api.get<Room[]>("/api/rooms?type=owner");
                console.log(res.data)
                const data = res.data.map(async (room: Room): Promise<yourInterview> => {
                    let candidate = "None"
                    if (room.participant_id){
                        try{
                            const user = await api.get(`/api/users/${room.participant_id}`);
                            candidate = user.data.username;
                        } catch (e: any) {
                            candidate = "Unknown"
                        }
                    }
                    return {
                        id: room.id,
                        company: room.company,
                        role: room.role,
                        date: new Date(room.start_time).toLocaleDateString(),
                        time: new Date(room.start_time).toLocaleTimeString(),
                        candidate: candidate,
                        status: room.status
                    } 
                })
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
        setSharedUrl(window.location.origin)
        getData();
    }, [])
    return (
        
                <div className="my-4">
                    {loading ? 
                    <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div> 
                    :
                    error ? 
                    <div className="flex flex-col justify-center items-center"><p className="text-(--text-secondary) text-sm!">An error occurred while fetching interviews.</p><button className="text-(--text-secondary) text-sm cursor-pointer hover:underline" onClick={() => {getData(); setError(null)}}>Try again</button></div> 
                    :
                    interviews && interviews.length > 0 ? 
                    <Table className="border border-(--border)">
                        <TableHeader>
                            <TableRow className="border-(--border) border bg-(--bg-muted)">
                                <TableHead>Role</TableHead>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {interviews.map((interview, index) => (
                                    <TableRow key={index} className="border-(--border) relative">
                                        <TableCell><Link href={`/user/interviews/${interview.id}`} className="absolute inset-0 hover:bg-black/10 hover:rounded-2xl duration-100" aria-label="view interview"/>{interview.role}</TableCell>
                                        <TableCell>{interview.candidate}</TableCell>
                                        <TableCell>{interview.date + " " + interview.time}</TableCell>
                                        <TableCell>{interview.company}</TableCell>
                                        <TableCell className="text-sm!">{interview.status}</TableCell>
                                        <TableCell className="text-center isolate">
                                            <DropdownMenu >
                                                <DropdownMenuTrigger>
                                                    <div className="cursor-pointer hover:bg-(--bg-cta)/10! p-1 rounded-lg">
                                                        <Ellipsis />
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent >
                                                    { interview.status.toLowerCase() === "pending" ? <DropdownMenuItem className="relative">
                                                        <Link href={`/user/interviews/${interview.id}`} className="absolute inset-0"/>
                                                            <Pencil />
                                                            Edit
                                                    </DropdownMenuItem>
                                                    : null}
                                                    <DropdownMenuItem onClick={()=> copyToClipboard(`${sharedUrl}/interview/${interview.id}`)}>
                                                        <Share />
                                                        Share
                                                    </DropdownMenuItem>
                                                    { interview.status.toLowerCase() === "pending" ? 
                                                    <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem variant="destructive" onClick={async()=> {
                                                        try {
                                                            await api.delete(`/api/rooms/${interview.id}`)
                                                            customToast.success("Interview deleted successfully")
                                                            setInterviews(interviews.filter((inter)=> inter.id !== interview.id))
                                                        } catch (error) {
                                                            if (axios.isAxiosError(error)) {
                                                                customToast.error(error.response?.data.error || "An error occurred")
                                                            }
                                                        }
                                                    }}>
                                                        <Trash />
                                                        Delete
                                                    </DropdownMenuItem>
                                                    </>
                                                    : null}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     : <div className="flex justify-center items-center text-(--text-secondary)">You have no interviews.</div>
                }
                </div>
    )
}


export function OtherInterviews(){
    const [interviews, setInterviews] = useState<otherInterview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
        const getData = async () => {
            try {
                // TODO: Fix endpoint
                setLoading(true);
                const res = await api.get<Room[]>("/api/rooms?type=participant");
                const data = res.data.map(async (room: Room) => {
                    let interviewer = "Error"
                    try{
                        const user = await api.get(`/api/users/${room.owner_id}`);
                        interviewer = user.data.username;
                    } catch (e: any) {
                        interviewer = "Error"
                    }
                            return {
                            id: room.id,
                            company: room.company,
                            role: room.role,
                            date: new Date(room.start_time).toLocaleDateString(),
                            time: new Date(room.start_time).toLocaleTimeString(),
                            interviewer: interviewer,
                            status: room.status
                        }
                })
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
        
                <div className="my-4">
                    {loading ? 
                    <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div> 
                    :
                    error ? 
                    <div className="flex flex-col justify-center items-center"><p className="text-(--text-secondary) text-sm!">An error occurred while fetching interviews.</p><button className="text-(--text-secondary) text-sm cursor-pointer hover:underline" onClick={() => {getData(); setError(null)}}>Try again</button></div> 
                    :
                    interviews && interviews.length > 0 ? 
                    <div className="my-4">
                    <Table className="border border-(--border)">
                        <TableHeader>
                            <TableRow className="border-(--border) border bg-(--bg-muted)">
                                <TableHead>Interviewer</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {interviews.map((interview, index) => (
                                <TableRow key={index} className="relative border-(--border)">
                                    <TableCell><Link href={`/user/interviews/${interview.id}`} className="absolute inset-0 hover:bg-black/10 hover:rounded-2xl duration-100" aria-label="view interview"/>{interview.interviewer}</TableCell>
                                    <TableCell>{interview.role}</TableCell>
                                    <TableCell>{interview.date + " " + interview.time}</TableCell>
                                    <TableCell className="text-sm!">{interview.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                     : <div className="flex justify-center items-center text-(--text-secondary)">You have no interviews.</div>
                }
                </div>
    )
}