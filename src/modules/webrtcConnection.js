import { useState } from 'react';

const useWebRTCConnection = () => {
  const [peerConnection, setPeerConnection] = useState(null);

  const createOffer = async () => {
    if (!peerConnection) {
      const pc = new RTCPeerConnection();
      setPeerConnection(pc);

      pc.onicecandidate = () => {
        console.log('ICE candidate generated');
      };

      pc.onaddstream = event => {
        console.log('Stream added:', event.stream);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state change:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected') {
          alert('WebRTC соединение установлено');
        } else if (pc.iceConnectionState === 'failed') {
          alert('WebRTC соединение оборвалось');
        }
      };

      pc.onerror = error => {
        console.log('WebRTC error:', error);
        alert('Ошибка WebRTC соединения');
      };
    }

    if (peerConnection) {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(new RTCSessionDescription({ type: 'offer', sdp: offer }));
        return peerConnection.localDescription;
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    } else {
      console.error('Peer connection is not initialized');
    }
  };

  const sendOffer = async (offer) => {
    try {
      const response = await fetch('http://localhost:8080', {
        method: 'POST',
        body: JSON.stringify(offer),
        headers: { 'Content-Type': 'application/json' }
      });
      const answer = await response.json();
      await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answer }));
    } catch (error) {
      console.error('Error sending offer:', error);
    }
  };

  return { createOffer, sendOffer };
};

export default useWebRTCConnection;
