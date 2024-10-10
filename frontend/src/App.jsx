import { useState } from 'react';
import useAudioRecorder from './modules/audioRecorder';
import AnimationVoice from './modules/AnimationVoice';
import useWebRTC from './modules/useWebRTC';

function App() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAudioAnalyser] = useState(null);

  const { startRecording, stopRecording, createAudioContext } = useAudioRecorder();

  const { connect, isConnected, isLoading, close } = useWebRTC({ offerURL: 'http://0.0.0.0:8080/offer', iceURL: 'http://0.0.0.0:8080/ice-candidate' });

  const handleStart = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setStream(stream);
    setIsStreaming(true);

    const { context, analyser } = await createAudioContext(stream);
    setAudioContext(context);
    setAudioAnalyser(analyser);

    await startRecording();

    connect(stream).then(() => console.log('Connected to WebRTC peer')).catch((e) => console.error('Error connecting to WebRTC peer:', e));
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
    if (audioContext) {
      stopRecording();
      setAudioContext(null);
    }
    close();
  };

  return (
    <>
    <AnimationVoice isConnected={isConnected} analyser={analyser || null} />
      <h1>webRTC + React</h1>
      <div className="card">
        <button onClick={handleStart} disabled={isStreaming}>
          Старт
        </button>
        <button onClick={handleClose} disabled={!isStreaming || !isConnected}>
          Стоп
        </button>
        <canvas id="canvas" width="400" height="200"></canvas>
        {isLoading ? (
          <p>Подключение...</p>
        ) : isConnected ? (
          <p>Подключено к WebRTC peer</p>
        ) : (
          <p></p>
        )}
      </div>
    </>
  );
}

export default App;
