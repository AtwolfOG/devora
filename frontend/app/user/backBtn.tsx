"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function BackBtn(){
    const router = useRouter()
    function handleClick(){
        router.back()
    }
    return (
        <button onClick={handleClick} className="flex items-center gap-1 my-4 text-(--text-secondary) group cursor-pointer hover:text-(--text-primary) duration-300"><ArrowLeft className="group-hover:-translate-x-1 duration-300" width={20} height={20}/> Back</button>
    )
}