import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Room from './components/Room.tsx';
import { v4 as uuidv4 } from 'uuid';

export const ws: WebSocket = new WebSocket("ws://192.168.1.7:3000/cable");

ws.onopen = () => {
    window.sessionStorage.setItem("id", uuidv4());
    ws.send(JSON.stringify({
      command: "subscribe",
      identifier: JSON.stringify({
        channel: "SignalChannel"
      })
    }));
  }

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App/>}/>
        <Route path="/room" element={<Room/>}/>
      </Routes>
    </BrowserRouter>
)
