import { useEffect, useRef, useState } from "react";
import { ws } from "../main";
import Image from "../../public/icon.jpg";
import { Location, NavigateFunction, useLocation, useNavigate } from "react-router-dom";

function Room() {
    const navigate: NavigateFunction = useNavigate();
    const location: Location = useLocation();
    const [offer, setOffer] = useState<boolean>(false);
    const [ans, setAns] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [userName, _] = useState<string | null>(location.state.username);
    const [remoteUserName, setRemoteUserName] = useState<string | null>(null);
    const localStream = useRef<HTMLVideoElement>(null);
    const remoteStream = useRef<HTMLVideoElement>(null);
    let rtpSender: RTCRtpSender | null = null;
    const connection: RTCPeerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: ["stun:stun2.l.google.com:19302"] }
        ]
    });

    useEffect(() => {
        if (success === false) {
            return;
        }
        navigator.mediaDevices.getUserMedia({ video: true, audio: {
            echoCancellation: true
        } }).then((stream) => {
            stream.getTracks().forEach((track) => {
              rtpSender = connection.addTrack(track, stream);
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
        if (typeof message.message !== "number" || typeof message.message !== "string") {
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
                if (connection.remoteDescription === null) return;
                connection.addIceCandidate(message.message.ice).then(() => console.log("ICE added")).catch((e) => console.log("ICE not added", e));
            }
            if (message.message?.type === "sdp" && message.message?.id !== window.sessionStorage.getItem("id")) {
                if (remoteUserName === null) {
                    setRemoteUserName(message.message.username);
                }
                if (message.message.sdp?.type === "offer") {
                    connection.setRemoteDescription(message.message.sdp).then(() => {
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
                                        sdp: sdp,
                                        username: userName
                                    })
                                }));
                                if (ans === false && offer === false) {
                                    setAns(true);
                                    ws.send(JSON.stringify({
                                        command: "message",
                                        identifier: JSON.stringify({
                                            channel: "SignalChannel"
                                        }),
                                        data: JSON.stringify({
                                            action: "success",
                                            roomId: window.sessionStorage.getItem("roomId"),
                                            id: window.sessionStorage.getItem("id"),
                                        })
                                    }));
                                    setSuccess(true);   
                                }
                            })
                        })
                    }).catch((e) => console.log(e));
                } else if (message.message.sdp?.type === "answer") {
                    connection.setRemoteDescription(message.message.sdp).then(() => {
                        console.log("connection initiated");
                    }).catch((e) => console.log(e));
                }
            }
            if (message.message?.type === "disconnect" && connection.signalingState !== "closed") {
                if (remoteStream.current !== null) {
                    remoteStream.current.srcObject = null;
                }
                if (rtpSender !== null) {
                    connection.removeTrack(rtpSender);
                }
                connection.close();
                navigate("/");
            }
        }
    }

    connection.onnegotiationneeded = async () => {
        if (success === true) {
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
                    sdp: sdp,
                    username: userName
                })
            }));
        } else {
            return;
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
                    sdp: sdp,
                    username: userName
                })
            }));
        }

        handleOffer();

    }, [offer]);

    const handleMigration = () => {
        ws.send(JSON.stringify({
            command: "message",
            identifier: JSON.stringify({
                channel: "SignalChannel"
            }),
            data: JSON.stringify({
                action: "disconnect",
                roomId: window.sessionStorage.getItem("roomId")
            })
        }));
        if (rtpSender !== null) {
            connection.removeTrack(rtpSender);
        }
        connection.close();
        navigate("/");
    }

  return (
    <div className="flex justify-center items-center h-full w-full">
        <img src={Image} className="h-80 w-72 fixed z-0 hidden lg:block mb-128"></img>
        <button className="fixed  bg-purple-500 h-10 w-28 rounded-lg text-white font-medium cursor-pointer hover:bg-purple-700 transition-all duration-300 ease-in" onClick={handleMigration}>New Chat</button>
        <div className="grid lg:grid-cols-2 lg:grid-rows-1 grid-rows-2 grid-cols-1 bg-gray-800 h-full w-full">
            <div className="flex flex-col justify-center items-center bg-black">
                <div className="lg:w-3/4 lg:h-2/4 w-3/4 h-3/4 rounded-lg relative">
                    <h2 className="text-green-50 font-bold md:text-2xl text-md z-20 absolute text-center w-full">{userName}</h2>
                    <video className="w-full h-full bg-gray-800 object-cover scale-x-[-1] rounded-lg z-10" autoPlay ref={localStream} muted={true}></video>
                </div>
            </div>
            <div className="flex flex-col justify-center items-center bg-black">
                <div className="lg:w-3/4 lg:h-2/4 w-3/4 h-3/4 rounded-lg relative">
                    <h2 className="text-green-50 font-bold md:text-2xl text-md z-20 absolute text-center w-full">{remoteUserName}</h2>
                    <video className="w-full h-full bg-gray-800 object-cover scale-x-[-1] rounded-lg z-10" autoPlay ref={remoteStream}></video>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Room