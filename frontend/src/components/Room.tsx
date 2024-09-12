import { useEffect, useState } from "react";
import { ws } from "../main";

function Room() {
    const [offer, setOffer] = useState<boolean>(false);
    const [ans, setAns] = useState<boolean>(false);
    const connection: RTCPeerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun.l.google.com:5349" },
            { urls: "stun:stun1.l.google.com:3478" },
            { urls: "stun:stun1.l.google.com:5349" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:5349" },
            { urls: "stun:stun3.l.google.com:3478" },
            { urls: "stun:stun3.l.google.com:5349" },
            { urls: "stun:stun4.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:5349" }
        ]
    });

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

    ws.onmessage = (e: MessageEvent) => {
        const message = JSON.parse(e.data);
        if (typeof message.message !== "number") {
            if (message.message?.type === "roomId") {
                window.sessionStorage.setItem("roomId", message.message.roomId);
                console.log(message.message.roomId);
            }
            if (message.message?.type === "send") {
                setTimeout(() => {
                    setOffer(true);
                }, 10000);
            }
            if (message.message?.type === "ice" && message.message?.id !== window.sessionStorage.getItem("id")) {
                connection.addIceCandidate(message.message.ice).then(() => console.log("ICE added")).catch(() => console.log("ICE not added"));
                console.log(message.message.ice);
            }
            if (message.message?.type === "sdp" && message.message?.id !== window.sessionStorage.getItem("id")) {
                connection.setRemoteDescription(message.message.sdp).then(() => console.log("Remote SDP added")).catch(() => console.log("Remote SDP not added"));
                console.log(message.message.sdp);
                if (offer === false && ans === false) {
                    setAns(true);
                }
            }
        }
    }

    useEffect(() => {
        const handleOffer = async () => {
            if (offer === false) {
                return;
            }
            const sdp = await connection.createOffer();
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

    useEffect(() => {
        const handleAns = async () => {
            if (ans === false) {
                return;
            }
            const sdp = await connection.createAnswer();
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

        handleAns();

    }, [ans]);


  return (
    <div className="grid grid-cols-2 bg-gray-800 h-full w-full">
        <div className="flex justify-center items-center bg-purple-300">

        </div>
        <div className="flex justify-center items-center bg-purple-900">

        </div>
    </div>
  )
}

export default Room