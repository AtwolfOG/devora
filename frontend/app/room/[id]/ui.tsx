"use client"

import { useState } from "react"
import { useCheckWindowDimension } from "@/lib/windowDimesion";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Question} from "@/lib/types";
import { api } from "@/lib/api"
import { isAxiosError } from "axios"
import { useCallback } from "react"
import { useRef } from "react"
import { useEffect } from "react"
import { Video, Mic, PhoneOff, Loader2, TextIcon, FileCode, ArrowLeft, VideoOff, MicOff, Copy, LoaderIcon } from "lucide-react"
import customToast from "@/components/customToast"
import Link from "next/link"
import { SolvingUI } from "./solving"
import { useRoom} from "./context";
import copyToClipboard from "@/lib/copyToClipBoard";
import { UserInline } from "@/components/user";
import { cn } from "@/lib/utils";

export function UI(){
    const [isUserJoined, setIsUserJoined] = useState(false);
    const isMobile = useCheckWindowDimension(1024);
    const {loading, room: roomData} = useRoom();
    if (loading) {
        return 
            <div className="flex justify-center items-center h-full"><LoaderIcon className="animate-spin" /></div> 
    }
    return (
                roomData?.status == "live" || roomData?.is_owner ? 
                isMobile ? <MobileUI /> : <DesktopUI /> 
                : 
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 backdrop-blur-sm ">
                    <div>
                        <h4 className="text-(--bg-secondary)!">The host is yet to join the room</h4>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                        <button className="cursor-pointer bg-(--bg-cta) px-3 py-1 rounded text" onClick={() => {setIsUserJoined(true)}}>Join Room</button>
                        <Link href="/user/dashboard" className="relative text-(--text-secondary) text-sm! after:content-[''] after:absolute after:-bottom-px after:left-0 after:h-px after:w-0 after:bg-(--text-secondary) after:transition-all after:duration-100 after:ease-in-out hover:after:w-full">Go back to dashboard</Link>
                    </div>
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
                isPhone ? <QuestionPhoneUI /> :<QuestionTabletUI />
            }
            <div className="mt-3 flex justify-center m-auto w-full border border-(--border) bg-(--bg-muted)">
                <div className={`py-2 px-4 w-[50%] border-r border-(--border) rounded-l-lg text-center cursor-pointer hover:bg-(--bg-light) ${isCallTab ? "bg-(--bg-light)" : ""}`} onClick={() => setIsCallTab(true)}>CALL</div>
                <div className={`py-2 px-4 w-[50%] border-l border-(--border) rounded-r-lg text-center cursor-pointer hover:bg-(--bg-light) ${!isCallTab ? "bg-(--bg-light)" : ""}`} onClick={() => setIsCallTab(false)}>QUESTIONS</div>
            </div>
        </>
    )
}

function DesktopUI(){
    return (
        <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel defaultSize={50} className="flex flex-col!">
                <QuestionDesktopUI />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} className="flex flex-col!">
                <CallUI />
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}

