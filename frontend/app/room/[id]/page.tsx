"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useCheckWindowDimension } from "@/lib/windowDimesion";
import { Editor } from "@monaco-editor/react"
import { ArrowLeft, Check, Clock, FileCode, Mic, PhoneOff, Play, TextIcon, Trash2, Video } from "lucide-react"
import Image from "next/image"
import Link from "next/link";
import { useState } from "react";
import { Separator } from "react-resizable-panels";

const isOwner: boolean = true;
// const peerConnection = new RTCPeerConnection();
// console.log(peerConnection);
let isUserJoined: boolean = true;

type Problem = {
    id: string;
    title: string;
    description: string;
    type: "text"|"code";
    boilerplateCode?: string;
    language?: string;
}
const codeOutput: string[] = [
    "Running your code...",
    "Code is running...",
    "Code has run"
]
const testData: Problem[] = [
    {
        id: "1",
        title: "Two Sum",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        type: "code",
        boilerplateCode: "",
        language: "javascript"
    },
    {
        id: "2",
        title: "Reverse String",
        description: "Write a function that reverses a string.",
        type: "text"
    },
    {
        id: "3",
        title: "FizzBuzz",
        description: "Write a function that prints numbers from 1 to n. For multiples of 3, print \"Fizz\", for multiples of 5, print \"Buzz\", and for multiples of both, print \"FizzBuzz\".",
        type: "code",
        boilerplateCode: "",
        language: "python"
    }
]
export default function RoomPage(){
    const isMobile = useCheckWindowDimension(1024);
    return (
        <div className="h-dvh max-h-dvh flex flex-col">
            <header className="flex justify-between py-3 px-8 bg-(--bg-light) border border-(--border) rounded">
                <div className="max-md:hidden"><h4>Devora</h4></div>
                <div><h4 className="max-md:text-xl!">Senior Software Engineer Interview</h4></div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border border-(--bg-cta)/80! text-(--border) px-4 py-1 rounded-2xl cursor-pointer"><Clock className="text-(--bg-cta)/80!" size={16} /><p className="text-sm text-(--bg-cta)/80!">00:00</p></div>
                    <div className="relative size-9 rounded-full overflow-hidden"><Image fill className="object-cover" src={"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"} alt="Michael" /></div>
                </div>
            </header>
                {isUserJoined ? 
                isMobile ? <MobileUI /> : <DesktopUI /> 
                : 
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 backdrop-blur-sm ">
                    <div>
                        <h4 className="text-(--bg-secondary)!">The host is yet to join the room</h4>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                        <button className="cursor-pointer bg-(--bg-cta) px-3 py-1 rounded text" onClick={() => {isUserJoined = true}}>Join Room</button>
                        <Link href="/user/dashboard" className="relative text-(--text-secondary) text-sm! after:content-[''] after:absolute after:-bottom-px after:left-0 after:h-px after:w-0 after:bg-(--text-secondary) after:transition-all after:duration-100 after:ease-in-out hover:after:w-full">Go back to dashboard</Link>
                    </div>
                </div>
                }
        </div>
    )
}

function MobileUI(){
    const  [isCallTab, setIsCallTab] = useState(true);
    const isPhone = useCheckWindowDimension(768)
    return (
        <>
            {
                isCallTab ? 
                <CallUI />
                :
                isPhone ? <ProblemPhoneUI /> :<ProblemTabletUI />
            }
            <div className="mt-3 flex justify-center m-auto w-full border border-(--border) bg-(--bg-muted)">
                <div className={`py-2 px-4 w-[50%] border-r border-(--border) rounded-l-lg text-center cursor-pointer hover:bg-(--bg-light) ${isCallTab ? "bg-(--bg-light)" : ""}`} onClick={() => setIsCallTab(true)}>CALL</div>
                <div className={`py-2 px-4 w-[50%] border-l border-(--border) rounded-r-lg text-center cursor-pointer hover:bg-(--bg-light) ${!isCallTab ? "bg-(--bg-light)" : ""}`} onClick={() => setIsCallTab(false)}>PROBLEMS</div>
            </div>
        </>
    )
}

function DesktopUI(){
    return (
        <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel defaultSize={50}>
                <ProblemDesktopUI />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50}>
                <CallUI />
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}

function CallUI(){
    return (
        <div className="flex flex-col flex-1 mt-4 bg-(--bg-light) border border-(--border) rounded">
                <div className="h-full flex-1">
                    <div className="h-full flex-1"></div>
                    <div className="h-[20%] max-h-[150px]"></div>
                </div>
                <div className="flex justify-center gap-4 items-end py-2 bg-(--bg-muted)">
                    <button className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-background/50 hover:bg-background/80 text-(--text-primary) rounded-lg"><Video size={20}/> Video</button>
                    <button className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-background/50 hover:bg-background/80 text-(--text-primary) rounded-lg"><Mic size={20}/> Mic</button>
                    <button className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-(--destructive)/20 hover:bg-(--destructive)/40 border border-(--destructive)/40 text-(--text-primary) rounded-lg">
                   <PhoneOff size={20}/> {isOwner ?  "End Call" : "Leave call"} </button>
                </div>
            </div>
    )
}

function ProblemPhoneUI(){
    const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
    const [isSolving, setIsSolving] = useState(false);
    return (
        <div className="flex flex-col flex-1 mt-4 bg-(--bg-light) border border-(--border) rounded">
            <div className="flex flex-1 overflow-y-auto">
                {!selectedProblem && <ProblemsCard problems={testData} setSelectedProblem={setSelectedProblem}/>}
                {selectedProblem && !isSolving && <ProblemViewer problem={selectedProblem} onClick={() => {setSelectedProblem(null)}} setIsSolving={setIsSolving}/>}
                {selectedProblem && isSolving && <SolvingUI problem={selectedProblem} setIsSolving={setIsSolving}/>}
            </div>
        </div>
    )
}

