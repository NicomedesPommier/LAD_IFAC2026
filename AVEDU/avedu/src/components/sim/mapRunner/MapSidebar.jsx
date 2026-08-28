// MapSidebar — left rail of the Map Runner: pick a built-in or workspace map,
// load & run it, then show a small info block and a reset button.

import React from 'react';
import { BASE_MAPS, getBaseMap } from '../baseMaps';

export default function MapSidebar({
  mapFiles,
  selectedMapPath,
  onSelectPath,
  mapData,
  canvasId,
  onLoadMap,
  onReset,
}) {
  const isBase = !!getBaseMap(selectedMapPath);
  const canLoad = !!selectedMapPath && (isBase || !!canvasId);

  return (
    <div className="map-sidebar">
      <h3 className="map-sidebar__title">Map Runner</h3>

      <select
        data-tour="map-select"
        className="map-sidebar__select"
        value={selectedMapPath}
        onChange={e => onSelectPath(e.target.value)}
      >
        <option value="">— Choose map —</option>
        <optgroup label="Built-in">
          {BASE_MAPS.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </optgroup>
        {mapFiles.length > 0 && (
          <optgroup label="Your maps">
            {mapFiles.map(f => (
              <option key={f.id} value={f.path}>{f.path}</option>
            ))}
          </optgroup>
        )}
      </select>

      <button
        data-tour="map-load"
        className="map-sidebar__load-btn"
        onClick={onLoadMap}
        disabled={!canLoad}
      >
        {(!canvasId && !isBase) ? 'Workspace loading…' : 'Load & Run'}
      </button>

      {mapData && (
        <>
          <div className="map-sidebar__info">
            <b>Map:</b> {selectedMapPath}<br />
            <b>Assets:</b> {mapData.assets?.length || 0}
          </div>
          <button className="map-sidebar__reset-btn" onClick={onReset}>
            ↺ Reset
          </button>
        </>
      )}
    </div>
  );
}
