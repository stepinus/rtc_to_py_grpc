import { useState, useEffect } from 'react';

const useWebRTC = ({ offerURL, iceURL }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pc, setPc] = useState(null);

  useEffect(() => {
    setPc(new RTCPeerConnection());
  }, []);

  const connect = async (stream) => {
    setIsLoading(true);
    if (pc) {
      // Добавление аудио-трека к peer connection
      stream.getAudioTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Создание оффер
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Отправка оффер на сервер
      const response = await fetch(offerURL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({sdp: pc.localDescription.sdp, type: pc.localDescription.type})
      });

      // Получение ответа от сервера
      const answer = await response.json();
      await pc.setRemoteDescription(answer);

      // Обработка ICE кандидатов
      pc.onicecandidate = event => {
        if (event.candidate) {
          // Отправка ICE кандидата на сервер
          fetch(iceURL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(event.candidate)
          });
        }
      };

      // Обработка закрытия peer connection
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
          setIsLoading(false);
        } else if (pc.connectionState === 'closed') {
          setIsConnected(false);
          setIsLoading(false);
        }
      };

      // Обработка ошибок peer connection
      pc.onerror = event => {
        console.error('WebRTC error:', event);
        setIsLoading(false);
      };
    }
  };

  const close = () => {
    if (pc) {
      pc.close();
      setIsConnected(false);
      setIsLoading(false);
    }
  };

  return { connect, isConnected, isLoading, close };
};

export default useWebRTC;
