// MultiCameraWidget — 2×2 grid of the QCar camera feeds.
//
// Reads frames from `framesRef` on a ~7 Hz timer (paused when the tab is hidden)
// so incoming camera frames update only this small widget instead of
// re-rendering the whole MapRunner tree.

import React, { useState } from 'react';
import { useVisiblePolling } from '../../../hooks/useVisiblePolling';
import { CAM_IDS, CAM_LABELS } from '../QCarCameras';

export default function MultiCameraWidget({ framesRef }) {
  const [frames, setFrames] = useState({});
  useVisiblePolling(() => setFrames({ ...framesRef.current }), 150);

  return (
    <div className="multi-camera">
      {CAM_IDS.map(id => {
        const frame = frames[id];
        const active = !!frame?.url;
        return (
          <div
            key={id}
            className={`multi-camera__cell${active ? '' : ' multi-camera__cell--inactive'}`}
          >
            <div className="multi-camera__label-bar">
              <span
                className={`multi-camera__label${active ? '' : ' multi-camera__label--inactive'}`}
              >
                {CAM_LABELS[id]}
              </span>
              {frame?.hz != null && (
                <span className="multi-camera__hz">{frame.hz.toFixed(1)} Hz</span>
              )}
            </div>

            <div className="multi-camera__image-area">
              {frame?.url ? (
                <img
                  className="multi-camera__image"
                  src={frame.url}
                  alt={CAM_LABELS[id]}
                />
              ) : (
                <div className="multi-camera__placeholder">waiting…</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
