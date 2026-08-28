/**
 * QCarVisualization.jsx
 *
 * Floating-widget dashboard that connects to the physical QCar's rosbridge
 * and displays live topic data. Each widget is draggable and resizable via
 * FloatingWidget (react-rnd).
 *
 * Displayed topics:
 *   /scan                   sensor_msgs/LaserScan   → LIDAR polar plot
 *   /qcar2_imu              sensor_msgs/Imu         → linear acc + angular vel
 *   /qcar2_battery          sensor_msgs/BatteryState→ voltage / percentage
 *   /qcar2_joint            sensor_msgs/JointState  → joint name/position table
 *   /qcar2_motor_speed_cmd  (custom)                → raw JSON
 *   /qcar2_led_cmd          (custom)                → raw JSON
 *   /rosout                 rcl_interfaces/Log      → scrolling log
 *   /parameter_events       rcl_interfaces/ParameterEvent → event counter
 *   /tf_static              tf2_msgs/TFMessage      → transform list
 */

import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import ROSLIB from 'roslib';
import FloatingWidget from '../sim/FloatingWidget';
import LidarWidget2D from '../sim/LidarWidget2D';
import { GiRadarSweep } from 'react-icons/gi';
import { MdBolt, MdSensors, MdOutlineMemory, MdVideocam } from 'react-icons/md';
import { TbActivity, TbBroadcast } from 'react-icons/tb';
import { IoTerminal } from 'react-icons/io5';
import { FaLink, FaUnlink } from 'react-icons/fa';

// ── QCar roslib connection ─────────────────────────────────────────────────────

function useQCarRos(url) {
  const rosRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    const ros = new ROSLIB.Ros();
    rosRef.current = ros;

    ros.on('connection', () => { setConnected(true); setError(null); });
    ros.on('close',      () => setConnected(false));
    ros.on('error',      (e) => { setError(String(e?.message ?? e)); setConnected(false); });

    try { ros.connect(url); } catch (e) { setError(String(e)); }

    return () => {
      try { ros.close(); } catch {}
      rosRef.current = null;
    };
  }, [url]);

  return { rosRef, connected, error };
}

// ── Generic topic subscriber ───────────────────────────────────────────────────

function useTopic(rosRef, connected, name, messageType, throttle = 150) {
  const [msg, setMsg] = useState(null);
  const [hz, setHz]   = useState(0);
  const cntRef        = useRef(0);

  useEffect(() => {
    if (!connected || !rosRef.current) return;
    const topic = new ROSLIB.Topic({
      ros: rosRef.current,
      name,
      messageType,
      throttle_rate: throttle,
      queue_size: 1,
    });
    const handler = (m) => { cntRef.current++; setMsg(m); };
    try { topic.subscribe(handler); } catch {}
    return () => { try { topic.unsubscribe(handler); topic.unsubscribe(); } catch {} };
  }, [rosRef, connected, name, messageType, throttle]);

  useEffect(() => {
    const id = setInterval(() => { setHz(cntRef.current); cntRef.current = 0; }, 1000);
    return () => clearInterval(id);
  }, []);

  return { msg, hz };
}

// ── Small helpers ──────────────────────────────────────────────────────────────

const S = {
  mono: { fontFamily: 'monospace', fontSize: 11 },
  dim:  { color: '#4a7a9a' },
  val:  { color: '#7df9d0' },
  lbl:  { color: '#6aaccc' },
  warn: { color: '#ffaa44' },
  err:  { color: '#ff6677' },
};

function Hz({ hz }) {
  const c = hz > 0 ? '#44ff88' : '#334';
  return <span style={{ fontSize: 9, color: c, marginLeft: 4 }}>{hz} Hz</span>;
}

function NoData({ connected }) {
  return (
    <div style={{
      ...S.mono, padding: '10px 8px', textAlign: 'center',
      color: connected ? '#4a7a9a' : '#553333',
    }}>
      {connected ? 'Waiting for data…' : '● offline'}
    </div>
  );
}

function Vec3Row({ label, v }) {
  if (!v) return null;
  const fmt = (n) => (typeof n === 'number' ? n.toFixed(3) : '—');
  return (
    <tr>
      <td style={{ ...S.lbl, paddingRight: 8, whiteSpace: 'nowrap' }}>{label}</td>
      <td style={S.val}>{fmt(v.x)}</td>
      <td style={S.val}>{fmt(v.y)}</td>
      <td style={S.val}>{fmt(v.z)}</td>
    </tr>
  );
}

