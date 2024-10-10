import { useState } from 'react';
import useAudioRecorder from './modules/audioRecorder';
import useAnimation from './modules/animation';

function App() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState(null);
  const [audioContext, setAudioContext] = useState(null);

  const { startRecording, stopRecording, createAudioContext } = useAudioRecorder();
  const { createAnimation } = useAnimation();

  const startStreaming = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setStream(stream);
    setIsStreaming(true);

    const { context, analyser } = await createAudioContext(stream);
    setAudioContext(context);

    await startRecording();
    createAnimation(analyser);

    const pc = new RTCPeerConnection();
  
    // Add audio track to the peer connection
    stream.getAudioTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = event => {
      if (event.candidate) {
        // Send the ICE candidate to the server
        fetch('http://0.0.0.0:8080/ice-candidate', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(event.candidate)
        });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const response = await fetch('http://0.0.0.0:8080/offer', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({sdp: pc.localDescription.sdp, type: pc.localDescription.type})
    });
    const answer = await response.json();
    await pc.setRemoteDescription(answer);
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
      <h1>webRTC + React</h1>
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
