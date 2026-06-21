"use client"
import customToast from "@/components/customToast";
import { DialogContent, DialogHeader, Dialog, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { Answer, CodeSnippet, Question } from "@/lib/types";
import { Editor } from "@monaco-editor/react";
import { CheckCircle, Circle, Ellipsis, FileCode, Loader2, TextIcon, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function Problems({id, isOwner}:{id: string, isOwner: boolean}){
    const [problems, setProblems] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState(false)
    const fetchProblems = async () => {
        try {
            setLoading(true)
            setErr(false)
            const res = await api.get(`/rooms/${id}/problems`)
            setProblems(res.data)
        } catch (error) {
            setErr(true)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        fetchProblems()
    }, [id])
    if (loading) return <Loader2 className="animate-spin" />
    if (err) return <div className="flex flex-col items-center gap-2">
        <p className="text-center text-(--text-secondary)">Error fetching problems</p>
        <p onClick={fetchProblems} className="text-(--text-secondary) hover:underline cursor-pointer">Retry</p>
    </div>
    return(

        <div className="my-6 bg-(--bg-muted)/60 border-(--border) border rounded-lg p-6">
            <h4 className="text-xl!">Problems</h4>
            <div className="flex flex-col gap-2 my-6">
                {problems.length === 0 ? <p className="text-center text-(--text-secondary)">No problems to review</p> : problems.map((problem) => (
                    <div key={problem.id} className="flex items-center gap-2 bg-(--bg-muted)/80 border-(--border) border rounded-lg px-4 py-2">
                        {problem.is_code? <div className="p-2 bg-(--bg-light) text-(--text-secondary)/70 rounded-lg"><FileCode /> </div>: <div className="p-2 bg-(--bg-light) text-(--text-secondary)/70 rounded-lg"><TextIcon /></div>}
                        <div className="flex flex-col gap-1">
                            <div className="flex gap-2 items-center">
                                <h5>{problem.title}</h5>
                                {
                                    !problem.passed.Valid ? <Tooltip>
                                        <TooltipTrigger>
                                            <Circle className="text-(--text-secondary) cursor-pointer" size={16} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-(--text-secondary)!">Pending</p>
                                        </TooltipContent>
                                    </Tooltip>
                                :
                                    problem.passed.Bool ? <Tooltip>
                                        <TooltipTrigger>
                                            <CheckCircle className="text-(--bg-cta) cursor-pointer" size={16} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-(--bg-cta)!">Pass</p>
                                        </TooltipContent>
                                    </Tooltip>
                                :
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <XCircle className="text-(--destructive) cursor-pointer" size={16} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-(--destructive)!">Fail</p>
                                        </TooltipContent>
                                    </Tooltip>
                                }
                            </div>
                            <p className="text-(--text-secondary) text-sm!">{problem.description}</p>
                        </div>
                        {
                            isOwner &&
                            problem.is_code?
                            <ReviewCodeProblemModal roomID={problem.room_id} problemID={problem.id} title={problem.title} description={problem.description} />
                            :
                            <ReviewTextProblemModal roomID={problem.room_id} problemID={problem.id} title={problem.title} description={problem.description} />
                        }
                    </div>
                ))}
            </div>
        </div>
    )
}


function ReviewCodeProblemModal({roomID, problemID, title, description}: {roomID: string, problemID: number, title: string, description: string}){
    const [data, setData] = useState<CodeSnippet | null>(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState(false)
    const fetchData = async () => {
        try{
            const res = await api.get<CodeSnippet>(`/rooms/${roomID}/questions/${problemID}/code`)
            setData(res.data)
        }
        catch (err){
            setErr(true)
        }finally{
            setLoading(false)
        }
    }
    useEffect(() => {
       fetchData()
    }, [roomID, problemID])
    return (
        <Dialog>
            <DialogTrigger className="cursor-pointer ml-auto hover:bg-(--bg-cta)/10! p-1 rounded-lg"><Ellipsis/></DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {
                    loading ? 
                    <div className="flex items-center justify-center">
                        <Loader2 className="text-(--text-secondary) animate-spin" />
                    </div>
                    : err ?
                    <div className="flex items-center justify-center flex-col gap-2">
                        <p className="text-(--text-secondary)">Error loading problem</p>
                        <p className="text-(--text-secondary) hover:underline" onClick={fetchData}>Try again</p>
                    </div>
                    :
                    <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex flex-col gap-2 w-full max-w-[450px] md:max-w-[350px] min-w-[320px]">
                        <div>
                            <p>{description}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-8">
                            <button type="submit" className="bg-(--bg-cta)/50 hover:bg-(--bg-cta)/60 text-(--text-cta) px-4 py-2 rounded-lg" onClick={() => PassOrFailProblem(problemID, roomID, true)}>Pass</button>
                            <button className="hover:bg-(--destructive)/10 text-(--destructive) border border-(--destructive)/20 px-4 py-2 rounded-lg" onClick={() => PassOrFailProblem(problemID, roomID, false)}>Fail</button>
                        </div>
                    </div>
                        <Editor options={{minimap: {enabled: false}, scrollBeyondLastLine: false, lineNumbers: "off"}} className="flex-1 h-full min-h-[320px] w-full min-w-[320px]"  defaultLanguage={"javascript"} language={data?.language} value={data?.code} theme="vs-dark" />
                </div>
                }
            </DialogContent>
        </Dialog>
    )
}


function ReviewTextProblemModal({roomID, problemID, title, description}: {roomID: string, problemID: number, title: string, description: string}){
    const [data, setData] = useState<Answer | null>(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState(false)
    const fetchData = async () => {
        setLoading(true)
        try{
            const res = await api.get<Answer>(`/rooms/${roomID}/questions/${problemID}/answer`)
            setData(res.data)
        }
        catch (err){
            setErr(true)
        }finally{
            setLoading(false)
        }
    }
    useEffect(() => {
       fetchData()
    }, [roomID, problemID])
    return (
        <Dialog>
            <DialogTrigger className="cursor-pointer ml-auto hover:bg-(--bg-cta)/10! p-1 rounded-lg"><Ellipsis/></DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {loading ? 
                    <div className="flex items-center justify-center">
                        <Loader2 className="text-(--text-secondary) animate-spin" />
                    </div>
                    : err ?
                    <div className="flex items-center justify-center flex-col gap-2">
                        <p className="text-(--text-secondary)">Error loading problem</p>
                        <p className="text-(--text-secondary) hover:underline" onClick={fetchData}>Try again</p>
                    </div>
                    :
                    <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex flex-col gap-2 w-full max-w-[450px] md:max-w-[350px] min-w-[320px]">
                        <div>
                            <p>{description}</p>
                            <h6>Answer:</h6>
                            {data ? <p className="text-(--text-secondary)">{data.answer}</p> : <p className="text-(--text-secondary)">No answer submitted</p>}
                        </div>
                        <div className="flex items-center gap-2 mt-8">
                            <button type="submit" className="bg-(--bg-cta)/50 hover:bg-(--bg-cta)/60 text-(--text-cta) px-4 py-2 rounded-lg" onClick={() => PassOrFailProblem(problemID, roomID, true)}>Pass</button>
                            <button className="hover:bg-(--destructive)/10 text-(--destructive) border border-(--destructive)/20 px-4 py-2 rounded-lg" onClick={() => PassOrFailProblem(problemID, roomID, false)}>Fail</button>
                        </div>
                    </div>
                </div>
                }
            </DialogContent>
            
        </Dialog>
    )
}

async function PassOrFailProblem(problemID: number, roomID: string, pass: boolean){
    try{
        if(pass){
            await api.patch(`/rooms/${roomID}/questions/${problemID}/pass`)
        }else{
            await api.patch(`/rooms/${roomID}/questions/${problemID}/fail`)
        }
        customToast.success("Problem updated successfully")
    }
    catch (err){
        customToast.error("Failed to update problem")
    }
}