function JsonDump({ data, maxLen = 600 }) {
  if (data == null) return null;
  const txt = JSON.stringify(data, null, 2);
  const clipped = txt.length > maxLen ? txt.slice(0, maxLen) + '\n…' : txt;
  return (
    <pre style={{
      ...S.mono, ...S.val,
      margin: 0, padding: '6px 8px',
      whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      overflowY: 'auto', maxHeight: '100%',
      fontSize: 10,
    }}>
      {clipped}
    </pre>
  );
}

// ── Widget content components ──────────────────────────────────────────────────

function ImuWidget({ rosRef, connected }) {
  const { msg, hz } = useTopic(rosRef, connected, '/qcar2_imu', 'sensor_msgs/Imu', 100);
  const la = msg?.linear_acceleration;
  const av = msg?.angular_velocity;
  return (
    <div style={{ ...S.mono, padding: '6px 8px', height: '100%', overflowY: 'auto' }}>
      <Hz hz={hz} />
      {!msg ? <NoData connected={connected} /> : (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 4 }}>
          <thead>
            <tr>
              <th style={{ ...S.dim, textAlign: 'left', fontSize: 9, paddingBottom: 3 }}> </th>
              <th style={{ ...S.dim, textAlign: 'left', fontSize: 9 }}>X</th>
              <th style={{ ...S.dim, textAlign: 'left', fontSize: 9 }}>Y</th>
              <th style={{ ...S.dim, textAlign: 'left', fontSize: 9 }}>Z</th>
            </tr>
          </thead>
          <tbody>
            <Vec3Row label="Lin acc" v={la} />
            <Vec3Row label="Ang vel" v={av} />
          </tbody>
        </table>
      )}
    </div>
  );
}

function BatteryWidget({ rosRef, connected }) {
  const { msg, hz } = useTopic(rosRef, connected, '/qcar2_battery', 'sensor_msgs/BatteryState', 500);
  return (
    <div style={{ ...S.mono, padding: '6px 8px', height: '100%', overflowY: 'auto' }}>
      <Hz hz={hz} />
      {!msg ? <NoData connected={connected} /> : (() => {
        const pct = msg.percentage != null ? (msg.percentage * 100).toFixed(1) : null;
        const volt = msg.voltage?.toFixed(2);
        const curr = msg.current?.toFixed(2);
        const barW = pct ? Math.min(100, parseFloat(pct)) : 0;
        const barColor = barW > 30 ? '#44ff88' : barW > 10 ? '#ffaa44' : '#ff6677';
        return (
          <>
            <div style={{ marginTop: 6, marginBottom: 2, ...S.dim, fontSize: 9 }}>CHARGE</div>
            <div style={{ height: 12, background: '#111', borderRadius: 3, overflow: 'hidden', border: '1px solid #223' }}>
              <div style={{ width: `${barW}%`, height: '100%', background: barColor, transition: 'width 0.5s' }} />
            </div>
            <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '70px 1fr', gap: '2px 6px' }}>
              {pct  != null && <><span style={S.dim}>Percentage</span><span style={S.val}>{pct}%</span></>}
              {volt != null && <><span style={S.dim}>Voltage</span><span style={S.val}>{volt} V</span></>}
              {curr != null && <><span style={S.dim}>Current</span><span style={S.val}>{curr} A</span></>}
            </div>
          </>
        );
      })()}
    </div>
  );
}

