/**
 * SimWidget.jsx
 *
 * Generic wrapper for a simulator panel widget. Provides:
 *  • A title bar with optional toggle-visibility button
 *  • A scrollable/overflowing content area that fills the remaining space
 *
 * Usage:
 *   <SimWidget title="ROS Camera Feed" icon="📷">
 *     <RosRxPanel fill />
 *   </SimWidget>
 */

import React, { useState } from 'react';

export default function SimWidget({ title, icon = '', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={styles.root}>
      {/* ── Title bar ─────────────────────────────────────────────────── */}
      <div style={styles.titleBar} onDoubleClick={() => setOpen(o => !o)}>
        <span style={styles.titleIcon}>{icon}</span>
        <span style={styles.titleText}>{title}</span>
        <button
          style={styles.collapseBtn}
          onClick={() => setOpen(o => !o)}
          title={open ? 'Collapse' : 'Expand'}
        >
          {open ? '▲' : '▼'}
        </button>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      {/* Collapsing hides the content via CSS rather than unmounting it, so
          toggling a widget never tears down / reconnects its children
          (e.g. ROS subscriptions, camera feeds). */}
      <div style={{ ...styles.content, display: open ? 'flex' : 'none' }}>
        {children}
      </div>
    </div>
  );
}

const styles = {
  root: {
    display:        'flex',
    flexDirection:  'column',
    height:         '100%',
    background:     'rgba(12, 14, 24, 0.97)',
    borderLeft:     '1px solid #1c2e3e',
    borderBottom:   '1px solid #1c2e3e',
    overflow:       'hidden',
  },
  titleBar: {
    display:        'flex',
    alignItems:     'center',
    gap:            '6px',
    padding:        '4px 8px',
    background:     '#0d1a2a',
    borderBottom:   '1px solid #1c2e3e',
    flexShrink:     0,
    cursor:         'default',
    userSelect:     'none',
  },
  titleIcon: {
    fontSize:       12,
  },
  titleText: {
    flex:           1,
    fontSize:       11,
    fontFamily:     'monospace',
    color:          '#5a8aaa',
    fontWeight:     'bold',
    letterSpacing:  '0.05em',
    textTransform:  'uppercase',
  },
  collapseBtn: {
    background:     'transparent',
    border:         'none',
    color:          '#3a5a6a',
    cursor:         'pointer',
    fontSize:       10,
    padding:        '0 2px',
    lineHeight:     1,
  },
  content: {
    flex:           1,
    overflow:       'hidden',
    position:       'relative',
    display:        'flex',
    flexDirection:  'column',
  },
};
