"use client"
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEffect, useState, useCallback } from "react";
import { FieldValues, useForm } from "react-hook-form";
import SubmitBtn from "@/components/submit";
import { api } from "@/lib/api";
import customToast from "@/components/customToast";
import type { Room } from "@/lib/types"

type RoomData = Room & {
    is_owner: boolean
    is_participant: boolean
}

export function DetailsCard({ roomData }: { roomData: RoomData }) {
    const { register, handleSubmit, setValue, getValues, formState: {isSubmitting} } = useForm()
    const [calendarOpen, setCalendarOpen] = useState(false)
    const date = getValues("date")
    const disabled = roomData.status != "pending" || !roomData.is_owner
    const setDetails = useCallback(() => {
        setValue("role", roomData.role);
        setValue("company", roomData.company);
        setValue("description", roomData.description);
        const start_time = new Date(roomData.start_time);
        setValue("date", start_time);
        setValue("time", start_time.toLocaleTimeString([],{ hour: "2-digit", minute: "2-digit", hour12: false}));
    }, [roomData, setValue])
    useEffect(() => {
        setDetails();
    }, [setDetails])

    const onSubmit = async (data: FieldValues) => {
        try {
            const [hours, minutes] = data.time.split(":").map(Number)
            const start_time = new Date(data.date as Date)
            start_time.setHours(hours, minutes, 0, 0)
            const response = await api.put(`/api/rooms/${roomData.id}`, {
                ...data,
                start_time: start_time,
            });
            if (response.status !== 200) {
                throw new Error("Failed to update interview");
            }
            customToast.success("Interview details updated successfully");
        } catch {
            customToast.error("failed to update interview details")
        }
    }

    return (
        <div className="my-6 bg-(--bg-muted)/60 border-(--border) border rounded-lg p-6">
            <h4 className=" text-xl!">Interview Details</h4>
            <div>
                <form action="" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 mt-8">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="role">Role</label>
                        <input type="text" id="role" {...register("role", { required: true })} disabled={disabled} className="px-4 py-2 text-(--text-secondary)" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="company">Company</label>
                        <input type="text" id="company" {...register("company", { required: true })} disabled={disabled} className="px-4 py-2 text-(--text-secondary)" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="description">Description</label>
                        <textarea id="description" disabled={disabled} {...register("description")} rows={3} cols={50} className="px-4 py-2 max-h-32 resize-none text-(--text-secondary)" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="date">Date</label>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger render={
                                <button disabled={disabled} className="flex items-center justify-between bg-(--bg-muted)/80 border-(--border) border text-(--text-secondary) rounded-lg px-4 py-2 outline-none">{date?.toDateString()} <CalendarIcon /></button>
                            }>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto overflow-hidden p-0" align="center">
                                <Calendar
                                    className="bg-(--bg-muted)/80!"
                                    disabled={disabled}
                                    mode="single"
                                    selected={date}
                                    captionLayout="dropdown"
                                    // defaultMonth={date}
                                    onSelect={(date) => {
                                        setCalendarOpen(false);
                                        date && setValue("date", date)
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="time">Time</label>
                        <input type="time" id="time" disabled={disabled} {...register("time", { required: true })}  className="px-4 py-2" />
                    </div>
                    {!disabled && <div className="flex items-center gap-2 mt-8">
                        <SubmitBtn disabled={isSubmitting} className="bg-(--bg-cta)/50 hover:bg-(--bg-cta)/60 text-(--text-cta) px-4 py-2" text="Save Changes" ></SubmitBtn>
                        <button type="button" disabled={isSubmitting} onClick={setDetails} className="text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-muted) border border-(--border-light) duration-200 px-4 py-2 rounded-lg">Cancel</button>
                    </div>
                    }
                </form>
            </div>
        </div>
    )
}