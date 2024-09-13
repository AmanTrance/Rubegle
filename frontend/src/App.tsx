import { NavigateFunction, useNavigate } from "react-router-dom";
import { ws } from "./main";
import { v4 as uuid } from "uuid";
import Image from "../public/icon.jpg"

function App() {
  const navigate: NavigateFunction = useNavigate();

  const handleJoin = () => {
    const tempName = uuid();
    const element: HTMLInputElement | null = document.getElementById("username") as HTMLInputElement;
    if (element !== null) {
      ws.send(JSON.stringify({
        command: "message",
        identifier: JSON.stringify({
          channel: "SignalChannel"
        }),
        data: JSON.stringify({
          action: "receive",
          username: element.value !== "" ? element.value : `user${tempName}` 
        })
      }));
      navigate("/room", { state: {
        username: element.value !== "" ? element.value : `user${tempName}` 
      } });
    } else {
      return;
    }
  }

  return (
    <div className="flex flex-col justify-center items-center h-full w-full bg-black">
      <img src={Image} className="sm:h-96 w-96 fixed sm:mb-128 mb-120 h-80"></img>
      <div className="grid grid-rows-2 h-52 sm:w-96 w-3/4 bg-gray-800 border-gray-50 border">
        <div className="flex flex-col items-center justify-end">
          <input id="username" className="p-2 h-2/4 w-3/4 rounded-lg font-bold outline-none text-lg focus:border-2 focus:border-blue-400" placeholder="Username"/>
        </div>
        <div className="flex flex-col justify-center items-center">
          <button className="bg-blue-600 w-2/4 font-bold text-white rounded-lg h-10 hover:bg-blue-400 hover:text-black transition-all duration-500 ease-in" onClick={handleJoin}>Join</button>
        </div>
      </div>
    </div>
  )
}

export default App
