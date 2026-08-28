import React, { useState } from 'react';
import MapCreator from './MapCreator';
import MapRunner from './MapRunner';
import RoadDesignerPanel from './road/RoadDesignerPanel';

export default function SimulationEnvironment({ canvasId, hideMenus = false, onRunStart }) {
  const [mode, setMode] = useState('run'); // 'run' or 'create'

  const handleSetMode = (newMode) => {
    setMode(newMode);
    if (newMode === 'run' && onRunStart) {
      onRunStart();
    }
  };

  return (
    <div className="simulation-env" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#111827' }}>
      {!hideMenus && (
        <header style={{ padding: '12px 16px', display: 'flex', gap: '12px', borderBottom: '1px solid #374151', backgroundColor: '#1f2937' }}>
          <button
            data-tour="sim-run"
            style={{ padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none', background: mode === 'run' ? '#3b82f6' : '#4b5563', color: '#fff' }}
            onClick={() => handleSetMode('run')}
          >
            Run Map
          </button>
          <button
            data-tour="sim-create"
            style={{ padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none', background: mode === 'create' ? '#10b981' : '#4b5563', color: '#fff' }}
            onClick={() => handleSetMode('create')}
          >
            🛣 Map Creator
          </button>
          <button
            data-tour="sim-objects"
            style={{ padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none', background: mode === 'objects' ? '#3b82f6' : '#4b5563', color: '#fff' }}
            onClick={() => handleSetMode('objects')}
          >
            Objects
          </button>
        </header>
      )}

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {mode === 'run' ? (
          <MapRunner canvasId={canvasId} hideMenus={hideMenus} onStartSim={onRunStart} />
        ) : mode === 'objects' ? (
          <MapCreator canvasId={canvasId} hideMenus={hideMenus} />
        ) : (
          /* 'create' → the integrated PathPhalt-style map editor */
          <RoadDesignerPanel canvasId={canvasId} />
        )}
      </div>
    </div>
  );
}