function ProblemTabletUI(){
    const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
    return (
        <div className="flex flex-1 mt-4 bg-(--bg-light) border border-(--border) rounded">
            <div className="flex-1 overflow-y-auto">
                {!selectedProblem && <ProblemsCard problems={testData} setSelectedProblem={setSelectedProblem}/>}
                {selectedProblem && 
                <ResizablePanelGroup orientation="horizontal">
                    <ResizablePanel defaultSize={50}>
                        <ProblemViewer problem={selectedProblem} onClick={() => {setSelectedProblem(null)}}/>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                        <SolvingUI problem={selectedProblem} />
                    </ResizablePanel>
                </ResizablePanelGroup>}
            </div>
        </div>
    )
}

function ProblemDesktopUI(){
    const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
    return (
        <div className="flex flex-1 mt-4 bg-(--bg-light) border border-(--border) rounded">
            <div className="flex-1 overflow-y-auto">
                {!selectedProblem && <ProblemsCard problems={testData} setSelectedProblem={setSelectedProblem}/>}
                {selectedProblem && 
                <ResizablePanelGroup orientation="horizontal">
                    <ResizablePanel defaultSize={50}>
                        <ProblemViewer problem={selectedProblem} onClick={() => {setSelectedProblem(null)}}/>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                        <SolvingUI problem={selectedProblem} />
                    </ResizablePanel>
                </ResizablePanelGroup>}
            </div>
        </div>
    )
}

function ProblemsCard({problems, setSelectedProblem}: {problems: Problem[], setSelectedProblem: (problem: Problem | null) => void}){
    return (
        <>
        <div className="p-6">
            <h4 className="text-xl!">Problems</h4>
            <div className="flex flex-col gap-2 my-6">
                {testData.length === 0 ? <p>No problems to solve here</p> : problems.map((problem) => (
                    <div key={problem.id} className="flex items-center gap-2 bg-(--bg-muted)/80 border-(--border) border rounded-lg px-4 py-2">
                        {problem.type == "code"? <div className="p-2 bg-(--bg-light) text-(--text-secondary)/70 rounded-lg"><FileCode /> </div>: <div className="p-2 bg-(--bg-light) text-(--text-secondary)/70 rounded-lg"><TextIcon /></div>}
                        <div className="flex flex-col gap-1">
                            <h5>{problem.title}</h5>
                            <p className="text-(--text-secondary) text-sm! line-clamp-2">{problem.description}</p>
                        </div>
                        <button onClick={() => setSelectedProblem(problem)} className="cursor-pointer ml-auto px-2 py-1 rounded-lg bg-(--bg-cta)">View</button>
                    </div>
                ))}
            </div>
        </div>
        </>
    )
}

function ProblemViewer({problem, onClick, setIsSolving}: {problem:Problem, onClick: () => void, setIsSolving?: (isSolving: boolean) => void}){
    return (
        <div className="p-6">
            <button onClick={onClick} className="flex items-center gap-1 my-4 text-(--text-secondary) group cursor-pointer hover:text-text duration-300"><ArrowLeft className="group-hover:-translate-x-1 duration-300" width={20} height={20}/> Back</button>
            <div className="mt-6">
                <h4>{problem.title}</h4>
                <p className="text-(--text-secondary) text-sm! mt-2">{problem.description}</p>
                {setIsSolving && <button onClick={() => setIsSolving(true)} className="cursor-pointer px-2 py-1 rounded-lg bg-(--bg-cta) mt-4">Solve Problem</button>}
            </div>
        </div>
    )
}
function SolvingUI({problem, setIsSolving}: {problem:Problem, setIsSolving?: (isSolving: boolean) => void}){
    return (
        <div className="flex flex-col flex-1 h-full">
            {setIsSolving && <button onClick={() => setIsSolving(false)} className="flex items-center gap-1 mx-6 my-4 text-(--text-secondary) group cursor-pointer hover:text-(--text-primary) duration-300"><ArrowLeft className="group-hover:-translate-x-1 duration-300" width={20} height={20}/> Back</button>}
            {
                problem.type === "code" ? 
                <div className="flex-1">
                    <h4 className="mx-6 mb-3">{problem.title}</h4>
                    <ResizablePanelGroup orientation="vertical" className="h-full w-full!">
                        <ResizablePanel defaultSize={50} minSize={30}>
                            <Editor language={problem.language} className="" theme="vs-dark" defaultValue={problem?.boilerplateCode}/>
                        </ResizablePanel>
                        <Separator className="cursor-row-resize!">
                            <div className="flex justify-center gap-2 bg-(--bg-muted) p-2 border border-(--border) cursor-row-resize!">
                                    <button className="px-2 py-1 rounded-lg bg-background/80 hover:bg-background cursor-pointer! flex items-center gap-2"><Play size={16}/> Run</button>
                                    <button className="px-2 py-1 rounded-lg bg-(--bg-cta) hover:bg-(--bg-cta-hover) cursor-pointer! flex items-center gap-2"><Check size={16}/> Submit</button>
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
                : 
                <div className="px-6 py-2 flex-1 flex flex-col">
                    <h4 className="mb-4">{problem.title}</h4>
                    <textarea name="solution" id="" className="flex-1 w-full border border-(--border) outline-none bg-(--bg-light) p-2"></textarea>
                    <div className="mt-4 self-center">
                    <button className="w-fit px-2 py-1 rounded-lg bg-(--bg-cta) hover:bg-(--bg-cta-hover) cursor-pointer! flex items-center gap-2"><Check size={16}/> Submit</button>
                    </div>
                </div>
            }
        </div>
    )
}