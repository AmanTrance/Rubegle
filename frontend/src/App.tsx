import { Route, Routes } from "react-router-dom";
import Room from "./components/Room";
import Home from "./components/Home";

function App() {
  const wsClient: WebSocket = new WebSocket("ws://192.168.1.6:5000");

  wsClient.onopen = () => {
    console.log("## WEBSOCKET CONNECTED ##");
  };

  wsClient.onclose = () => {
    console.log("## WEBSOCKET CLOSED ##");
  }

  return (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room" element={<Room wsClient={wsClient} />} />
    </Routes>
  );
}

export default App;
