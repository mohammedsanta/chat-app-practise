export function createPeerConnection({ localStream, onRemoteStream, onIceCandidate, onConnectionChange }) {
  const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  const pc = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
    console.log(`Added local track: ${track.kind}`);
  });

  pc.ontrack = event => {
    console.log('Remote track received.');
    onRemoteStream(event.streams[0]);
  };

  pc.onicecandidate = event => {
    if (event.candidate) {
      console.log('ICE candidate generated:', event.candidate);
      onIceCandidate(event.candidate);
    }
  };

  pc.onconnectionstatechange = () => {
    console.log('Peer connection state changed:', pc.connectionState);
    onConnectionChange(pc.connectionState);
  };

  return pc;
}
