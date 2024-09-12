import { useEffect, useRef, useState } from "react";
import { ws } from "../main";

function Room() {
    const [offer, setOffer] = useState<boolean>(false);
    const localStream = useRef<HTMLVideoElement>(null);
    const remoteStream = useRef<HTMLVideoElement>(null);
    const connection: RTCPeerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: ["stun:stun2.l.google.com:19302"] }
        ]
    });

    useEffect(() => {
        const handleMedia = async () => {
            const stream: MediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            stream.getTracks().forEach((track) => {
                connection.addTrack(track, stream);
            });
            if (localStream.current !== null) {
                localStream.current.srcObject = stream; 
            }
        }
        handleMedia();
    }, []);

    ws.onmessage = (e: MessageEvent) => {
        const message = JSON.parse(e.data);
        if (typeof message.message !== "number") {
            if (message.message?.type === "roomId") {
                window.sessionStorage.setItem("roomId", message.message.roomId);
            }
            if (message.message?.type === "send") {
                setTimeout(function(){
                    setOffer(true);
                }, 10000);
            }
            if (message.message?.type === "ice" && message.message?.id !== window.sessionStorage.getItem("id")) {
                connection.addIceCandidate(message.message.ice).then(() => console.log("ICE added")).catch((e) => console.log("ICE not added", e));
                console.log(message.message.ice);
            }
            if (message.message?.type === "sdp" && message.message?.id !== window.sessionStorage.getItem("id")) {
                connection.setRemoteDescription(message.message.sdp).then(() => {
                    if (offer === false) {
                        connection.createAnswer().then((sdp) => {
                            connection.setLocalDescription(sdp).then(() => {
                                ws.send(JSON.stringify({
                                    command: "message",
                                    identifier: JSON.stringify({
                                        channel: "SignalChannel"
                                    }),
                                    data: JSON.stringify({
                                        action: "exchangeSdp",
                                        roomId: window.sessionStorage.getItem("roomId"),
                                        id: window.sessionStorage.getItem("id"),
                                        sdp: sdp
                                    })
                                }));
                            })
                        })
                    }
                }).catch((e) => console.log("Remote SDP not added", e));
            }
        }
    }

    connection.onnegotiationneeded = async (_: Event) => {
        if (offer === true) {
            const sdp: RTCSessionDescriptionInit = await connection.createOffer();
            await connection.setLocalDescription(sdp);
            ws.send(JSON.stringify({
                command: "message",
                identifier: JSON.stringify({
                    channel: "SignalChannel"
                }),
                data: JSON.stringify({
                    action: "exchangeSdp",
                    roomId: window.sessionStorage.getItem("roomId"),
                    id: window.sessionStorage.getItem("id"),
                    sdp: sdp
                })
            }));    
        } else {
            const sdp: RTCSessionDescriptionInit = await connection.createOffer();
            await connection.setLocalDescription(sdp);
        }
    }

    connection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (offer === false) {
            return;
        } else {
            ws.send(JSON.stringify({
                command: "message",
                identifier: JSON.stringify({
                    channel: "SignalChannel"
                }),
                data: JSON.stringify({
                    action: "exchangeIce",
                    roomId: window.sessionStorage.getItem("roomId"),
                    id: window.sessionStorage.getItem("id"),
                    ice: event.candidate
                })
            }));
        }
    }

    connection.ontrack = (event: RTCTrackEvent) => {
        console.log(event.streams);
        if (remoteStream.current !== null) {
            console.log(event.streams);
            remoteStream.current.srcObject = event.streams[0];
        }
    }

    useEffect(() => {
        const handleOffer = async () => {
            if (offer === false) {
                return;
            }
            const sdp: RTCSessionDescriptionInit = await connection.createOffer();
            await connection.setLocalDescription(sdp);
            ws.send(JSON.stringify({
                command: "message",
                identifier: JSON.stringify({
                    channel: "SignalChannel"
                }),
                data: JSON.stringify({
                    action: "exchangeSdp",
                    roomId: window.sessionStorage.getItem("roomId"),
                    id: window.sessionStorage.getItem("id"),
                    sdp: sdp
                })
            }));
        }

        handleOffer();

    }, [offer]);


  return (
    <div className="grid grid-cols-2 bg-gray-800 h-full w-full">
        <div className="flex justify-center items-center bg-black">
            <video className="w-3/4 h-2/4 bg-gray-800 object-cover scale-x-[-1]" autoPlay ref={localStream}></video>
        </div>
        <div className="flex justify-center items-center bg-black">
            <video className="w-3/4 h-2/4 bg-gray-800 object-cover scale-x-[-1]" autoPlay ref={remoteStream}></video>
        </div>
    </div>
  )
}

export default Room