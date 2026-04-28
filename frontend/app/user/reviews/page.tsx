"use client"
import useDebounce from "@/lib/debounce";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Share, Ellipsis, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "react-day-picker";

type Interview = {
	id: string;
	role: string;
	candidate: string;
	company: string;
    date: string;
    time: string;
	status: string;
}
const yourInterviews = [
    {
        candidate: "John Doe",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        company: "Google",
        status: "Completed"
    },
    {
        candidate: "John Doe",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        company: "Google",
        status: "Reviewing"
    },
    {
        candidate: "John Doe",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        company: "Google",
        status: "Completed"
    },
    {
        interviewer: "John Doe",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        company: "Google",
        status: "Completed"
    },
    {
        interviewer: "John Doe",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        company: "Google",
        status: "Reviewing"
    },
    {
        interviewer: "John Doe",
        role: "Software Engineer",
        date: "2022-01-01",
        time: "10:00 AM",
        company: "Google",
        status: "Reviewing"
    }
]

export default function ReviewsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const status = searchParams.get("status") || "all";
    const searchQuery = searchParams.get("search") || "";
    const [searchInput, setSearchInput ] = useState<string>(searchQuery) 
    const debouncedSearch = useDebounce(searchInput, 300);
    useEffect(() => {
        const params = new URLSearchParams();

        if(debouncedSearch){
            params.set("search", debouncedSearch);
        }
        params.set("status", status);
        router.replace(`/user/reviews?${params.toString()}`);
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
                    <button className="flex gap-2 items-center px-2 py-2 bg-(--bg-cta-darker) hover:bg-(--bg-cta-hover) rounded-lg w-max">
                        <Plus/>
                        Create Interview
                    </button>
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
                <h5 className="text-(--text-primary)">Created by you</h5>
                <p className="text-sm!">Interviews you created</p>
                <div className="my-4">
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
                            {yourInterviews.map((interview, index) => (
                                    <TableRow key={index} className="border-(--border) relative">
                                        <TableCell><Link href={`/user/reviews/${index}`} className="absolute inset-0 hover:bg-black/10 hover:rounded-2xl duration-100" aria-label="view interview"/>{interview.role}</TableCell>
                                        <TableCell>{interview.candidate}</TableCell>
                                        <TableCell>{interview.date + " " + interview.time}</TableCell>
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
                                                    <DropdownMenuItem>
                                                        <Pencil />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Share />
                                                        Share
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                
            </div>
        </div>
        
	)
}


function useReviews(){
    const [reviews, setReviews] = useState<{error: string | null, data: Interview[], loading: boolean}>({error: null, data: [], loading: false});
    const searchParams = useSearchParams();
    const status = searchParams.get("status") || "all";
    const searchQuery = searchParams.get("search") || "";
    useEffect(() => {
        const timer = setTimeout(async () => {
            try{
                setReviews({error: null, data: [], loading: true});
                const res = await axios.get<{data: Interview[]}>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/interviews?status=${status}&${searchQuery}`);
                setReviews({error: null, data: res.data.data, loading: false});
            }
            catch(err){
                if(axios.isAxiosError(err)){
                    const msg = err.response?.data.error || "An error occurred"
                    setReviews({error: msg, data: [], loading: false});
                }
                else{
                    console.log("error: ", err);
                    setReviews({error: "An error occurred", data: [], loading: false});
                }
            }
        }, 300)
        return () => clearTimeout(timer);
    }, [status, searchQuery]);
    return reviews;
}