function CallUI(){
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [ muted, setMuted ] = useState(false);
    const [ videoEnabled, setVideoEnabled ] = useState(true);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const {room: roomData, refetchRoom, roomInstance} = useRoom();
    const [isCallStarting, setIsCallStarting] = useState(false);
    const [isCallStarted, setIsCallStarted] = useState(false);
    const [userStatusOnline, setUserStatusOnline] = useState(false);

    // set room instance event listeners
    useEffect(() => {
      if (!roomInstance) return;
        roomInstance.onRemoteStream = (stream) => setRemoteStream(stream);
        roomInstance.onLocalStream = (stream) => setLocalStream(stream);
        roomInstance.onUserLeft = () => {
          setIsCallStarted(false);
          setIsCallStarting(false);
          setRemoteStream(null);
        }
        roomInstance.onUserStatusChange = (status) => {
            setUserStatusOnline(status == "online")
        }
    }, [roomInstance]);

    // attach streams to video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream && remoteStream.active){
          remoteVideoRef.current!.srcObject = remoteStream;
        }
        if (localVideoRef.current && localStream && localStream.active){
          localVideoRef.current!.srcObject = localStream;
        }
    }, [remoteStream, localStream])

    // toggle mute video and audio
    const toggleMute = useCallback(() => {
      if(muted){
        roomInstance.unmuteAudio();
      }else{
        roomInstance.muteAudio();
      }
        setMuted(!muted);
    }, [muted, roomInstance])
    const toggleVideo = useCallback(() => {
      if(videoEnabled){
        roomInstance.muteVideo();
      }else{
        roomInstance.unmuteVideo();
      }
        setVideoEnabled(!videoEnabled);
    }, [videoEnabled, roomInstance])

    // start call
    const startCall = useCallback(async () => {
        if (!roomInstance) return;
        try {
            setIsCallStarting(true);
            await roomInstance.getMediaStream();
            await roomInstance.triggerCall();
            setIsCallStarted(true);
            await refetchRoom();
        } catch {
            customToast.error("Failed to start call");
        } finally {
            setIsCallStarting(false);
        }
    }, [roomInstance, refetchRoom])

    const joinCall = useCallback(async () => {
        if (!roomInstance) return;
        try {
            setIsCallStarting(true);
            await roomInstance.getMediaStream();
            await roomInstance.joinCall();
            setIsCallStarted(true);
            await refetchRoom();
        } catch {
            customToast.error("Failed to join call");
        } finally {
            setIsCallStarting(false);
        }
    }, [roomInstance, refetchRoom])

    // start call if roomData?.status == "live"
    useEffect(() => {
        if (!roomData) return;
        if (isCallStarted) return;
        if (isCallStarting) return;
        if (roomData?.status == "live") {
            if (roomData?.is_owner) {
                startCall();
            }
            if (roomData?.is_participant) {
                joinCall();
            }
        }
    }, [roomData, startCall, joinCall, isCallStarting, isCallStarted])

    if (remoteStream) console.log("remote stream is received: ", remoteStream)
    
    return (
        <div className="flex flex-col flex-1 mt-4 bg-(--bg-light) border border-(--border) rounded">
            
            {roomData?.status == "pending" && roomData?.is_participant && (
                <div className="flex flex-col items-center justify-center h-full">
                    <h4 className="text-2xl font-bold">Waiting for interviewer to join</h4>
                    <p className="text-muted-foreground">The interviewer will join the call soon</p>
                </div>
            )}
            {roomData?.status == "pending" && roomData?.is_owner && (
                <div className="flex flex-col items-center justify-center h-full relative">
                    <h3 className="text-2xl font-bold">Start the call</h3>
                    <p className="text-muted-foreground">Click the button below to start the call</p>
                    <div className="mt-4 flex gap-2">
                        <button className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-background/50 hover:bg-background/80 text-(--text-primary) rounded-lg" onClick={startCall}>Start Call</button>
                       <button onClick={() => copyToClipboard(window.location.href)} className="cursor-pointer flex items-center gap-2 px-4 py-2  hover:bg-background/30 text-(--text-secondary)! rounded-lg">Copy Link <Copy size={20}/></button>
                    </div>
			        {(isCallStarting) && <div className="absolute inset-0 flex items-center justify-center z-1 bg-black/60"><LoaderIcon className="size-5 animate-spin" /></div>}
                </div>
            )}
            { roomData?.status == "live" && 
            <>
            <div className="h-full flex-1">
                <div className="flex flex-col justify-center items-center h-full flex-1 w-full">
                    <UserVideo stream={localStream} id={roomData?.is_owner ? roomData?.owner_id : roomData?.participant_id} online={false} />
                    {remoteStream && <UserVideo stream={remoteStream} id={roomData?.is_owner ? roomData?.participant_id : roomData?.owner_id} online={userStatusOnline} />}
                </div>
                <div className="h-[20%] max-h-[150px]"></div>
            </div>
            <div className="flex justify-center gap-4 items-end py-2 bg-(--bg-muted)">
                <button className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-background/50 hover:bg-background/80 text-(--text-primary) rounded-lg" onClick={toggleVideo}>{videoEnabled ? <Video size={20}/> : <VideoOff size={20}/>} Video</button>
                <button className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-background/50 hover:bg-background/80 text-(--text-primary) rounded-lg" onClick={toggleMute}>{muted ? <MicOff size={20}/> : <Mic size={20}/>} Mic</button>

                { roomData?.status == "live" && (roomData?.is_owner ? 
                <button onClick={async () => {try{await room?.endCall()} catch{customToast.error("Error ending call")}}} className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-(--destructive)/20 hover:bg-(--destructive)/40 border border-(--destructive)/40 text-(--text-primary) rounded-lg">
                <PhoneOff size={20}/> End Call</button> 
                    :
                <button onClick={async () => {try{await room?.leaveCall()} catch{customToast.error("Error leaving call")}}} className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-(--destructive)/20 hover:bg-(--destructive)/40 border border-(--destructive)/40 text-(--text-primary) rounded-lg">
                <PhoneOff size={20}/> Leave call</button>)}
                
            </div>
            </>
            }
            {
                roomData?.status == "ended" && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <h1 className="text-2xl font-bold">Call Ended</h1>
                        <p className="text-muted-foreground">The call has ended</p>
                    </div>
                )
            }
        </div>
    )
}

