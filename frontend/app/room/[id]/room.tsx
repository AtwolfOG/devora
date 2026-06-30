import customToast from "@/components/customToast";

export class Room {
  isOwner: boolean;
  roomId: string;
  accessToken: string;
  socket: WebSocket | null;
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteVideo: HTMLVideoElement | null;
  localVideo: HTMLVideoElement | null;
  onEndCall?: () => void;
  onUserStatusChange?: (status: "online" | "offline") => void;
  onUserLeft?: () => void;
    constructor(isOwner: boolean, roomId: string, accessToken: string){
        if (!roomId || !accessToken) throw new Error("Room ID and access token are required");
        this.isOwner = isOwner;
        this.roomId = roomId;
        this.accessToken = accessToken;
        this.remoteVideo = null;
        this.localVideo = null;
        this.socket = null;
        this.peerConnection = null;
        this.localStream = null;
    }

    async joinCall(){
        if (this?.peerConnection) return;
        if (!this?.socket) return;
        if (this.socket.readyState !== WebSocket.OPEN) return;
        if (this.peerConnection?.connectionState === "connected" || this.peerConnection?.connectionState === "connecting") return;

        await this.getMediaStream();

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
        // handle remote stream
        this.peerConnection.ontrack = (event) => {
          try {
            const [stream] = event.streams;
            this.remoteVideo!.srcObject = stream;
          } catch (error) {
            customToast.error("Error getting media stream:", ()=> this.reset());
          }
        };
    }

    async leaveCall(){
        this.#endCall();
        this.#sendMessage("leave", {})
    }

    async endCall(){
        if (!this.isOwner) return;
        this.#endCall();
        this.#sendMessage("end", {})
    }

    async startCall(){
        if (!this.isOwner) return;
        this.#sendMessage("start", {})
    }

    set remoteVideo(video: HTMLVideoElement){
        this.remoteVideo = video;
    }

    set localVideo(video: HTMLVideoElement){
        this.localVideo = video;
    }

    get remoteVideo(){
      if (!this.remoteVideo) throw new Error("Remote video element is not set");
        return this.remoteVideo;
    }

    get localVideo(){
      if (!this.localVideo) throw new Error("Local video element is not set");
        return this.localVideo;
    }

    async #handleOffer(offer: any){
        await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await this.peerConnection?.createAnswer()
        await this.peerConnection?.setLocalDescription(answer)
        this.#sendMessage("answer", answer)
    }

    async #handleAnswer(answer: any){
        await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(answer))
    }

    async #handleIceCandidate(candidate: any){
        await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate))
    }

    async getMediaStream(){
        if (this.localStream) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            this.localStream = stream;
            // set the local video src object
            this.localVideo!.srcObject = stream;
        } catch (error) {
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
        this.onUserStatusChange?.(status);
    }

    #handleUserLeft(){
      this.peerConnection?.close();
      this.onUserLeft?.();
    }

    async joinSocket(){
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;
        const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL! + "?roomId=" + this.roomId);
        this.socket = socket;
        socket.onopen = () => {
            this.#sendMessage("join", {
                is_owner: this.isOwner,
                access_token: this.accessToken
            })
        }

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case "joined":
                case "started":
                    this.joinCall();
                    break;
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
                default:
                    break;
            }
        }
    }

    async #sendMessage(type: string, payload: any){
        if (!this.socket) return;
        if (this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({
            type,
            payload
        }))
    }

    reset(){
        this.peerConnection?.close();
        this.localStream?.getTracks().forEach((track) => track.stop());
        this.remoteVideo!.srcObject = null;
        this.localVideo!.srcObject = null;
        this.socket?.close();
        this.peerConnection = null;
        this.localStream = null;
        this.remoteVideo = null;
        this.localVideo = null;
    }

}
