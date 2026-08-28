import React, { useEffect, useRef, useContext, useState, useCallback } from 'react';
import ROSLIB from 'roslib';
import { RosBridgeContext } from '../../hooks/useRosBridge';
import { ROSContext } from './ROSContext';
import { useROS2Workspace } from '../../hooks/useROS2Workspace';

// ── Topic descriptors ──────────────────────────────────────────────────────────
// kind: 'compressed' → sensor_msgs/CompressedImage, data is base64 JPEG, render via <img>
// kind: 'raw'        → sensor_msgs/Image,           data is base64 raw pixels, render via <canvas>

const CUSTOM_SENTINEL = '__custom__';

const TOPIC_DEFS = [
  // QCar simulation cameras (namespaced)
  { label: 'CSI Front',               group: 'QCar Simulation', path: 'camera/csi_front/image/compressed', kind: 'compressed' },
  { label: 'CSI Right',               group: 'QCar Simulation', path: 'camera/csi_right/image/compressed', kind: 'compressed' },
  { label: 'CSI Back',                group: 'QCar Simulation', path: 'camera/csi_back/image/compressed',  kind: 'compressed' },
  { label: 'CSI Left',                group: 'QCar Simulation', path: 'camera/csi_left/image/compressed',  kind: 'compressed' },
  { label: 'RealSense RGB',           group: 'QCar Simulation', path: 'camera/rgb/image/compressed',       kind: 'compressed' },
  // Lane detection
  { label: 'Lane Detection',          group: 'Lane Detection',  path: 'lane_detection/image/compressed',   kind: 'compressed' },
  { label: 'Lane Detection (raw)',    group: 'Lane Detection',  path: 'lane_detection/image',              kind: 'raw'        },
  // Generic
  { label: 'Camera (compressed)',     group: 'Other',           path: 'camera/image/compressed',           kind: 'compressed' },
  { label: 'Camera (raw)',            group: 'Other',           path: 'camera/image_raw',                  kind: 'raw'        },
];

const GROUPS = ['QCar Simulation', 'Lane Detection', 'Other'];

const TYPE_MAP = {
  compressed: 'sensor_msgs/CompressedImage',
  raw:        'sensor_msgs/Image',
};

function buildTopics(workspaceName) {
  const ns = workspaceName ? `/${workspaceName}` : '';
  const topics = TOPIC_DEFS.map(d => ({
    ...d,
    value: `${ns}/${d.path}`,
    type:  TYPE_MAP[d.kind],
  }));
  // Custom sentinel at end — no namespace, user types the full topic
  topics.push({ label: '— Custom topic —', group: null, path: '', value: CUSTOM_SENTINEL, kind: 'compressed', type: TYPE_MAP.compressed });
  return topics;
}

