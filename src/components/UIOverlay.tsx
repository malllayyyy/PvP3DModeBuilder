import React, { useEffect } from 'react';
import { Box, Circle, Cylinder, Cone, Settings, Copy, Upload, Orbit } from 'lucide-react';
import { useWorkspaceStore } from '../store';

export const UIOverlay: React.FC = () => {
  const { 
    addObject, 
    serializeScene, 
    hydrateScene, 
    transformMode, 
    setTransformMode,
    isAntiGravityEnabled,
    setAntiGravityEnabled,
    gamePhase,
    timeLeft,
    joinPvPQueue,
    leavePvPQueue,
    submitRating,
    resetGame,
    clearCanvas,
    hasRated,
    opponentHasRated,
    localRating,
    opponentRating
  } = useWorkspaceStore();

  const [selectedRating, setSelectedRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);

  // Keyboard hotkeys for transform mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input (not that we have one right now, but good practice)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch(e.key.toLowerCase()) {
        case 'w':
          setTransformMode('translate');
          break;
        case 'e':
          setTransformMode('rotate');
          break;
        case 'r':
          setTransformMode('scale');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTransformMode]);

  const handleSerialize = () => {
    const json = serializeScene();
    console.log("Serialized Scene:", json);
    // Copy to clipboard for easy testing
    navigator.clipboard.writeText(json).then(() => {
      alert("Scene serialized and copied to clipboard!");
    });
  };

  const handleHydrate = () => {
    const json = prompt("Paste serialized scene JSON here:");
    if (json) {
      hydrateScene(json);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '250px',
      height: '100%',
      backgroundColor: 'rgba(30, 30, 30, 0.9)',
      color: 'white',
      padding: '20px',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      borderRight: '1px solid #444',
      zIndex: 10
    }}>
      <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Settings size={20} /> Tools
      </h2>

      {/* Game State Indicator */}
      <div style={{ padding: '10px', background: '#222', borderRadius: '8px', border: '1px solid #555' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: '#ffcc00' }}>
          Status: {gamePhase === 'offline' ? 'PRACTICE (Sandbox)' : gamePhase.toUpperCase()}
        </h3>
        {gamePhase === 'building' && (
          <p style={{ margin: '5px 0 0 0', fontSize: '1.2rem', fontWeight: 'bold' }}>
            Time Left: {timeLeft}s
          </p>
        )}
      </div>

      {/* Practice Sandbox Mode Controls */}
      {gamePhase === 'offline' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #444' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#60a5fa' }}>Practice Sandbox</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', lineHeight: '1.4' }}>
              Practice building flat-shaded models here. Clean your canvas or start a battle anytime!
            </p>
            <button onClick={clearCanvas} className="ui-btn" style={{ justifyContent: 'center', borderColor: '#f87171', color: '#f87171' }}>
              🗑️ Clear Canvas
            </button>
            <button onClick={joinPvPQueue} className="ui-btn active-purple" style={{ justifyContent: 'center', fontWeight: 'bold' }}>
              ⚔️ Match & Battle PvP
            </button>
          </div>

          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '10px' }}>Primitives</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => addObject('Cube')} className="ui-btn"><Box size={16} /> Cube</button>
              <button onClick={() => addObject('Sphere')} className="ui-btn"><Circle size={16} /> Sphere</button>
              <button onClick={() => addObject('Cylinder')} className="ui-btn"><Cylinder size={16} /> Cylinder</button>
              <button onClick={() => addObject('Cone')} className="ui-btn"><Cone size={16} /> Cone</button>
              <button onClick={() => addObject('Torus')} className="ui-btn"><Circle size={16} /> Torus</button>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '10px' }}>Transform Mode</h3>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setTransformMode('translate')} className={`ui-btn-sm ${transformMode === 'translate' ? 'active' : ''}`}>W (Move)</button>
              <button onClick={() => setTransformMode('rotate')} className={`ui-btn-sm ${transformMode === 'rotate' ? 'active' : ''}`}>E (Rotate)</button>
              <button onClick={() => setTransformMode('scale')} className={`ui-btn-sm ${transformMode === 'scale' ? 'active' : ''}`}>R (Scale)</button>
            </div>
          </div>
        </>
      )}

      {gamePhase === 'waiting' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #444' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#f59e0b' }}>Searching Peer...</h3>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', lineHeight: '1.4' }}>
            Looking for another player. Standby...
          </p>
          <button onClick={leavePvPQueue} className="ui-btn" style={{ justifyContent: 'center', borderColor: '#f87171', color: '#f87171' }}>
            Cancel Queue
          </button>
        </div>
      )}

      {gamePhase === 'building' && (
        <>
          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '10px' }}>Primitives</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => addObject('Cube')} className="ui-btn"><Box size={16} /> Cube</button>
              <button onClick={() => addObject('Sphere')} className="ui-btn"><Circle size={16} /> Sphere</button>
              <button onClick={() => addObject('Cylinder')} className="ui-btn"><Cylinder size={16} /> Cylinder</button>
              <button onClick={() => addObject('Cone')} className="ui-btn"><Cone size={16} /> Cone</button>
              <button onClick={() => addObject('Torus')} className="ui-btn"><Circle size={16} /> Torus</button>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '10px' }}>Transform Mode</h3>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setTransformMode('translate')} className={`ui-btn-sm ${transformMode === 'translate' ? 'active' : ''}`}>W (Move)</button>
              <button onClick={() => setTransformMode('rotate')} className={`ui-btn-sm ${transformMode === 'rotate' ? 'active' : ''}`}>E (Rotate)</button>
              <button onClick={() => setTransformMode('scale')} className={`ui-btn-sm ${transformMode === 'scale' ? 'active' : ''}`}>R (Scale)</button>
            </div>
          </div>
        </>
      )}

      {gamePhase === 'voting' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #444' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#10b981' }}>Rate Opponent's Build</h3>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', lineHeight: '1.4' }}>
            Inspect their model and submit a rating from 1 to 5 stars!
          </p>

          {!hasRated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              {/* Star Rating Icons */}
              <div style={{ display: 'flex', gap: '8px', fontSize: '1.6rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    style={{ cursor: 'pointer', color: (hoverRating || selectedRating) >= star ? '#fbbf24' : '#4b5563', transition: 'color 0.15s ease' }}
                    onClick={() => setSelectedRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <button 
                onClick={() => {
                  if (selectedRating > 0) {
                    submitRating(selectedRating);
                  }
                }} 
                disabled={selectedRating === 0}
                className="ui-btn active-purple" 
                style={{ justifyContent: 'center', fontWeight: 'bold', opacity: selectedRating === 0 ? 0.5 : 1 }}
              >
                Submit ⭐{selectedRating} Rating
              </button>
            </div>
          ) : (
            <button disabled className="ui-btn" style={{ justifyContent: 'center', opacity: 0.6, cursor: 'not-allowed' }}>
              Rating Submitted! (⭐{localRating})
            </button>
          )}

          <div style={{ padding: '8px', background: '#222', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>You Rated Opponent:</span>
              <span style={{ color: hasRated ? '#fbbf24' : '#f59e0b', fontWeight: 'bold' }}>
                {hasRated ? `${'★'.repeat(localRating)} (${localRating}/5)` : 'PENDING'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Opponent Rated You:</span>
              <span style={{ color: opponentHasRated ? '#fbbf24' : '#f59e0b', fontWeight: 'bold' }}>
                {opponentHasRated ? `${'★'.repeat(opponentRating)} (${opponentRating}/5)` : 'PENDING'}
              </span>
            </div>
          </div>

          {hasRated && opponentHasRated && (
            <div style={{ 
              padding: '10px', 
              background: 'rgba(16, 185, 129, 0.2)', 
              border: '1px solid #10b981', 
              borderRadius: '6px', 
              textAlign: 'center', 
              fontWeight: 'bold', 
              color: opponentRating > localRating ? '#34d399' : opponentRating < localRating ? '#f87171' : '#a7f3d0',
              fontSize: '0.85rem' 
            }}>
              {opponentRating > localRating 
                ? '🏆 Victory! Your build scored higher!' 
                : opponentRating < localRating 
                  ? '💀 Defeat! Opponent scored higher!' 
                  : '🤝 It\'s a Draw! Harmonious builder!'
              }
            </div>
          )}

          <button onClick={resetGame} className="ui-btn" style={{ justifyContent: 'center', marginTop: '5px', borderColor: '#ef4444', color: '#ef4444' }}>
            Exit Battle Lobby
          </button>
        </div>
      )}

      <div>
        <h3 style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '10px' }}>Environment</h3>
        <button 
          onClick={() => setAntiGravityEnabled(!isAntiGravityEnabled)} 
          className={`ui-btn ${isAntiGravityEnabled ? 'active-purple' : ''}`}
        >
          <Orbit size={16} /> Anti-Gravity: {isAntiGravityEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <h3 style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '10px' }}>Data</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={handleSerialize} className="ui-btn"><Copy size={16} /> Serialize Scene</button>
          <button onClick={handleHydrate} className="ui-btn"><Upload size={16} /> Hydrate Scene</button>
        </div>
      </div>
    </div>
  );
};