function QuestionPhoneUI(){
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const {room: roomData} = useRoom();
    const fetchQuestions = useCallback(async () => {
        try {
            if (!roomData) return;
            setLoading(true);
            const response = await api.get<Question[]>(`/api/rooms/${roomData.id}/questions`);
            setQuestions(response.data?.questions);
        } catch (error) {
            if (isAxiosError(error)) {
                setError(error.response?.data?.error || "Failed to fetch questions")
                return
            }
            setError("Failed to fetch questions");
        } finally {
            setLoading(false);
        }
    }, [roomData]);
    useEffect(() => {
        fetchQuestions();        
    }, [fetchQuestions]);

    if (loading) {
        return (
            <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div> 
        )
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center"><p className="text-(--text-secondary) text-sm!">An error occurred while fetching questions.</p><button className="text-(--text-secondary) text-sm cursor-pointer hover:underline" onClick={() => {setError(null); fetchQuestions(); }}>Try again</button></div> 
        )
    }

    return (
        <div className="flex flex-col flex-1 mt-4 bg-(--bg-light) border border-(--border) rounded">
            <div className="flex flex-1 overflow-y-auto">
                {!selectedQuestion && <QuestionsCard questions={questions} setSelectedQuestion={setSelectedQuestion}/>}
                {selectedQuestion && !isSolving && <QuestionViewer question={selectedQuestion} onClick={() => {setSelectedQuestion(null)}} setIsSolving={setIsSolving}/>}
                {selectedQuestion && isSolving && <SolvingUI question={selectedQuestion} setIsSolving={setIsSolving}/>}
            </div>
        </div>
    )
}

function QuestionTabletUI(){
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const {room: roomData} = useRoom();
    const fetchQuestions = useCallback(async () => {
                try {
                    if (!roomData) return;
                    setLoading(true);
                    const response = await api.get<Question[]>(`/api/rooms/${roomData.id}/questions`);
                    setQuestions(response.data?.questions);
                } catch (error) {
                    if (isAxiosError(error)) {
                        setError(error.response?.data?.error || "Failed to fetch questions")
                        return
                    }
                    setError("Failed to fetch questions");
                } finally {
                    setLoading(false);
                }
            }, [roomData]);
    useEffect(() => {
            fetchQuestions();        
    }, [fetchQuestions]);

    if (loading) {
        return (
            <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div> 
        )
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center"><p className="text-(--text-secondary) text-sm!">An error occurred while fetching questions.</p><button className="text-(--text-secondary) text-sm cursor-pointer hover:underline" onClick={() => {setError(null); fetchQuestions(); }}>Try again</button></div> 
        )
    }

    return (
        <div className="flex flex-1 mt-4 bg-(--bg-light) border border-(--border) rounded">
            <div className="flex-1 overflow-y-auto">
                {!selectedQuestion && <QuestionsCard questions={questions} setSelectedQuestion={setSelectedQuestion}/>}
                {selectedQuestion && 
                <ResizablePanelGroup orientation="horizontal">
                    <ResizablePanel defaultSize={50}>
                        <QuestionViewer question={selectedQuestion} onClick={() => {setSelectedQuestion(null)}}/>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                        <SolvingUI question={selectedQuestion} />
                    </ResizablePanel>
                </ResizablePanelGroup>}
            </div>
        </div>
    )
}

