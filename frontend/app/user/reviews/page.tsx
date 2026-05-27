"use client"
import useDebounce from "@/lib/debounce";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Share, Ellipsis, Plus, Eye } from "lucide-react";
import Link from "next/link";
import CreateInterview from "@/components/createInterview";
import { Room } from "@/lib/types";
import { api } from "@/lib/api";
import { User } from "@/components/user";


type interviewType = Room & {
    is_owner: boolean;
    is_participant: boolean;
}

type Review = {
    id: string;
    role: string;
    status: string;
    candidate: string;
    interviewer: string;
    company: string;
    started_at: string;
}

export default function ReviewsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const status = searchParams.get("status") || "all";
    const searchQuery = searchParams.get("search") || "";
    const [searchInput, setSearchInput ] = useState<string>(searchQuery) 
    const debouncedSearch = useDebounce(searchInput, 300);
    const [interviews, setInterviews] = useState<interviewType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get<interviewType[]>(`/api/rooms?status=reviewing,completed`);
            console.log(res.data)
            setInterviews(res.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data.error || "An error occurred");
            }
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        fetchData()
    }, [])
    useEffect(() => {
        const params = new URLSearchParams();

        if(debouncedSearch){
            params.set("search", debouncedSearch);
        }
        params.set("status", status);
        router.replace(`/user/reviews?${params.toString()}`);
        // Replace with API call to fetch reviews
    }, [debouncedSearch, router, status]);
    
    function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>){
        const newStatus = e.target.value;
        const params = new URLSearchParams();
        params.set("status", newStatus);
        params.set("search", debouncedSearch);
        router.replace(`/user/reviews?${params.toString()}`);
    }
	return (
		<div className="min-h-screen w-full">
            <main className="w-full">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-(--text-primary)">Reviews</h3>
                        <p className="text-sm!">Manage all interview sessions in one place</p>
                    </div>
                    <div>
                    <CreateInterview/>
                    </div>
                </div>
            
                        <div className="flex gap-4 items-center w-full my-6">
                            <div className="w-full flex flex-col gap-2">
                                <label htmlFor="search">Search</label>
                                <input type="search" id="search" placeholder="Search" value={searchInput} className="w-full px-2 py-1" onChange={(e) => setSearchInput(e.target.value)} />
                            </div>
                        <div className="w-1/4 flex flex-col gap-2">
                            <label htmlFor="filter">Filter by status</label>
                            <select id="filter" value={status} onChange={handleStatusChange}>
                                <option value="all">All</option>
                                <option value="reviewing">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        </div>
            </main>
             <div className="my-6">
                {loading ? (
                    <div className="w-full flex items-center justify-center">Loading...</div>
                ) : (
                    <div className="my-4">
                    <Table className="border border-(--border)">
                        <TableHeader>
                            <TableRow className="border-(--border) border bg-(--bg-muted)">
                                <TableHead>Interviewer</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filterData(interviews, status, debouncedSearch).map((interview, index) => (
                                    <TableRow key={index} className="border-(--border) relative">
                                        <TableCell><Link href={`/user/reviews/${interview.id}`} className="absolute inset-0 hover:bg-black/10 hover:rounded-2xl duration-100" aria-label="view interview"/>{interview.is_owner ? <p>You</p> : <User id={interview.owner_id} />}</TableCell>
                                        <TableCell>{interview.role}</TableCell>
                                        <TableCell>{interview.is_participant ? <p>You</p> : interview.participant_id && <User id={interview.participant_id} />}</TableCell>
                                        <TableCell>{new Date(interview.started_at.Time).toLocaleString()}</TableCell>
                                        <TableCell>{interview.company}</TableCell>
                                        <TableCell>{interview.status}</TableCell>
                                        <TableCell className="text-center isolate">
                                            <DropdownMenu >
                                                <DropdownMenuTrigger>
                                                    <div className="cursor-pointer hover:bg-(--bg-cta)/10! p-1 rounded-lg">
                                                        <Ellipsis />
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent >
                                                    {interview.is_owner && <DropdownMenuItem>
                                                        <Pencil />
                                                        Edit
                                                    </DropdownMenuItem>}
                                                    {interview.is_participant && interview.status == "completed" && <DropdownMenuItem>
                                                        <Eye />
                                                        View
                                                    </DropdownMenuItem>}
                                                    {interview.is_owner && <DropdownMenuItem>
                                                        <Share />
                                                        Share
                                                    </DropdownMenuItem>}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                )}
            </div>
        </div>
        
	)
}


function filterData(data: interviewType[], filter: string, searchQuery: string){
    return data.filter((item) => {
        const matchesFilter = filter === "all" || item.status === filter;
        const matchesSearch = item.role.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase()) || item.company.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    })
}