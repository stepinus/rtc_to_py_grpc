import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const Animation = ({ isConnected, analyser }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isConnected || !analyser) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const animate = async () => {
      const audioData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(audioData);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      for (let i = 0; i < audioData.length; i++) {
        ctx.lineTo(i * canvas.width / audioData.length, canvas.height / 2 - audioData[i] * canvas.height / 256);
      }
      ctx.stroke();
      requestAnimationFrame(animate);
    };
    animate();
  }, [isConnected, analyser]);

  return (
    <div>
      <canvas ref={canvasRef} width="400" height="200"></canvas>
    </div>
  );
};

Animation.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  analyser: PropTypes.object.isRequired,
};

export default Animation;
