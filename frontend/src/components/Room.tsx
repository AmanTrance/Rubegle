import { useEffect, useRef, useState } from "react";
import { ws } from "../main";
import Image from "../../public/icon.jpg";

function Room() {
    const [offer, setOffer] = useState<boolean>(false);
    const [ans, setAns] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const localStream = useRef<HTMLVideoElement>(null);
    const remoteStream = useRef<HTMLVideoElement>(null);
    const connection: RTCPeerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: ["stun:stun2.l.google.com:19302"] }
        ]
    });

    useEffect(() => {
        if (success === false) return;
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            stream.getTracks().forEach((track) => {
              connection.addTrack(track, stream);
            });
            if (localStream.current !== null) {
              localStream.current.srcObject = stream;
            }  
          });
    }, [success]);

    connection.ontrack = (event: RTCTrackEvent) => {
        if (remoteStream.current !== null) {
            remoteStream.current.srcObject = event.streams[0];
        }
    }

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
            if (message.message?.type === "success" && message.message?.id !== window.sessionStorage.getItem("id")) {
                if (success === false) {
                    setSuccess(true);
                } else {
                    return;
                }
            }
            if (message.message?.type === "ice" && message.message?.id !== window.sessionStorage.getItem("id")) {
                connection.addIceCandidate(message.message.ice).then(() => console.log("ICE added")).catch((e) => console.log("ICE not added", e));
            }
            if (message.message?.type === "sdp" && message.message?.id !== window.sessionStorage.getItem("id")) {
                connection.setRemoteDescription(message.message.sdp).then(() => {
                    if (offer === false) {
                        if (ans === false) {
                            setAns(true);
                        }
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
                                ws.send(JSON.stringify({
                                    command: "message",
                                    identifier: JSON.stringify({
                                        channel: "SignalChannel"
                                    }),
                                    data: JSON.stringify({
                                        action: "success",
                                        roomId: window.sessionStorage.getItem("roomId"),
                                        id: window.sessionStorage.getItem("id")
                                    })
                                }));
                                if (success === false) {
                                    setSuccess(true);
                                }
                            })
                        })
                    }
                }).catch((e) => console.log("Remote SDP not added", e));
            }
        }
    }

    connection.onnegotiationneeded = async () => {
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
        } 
        else if (ans === true) {
            const sdp: RTCSessionDescriptionInit = await connection.createAnswer();
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
    }

    connection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
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
    <div className="flex justify-center items-center h-full w-full">
        <img src={Image} className="h-96 lg:w-72 w-96 fixed"></img>
        <div className="grid lg:grid-cols-2 lg:grid-rows-1 grid-rows-2 grid-cols-1 bg-gray-800 h-full w-full">
            <div className="flex justify-center items-center bg-black">
                <video className="lg:w-3/4 lg:h-2/4 w-3/4 h-3/4 bg-gray-800 object-cover scale-x-[-1] rounded-lg" autoPlay ref={localStream}></video>
            </div>
            <div className="flex justify-center items-center bg-black">
                <video className="lg:w-3/4 lg:h-2/4 w-3/4 h-3/4 bg-gray-800 object-cover scale-x-[-1] rounded-lg" autoPlay ref={remoteStream}></video>
            </div>
        </div>
    </div>
  )
}

export default Room