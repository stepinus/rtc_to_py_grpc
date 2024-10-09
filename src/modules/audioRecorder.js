import { useState } from 'react';

const useAudioRecorder = () => {
  const [audioContext, setAudioContext] = useState(null);
  const [stream, setStream] = useState(null);

  const createAudioContext = async (stream) => {
    try {
      if (!(stream instanceof MediaStream)) {
        console.error('Error creating audio context: stream is not a MediaStream');
        return;
      }

      const context = new AudioContext();
      setAudioContext(context);
      const source = context.createMediaStreamSource(stream);
      const gainNode = context.createGain();
      const analyser = context.createAnalyser();

      source.connect(gainNode);
      gainNode.connect(analyser);

      gainNode.gain.value = 1;

      return { context, analyser };
    } catch (error) {
      console.error('Error creating audio context:', error);
    }
  };

  const startRecording = async () => {
    try {
      // start recording logic here
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (audioContext) {
        audioContext.close();
        setAudioContext(null);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  return { startRecording, stopRecording, createAudioContext };
};

export default useAudioRecorder;