function LidarContent({ rosRef, connected }) {
  const rangesRef = useRef([]);
  const [hz, setHz] = useState(0);
  const cntRef = useRef(0);

  useEffect(() => {
    if (!connected || !rosRef.current) return;
    const topic = new ROSLIB.Topic({
      ros: rosRef.current,
      name: '/scan',
      messageType: 'sensor_msgs/LaserScan',
      throttle_rate: 80,
      queue_size: 1,
    });
    const handler = (m) => {
      cntRef.current++;
      rangesRef.current = m.ranges || [];
    };
    try { topic.subscribe(handler); } catch {}
    return () => { try { topic.unsubscribe(handler); topic.unsubscribe(); } catch {} };
  }, [rosRef, connected]);

  useEffect(() => {
    const id = setInterval(() => { setHz(cntRef.current); cntRef.current = 0; }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <LidarWidget2D rangesRef={rangesRef} />
      <Hz hz={hz} />
    </div>
  );
}

function JointWidget({ rosRef, connected }) {
  const { msg, hz } = useTopic(rosRef, connected, '/qcar2_joint', 'sensor_msgs/JointState', 200);
  return (
    <div style={{ ...S.mono, padding: '6px 8px', height: '100%', overflowY: 'auto' }}>
      <Hz hz={hz} />
      {!msg ? <NoData connected={connected} /> : (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 4, fontSize: 10 }}>
          <thead>
            <tr>
              <th style={{ ...S.dim, textAlign: 'left', fontSize: 9, paddingBottom: 3 }}>JOINT</th>
              <th style={{ ...S.dim, textAlign: 'right', fontSize: 9 }}>POS</th>
              <th style={{ ...S.dim, textAlign: 'right', fontSize: 9 }}>VEL</th>
            </tr>
          </thead>
          <tbody>
            {(msg.name || []).map((n, i) => (
              <tr key={n}>
                <td style={{ ...S.lbl, paddingRight: 6, whiteSpace: 'nowrap' }}>{n}</td>
                <td style={{ ...S.val, textAlign: 'right' }}>
                  {msg.position?.[i]?.toFixed(3) ?? '—'}
                </td>
                <td style={{ ...S.val, textAlign: 'right' }}>
                  {msg.velocity?.[i]?.toFixed(3) ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function LogWidget({ rosRef, connected }) {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    if (!connected || !rosRef.current) return;
    const topic = new ROSLIB.Topic({
      ros: rosRef.current,
      name: '/rosout',
      messageType: 'rcl_interfaces/Log',
      throttle_rate: 0,
      queue_size: 20,
    });
    const handler = (m) => {
      const level = m.level;
      const color = level >= 50 ? '#ff6677' : level >= 40 ? '#ffaa44' : level >= 30 ? '#ffee44' : '#7df9d0';
      const entry = { ts: Date.now(), name: m.name, msg: m.msg, color };
      setLines((prev) => [...prev.slice(-49), entry]);
    };
    try { topic.subscribe(handler); } catch {}
    return () => { try { topic.unsubscribe(handler); topic.unsubscribe(); } catch {} };
  }, [rosRef, connected]);

  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  return (
    <div style={{ ...S.mono, padding: '4px 6px', height: '100%', overflowY: 'auto', fontSize: 10 }}>
      {!connected && <NoData connected={false} />}
      {lines.length === 0 && connected && <div style={S.dim}>Listening for log messages…</div>}
      {lines.map((l, i) => (
        <div key={i} style={{ marginBottom: 2 }}>
          <span style={S.dim}>[{l.name}]</span>{' '}
          <span style={{ color: l.color }}>{l.msg}</span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function RawWidget({ rosRef, connected, topic, msgType }) {
  const { msg, hz } = useTopic(rosRef, connected, topic, msgType || '', 200);
  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '4px 8px' }}><Hz hz={hz} /></div>
      {!msg ? <NoData connected={connected} /> : <JsonDump data={msg} />}
    </div>
  );
}

function TfStaticWidget({ rosRef, connected }) {
  const { msg, hz } = useTopic(rosRef, connected, '/tf_static', 'tf2_msgs/TFMessage', 2000);
  const transforms = msg?.transforms || [];
  return (
    <div style={{ ...S.mono, padding: '6px 8px', height: '100%', overflowY: 'auto', fontSize: 10 }}>
      <Hz hz={hz} />
      {!msg ? <NoData connected={connected} /> : (
        <>
          <div style={{ ...S.dim, marginBottom: 4 }}>{transforms.length} static transform{transforms.length !== 1 ? 's' : ''}</div>
          {transforms.map((tf, i) => (
            <div key={i} style={{ marginBottom: 3 }}>
              <span style={S.lbl}>{tf.header?.frame_id || '?'}</span>
              <span style={S.dim}> → </span>
              <span style={S.val}>{tf.child_frame_id || '?'}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function ParamWidget({ rosRef, connected }) {
  const [count, setCount] = useState(0);
  const [last, setLast]   = useState(null);

  useEffect(() => {
    if (!connected || !rosRef.current) return;
    const topic = new ROSLIB.Topic({
      ros: rosRef.current,
      name: '/parameter_events',
      messageType: 'rcl_interfaces/ParameterEvent',
      throttle_rate: 500,
      queue_size: 1,
    });
    const handler = (m) => { setCount((c) => c + 1); setLast(m.node); };
    try { topic.subscribe(handler); } catch {}
    return () => { try { topic.unsubscribe(handler); topic.unsubscribe(); } catch {} };
  }, [rosRef, connected]);

  return (
    <div style={{ ...S.mono, padding: '6px 10px', height: '100%' }}>
      {!connected ? <NoData connected={false} /> : (
        <>
          <div style={{ ...S.dim, fontSize: 9, marginBottom: 4 }}>EVENTS RECEIVED</div>
          <div style={{ ...S.val, fontSize: 22, fontWeight: 'bold' }}>{count}</div>
          {last && <div style={{ ...S.dim, marginTop: 6, fontSize: 9 }}>Last node: <span style={S.lbl}>{last}</span></div>}
        </>
      )}
    </div>
  );
}

function CameraStreamWidget({ qcarIp, topic }) {
  const [status, setStatus] = useState('loading');
  const url = qcarIp ? `http://${qcarIp}:8080/stream?topic=${encodeURIComponent(topic)}` : null;

  if (!url) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ ...S.mono, ...S.dim, textAlign: 'center', fontSize: 10, padding: 8 }}>
          No QCar host configured<br />
          <span style={{ fontSize: 9 }}>Set qcar_ip in config/ip_config.json</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
      {status === 'loading' && (
        <div style={{ ...S.mono, ...S.dim, fontSize: 10 }}>Connecting to stream…</div>
      )}
      {status === 'error' && (
        <div style={{ ...S.mono, ...S.err, textAlign: 'center', fontSize: 10, padding: 8 }}>
          Stream unavailable<br />
          <span style={{ ...S.dim, fontSize: 9 }}>Is web_video_server running?</span>
        </div>
      )}
      <img
        src={url}
        alt={topic}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: status === 'ok' ? 'block' : 'none' }}
        onLoad={() => setStatus('ok')}
        onError={() => setStatus('error')}
      />
    </div>
  );
}

// ── Z-order manager ────────────────────────────────────────────────────────────

function useZOrder(ids) {
  const [order, setOrder] = useState(() => Object.fromEntries(ids.map((id, i) => [id, 10 + i])));
  const topRef = useRef(10 + ids.length);

  const bringToFront = useCallback((id) => {
    topRef.current += 1;
    setOrder((prev) => ({ ...prev, [id]: topRef.current }));
  }, []);

  return { order, bringToFront };
}

// ── Widget registry ────────────────────────────────────────────────────────────

const WIDGET_IDS = ['lidar', 'imu', 'battery', 'joints', 'motor', 'led', 'log', 'tf', 'params', 'cam_color', 'cam_csi', 'cam_depth'];

const WIDGET_META = {
  lidar:     { title: 'LIDAR SCAN',        icon: <GiRadarSweep />,   defaultX: 20,  defaultY: 20,  defaultW: 300, defaultH: 300 },
  imu:       { title: 'IMU',               icon: <TbActivity />,     defaultX: 340, defaultY: 20,  defaultW: 260, defaultH: 160 },
  battery:   { title: 'BATTERY',           icon: <MdBolt />,         defaultX: 620, defaultY: 20,  defaultW: 220, defaultH: 140 },
  joints:    { title: 'JOINT STATES',      icon: <MdOutlineMemory />,defaultX: 340, defaultY: 200, defaultW: 260, defaultH: 200 },
  motor:     { title: 'MOTOR CMD',         icon: <TbBroadcast />,    defaultX: 620, defaultY: 180, defaultW: 220, defaultH: 180 },
  led:       { title: 'LED CMD',           icon: <MdSensors />,      defaultX: 860, defaultY: 20,  defaultW: 200, defaultH: 160 },
  log:       { title: 'ROSOUT LOG',        icon: <IoTerminal />,     defaultX: 20,  defaultY: 340, defaultW: 580, defaultH: 180 },
  tf:        { title: 'TF STATIC',         icon: <MdSensors />,      defaultX: 620, defaultY: 380, defaultW: 220, defaultH: 160 },
  params:    { title: 'PARAMETER EVENTS',  icon: <MdSensors />,      defaultX: 860, defaultY: 200, defaultW: 200, defaultH: 120 },
  cam_color: { title: 'COLOR CAMERA',      icon: <MdVideocam />,     defaultX: 20,  defaultY: 550, defaultW: 360, defaultH: 280 },
  cam_csi:   { title: 'CSI CAMERA',        icon: <MdVideocam />,     defaultX: 400, defaultY: 550, defaultW: 360, defaultH: 280 },
  cam_depth: { title: 'DEPTH CAMERA',      icon: <MdVideocam />,     defaultX: 780, defaultY: 550, defaultW: 360, defaultH: 280 },
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function QCarVisualization({ qcarRosbridgeUrl }) {
  const { rosRef, connected, error } = useQCarRos(qcarRosbridgeUrl);
  const { order, bringToFront } = useZOrder(WIDGET_IDS);
  const [hidden, setHidden] = useState(new Set());

  // El host de las cámaras se deriva de la URL de rosbridge que entrega
  // /api/config/network/. Sin esa URL no hay IP que adivinar: null.
  const qcarIp = React.useMemo(() => {
    if (!qcarRosbridgeUrl) return null;
    const m = qcarRosbridgeUrl.match(/wss?:\/\/([^:/]+)/);
    return m ? m[1] : null;
  }, [qcarRosbridgeUrl]);

  const toggleWidget = (id) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const renderContent = (id) => {
    switch (id) {
      case 'lidar':   return <LidarContent  rosRef={rosRef} connected={connected} />;
      case 'imu':     return <ImuWidget     rosRef={rosRef} connected={connected} />;
      case 'battery': return <BatteryWidget rosRef={rosRef} connected={connected} />;
      case 'joints':  return <JointWidget   rosRef={rosRef} connected={connected} />;
      case 'motor':     return <RawWidget     rosRef={rosRef} connected={connected} topic="/qcar2_motor_speed_cmd" msgType="" />;
      case 'led':       return <RawWidget     rosRef={rosRef} connected={connected} topic="/qcar2_led_cmd"          msgType="" />;
      case 'log':       return <LogWidget     rosRef={rosRef} connected={connected} />;
      case 'tf':        return <TfStaticWidget rosRef={rosRef} connected={connected} />;
      case 'params':    return <ParamWidget   rosRef={rosRef} connected={connected} />;
      case 'cam_color': return <CameraStreamWidget qcarIp={qcarIp} topic="/camera/color_image/compressed" />;
      case 'cam_csi':   return <CameraStreamWidget qcarIp={qcarIp} topic="/camera/csi_image/compressed" />;
      case 'cam_depth': return <CameraStreamWidget qcarIp={qcarIp} topic="/camera/depth_image/compressed" />;
      default:          return null;
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#050d14', overflow: 'hidden' }}>

      {/* ── Connection bar ────────────────────────────────────────────────── */}
      <div style={{
        height: 32, flexShrink: 0,
        background: 'rgba(9,12,22,0.95)',
        borderBottom: '1px solid #1c2e3e',
        display: 'flex', alignItems: 'center',
        padding: '0 12px', gap: 10,
        fontFamily: 'monospace', fontSize: 11,
        zIndex: 1001,
      }}>
        {connected
          ? <><FaLink style={{ color: '#44ff88' }} /><span style={{ color: '#44ff88' }}>Connected</span></>
          : <><FaUnlink style={{ color: '#ff6677' }} /><span style={{ color: '#ff6677' }}>{error ? `Error: ${error}` : 'Connecting…'}</span></>
        }
        <span style={{ color: '#334', marginLeft: 4 }}>{qcarRosbridgeUrl}</span>

        {/* Widget toggles */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {WIDGET_IDS.map((id) => (
            <button
              key={id}
              onClick={() => toggleWidget(id)}
              title={hidden.has(id) ? `Show ${id}` : `Hide ${id}`}
              style={{
                background: hidden.has(id) ? 'transparent' : 'rgba(106,172,204,0.15)',
                border: '1px solid ' + (hidden.has(id) ? '#223' : '#6aaccc'),
                color: hidden.has(id) ? '#334' : '#6aaccc',
                borderRadius: 3, padding: '2px 6px', fontSize: 9,
                cursor: 'pointer', fontFamily: 'monospace',
              }}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* ── Widget canvas — position:relative gives FloatingWidget a real parent ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Offline banner — visible but non-blocking when disconnected */}
        {!connected && (
          <div style={{
            position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
            zIndex: 2000, pointerEvents: 'none',
            background: 'rgba(60,10,10,0.9)', border: '1px solid #662233',
            borderRadius: 6, padding: '6px 18px',
            fontFamily: 'monospace', fontSize: 11, color: '#ff8899',
          }}>
            {error
              ? `rosbridge error: ${error}`
              : qcarRosbridgeUrl
                ? `Connecting to ${qcarRosbridgeUrl}…`
                : 'No QCar rosbridge URL — check ip_config.json'}
          </div>
        )}

        {WIDGET_IDS.filter((id) => !hidden.has(id)).map((id) => {
          const meta = WIDGET_META[id];
          return (
            <FloatingWidget
              key={id}
              title={meta.title}
              icon={meta.icon}
              defaultX={meta.defaultX}
              defaultY={meta.defaultY}
              defaultW={meta.defaultW}
              defaultH={meta.defaultH}
              zIndex={order[id]}
              onFocus={() => bringToFront(id)}
              onClose={() => toggleWidget(id)}
            >
              {renderContent(id)}
            </FloatingWidget>
          );
        })}
      </div>
    </div>
  );
}
