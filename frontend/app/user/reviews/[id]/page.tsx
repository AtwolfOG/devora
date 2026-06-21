"use client"
import { StatusBtn } from "@/components/statusBtn";
import {Problems} from "./problems"
import FeedbackForm from "./feedback";
import { Room } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

type Interview = Room & {
    is_owner: boolean;
    is_participant: boolean;
}
export default function Page() {
    const [interview, setInterview] = useState<Interview | null>(null)
    const [loading, setLoading] = useState(false)
    const [ err, setErr] = useState<string | null>(null)
    const { id } = useParams()
    const router = useRouter()
    const fetchInterview = async () => {
        try {
            setLoading(true)
            const res = await api.get<Interview>(`/rooms/${id}`)
            setInterview(res.data)
        } catch (error) {
            setErr("Error fetching interview")
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        fetchInterview()
    }, [id])
    if (loading) return <Loader2 className="animate-spin" />
    if (err) return <div className="flex flex-col items-center gap-2">
        <p className="text-center text-(--text-secondary)">Error fetching interview</p>
        <p onClick={fetchInterview} className="text-(--text-secondary) hover:underline cursor-pointer">Retry</p>
    </div>
    if (!interview) return <div className="flex flex-col items-center gap-2">
        <p className="text-center text-(--text-secondary)">Interview not found</p>
        <p onClick={() => router.push("/user/reviews")} className="text-(--text-secondary) hover:underline cursor-pointer">Go back</p>
    </div>  
    if (!interview.is_owner && !interview.is_participant) return <div className="flex flex-col items-center gap-2">
        <p className="text-center text-(--text-secondary)">You are not authorized to view this interview</p>
        <p onClick={() => router.push("/user/reviews")} className="text-(--text-secondary) hover:underline cursor-pointer">Go back</p>
    </div>
    return(
        <main className="flex flex-col">
            <header className="flex items-center gap-4">
                <div>
                    <h3 className="text-(--text-primary) text-3xl!">{interview.role} Interview</h3>
                    <p className="text-sm!">Manage all interview sessions in one place</p>
                </div>
                <StatusBtn className="bg-(--bg-cta)/50 hover:bg-(--bg-cta)/60">Completed</StatusBtn>
            </header>
            <div className="my-8 max-w-[650px]">
                <iframe
                className="w-full aspect-video max-w-[650px]"
                src="https://www.youtube-nocookie.com/embed/SOQynHuWPeI?si=2F12NOIUGLW906hc"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
                <p className="text-sm! text-(--text-secondary)">For the mean time youtube will be used to store your interview&apos;s recording. Don&apos;t worry they are protected and can&apos;t be viewed by another user except you share this review link</p>
            </div>
            <Problems id={id as string} isOwner={interview.is_owner} />
            <FeedbackForm feedback={interview.feedback.String} isOwner={interview.is_owner} />
        </main>
    )
}
