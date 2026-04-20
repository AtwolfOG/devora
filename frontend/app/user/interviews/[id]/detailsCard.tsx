"use client"
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
export function DetailsCard(){
    const [date, setDate ] = useState<Date | undefined>(new Date())
    const [open, setOpen ] = useState(false)
    return (
        <div className="my-6 bg-(--bg-muted)/60 border-(--border) border rounded-lg p-6">
            <h4 className=" text-xl!">Interview Details</h4>
            <div>
                <form action="" className="flex flex-col gap-2 my-8">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="title">Role</label>
                        <input type="text" id="title" name="title" className="bg-(--bg-muted)/80 border-(--border) border rounded-lg px-4 py-2 outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="title">Company</label>
                        <input type="text" id="title" name="title" className="bg-(--bg-muted)/80 border-(--border) border rounded-lg px-4 py-2 outline-none" />
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
                setDate(date)
                setOpen(false)
              }}
 />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="time">Time</label>
                        <input type="time" id="time" name="time" className="bg-(--bg-muted)/80 border-(--border) border rounded-lg px-4 py-2 outline-none" />
                    </div>
                </form>
                <div className="flex items-center gap-2">
                    <button className="bg-(--bg-cta)/50 hover:bg-(--bg-cta)/60 text-(--text-cta) px-4 py-2 rounded-lg">Save Changes</button>
                    <button className="text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-muted) border border-(--border-light) duration-200 px-4 py-2 rounded-lg">Cancel</button>
                </div>
            </div>
        </div>
    )
}