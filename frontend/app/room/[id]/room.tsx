
export class Room {
    constructor(isOwner: boolean, roomId: string, accessToken: string){
        if ()
        this.isOwner = isOwner;
        this.roomId = roomId;
        this.accessToken = accessToken;
        this.state = {
            started: false,
            ended: false
        }
        
    }

    async joinCall(){
        if (this?.peerConnection) return;
        if (!this?.socket) return;
        const pc = new RTCPeerConnection();
        this.peerConnection = pc;
        this.peerConnection.ontrack = (event) => {
            const [stream] = event.streams;
            this.remoteVideo.srcObject = stream;
        };
    }

    async joinSocket(){
        const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL! + "?roomId=" + this.roomId);
        this.socket = socket;
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: "join",
                payload: {
                    is_owner: this.isOwner,
                    access_token: this.accessToken
                }
            }))
            if (this.isOwner){
                socket.send(JSON.stringify({
                    type: "start",
                }))
            }
        }

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case "state":
                    const state = message.payload;
                    const started = state.started ?? this.state.started;
                    const ended = state.ended ?? this.state.ended;
                    this.state = {started, ended};
                    break;
                  case "joined":

                case "started":
                  if (this.state.started){
                    return
                  }
                  this.joinCall();
                    break;
                case "ended":
                    break;
            }
        }
    }
    
}