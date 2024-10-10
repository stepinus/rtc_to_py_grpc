const useAnimation = () => {
  const createAnimation = async (analyser) => {
    try {
      if (!analyser) {
        console.error('Error creating animation: analyser is not defined');
        return;
      }

      const canvas = document.getElementById('canvas');
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
    } catch (error) {
      console.error('Error creating animation:', error);
    }
  };

  return { createAnimation };
};

export default useAnimation;
