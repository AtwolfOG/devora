import customToast from "@/components/customToast";
import { getAccessToken } from "@/lib/api";

export class Room {
  roomId: string;
  accessToken: string;
  socket: WebSocket | null;
  peerConnection: RTCPeerConnection | null;
  #localStream: MediaStream | null;
  #remoteStream: MediaStream | null;
  #emitOnlineTimeout: NodeJS.Timeout | null;
  #iceCandidate: Array<RTCIceCandidateInit> = [];
  #isProccessingIce: boolean = false;
  userStatus: "online" | "offline" = "offline";
  onEndCall?: () => void;
  onUserStatusChange?: (status: "online" | "offline") => void;
  onUserLeft?: () => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onLocalStream?: (stream: MediaStream) => void;
  #onLocalStream?: (stream: MediaStream) => void;
  #onRemoteStream?: (stream: MediaStream) => void;
  waitForJoinCall: Promise<void>;
    constructor(roomId: string, accesstoken: string){
        if (!roomId || !accesstoken) throw new Error("Room ID is required");
        this.roomId = roomId;
        this.accessToken = accesstoken;
        this.socket = null;
        this.peerConnection = null;
    }

    static async create(){
        try {
            if (typeof window === "undefined") return;
            const pns = window.location.pathname.split('/')
            const roomId = pns[pns.length - 1]
            const accessToken = await getAccessToken();
            if (!accessToken) throw new Error("Access token is required");
            const room = new Room(roomId, accessToken);
            room.joinSocket();
            return room;
        } catch {
            customToast.error("Error creating room", ()=> window && window.location.reload());
        }
    }

