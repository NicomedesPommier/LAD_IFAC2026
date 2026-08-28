/**
 * FloatingWidget.jsx
 *
 * A draggable, resizable floating window that can be placed anywhere
 * inside its `position:relative` parent container.
 *
 * Props:
 *   title        — window title bar text
 *   icon         — emoji / short string shown left of the title
 *   children     — window content
 *   defaultX/Y   — initial position in px
 *   defaultW/H   — initial size in px
 *   minW/minH    — minimum size constraints
 *   zIndex       — stack order (higher = on top)
 *   onFocus      — called on mousedown so parent can raise z-index
 *   onClose      — called when the ✕ button is clicked
 */

import React from 'react';
import { Rnd } from 'react-rnd';

export default function FloatingWidget({
  title,
  icon = '',
  children,
  defaultX   = 20,
  defaultY   = 20,
  defaultW   = 320,
  defaultH   = 260,
  minW       = 180,
  minH       = 100,
  zIndex     = 10,
  onFocus,
  onClose,
}) {
  return (
    <Rnd
      default={{ x: defaultX, y: defaultY, width: defaultW, height: defaultH }}
      minWidth={minW}
      minHeight={minH}
      bounds="parent"
      dragHandleClassName="fw-drag"
      onMouseDown={onFocus}
      style={{ zIndex, position: 'absolute' }}
      enableResizing={{
        top: true, right: true, bottom: true, left: true,
        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true,
      }}
      resizeHandleStyles={{
        topRight:    { cursor: 'ne-resize' },
        bottomRight: { cursor: 'se-resize' },
        bottomLeft:  { cursor: 'sw-resize' },
        topLeft:     { cursor: 'nw-resize' },
      }}
    >
      {/* Window chrome */}
      <div style={styles.window}>

        {/* ── Title bar (drag handle) ──────────────────────────────────── */}
        <div
          className="fw-drag"
          style={styles.titleBar}
          onMouseDown={onFocus}
        >
          {icon && <span style={styles.icon}>{icon}</span>}
          <span style={styles.title}>{title}</span>
          <button
            style={styles.closeBtn}
            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ff6688'; e.currentTarget.style.background = 'rgba(255,60,80,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#3a5a6a'; e.currentTarget.style.background = 'transparent'; }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Content area ─────────────────────────────────────────────── */}
        <div style={styles.content}>
          {children}
        </div>

      </div>
    </Rnd>
  );
}

const styles = {
  window: {
    width:          '100%',
    height:         '100%',
    display:        'flex',
    flexDirection:  'column',
    background:     'rgba(9, 12, 22, 0.96)',
    border:         '1px solid #1c3a52',
    borderRadius:   7,
    overflow:       'hidden',
    boxShadow:      '0 6px 32px rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)',
  },
  titleBar: {
    display:        'flex',
    alignItems:     'center',
    gap:            6,
    padding:        '5px 8px 5px 10px',
    background:     'linear-gradient(90deg, #0a1828 0%, #0d2035 100%)',
    borderBottom:   '1px solid #1c3a52',
    cursor:         'grab',
    userSelect:     'none',
    flexShrink:     0,
  },
  icon: {
    fontSize:       13,
    lineHeight:     1,
    flexShrink:     0,
  },
  title: {
    flex:           1,
    fontSize:       11,
    fontFamily:     'monospace',
    color:          '#6aaccc',
    fontWeight:     'bold',
    letterSpacing:  '0.06em',
    textTransform:  'uppercase',
    overflow:       'hidden',
    textOverflow:   'ellipsis',
    whiteSpace:     'nowrap',
  },
  closeBtn: {
    background:     'transparent',
    border:         'none',
    color:          '#3a5a6a',
    cursor:         'pointer',
    fontSize:       13,
    lineHeight:     1,
    padding:        '2px 4px',
    borderRadius:   3,
    flexShrink:     0,
    transition:     'color 0.15s, background 0.15s',
  },
  content: {
    flex:           1,
    overflow:       'hidden',
    position:       'relative',
    display:        'flex',
    flexDirection:  'column',
  },
};
