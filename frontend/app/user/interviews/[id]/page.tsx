"use client"
import { StatusBtn } from "@/components/statusBtn";
import { Copy } from "lucide-react";
import { DetailsCard } from "./detailsCard";
import { ProblemsCard } from "./problem";
import copyToClipboard from "@/lib/copyToClipBoard";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import type { Room } from "@/lib/types";
import ActionsCard from "./actions";

type RoomData = Room & {
    is_owner: boolean
    is_participant: boolean
}

export default function InterviewPage() {
    const [data, setData] = useState<RoomData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
        const { id } = useParams<{ id: string }>()
        const fetchRoom: () => Promise<void> = async () => {
            try {
                setLoading(true)
                setError(false)
                const response = await api.get<RoomData>(`/api/rooms/${id}`);
                if (response.status !== 200) {
                    throw new Error("Failed to fetch room");
                }
                const data = response.data;
                if (!data) {
                    throw new Error("Room not found");
                }
                setData(data)
            } catch (error) {
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        useEffect(() => {
            fetchRoom();
        }, [id])
        if (loading) {
            return  <Loader2 className="animate-spin text-(--text-secondary) my-8 m-auto" />
        }
        if (error) {
            return <div className="flex items-center justify-center h-full"><p className="text-(--text-secondary)">Error fetching room data</p></div>
        }
        if (!data) {
            return <div className="flex items-center justify-center h-full"><p className="text-(--text-secondary)">Room not found</p></div>
        }
	return (
		<div className="@4xl:grid @4xl:grid-cols-2 @4xl:gap-4">
			<div className="@4xl:col-span-1">
                <div>
                    <header className="flex flex-wrap items-center gap-4">
                        <h3 className="text-3xl!">{data.role} Interview</h3>
                        <StatusBtn className={`bg-(--bg-muted)/50 hover:bg-(--bg-muted)/80`}>{(data.status).charAt(0).toUpperCase() + (data.status).slice(1)}</StatusBtn>
                    </header>
                    <p className="text-(--text-secondary) text-sm! my-1">Manage details, participants, and session settings</p>
                </div>
                
                <DetailsCard roomData={data} />
                {data.is_owner &&  <ProblemsCard isOwner={data.is_owner} id={id} />}
            </div>
            <div className="@3xl:col-span-1">
                <Invite participantId={data.participant_id} isOwner={data.is_owner}/>
                <ActionsCard id={id} isOwner={data.is_owner} isParticipant={data.is_participant} status={data.status}/>

            </div>
		</div>
	)
} 



type User = {
	username: string,
	profile_picture_url: string,
	email: string,
	}

function Invite({isOwner, participantId}:{
    isOwner:boolean,
    participantId: RoomData['participant_id'] | null,
}){
    const [link, setLink] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [participant, setParticipant] = useState<any>(null)
    const fetchParticipant = async () => {
        if (participantId == null || !participantId.Valid)  {
            return
        }
        try {
            setLoading(true)
            const response = await api.get<User>(`/api/users/${participantId.UUID}`)
            setParticipant(response.data)
        } catch (error) {
            setError(true)
        } finally {
            setLoading(false)
        }
    }
    useEffect(()=>{
        fetchParticipant()
        setLink(`${window.location.href}`)
    },[])
    
    return (
        isOwner?
        <div className="my-6 bg-(--bg-muted)/60 border-(--border) border rounded-lg p-6">
            <h4 className=" text-xl!">Invite Participant</h4>
             {
            loading ? <Loader2 className="animate-spin text-(--text-secondary)" />:
            error ? <p className="text-(--text-secondary)">Error fetching participant</p>:
            participant && (
                <>
                    <h5>Participant:</h5>
                    <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden"><img src={participant.profile_picture_url} alt={participant.username} className="w-12 h-12 rounded-full object-cover" /> </div>
                        <div className="flex flex-col gap-2">
                            <h4 className=" text-xl!">Interview with {participant.username}</h4>
                            <p className="text-(--text-secondary)">{participant.email}</p>
                        </div>
                    </div>
                </>
             )
            }
            <div className="flex items-center gap-2 my-6 relative"><input type="text" readOnly value={link} className="bg-(--bg-muted)/80 border-(--border) border rounded-lg px-4 py-2 outline-none w-full" /> <button onClick={()=> copyToClipboard(link)} className="absolute right-1 top-1 hover:bg-(--bg-cta)/10 text-(--text-secondary) duration-200 px-4 py-1 rounded-lg"><Copy /></button></div>
            <button onClick={()=> copyToClipboard(link)} className="flex items-center gap-2 bg-(--bg-cta)/50 hover:bg-(--bg-cta)/60 text-(--text-cta) px-4 py-2 rounded-lg"><Copy /> Copy link</button>
        </div>
        :
        <div className="my-6 bg-(--bg-muted)/60 border-(--border) border rounded-lg p-6">
        {
            loading ? <Loader2 className="animate-spin text-(--text-secondary)" />:
            error ? <p className="text-(--text-secondary)">Error fetching participant</p>:
            participant && (
                <>
                    <h5>Participant:</h5>
                    <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden"><img src={participant.profile_picture_url} alt={participant.username} className="w-12 h-12 rounded-full object-cover" /> </div>
                        <div className="flex flex-col gap-2">
                            <h4 className=" text-xl!">Interview with {participant.username}</h4>
                            <p className="text-(--text-secondary)">{participant.email}</p>
                        </div>
                    </div>
                </>
            )
        }
        </div>
    )
}
