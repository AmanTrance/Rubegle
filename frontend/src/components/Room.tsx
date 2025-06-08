import { useEffect, useRef } from "react";
import Image from "../../public/icon.jpg";
import {
  Location,
  NavigateFunction,
  useLocation,
  useNavigate,
} from "react-router-dom";

function Room({ wsClient }: { wsClient: WebSocket }) {
  let remoteID: string | null = null;
  const navigate: NavigateFunction = useNavigate();
  const location: Location = useLocation();
  const localStream = useRef<HTMLVideoElement | null>(null);
  const remoteStream = useRef<HTMLVideoElement | null>(null);
  const connection: RTCPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302"
      },
      {
        urls: "turn:turn.speed.cloudflare.com:50000",
        username: "923162bb88b43718b308b5e067b2302ada919014b5248bfb76d159a14812f8ecc5711820826b2ebde62d795331849a2b3846b11bc84fa12107fa758364aaefe8",
        credential: "aba9b169546eb6dcc7bfb1cdf34544cf95b5161d602e3b5fa7c8342b2e9802fb",
      }
    ]
  });

  useEffect(() => {    
    connection.ontrack = async (event: RTCTrackEvent) => {
      if (remoteStream.current) {
        console.log(event.streams.length);
        remoteStream.current.srcObject = event.streams.length > 0 ? event.streams[0] : null;
      }
    };

    connection.onnegotiationneeded = async () => {
      const sdp: RTCSessionDescriptionInit = await connection.createOffer();
      await connection.setLocalDescription(sdp);

      wsClient.send(
        JSON.stringify(
          {
            "type": "send",
            "to": remoteID,
            "data": {
              type: "offer",
              sdp
            }
          }
        )
      );
    };

    connection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        wsClient.send(
          JSON.stringify(
            {
              "type": "send",
              "to": remoteID,
              "data": { 
                type: "ice",
                ice: event.candidate.toJSON() 
              }
            }
          )
        );
      }
    };

    wsClient.onmessage = async (event: MessageEvent) => {
      const message: any = JSON.parse(event.data);
      switch (message["type"]) {
        case "start": {
          remoteID = message["remote_id"];

          const sdp: RTCSessionDescriptionInit = await connection.createOffer();
          await connection.setLocalDescription(sdp);

          wsClient.send(
            JSON.stringify(
              {
                "type": "send",
                "to": message["remote_id"],
                "data": {
                  type: "offer",
                  remote_id: message["local_id"],
                  sdp
                }
              }
            )
          );

          break;
        }

        case "ice": {
          await connection.addIceCandidate(new RTCIceCandidate(message["ice"]));
          
          break;
        }

        case "offer": {
          if (!remoteID) {
            remoteID = message["remote_id"];
          }

          await connection.setRemoteDescription(new RTCSessionDescription(message["sdp"]));

          const sdp: RTCSessionDescriptionInit = await connection.createAnswer();
          await connection.setLocalDescription(sdp);

          wsClient.send(
            JSON.stringify(
              {
                "type": "send",
                "to": remoteID,
                "data": {
                  type: "answer",
                  sdp
                }
              }
            )
          );

          break;
        }

        case "answer": {
          await connection.setRemoteDescription(new RTCSessionDescription(message["sdp"]));

          break;
        }
      }
    }

    wsClient.send(
      JSON.stringify(
        {
          type: "initial"
        }
      )
    );

    return () => {
      wsClient.onmessage = null;
      connection.ontrack = null;
      connection.onicecandidate = null;
      connection.onnegotiationneeded = null;
      connection.close();
    };
  }, []);

  const handleVideo = async () => {
    const stream: MediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    for (const track of stream.getTracks()) {
      connection.addTrack(track, stream);
    }

    localStream.current!.srcObject = stream;
  };

  return (
    <div className="flex justify-center items-center h-full w-full">
      <img
        src={Image}
        className="h-80 w-72 fixed z-0 hidden lg:block mb-128"
      ></img>
      <button
        className="fixed  bg-purple-500 h-10 w-28 rounded-lg text-white font-medium cursor-pointer hover:bg-purple-700 transition-all duration-300 ease-in"
        onClick={handleVideo}
      >
        New Chat
      </button>
      <div className="grid lg:grid-cols-2 lg:grid-rows-1 grid-rows-2 grid-cols-1 bg-gray-800 h-full w-full">
        <div className="flex flex-col justify-center items-center bg-black">
          <div className="lg:w-3/4 lg:h-2/4 w-3/4 h-3/4 rounded-lg relative">
            <h2 className="text-green-50 font-bold md:text-2xl text-md z-20 absolute text-center w-full">
              {location.state.username}
            </h2>
            <video
              className="w-full h-full bg-gray-800 object-cover scale-x-[-1] rounded-lg z-10"
              autoPlay
              ref={localStream}
              muted={true}
            ></video>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center bg-black">
          <div className="lg:w-3/4 lg:h-2/4 w-3/4 h-3/4 rounded-lg relative">
            <h2 className="text-green-50 font-bold md:text-2xl text-md z-20 absolute text-center w-full">
              {"remote"}
            </h2>
            <video
              className="w-full h-full bg-gray-800 object-cover scale-x-[-1] rounded-lg z-10"
              autoPlay
              ref={remoteStream}
            ></video>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Room;
