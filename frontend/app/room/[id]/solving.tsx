"use client"
import { useRoom } from "./context"
import { useCallback, useContext, useEffect, useState } from "react"
import { Question as Problem, CodeSnippet } from "@/lib/types"
import { api } from "@/lib/api"
import customToast from "@/components/customToast"
import { ArrowLeft, Check, Loader2, Play } from "lucide-react"
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable"
import { Separator } from "react-resizable-panels"
import { Editor } from "@monaco-editor/react"
import { cn } from "@/lib/utils"

export function SolvingUI({problem, setIsSolving}: {problem:Problem, setIsSolving?: (isSolving: boolean) => void}){
    return (
        <div className="flex flex-col flex-1 h-full">
            {setIsSolving && <button onClick={() => setIsSolving(false)} className="flex items-center gap-1 mx-6 my-4 text-(--text-secondary) group cursor-pointer hover:text-(--text-primary) duration-300"><ArrowLeft className="group-hover:-translate-x-1 duration-300" width={20} height={20}/> Back</button>}
            {
                problem.type === "code" ? 
                <CodeSolvingUI problem={problem} isMobile={!!setIsSolving}/>
                : 
                <AnswerSubmissionUI problem={problem} isMobile={!!setIsSolving}/>
            }
        </div>
    )
}

function CodeSolvingUI ({problem, isMobile}: {problem: Problem, isMobile: boolean}){
    const [code, setCode] = useState<CodeSnippet | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [codeOutput, setCodeOutput] = useState<string[]>([])
    const {room: roomData} = useRoom()
    const fetchCode = useCallback(async () => {
        if (!roomData) return;
        try {
            setLoading(true)
            const res = await api.get(`/api/rooms/${roomData.id}/problems/${problem.id}/code`)
            const data = await res.json()
            setCode(data.code)
        } catch (error) {
            if (isAxiosError(error)) {
                setError(error.response?.data.error || "Failed to fetch code");
                return;
            }
            setError("Failed to fetch code")
        } finally {
            setLoading(false)
        }
    }, [roomData, problem.id])
    useEffect(() => {
        if (!roomData) return;
        if (!roomData.room?.id) return;
        fetchCode()
    }, [roomData, fetchCode])
    if (loading) {
        return (
            <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div> 
        )
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center"><p className="text-(--text-secondary) text-sm!">An error occurred while fetching interviews.</p><button className="text-(--text-secondary) text-sm cursor-pointer hover:underline" onClick={() => {setError(null); fetchCode(); }}>Try again</button></div> 
        )
    }

    return (
        <div className="flex-1">
            <h5 className={cn("mb-2", isMobile ? "mx-6" : "mx-2")}>{problem.title}</h5>
            <ResizablePanelGroup orientation="vertical" className="h-full w-full!">
                <ResizablePanel defaultSize={50} minSize={30}>
                    <Editor language={code?.language} options={{readOnly: problem.done}} value={code?.code} onChange={(value) => setCode(value)} className="" theme="vs-dark" defaultValue={code?.code}/>
                </ResizablePanel>
                <Separator className="cursor-row-resize!">
                    <div className="flex justify-center gap-2 bg-(--bg-muted) p-2 border border-(--border) cursor-row-resize!">
                        <button className="px-2 py-1 rounded-lg bg-background/80 hover:bg-background cursor-pointer! flex items-center gap-2"><Play size={16}/> Run</button>
                        <button disabled={problem.done || submitting} onClick={() => code && submitCode(code, setSubmitting)} className="px-2 py-1 rounded-lg bg-(--bg-cta) hover:bg-(--bg-cta-hover) cursor-pointer! flex items-center gap-2"><Check size={16}/> Submit</button>
                    </div>
                </Separator>
                <ResizablePanel className="flex flex-col" defaultSize={50} minSize={30}>
                    <div className="flex flex-1 flex-col">
                        <div className="flex-1 p-2 bg-background">
                            {codeOutput.map((output, index) => (
                                <div key={index} className="p-1">
                                    <p>{output}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}

function AnswerSubmissionUI ({problem, isMobile}: {problem:Problem, isMobile: boolean}){
    const [answer, setAnswer] = useState<string>("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const roomData = useContext(DataContext)
    const fetchAnswer = useCallback(async () => {
        if (!roomData) return;
        try {
            setLoading(true)
            const res = await api.get(`/api/rooms/${roomData.id}/problems/${problem.id}/answer`)
            const data = await res.json()
            setAnswer(data.answer)
        } catch (error) {
            if (isAxiosError(error)) {
                setError(error.response?.data?.error || "Failed to fetch answer")
                return
            }
            setError("Failed to fetch answer")
        } finally {
            setLoading(false)
        }
    }, [roomData, problem.id])
    useEffect(() => {
        if (!roomData?.id) return;
        // get the answer if the problem is already solved
        if (problem.done) {
            fetchAnswer()
        }
    }, [fetchAnswer, roomData, problem.done])
    if (loading) {
        return (
            <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div> 
        )
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center"><p className="text-(--text-secondary) text-sm!">An error occurred while fetching interviews.</p><button className="text-(--text-secondary) text-sm cursor-pointer hover:underline" onClick={() => {setError(null); fetchAnswer(); }}>Try again</button></div> 
        )
    }

    return (
        <div className="px-6 py-2 flex-1 flex flex-col">
            <h5 className={cn("mb-2", isMobile ? "mx-6" : "mx-2")}>{problem.title}</h5>
            {/* <h4 className="mb-4">{problem.title}</h4> */}
            <textarea name="solution" id="" className="flex-1 w-full border border-(--border) outline-none bg-(--bg-light) p-2" contentEditable={!problem.done} value={answer} onChange={(e) => setAnswer(e.target.value)}></textarea>
            <div className="mt-4 self-center">
            <button disabled={problem.done || submitting} onClick={() => roomData && submitAnswer(answer, roomData.id, problem.id, setSubmitting)} className="w-fit px-2 py-1 rounded-lg bg-(--bg-cta) hover:bg-(--bg-cta-hover) cursor-pointer! flex items-center gap-2"><Check size={16}/> Submit</button>
            </div>
        </div>
    )
}


async function submitAnswer(answer: string, roomID: string, questionID: number, setSubmitting: (submitting: boolean) => void){
    try{
        setSubmitting(true)
        await api.post(`/api/rooms/${roomID}/questions/${questionID}/answer`, {answer})
        customToast.success("Answer submitted successfully")
    }catch(err){
        if (isAxiosError(err)) {
            customToast.error(err.response?.data?.error || "Failed to submit answer")
            return
        }
        customToast.error("Failed to submit answer")
    } finally {
        setSubmitting(false)
    }
}

async function submitCode(code: CodeSnippet, setSubmitting: (submitting: boolean) => void){
    try{
        setSubmitting(true)
        await api.post(`/api/rooms/${code.roomID}/questions/${code.questionID}/answer`, {code, language: code.language})
        customToast.success("Code submitted successfully")
    }catch(err){
        if (isAxiosError(err)) {
            customToast.error(err.response?.data?.error || "Failed to submit code")
            return
        }
        customToast.error("Failed to submit code")
    } finally {
        setSubmitting(false)
    }
}
