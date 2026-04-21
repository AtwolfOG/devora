"use client"
import { StatusBtn } from "@/components/statusBtn";
import { CircleX, Copy, Play, Trash2 } from "lucide-react";
import { DetailsCard } from "./detailsCard";
import { ProblemsCard } from "./addProblem";
import customToast from "@/components/customToast";

export default function InterviewPage(){
	return (
		<div className="@4xl:grid @4xl:grid-cols-2 @4xl:gap-4">
			<div className="@4xl:col-span-1">
                <div>
                                <div className="flex items-center gap-4">
                                    <h3 className="text-3xl!">Senior Backend Engineer Interview</h3>
                                    <StatusBtn className="bg-(--bg-cta)/50 hover:bg-(--bg-cta)/60">Completed</StatusBtn>
                                </div>
                                <p className="text-(--text-secondary) text-sm! my-1">Manage details, participants, and session settings</p>
                            </div>
                
                            <DetailsCard />
                            <ProblemsCard />
            </div>
            <div className="@3xl:col-span-1">
                            <Invite/>
                            <ActionsCard />

            </div>
		</div>
	)
} 





function Invite(){
    function copyToClipboard(){
        navigator.clipboard.writeText("https://devora.app/interview/inv_8k2j9d0f2j3d")
        customToast.success("Link copied to clipboard")
    }
    return (
        <div className="my-6 bg-(--bg-muted)/60 border-(--border) border rounded-lg p-6">
            <h4 className=" text-xl!">Invite Participant</h4>

            <div className="flex items-center gap-2 my-6 relative"><input type="text" readOnly value="https://devora.app/interview/inv_8k2j9d0f2j3d" className="bg-(--bg-muted)/80 border-(--border) border rounded-lg px-4 py-2 outline-none w-full" /> <button onClick={copyToClipboard} className="absolute right-1 top-1 hover:bg-(--bg-cta)/10 text-(--text-secondary) duration-200 px-4 py-1 rounded-lg"><Copy /></button></div>
            <button onClick={copyToClipboard} className="flex items-center gap-2 bg-(--bg-cta)/50 hover:bg-(--bg-cta)/60 text-(--text-cta) px-4 py-2 rounded-lg"><Copy /> Copy link</button>
        </div>
    )
}

function ActionsCard(){
    return (
        <div className="my-6 bg-(--bg-muted)/60 border-(--border) border rounded-lg p-6">
            <h4 className=" text-xl!">Actions</h4>
            <div className="flex flex-col gap-2 my-6">
                <button className="flex items-center justify-center gap-3 bg-(--bg-cta)/70 hover:bg-(--bg-cta)/60 text-(--text-cta) px-4 py-2 my-4 rounded-lg"><Play /> Start Interview</button>
                <button className="flex items-center justify-center gap-3 hover:bg-(--bg-muted)/60 text-(--text-secondary) border border-(--border) px-4 py-2 rounded-lg"><CircleX /> Cancel Interview</button>
                <button className="flex items-center justify-center gap-3 hover:bg-(--destructive)/10 text-(--destructive) border border-(--destructive)/20 px-4 py-2 rounded-lg"><Trash2 /> Delete Interview</button>
            </div>
        </div>
    )
}