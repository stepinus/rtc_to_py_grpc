import { useState } from 'react';
import useWebRTCConnection from './modules/webrtcConnection';
import useAudioRecorder from './modules/audioRecorder';
import useAnimation from './modules/animation';

function App() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState(null);
  const [audioContext, setAudioContext] = useState(null);

  const { createOffer, sendOffer } = useWebRTCConnection();
  const { startRecording, stopRecording, createAudioContext } = useAudioRecorder();
  const { createAnimation } = useAnimation();

  const startStreaming = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setStream(stream);
    setIsStreaming(true);

    const { context, analyser } = await createAudioContext(stream);
    setAudioContext(context);

    await startRecording();

    const offer = await createOffer();
    await sendOffer(offer);

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