    async triggerCall(){
        if (!this.socket) return;
        if (this.socket.readyState !== WebSocket.OPEN) return;
        if (this.peerConnection && (this.peerConnection?.connectionState === "connected" && this.peerConnection?.connectionState === "connecting")) return;
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        await this.getMediaStream()

        const pc = new RTCPeerConnection( {
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302"
                }
            ]
        });
        this.peerConnection = pc;
        // add local stream to peer connection
        this.localStream?.getTracks().forEach((track) => {
            console.log("attaching local track")
            this.peerConnection?.addTrack(track, this.localStream!);
        });
        // create offer and send to other peer
        const offer = await this.peerConnection.createOffer()
        await this.peerConnection.setLocalDescription(offer)
        this.#sendMessage("offer", offer)
        // handle ice candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate){
                this.#sendMessage("ice_candidate", event.candidate)
            }
        }
        pc.onconnectionstatechange = () =>{
            console.log("peer connection state", pc.connectionState)
            if (pc.connectionState !== "connected" && pc.connectionState !== "connecting"){
                this.remoteStream = null;
            }
        }
        // handle remote stream
        this.peerConnection.ontrack = (event) => {
          try {
            console.log("remote track: ", event.track)
            const [stream] = event.streams;
            this.remoteStream = stream;
          } catch {
            customToast.error("Error getting media stream:", ()=> this.reset());
          }
        };
    }

    async joinCall(){

        this.waitForJoinCall = new Promise((async (resolve) => {
            if (!this.socket) return;
            if (this.socket.readyState !== WebSocket.OPEN) return;
            if (this.peerConnection && (this.peerConnection?.connectionState === "connected" && this.peerConnection?.connectionState === "connecting")) return;
            if (this.peerConnection) {
                this.peerConnection.close();
                this.peerConnection = null;
            }

            await this.getMediaStream()


            const pc = new RTCPeerConnection( {
                iceServers: [
                    {
                        urls: "stun:stun.l.google.com:19302"
                    }
                ]
            });
            this.peerConnection = pc;
            // add local stream to peer connection
            this.localStream?.getTracks().forEach((track) => {
            console.log("attaching local track")
                this.peerConnection?.addTrack(track, this.localStream!);
            });
            pc.onconnectionstatechange = () =>{
                console.log("peer connection state", pc.connectionState)
                if (pc.connectionState !== "connected" && pc.connectionState !== "connecting"){
                    this.remoteStream = null;
                }
            }
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate){
                    this.#sendMessage("ice_candidate", event.candidate)
                }
            }
            // handle remote stream
            this.peerConnection.ontrack = (event) => {
            try {
                console.log("remote track: ", event.track)
                const [stream] = event.streams;
                this.remoteStream = stream;
            } catch {
                customToast.error("Error getting media stream:", ()=> this.reset());
            }
            };
            resolve()
        }))
        await this.waitForJoinCall;

        this.waitForJoinCall = null;
    }

    set onLocalStream(callback: (stream: MediaStream) => void){
        this.#onLocalStream = callback;
        if (this.#localStream){
            callback(this.#localStream);
        }
    }

    set onRemoteStream(callback: (stream: MediaStream | null) => void){
        this.#onRemoteStream = callback;
        if (this.#remoteStream){
            callback(this.#remoteStream);
        }
    }

    get onLocalStream(){
        return this.#onLocalStream;
    }

    get onRemoteStream(){
        return this.#onRemoteStream;
    }

    set localStream(stream: MediaStream){
        this.#localStream = stream;
        this.onLocalStream?.(stream);
    }

    set remoteStream(stream: MediaStream | null){
        this.#remoteStream = stream;
        this.onRemoteStream?.(stream);
    }

    get localStream(){
        return this.#localStream;
    }

    get remoteStream(){
        return this.#remoteStream;
    }

    async leaveCall(){
        this.#endCall();
        this.#sendMessage("leave", {})
    }

    async endCall(){
        this.#endCall();
        this.#sendMessage("end", {})
    }

    async startCall(){
        this.#sendMessage("start", {})
    }

    async #handleOffer(offer: RTCSessionDescription){
        try{
            if (this.waitForJoinCall){
                await this.waitForJoinCall;
            }
            if (!this.peerConnection) return;
            if (!offer) return;
            // if (this.peerConnection.signalingState === "have-local-offer"){
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
                const answer = await this.peerConnection.createAnswer()
                await this.peerConnection.setLocalDescription(answer)
                this.#sendMessage("answer", answer)
                await this.#processIceCandidates()
                console.log("answer sent")
            // }
        }catch(err){
            console.error("failed to create answer: ", err)
        }
    }

    async #handleAnswer(answer: RTCSessionDescription){
        try{
            if (!this.peerConnection) return;
            if (!answer) return;
            if (this.peerConnection.signalingState === "have-local-offer"){
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
                await this.#processIceCandidates()
            }
        }catch (err) {
            console.error("failed to set remote description: ", err)
        }
    }

    async #handleIceCandidate(candidate: RTCIceCandidate){
        try{
            if (!this.peerConnection) return;
            if (this.peerConnection.connectionState == "connected") return;
            if (this.peerConnection.remoteDescription && 
                this.peerConnection.localDescription && 
                this.peerConnection.remoteDescription.type &&
                !this.#isProccessingIce
            ){
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            }else{
                console.log("adding ice candidate to queue: ", this.peerConnection.remoteDescription, this.peerConnection.localDescription, this.peerConnection.remoteDescription?.type)
                this.#iceCandidate.push(candidate)
            }
        }catch(err){
            console.error("failed to add ice candidate: ", err)
        }
    }
    async #processIceCandidates(){
        this.#isProccessingIce = true;
        while (this.#iceCandidate.length > 0){
            try{
                const candidate = this.#iceCandidate.shift();
                if (candidate){
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                }
            }catch(err){
                console.error("failed to add ice candidate: ", err)
            }
        }
        this.#isProccessingIce = false;
    }

    async getMediaStream(){
        if (this.localStream) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            this.localStream = stream;
        } catch {
            customToast.error("Error getting media stream:", ()=> this.reset());
        }
    }

    async muteAudio(){
        this.localStream?.getAudioTracks().forEach((track) => {
            track.enabled = false;
        });
    }

    async unmuteAudio(){
        this.localStream?.getAudioTracks().forEach((track) => {
            track.enabled = true;
        });
    }

    async muteVideo(){
        this.localStream?.getVideoTracks().forEach((track) => {
            track.enabled = false;
        });
    }

    async unmuteVideo(){
        this.localStream?.getVideoTracks().forEach((track) => {
            track.enabled = true;
        });
    }

    #endCall(){
        this.peerConnection?.close();
        this.localStream?.getTracks().forEach((track) => {
            track.stop();
        });
        this.socket?.close();
        this.onEndCall?.();
    }

    #handleUserStatusChange(status: "online" | "offline"){
        this.userStatus = status;
        this.onUserStatusChange?.(status);
    }

    #handleUserLeft(){
      this.peerConnection?.close();
      this.remoteStream = null;
      this.onUserLeft?.();
    }

    async joinSocket(){
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;
        const socket = new WebSocket(process.env.NEXT_PUBLIC_BACKEND_WS_URL + "ws/rooms/" + this.roomId + "/call");
        this.socket = socket;
        socket.onclose = () => {
            if (this.#emitOnlineTimeout) {
                clearInterval(this.#emitOnlineTimeout);
                this.#emitOnlineTimeout = null
            }
            customToast.error("Connection lost", ()=> this.reset(), Infinity);
        }
        socket.onopen = () => {
            this.#sendMessage("join", {
                access_token: this.accessToken
            })

            // send online tick message every 5 seconds
            if (this.#emitOnlineTimeout) {
                clearInterval(this.#emitOnlineTimeout);
                this.#emitOnlineTimeout = null
            }
            this.#emitOnlineTimeout = setInterval(() => {
                    this.#sendMessage("online", {})
            }, 5000)
        }

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("message received")
            console.log(message.type, message.payload)
            switch (message.type) {
                case "trigger":
                    this.triggerCall();
                    break;
                case "triggered":
                    this.joinCall();
                    break
                case "offer":
                    this.#handleOffer(message.payload)
                    break;
                case "answer":
                    this.#handleAnswer(message.payload)
                    break;
                case "ice_candidate":
                    this.#handleIceCandidate(message.payload)
                    break;
                case "ended":
                    this.#endCall();
                    break;
                case "user_left":
                    this.#handleUserLeft();
                    break;
                case "user_online":
                    this.#handleUserStatusChange("online");
                    break;
                case "user_offline":
                    this.#handleUserStatusChange("offline")
                    break;
                default:
                    break;
            }
        }
    }

    async #sendMessage(type: string, payload: unknown){
        if (!this.socket) return;
        if (this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({
            type,
            payload
        }))
    }

    async reset(){
        this.peerConnection?.close();
        this.peerConnection = null;
        this.localStream?.getTracks().forEach((track) => track.stop());
        this.socket?.close();
        this.socket = null;
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        await this.joinSocket();
    }

}

let room: Room | null = null;
let initializingRoom: Promise<Room> | null = null;

export async function initRoom(): Room {
    // if there is an ongoing room initialization, return it
    if (initializingRoom) return await initializingRoom;
    // if there is an existing room, return it
    if (room) return room;
    // create a new room initialization
    initializingRoom = (async () => {return await Room.create();})()
    // wait for the room to be initialized
    room = await initializingRoom
    // return the room
    return room;
}

export function getRoom(): Room {
    if (!room) throw new Error("Room not initialized");
    return room;
}