// ── Raw sensor_msgs/Image → canvas ─────────────────────────────────────────────
function paintRawImage(canvas, msg) {
  try {
    const { width, height, encoding, data } = msg;
    if (!width || !height || !data) return;

    const ctx = canvas.getContext('2d');
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width  = width;
      canvas.height = height;
    }

    const bin    = atob(data);
    const bytes  = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const imgData = ctx.createImageData(width, height);
    const d       = imgData.data;
    const enc     = (encoding || 'bgr8').toLowerCase();

    if (enc === 'rgb8') {
      for (let i = 0, j = 0; i < d.length; i += 4, j += 3) {
        d[i] = bytes[j]; d[i+1] = bytes[j+1]; d[i+2] = bytes[j+2]; d[i+3] = 255;
      }
    } else if (enc === 'bgr8' || enc === 'bgr8; jpeg compressed bgr8') {
      for (let i = 0, j = 0; i < d.length; i += 4, j += 3) {
        d[i] = bytes[j+2]; d[i+1] = bytes[j+1]; d[i+2] = bytes[j]; d[i+3] = 255;
      }
    } else if (enc === 'mono8') {
      for (let i = 0, j = 0; i < d.length; i += 4, j++) {
        d[i] = d[i+1] = d[i+2] = bytes[j]; d[i+3] = 255;
      }
    } else {
      for (let i = 0, j = 0; i < d.length; i += 4, j += 3) {
        d[i] = bytes[j]; d[i+1] = bytes[j+1]; d[i+2] = bytes[j+2]; d[i+3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[RosRxPanel] paintRawImage error:', e);
  }
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const PANEL_STYLE = {
  position: 'absolute', top: 16, right: 16, zIndex: 10,
  background: 'rgba(20,20,30,0.88)',
  border: '1px solid rgba(100,200,100,0.35)',
  borderRadius: 8, padding: '10px 14px',
  color: '#cce', fontFamily: 'monospace', fontSize: 12, lineHeight: '1.7',
  pointerEvents: 'auto', userSelect: 'none', minWidth: 180,
};

const FILL_STYLE = {
  position: 'relative', width: '100%', height: '100%',
  background: 'transparent', color: '#cce', fontFamily: 'monospace',
  fontSize: 12, lineHeight: '1.7', pointerEvents: 'auto', userSelect: 'none',
  display: 'flex', flexDirection: 'column', padding: '8px 10px',
  boxSizing: 'border-box', overflow: 'hidden',
};

const selectStyle = {
  display: 'block', width: '100%',
  background: 'rgba(0,0,0,0.8)', border: '1px solid #445',
  color: '#aab', fontSize: 10, padding: '4px', borderRadius: 2,
  boxSizing: 'border-box', cursor: 'pointer',
};

// fill=true → expands to fill its container (for use inside SimWidget panels)
// fill=false (default) → floats as absolute-positioned overlay on the 3D canvas
export default function RosRxPanel({ fill = false }) {
  const bridge = useContext(RosBridgeContext);
  const legacy = useContext(ROSContext);

  const connected = bridge?.connected ?? legacy?.connected ?? false;
  const ros       = bridge?.ros       ?? legacy?.ros       ?? null;

  const subscribeTopic = useCallback(
    legacy?.subscribeTopic ?? ((name, messageType, onMessage, opts = {}) => {
      const r = ros?.current;
      if (!r) return () => {};
      const topic = new ROSLIB.Topic({
        ros: r, name, messageType,
        throttle_rate: opts.throttle_rate ?? 50,
        queue_size:    opts.queue_size    ?? 1,
      });
      const handler = (msg) => { try { onMessage?.(msg); } catch {} };
      try { topic.subscribe(handler); } catch {}
      return () => {
        try { topic.unsubscribe(handler); } catch {}
        try { topic.unsubscribe();        } catch {}
      };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [legacy?.subscribeTopic, ros],
  );

  const { canvasId } = useROS2Workspace();

  useEffect(() => { window.__ros_debug_ref = ros?.current; }, [ros, connected]);

  const [lidarHz,   setLidarHz]   = useState(0);
  const [camHz,     setCamHz]     = useState(0);
  const lastImgTs   = useRef(0);
  const [imgStatus, setImgStatus] = useState('idle');
  const lidarCount  = useRef(0);
  const camCount    = useRef(0);

  const imgRef    = useRef(null);
  const canvasRef = useRef(null);

  const workspaceName = canvasId
    ? `ws_${canvasId.replace(/-/g, '_')}`
    : 'workspace';

  // Dropdown: index into currentTopics array
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Custom topic inputs
  const [customTopic, setCustomTopic] = useState('');
  const [customKind,  setCustomKind]  = useState('compressed');

  // Hz tick
  useEffect(() => {
    const id = setInterval(() => {
      setLidarHz(lidarCount.current);
      setCamHz(camCount.current);
      lidarCount.current = 0;
      camCount.current   = 0;
      const age = Date.now() - lastImgTs.current;
      setImgStatus(lastImgTs.current === 0 ? 'idle' : age < 2000 ? 'receiving' : 'stale');
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const currentTopics  = buildTopics(workspaceName);
  const selectedTopic  = currentTopics[selectedIdx] ?? currentTopics[0];
  const isCustom       = selectedTopic.value === CUSTOM_SENTINEL;

  // Resolve what we actually subscribe to
  const activeTopic = isCustom && customTopic.trim()
    ? { value: customTopic.trim(), type: TYPE_MAP[customKind], kind: customKind }
    : isCustom
    ? null   // custom mode but no topic typed yet
    : selectedTopic;

  const handleMessage = useCallback((msg, kind) => {
    const isFirst = camCount.current === 0;
    camCount.current++;
    lastImgTs.current = Date.now();
    if (isFirst) {
      console.log('[RosRxPanel] ✅ First message received', {
        kind, hasData: !!msg.data, format: msg.format, encoding: msg.encoding,
        width: msg.width, height: msg.height,
      });
    }
    if (kind === 'compressed') {
      if (imgRef.current && msg.data)
        imgRef.current.src = `data:image/jpeg;base64,${msg.data}`;
    } else {
      if (canvasRef.current) paintRawImage(canvasRef.current, msg);
    }
  }, []);

  // Subscribe to active topic
  useEffect(() => {
    if (!connected || !subscribeTopic || !activeTopic) return;

    const unsubScan = subscribeTopic(
      `/${workspaceName}/scan`, 'sensor_msgs/LaserScan',
      () => { lidarCount.current++; },
      { throttle_rate: 200 },
    );

    console.log('[RosRxPanel] subscribing to:', activeTopic.value, 'as', activeTopic.type);

    const unsubImg = subscribeTopic(
      activeTopic.value, activeTopic.type,
      (msg) => handleMessage(msg, activeTopic.kind),
      { throttle_rate: activeTopic.kind === 'raw' ? 200 : 80, queue_size: 1 },
    );

    const diagTimer = setTimeout(() => {
      if (lastImgTs.current === 0) {
        console.warn('[RosRxPanel] ⚠️ No messages after 4 s on', activeTopic.value);
        const r = window.__ros_debug_ref;
        if (r) r.getTopics(
          (res) => console.log('[RosRxPanel] topic visible to rosbridge?', res.topics.includes(activeTopic.value)),
          (err) => console.warn('[RosRxPanel] getTopics failed:', err),
        );
      }
    }, 4000);

    lastImgTs.current = 0;
    setImgStatus('idle');
    if (imgRef.current)    imgRef.current.src = '';
    if (canvasRef.current) canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    return () => {
      clearTimeout(diagTimer);
      unsubScan();
      unsubImg();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, subscribeTopic, activeTopic?.value, activeTopic?.type, activeTopic?.kind, workspaceName, handleMessage]);

  const dotColor = imgStatus === 'receiving' ? '#44ff88' : imgStatus === 'stale' ? '#ffaa00' : '#445';
  const dotTitle = imgStatus === 'receiving' ? 'Receiving messages'
                 : imgStatus === 'stale'     ? 'No messages in >2 s — check topic / script'
                 :                             'No messages yet';

  const activeKind = activeTopic?.kind ?? 'compressed';

  const imgAreaStyle = fill
    ? { position: 'relative', flex: 1, minHeight: 0 }
    : { position: 'relative', width: 160, height: 120 };

  const imgStyle = {
    display: activeKind === 'compressed' ? 'block' : 'none',
    borderRadius: 4, border: '1px solid #223', objectFit: 'contain',
    ...(fill ? { width: '100%', height: '100%' } : { width: 160, height: 120 }),
  };

  const canvasStyle = {
    display: activeKind === 'raw' ? 'block' : 'none',
    borderRadius: 4, border: '1px solid #223',
    ...(fill ? { width: '100%', height: '100%' } : { width: 160, height: 120 }),
  };

  return (
    <div style={fill ? FILL_STYLE : PANEL_STYLE}>
      {!fill && (
        <div style={{ marginBottom: 6, color: '#44ff88', fontWeight: 'bold' }}>RX FROM ROS</div>
      )}

      {/* Hz grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: '2px 8px', flexShrink: 0 }}>
        <span style={{ color: '#7af' }}>LIDAR</span><span style={{ color: '#cce' }}>{lidarHz} Hz</span>
        <span style={{ color: '#7af' }}>CAM</span>  <span style={{ color: '#cce' }}>{camHz} Hz</span>
      </div>

      {/* Topic selector */}
      <div style={{ marginTop: 8, marginBottom: 4, flexShrink: 0 }}>
        <div style={{ color: '#556', fontSize: 11, marginBottom: 4 }}>
          Camera Topic
          <span title={dotTitle} style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: dotColor, marginLeft: 6, verticalAlign: 'middle',
            cursor: 'help', transition: 'background 0.4s',
          }} />
        </div>

        {/* Grouped dropdown */}
        <select value={selectedIdx} onChange={e => setSelectedIdx(Number(e.target.value))} style={selectStyle}>
          {GROUPS.map(g => {
            const items = currentTopics.map((t, i) => ({ ...t, idx: i })).filter(t => t.group === g);
            if (!items.length) return null;
            return (
              <optgroup key={g} label={g}>
                {items.map(t => <option key={t.idx} value={t.idx}>{t.label}</option>)}
              </optgroup>
            );
          })}
          {/* Custom at the bottom, outside any group */}
          {(() => {
            const ci = currentTopics.findIndex(t => t.value === CUSTOM_SENTINEL);
            return <option value={ci}>— Custom topic —</option>;
          })()}
        </select>

        {/* Custom topic input — shown only when custom is selected */}
        {isCustom && (
          <div style={{ marginTop: 5 }}>
            <input
              type="text"
              placeholder="/my/camera/image/compressed"
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              style={{
                display: 'block', width: '100%', boxSizing: 'border-box',
                background: 'rgba(0,0,0,0.9)', border: '1px solid #3a6a8a',
                color: '#7ad4ff', fontSize: 10, padding: '4px 6px', borderRadius: 2,
                outline: 'none', fontFamily: 'monospace',
              }}
            />
            {/* Type toggle */}
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {['compressed', 'raw'].map(k => (
                <button key={k} onClick={() => setCustomKind(k)} style={{
                  flex: 1, padding: '3px 0', borderRadius: 2, cursor: 'pointer', fontSize: 9,
                  fontFamily: 'monospace', border: 'none',
                  background: customKind === k ? 'rgba(0,140,255,0.3)' : 'rgba(255,255,255,0.05)',
                  color:      customKind === k ? '#7ad4ff' : '#446',
                  outline:    customKind === k ? '1px solid rgba(0,140,255,0.4)' : 'none',
                }}>
                  {k === 'compressed' ? 'CompressedImage' : 'Image (raw)'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active topic path hint */}
        <div style={{ fontSize: 9, color: '#334', marginTop: 3, wordBreak: 'break-all', lineHeight: 1.4 }}>
          {activeTopic ? <><span style={{ color: '#445' }}>{activeTopic.value}</span><br /><span style={{ color: '#336' }}>{activeTopic.type}</span></> : <span style={{ color: '#552' }}>Type a topic name above</span>}
        </div>
      </div>

      {/* Image output */}
      <div style={imgAreaStyle}>
        <img
          ref={imgRef} alt="rx camera"
          onLoad={() => console.log('[RosRxPanel] img decoded OK')}
          onError={(e) => { if (imgRef.current?.src) console.error('[RosRxPanel] img decode failed', e); }}
          style={imgStyle}
        />
        <canvas ref={canvasRef} style={canvasStyle} />
        {imgStatus !== 'receiving' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)', borderRadius: 4,
            fontSize: 9, color: imgStatus === 'stale' ? '#ffaa00' : '#445',
            textAlign: 'center', padding: '0 8px', pointerEvents: 'none',
          }}>
            {isCustom && !customTopic.trim()
              ? 'Enter a topic name above'
              : imgStatus === 'stale'
              ? 'No data — is the script running?'
              : connected ? 'Waiting for image…' : 'ROS disconnected'}
          </div>
        )}
      </div>
    </div>
  );
}
