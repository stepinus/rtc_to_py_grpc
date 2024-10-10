import { useState, useEffect } from 'react';
import useAudioRecorder from './modules/audioRecorder';
import useAnimation from './modules/animation';

function App() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const wsUrl = 'ws://localhost:8080/websocket';
    const ws = new WebSocket(wsUrl);
    setWs(ws);

    ws.onmessage = (event) => {
      if (event.data.startsWith('answer')) {
        const answer = JSON.parse(event.data.split(' ')[1]);
        peerConnection.setRemoteDescription(answer);
      }
    };

    ws.onopen = () => {
      console.log('WebSocket соединение установлено');
      const pc = new RTCPeerConnection();
      setPeerConnection(pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws.send(JSON.stringify(event.candidate));
        }
      };

      pc.ontrack = (event) => {
        console.log('Track added:', event.track);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state change:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected') {
          alert('WebRTC соединение установлено');
        } else if (pc.iceConnectionState === 'failed') {
          alert('WebRTC соединение оборвалось');
        }
      };

      pc.onerror = (error) => {
        console.log('WebRTC error:', error);
        alert('Ошибка WebRTC соединения');
      };

      return () => {
        pc.close();
      };
    };

    ws.onerror = (error) => {
      console.log('WebSocket error:', error);
      alert('Ошибка WebSocket соединения');
    };

    ws.onclose = () => {
      console.log('WebSocket соединение закрыто');
    };
  }, []);

  const createOffer = async () => {
    if (peerConnection) {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        ws.send('offer ' + JSON.stringify(offer));
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    } else {
      console.error('Peer connection is not initialized');
    }
  };

  const connectWebSocket = () => {
    console.log('Connecting to WebSocket...');
    if (ws !== null) {
      console.log('WebSocket connection already exists');

    } else {
      return ws;
    }
  };

  const { startRecording, stopRecording, createAudioContext } = useAudioRecorder();
  const { createAnimation } = useAnimation();

  const startStreaming = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setStream(stream);
    setIsStreaming(true);

    const { context, analyser } = await createAudioContext(stream);
    setAudioContext(context);

    await startRecording();
    await createOffer();

    createAnimation(analyser);
  };

  const stopStreaming = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
    if (audioContext) {
      await stopRecording();
      setAudioContext(null);
    }
  };

  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={startStreaming} disabled={isStreaming}>
          Старт
        </button>
        <button onClick={stopStreaming} disabled={!isStreaming}>
          Стоп
        </button>
        <canvas id="canvas" width="400" height="200"></canvas>
      </div>
    </>
  );
}

export default App;