function QuestionDesktopUI(){
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const {room: roomData} = useRoom();
    const fetchQuestions = useCallback(async () => {
        if (!roomData) return;
                try {
                    setLoading(true);
                    const response = await api.get<Question[]>(`/api/rooms/${roomData.id}/questions`);
                    setQuestions(response.data?.questions);
                } catch (error) {
                    if (isAxiosError(error)) {
                        setError(error.response?.data?.error || "Failed to fetch questions")
                        return
                    }
                    setError("Failed to fetch questions");
                } finally {
                    setLoading(false);
                }
            }, [roomData]);
    useEffect(() => {
            fetchQuestions();        
    }, [fetchQuestions]);

    if (loading) {
        return (
            <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div> 
        )
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center"><p className="text-(--text-secondary) text-sm!">An error occurred while fetching questions.</p><button className="text-(--text-secondary) text-sm cursor-pointer hover:underline" onClick={() => {setError(null); fetchQuestions(); }}>Try again</button></div> 
        )
    }
    return (
        <div className="flex flex-1 mt-4 bg-(--bg-light) border border-(--border) rounded">
            <div className="flex-1 overflow-y-auto">
                {!selectedQuestion && <QuestionsCard questions={questions} setSelectedQuestion={setSelectedQuestion}/>}
                {selectedQuestion && 
                <ResizablePanelGroup orientation="horizontal">
                    <ResizablePanel defaultSize={50}>
                        <QuestionViewer question={selectedQuestion} onClick={() => {setSelectedQuestion(null)}}/>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                        <SolvingUI question={selectedQuestion} />
                    </ResizablePanel>
                </ResizablePanelGroup>}
            </div>
        </div>
    )
}

function QuestionsCard({questions, setSelectedQuestion}: {questions: Question[], setSelectedQuestion: (question: Question | null) => void}){
    return (
        <>
        <div className="p-6">
            <h4 className="text-xl!">Questions</h4>
            <div className="flex flex-col gap-2 my-6">
                {questions.length === 0 ? <p>No questions to solve here</p> : questions.map((question) => (
                    <div key={question.id} className="flex items-center gap-2 bg-(--bg-muted)/80 border-(--border) border rounded-lg px-4 py-2">
                        {question.type == "code"? <div className="p-2 bg-(--bg-light) text-(--text-secondary)/70 rounded-lg"><FileCode /> </div>: <div className="p-2 bg-(--bg-light) text-(--text-secondary)/70 rounded-lg"><TextIcon /></div>}
                        <div className="flex flex-col gap-1">
                            <h5>{question.title}</h5>
                            <p className="text-(--text-secondary) text-sm! line-clamp-2">{question.description}</p>
                        </div>
                        <button onClick={() => setSelectedQuestion(question)} className="cursor-pointer ml-auto px-2 py-1 rounded-lg bg-(--bg-cta)">View</button>
                    </div>
                ))}
            </div>
        </div>
        </>
    )
}

function QuestionViewer({question, onClick, setIsSolving}: {question:Question, onClick: () => void, setIsSolving?: (isSolving: boolean) => void}){
    return (
        <div className="p-6">
            <button onClick={onClick} className="flex items-center gap-1 my-4 text-(--text-secondary) group cursor-pointer hover:text-text duration-300"><ArrowLeft className="group-hover:-translate-x-1 duration-300" width={20} height={20}/> Back</button>
            <div className="mt-6">
                <h4>{question.title}</h4>
                <p className="text-(--text-secondary) text-sm! mt-2">{question.description}</p>
                {setIsSolving && <button onClick={() => setIsSolving(true)} className="cursor-pointer px-2 py-1 rounded-lg bg-(--bg-cta) mt-4">Solve Question</button>}
            </div>
        </div>
    )
}

function UserVideo({stream, id, online}: {stream: MediaStream, id: string, online: boolean}){
    const videoRef = useRef<HTMLVideoElement>(null)
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream
        }
    }, [stream])

    return (
        <div className="relative flex w-full h-full max-h-1/2 max-w-[750px]">
            <div className="relative w-full h-full">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover rounded-lg" />
                <div className={cn("absolute top-2 right-2", !online && "hidden")}>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
            </div>
            <div className="absolute bottom-2 left-2 bg-(--bg-muted) px-2 py-1 rounded-lg">
                <UserInline id={id} />
            </div>
        </div>
    )
}