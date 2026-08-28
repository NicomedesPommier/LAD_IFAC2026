// ResizeHandle — thin draggable separator between tiled panels.
// Wraps react-resizable-panels' <Separator> with a centered grip.

import React from 'react';
import { Separator } from 'react-resizable-panels';

export default function ResizeHandle({ orientation = 'horizontal' }) {
  return (
    <Separator className={`resize-handle resize-handle--${orientation}`}>
      <div className="resize-handle__grip" />
    </Separator>
  );
}
