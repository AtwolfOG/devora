"use client"
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { useForm } from "react-hook-form";
export function DetailsCard(){
    const {register, handleSubmit, setValue, getValues} = useForm()
    const [open, setOpen ] = useState(false)
    setValue("date", new Date())
    const date = getValues("date")
    return (
        <div className="my-6 bg-(--bg-muted)/60 border-(--border) border rounded-lg p-6">
            <h4 className=" text-xl!">Interview Details</h4>
            <div>
                <form action="" onSubmit={handleSubmit((data) => console.log(data))} className="flex flex-col gap-2 mt-8">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="title">Role</label>
                        <input type="text" id="title" {...register("title", {required: true})} className="bg-(--bg-muted)/80 border-(--border) border rounded-lg px-4 py-2 outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="title">Company</label>
                        <input type="text" id="title" {...register("company", {required: true})} className="bg-(--bg-muted)/80 border-(--border) border rounded-lg px-4 py-2 outline-none" />
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
                                    setValue("date", date)
                                }}
                                // {...register("date")}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="time">Time</label>
                        <input type="time" id="time" {...register("time", {required: true})} defaultValue={"12:38"} className="bg-(--bg-muted)/80 border-(--border) border rounded-lg px-4 py-2 outline-none" />
                    </div>
                    <div className="flex items-center gap-2 mt-8">
                        <button type="submit" className="bg-(--bg-cta)/50 hover:bg-(--bg-cta)/60 text-(--text-cta) px-4 py-2 rounded-lg">Save Changes</button>
                        <button type="button" className="text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-muted) border border-(--border-light) duration-200 px-4 py-2 rounded-lg">Cancel</button>
                    </div>
                </form>
                
            </div>
        </div>
    )
}