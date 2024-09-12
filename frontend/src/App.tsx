import { NavigateFunction, useNavigate } from "react-router-dom";
import { ws } from "./main";
import { v4 as uuid } from "uuid";

function App() {
  const navigate: NavigateFunction = useNavigate();

  const handleJoin = () => {
    const element: HTMLInputElement | null = document.getElementById("username") as HTMLInputElement;
    if (element !== null) {
      ws.send(JSON.stringify({
        command: "message",
        identifier: JSON.stringify({
          channel: "SignalChannel"
        }),
        data: JSON.stringify({
          action: "receive",
          username: element.value !== "" ? element.value : `user${uuid()}` 
        })
      }));
      navigate("/room");
    } else {
      return;
    }
  }

  return (
    <div className="flex justify-center items-center h-full w-full bg-gray-800">
      <div className="grid grid-rows-2 h-52 w-96 bg-slate-700 border-gray-50 border">
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
