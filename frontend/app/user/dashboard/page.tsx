"use client"

import { Calendar, Loader2, LoaderIcon, Trophy } from "lucide-react";
import Link from "next/link";
import { UpcomingInterviewCard, PastInterviewCard } from "./interviewCard";
import CreateInterview from "@/components/createInterview";
import { useEffect, useState } from "react";
import axios from "axios";
import { api } from "@/lib/api";

interface DashboardStat{
    total_interview_count: number;
    pass_rate: string;
    upcoming_interview_count: number;
    username: string;
}

export default function DashboardPage(){
    const [stats, setStats] = useState<DashboardStat | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const getData = async () => {
        try {
            setLoading(true)
            const res = await api.get("/api/users/dashboard")
            setStats(res.data)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.error || "Failed to get dashboard data")
            } else {
                setError("An error occurred")
            }
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        getData()
    }, [])
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-full text-center">
                <Loader2 className="animate-spin" />
            </div>
        )
    }
    return (
        error ? 
        <div className="flex flex-col gap-2 justify-center h-full w-full p-4 text-center">
            <p className="text-(--text-secondary) text-sm!">An error occurred while loading dashboard: {error}</p>
            <button className="text-(--text-secondary) text-sm cursor-pointer hover:underline" onClick={() => {getData(); setError(null)}}>Try again</button>
        </div> 
        : 
        stats &&
        <div>
            <div className="flex flex-wrap gap-8 justify-between items-center mb-4">
                <div>
                    <h3 className="text-(--text-primary)">Welcome to back, {stats?.username}</h3>
                    <p className="text-sm!">Track your interviews and performance</p>
                </div>
                <div>
                    <CreateInterview/>
                </div>
            </div>

            <div className="flex gap-4 my-12 flex-wrap">
                <div className="flex-1 min-w-[200px] max-w-[300px] flex flex-col gap-8 py-4 px-6 border-(--border) border rounded-lg hover:bg-(--bg-muted)">
                    <div className="flex justify-between items-center"><h6>Total Interviews</h6> <Calendar color="#fff9" /></div>
                    <div><p>{stats.total_interview_count}</p></div>
                </div>
                 <div className="flex-1 min-w-[200px] max-w-[300px] flex flex-col gap-8 py-4 px-6 border-(--border) border rounded-lg hover:bg-(--bg-muted)">
                    <div className="flex justify-between items-center"><h6>Pass Rate</h6> <Trophy color="#fff9"/></div>
                    <div><p>{stats.pass_rate}%</p></div>
                </div>
                 <div className="flex-1 min-w-[200px] max-w-[300px] flex flex-col gap-8 py-4 px-6 border-(--border) border rounded-lg hover:bg-(--bg-muted)">
                    <div className="flex justify-between items-center"><h6>Upcoming Interviews</h6> <Calendar color="#fff9"/></div>
                    <div><p>{stats.upcoming_interview_count}</p></div> 
                </div>
            </div>
            <div className="my-18">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-(--text-primary)">Upcoming Interviews</h4>
                    <Link href="/user/interviews" className="relative text-(--text-secondary) text-sm! after:content-[''] after:absolute after:-bottom-px after:left-0 after:h-px after:w-0 after:bg-(--text-secondary) after:transition-all after:duration-100 after:ease-in-out hover:after:w-full">View all</Link>
                </div>

                        <UpcomingInterviewCard/>
            </div>
             <div className="my-18">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-(--text-primary)">Past Interviews</h4>
                    <Link href="/user/interviews" className="relative text-(--text-secondary) text-sm! after:content-[''] after:absolute after:-bottom-px after:left-0 after:h-px after:w-0 after:bg-(--text-secondary) after:transition-all after:duration-100 after:ease-in-out hover:after:w-full">View all</Link>
                </div>

                <div>
                    <PastInterviewCard />
                </div>
            </div>
        </div>
    )
}
