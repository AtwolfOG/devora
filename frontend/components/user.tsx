import { api } from "@/lib/api";
import Image from "next/image"
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type UserProfileProps = {
    name: string;
    url: string;
    email: string;
}

type UseIdProps = {
    id: string;
}

type User = {
    id: string;
    username: string;
    email: string;
    profile_picture_url: string;
}

export function User({id}: UseIdProps){
    const [user, setUser] = useState<User | null>(null)
    useEffect(() => {
        const getUser = async () => {
            const res = await api.get<User>(`/api/users/${id}`)
            console.log(res.data)
            setUser(res.data)
        }
        getUser()
    }, [id])
    if (user){
        console.log("user", user)
    }
    return (
        user && (
        <Tooltip>
            <TooltipTrigger className="flex items-center gap-2 isolate">
                <p className="text-sm! text-(--text-primary)">{user.username}</p>
            </TooltipTrigger>
            <TooltipContent>
                <UserProfile name={user?.username || ""} url={user?.profile_picture_url || ""} email={user?.email || ""} />
            </TooltipContent>
        </Tooltip>
        )
    )
}

export function UserProfile({name, url, email}: UserProfileProps){
    return (
        <div className="flex items-center gap-4 p-2">
            <div className="w-10 h-10 rounded-full bg-(--primary) flex items-center justify-center overflow-hidden">
                <img width={40} height={40} className="w-full h-full object-cover" src={url} alt={name} />
            </div>
            <div className="flex flex-col">
                <p className="text-sm! text-(--text-primary)">{name}</p>
                <p className="text-xs! text-(--text-secondary)">{email}</p>
            </div>
        </div>
    )
}