import { io, Socket } from 'socket.io-client';

type EventCallback = (data?: any) => void;

export class WebRTCManager {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private roomId: string | null = null;
  
  // Callbacks for UI/Zustand integration
  public onWaitingForOpponent: EventCallback = () => {};
  public onGameStarted: EventCallback = () => {};
  public onTimerTick: EventCallback = () => {};
  public onTimerExpired: EventCallback = () => {};
  public onOpponentDisconnected: EventCallback = () => {};
  public onDataReceived: EventCallback = () => {};

  public connect(serverUrl: string = 'http://localhost:3001') {
    this.socket = io(serverUrl);

    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
    });

    this.socket.on('WAITING_FOR_OPPONENT', () => {
      console.log('Waiting for an opponent...');
      this.onWaitingForOpponent();
    });

    this.socket.on('GAME_STARTED', async (data) => {
      console.log('Game started!', data);
      this.roomId = data.roomId;
      this.onGameStarted(data);

      if (data.isInitiator) {
        this.initiateCall();
      }
    });

    this.socket.on('webrtc_offer', async (data) => {
      console.log('Received WebRTC Offer');
      if (!this.peerConnection) this.setupPeerConnection();
      
      try {
        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await this.peerConnection!.createAnswer();
        await this.peerConnection!.setLocalDescription(answer);
        
        this.socket!.emit('webrtc_answer', {
          roomId: this.roomId,
          sdp: answer
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    this.socket.on('webrtc_answer', async (data) => {
      console.log('Received WebRTC Answer');
      try {
        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    });

    this.socket.on('webrtc_ice_candidate', async (data) => {
      try {
        if (data.candidate && this.peerConnection) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    this.socket.on('TIMER_TICK', (data) => this.onTimerTick(data));
    this.socket.on('TIMER_EXPIRED', () => this.onTimerExpired());
    
    this.socket.on('OPPONENT_DISCONNECTED', () => {
      console.log('Opponent disconnected');
      this.onOpponentDisconnected();
      this.cleanupRTC();
    });
  }

  // Called manually by one of the peers, or triggered automatically. 
  // Let's create an explicit initOffer to be called.
  public async initiateCall() {
    this.setupPeerConnection();
    
    // Create data channel explicitly configured for reliable, high-ordered delivery
    this.dataChannel = this.peerConnection!.createDataChannel('game_sync', { ordered: true });
    this.setupDataChannel(this.dataChannel);

    try {
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      
      this.socket!.emit('webrtc_offer', {
        roomId: this.roomId,
        sdp: offer
      });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  }

  private setupPeerConnection() {
    if (this.peerConnection) return;

    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.roomId) {
        this.socket!.emit('webrtc_ice_candidate', {
          roomId: this.roomId,
          candidate: event.candidate
        });
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      console.log('Received data channel');
      this.dataChannel = event.channel;
      this.setupDataChannel(this.dataChannel);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE state:', this.peerConnection?.iceConnectionState);
      if (this.peerConnection?.iceConnectionState === 'disconnected' || 
          this.peerConnection?.iceConnectionState === 'failed') {
        this.onOpponentDisconnected();
      }
    };
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.onopen = () => console.log('Data channel opened');
    channel.onclose = () => console.log('Data channel closed');
    channel.onerror = (err) => console.error('Data channel error:', err);
    channel.onmessage = (event) => {
      if (event.data) {
        this.onDataReceived(event.data);
      }
    };
  }

  public sendData(data: string) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(data);
    } else {
      console.error('Data channel is not open. Cannot send data.');
    }
  }

  private cleanupRTC() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  public destroy() {
    this.cleanupRTC();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
