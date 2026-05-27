"use client";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus } from "lucide-react";
import { useForm, type FieldValues } from "react-hook-form";
import { DialogContent, DialogHeader, Dialog, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import customToast from "./customToast";
import { useEffect, useState } from "react";
import SubmitBtn from "./submit";

interface CreateInterviewData {
    role: string;
    company: string;
    date: Date;
    time: string;
    description: string;
}

export default function CreateInterview() {
    const { register, handleSubmit, formState: { isSubmitting }, setValue, getValues } = useForm<CreateInterviewData>()
    const [open, setOpen] = useState(false)
    useEffect(() => {
        setValue("date", new Date())
        setValue("time", new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }))
    }, [])
    const date = getValues("date")
    const onSubmit = async (data: CreateInterviewData) => {
        try {
            const [hours, minutes] = data.time.split(":").map(Number)
            const start_time = new Date(data.date)
            start_time.setHours(hours, minutes, 0, 0)

            console.log("start time", start_time.toISOString())
            const response = await api.post(`/api/rooms`, {
                ...data,
                start_time: start_time.toISOString(),
            });
            if (response.status !== 201) {
                throw new Error("Failed to add interview");
            }
            customToast.success("Interview created successfully");
        } catch (error) {
            customToast.error("failed to create interview")
        }
    }
    return (
        <Dialog>
            <DialogTrigger className="cursor-pointer flex gap-2 items-center px-2 py-2 bg-(--bg-cta) hover:bg-(--bg-cta-hover) rounded-lg w-max">
                <Plus />
                Create an Interview
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
                            <label htmlFor="role">Role</label>
                            <input type="text" id="role" {...register("role", { required: true })} className="px-4 py-2" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="company">Company</label>
                            <input type="text" id="company" {...register("company", { required: true })} className="px-4 py-2" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="description">Description</label>
                            <input type="text" id="description" {...register("description", { required: true })} className="px-4 py-2" />
                        </div>
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

                        <SubmitBtn disabled={isSubmitting} onClick={handleSubmit(onSubmit)} text="CREATE" className="bg-(--bg-cta-darker)" />
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )

}
