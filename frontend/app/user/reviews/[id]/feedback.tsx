"use client"

import { Check, X } from "lucide-react"

export default function Feedback(){
    return (
        <div className="flex flex-col items-center w-full mt-12">
            <p className="self-start text-sm!">Provide your final feedback, this should be no more than 150 characters.</p>
            <textarea className="px-4 py-2 w-full mx-auto text-sm!" placeholder="feedback..."  maxLength={150} rows={7} cols={5}>

            </textarea>
                <div className="flex items-center gap-2 mt-8">
                    <button className="cursor-pointer flex gap-2 items-center bg-(--bg-cta)/50 hover:bg-(--bg-cta)/60 text-(--text-cta) px-4 py-2 rounded-lg"><Check/> Pass</button>
                    <button className="cursor-pointer flex gap-2 items-center hover:bg-(--destructive)/10 text-(--destructive) border border-(--destructive)/20 px-4 py-2 rounded-lg"><X/> Fail</button>
                </div>
        </div>
    )
}