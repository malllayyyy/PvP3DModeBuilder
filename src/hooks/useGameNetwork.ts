import { useEffect, useRef } from 'react';
import { WebRTCManager } from '../network/WebRTCManager';
import { useWorkspaceStore } from '../store';

export const useGameNetwork = () => {
  const rtcManager = useRef<WebRTCManager | null>(null);
  const { 
    setGamePhase, 
    setTimeLeft, 
    serializeScene, 
    hydrateScene,
    wantsToConnect,
    hasRated,
    localRating,
    receiveOpponentRating,
    resetGame
  } = useWorkspaceStore();

  useEffect(() => {
    if (!wantsToConnect) {
      if (rtcManager.current) {
        rtcManager.current.destroy();
        rtcManager.current = null;
      }
      return;
    }

    if (!rtcManager.current) {
      const manager = new WebRTCManager();
      rtcManager.current = manager;

      manager.onWaitingForOpponent = () => {
        setGamePhase('waiting');
      };

      manager.onGameStarted = (data) => {
        setGamePhase('building');
        setTimeLeft(data.timeLimit);
      };

      manager.onTimerTick = (data) => {
        setTimeLeft(data.timeLeft);
      };

      manager.onTimerExpired = () => {
        setGamePhase('voting');
        const sceneData = serializeScene();
        console.log('Timer expired. Sending serialized scene...', sceneData);
        manager.sendData(sceneData);
      };

      manager.onDataReceived = (data) => {
        if (data.startsWith('RATE:')) {
          const stars = parseInt(data.split(':')[1], 10);
          console.log('Received RATE from opponent:', stars);
          receiveOpponentRating(stars);
        } else {
          console.log('Received opponent data on DataChannel:', data);
          try {
            hydrateScene(data);
          } catch (e) {
            console.error('Failed to parse incoming scene data', e);
          }
        }
      };

      manager.onOpponentDisconnected = () => {
        alert("Opponent disconnected!");
        resetGame();
      };

      manager.connect('http://localhost:3001');
    }

    return () => {
      // Clean teardown to prevent memory leaks on unmount
      if (rtcManager.current) {
        rtcManager.current.destroy();
        rtcManager.current = null;
      }
    };
  }, [wantsToConnect]);

  // Effect to handle sending the rating over DataChannel when user submits their rating
  useEffect(() => {
    if (hasRated && localRating > 0 && rtcManager.current) {
      console.log('Sending RATE payload over RTCDataChannel:', localRating);
      rtcManager.current.sendData(`RATE:${localRating}`);
    }
  }, [hasRated, localRating]);

  return null;
};
