"use client"

import customToast from "@/components/customToast";
import { CircleX, LoaderIcon, Notebook, Pencil, Phone, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { DialogContent, DialogHeader, Dialog, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { api } from "@/lib/api";
import SubmitBtn from "@/components/submit";
import { Calendar as CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";

export default function ActionsCard({id, isOwner, status, isParticipant}: {id: string, isOwner: boolean, status: string, isParticipant: boolean}){
    const [disabled, setDisabled] = useState(false)
    
    
    return (
        <>
        <div className="my-6 bg-(--bg-muted)/60 border-(--border) border rounded-lg p-6">
            <h4 className=" text-xl!">Actions</h4>
            <div className="flex flex-col gap-2 my-6">
                {(isOwner || isParticipant) && (status == "live" || status == "pending") && <Link href={`/room/${id}`} className="flex items-center justify-center gap-3 bg-(--bg-cta)/70 hover:bg-(--bg-cta)/60 text-(--text-cta) px-4 py-2 my-4 rounded-lg"><Phone /> Go to Call</Link>}
                {!isOwner && status == "pending" && !isParticipant && <button onClick={() => joinInterview(id, setDisabled)} className="flex items-center justify-center gap-3 bg-(--bg-cta)/70 hover:bg-(--bg-cta)/60 text-(--text-cta) px-4 py-2 my-4 rounded-lg"><Play /> Join Interview</button>}
                {status == "pending" && isParticipant && <button onClick={() => leaveInterview(id, setDisabled)} className="flex items-center justify-center gap-3 hover:bg-(--bg-muted)/60 text-(--text-secondary) border border-(--border) px-4 py-2 rounded-lg"><CircleX /> Leave Interview</button>}
                
                {isOwner && status =="pending" &&  <>
                    <button onClick={() => cancelInterview(id, setDisabled)} className="flex items-center justify-center gap-3 hover:bg-(--bg-muted)/60 text-(--text-secondary) border border-(--border) px-4 py-2 rounded-lg"><CircleX /> Cancel Interview</button>
                 <button onClick={() => deleteInterview(id, setDisabled)} className="flex items-center justify-center gap-3 hover:bg-(--destructive)/10 text-(--destructive) border border-(--destructive)/20 px-4 py-2 rounded-lg"><Trash2 /> Delete Interview</button></>}

                 {status == "cancelled" && isOwner && <Reschedule id={id}/>}

                 {status == "completed" && <Link href={`/user/reviews/${id}`} className="flex items-center justify-center gap-3 bg-(--bg-cta)/70 hover:bg-(--bg-cta)/60 text-(--text-secondary) px-4 py-2 my-4 rounded-lg"><Notebook/> Review</Link>}
            </div>
        </div>
        {disabled && <div className="absolute top-0 left-0 w-full h-full bg-(--bg-muted)/20"> <LoaderIcon className="animate-spin text-(--text-secondary) my-8 m-auto" /></div>}
        </>
    )
}
type rescheduleData = {
    date: Date,
    time: string,
}
function Reschedule({id}: {id: string}){
    const { register, handleSubmit, formState: { isSubmitting }, setValue, getValues } = useForm<rescheduleData>({
        defaultValues: {
            date: new Date(),
            time: new Date().toLocaleTimeString([],{ hour: "2-digit", minute: "2-digit", hour12: false}),
        }
    })
    const [open, setOpen] = useState(false)
    const date = getValues("date")
    const onSubmit = async (data: rescheduleData) => {
        try {
            const [hours, minutes] = data.time.split(":").map(Number)
            const start_time = new Date(data.date)
            start_time.setHours(hours, minutes, 0, 0)

            await api.patch(`/api/rooms/${id}/reschedule`, {
                start_time: start_time.toISOString(),
            });
            customToast.success("Interview rescheduled successfully");
            window.location.reload()
        } catch (error) {
            customToast.error("failed to reschedule interview")
        }
    }
    return (
                <Dialog>
                    <DialogTrigger className="flex items-center justify-center gap-3 bg-(--bg-cta)/70 hover:bg-(--bg-cta)/60 text-(--text-secondary) px-4 py-2 my-4 rounded-lg">
                        <Pencil /> Reschedule Interview
                    </DialogTrigger>
                    <DialogContent className="w-[85%] max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create Interview</DialogTitle>
                            <DialogDescription>
                                Add a new interview to the list
                            </DialogDescription>
                        </DialogHeader>
                        <form>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="date">Date</label>
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger render={
                                            <button className="flex items-center justify-between bg-(--bg-muted)/80 border-(--border) border text-(--text-secondary) rounded-lg px-4 py-2 outline-none">{date?.toDateString()} <CalendarIcon /></button>
                                        }>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto overflow-hidden p-0" align="center">
                                            <Calendar
                                                className="bg-(--bg-muted)/80!"
                                                mode="single"
                                                selected={date}
                                                captionLayout="dropdown"
                                                defaultMonth={date}
                                                onSelect={(date) => {
                                                    setOpen(false)
                                                    date && setValue("date", date)
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="time">Time</label>
                                    <input type="time" id="time" {...register("time", { required: true })} className="px-4 py-2" />
                                </div>
        
                                <SubmitBtn disabled={isSubmitting} onClick={handleSubmit(onSubmit)} text="RESCHEDULE" className="bg-(--bg-cta-darker)" />
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
    )
}

async function joinInterview(id: string, setDisabled: (disabled: boolean) => void){
    setDisabled(true)
    try{
        await api.patch(`/api/rooms/${id}/join`)
        customToast.success("Joined room successfully")
        window.location.reload()
    }catch(error){
        customToast.error("Failed to join room")
    }finally{
        setDisabled(false)
    }
}

async function leaveInterview(id: string, setDisabled: (disabled: boolean) => void){
    setDisabled(true)
    try{
        await api.patch(`/api/rooms/${id}/leave`)
        customToast.success("Left room successfully")
        window.location.reload()
    }catch(error){
        customToast.error("Failed to leave room")
    }finally{
        setDisabled(false)
    }
}

async function cancelInterview(id: string, setDisabled: (disabled: boolean) => void){
    setDisabled(true)
    try{
        await api.patch(`/api/rooms/${id}/cancel`)
        customToast.success("Interview cancelled successfully")
        window.location.reload()
    }catch(error){
        customToast.error("Failed to cancel interview")
    }finally{
        setDisabled(false)
    }
}

async function deleteInterview(id: string, setDisabled: (disabled: boolean) => void){
    setDisabled(true)
    try{
        await api.delete(`/api/rooms/${id}`)
        customToast.success("Interview deleted successfully")
        window.location.href = "/user/interviews"
    }catch(error){
        customToast.error("Failed to delete interview")
    }finally{
        setDisabled(false)
    }
}

