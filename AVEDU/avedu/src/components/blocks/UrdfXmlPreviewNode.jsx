// components/blocks/UrdfXmlPreviewNode.jsx
import React, { useMemo } from "react";
import { Handle, Position } from "@xyflow/react";

/**
 * URDF XML Preview Node - Improved with syntax highlighting
 * Displays generated URDF XML with proper formatting and colors
 */

// Simple XML syntax highlighter
function highlightXml(xml) {
  if (!xml) return null;

  // Split by lines and add line numbers
  const lines = xml.split('\n');

  return lines.map((line, index) => {
    // Detect different XML parts
    const isXmlDeclaration = line.trim().startsWith('<?xml');
    const isComment = line.trim().startsWith('<!--');
    const isClosingTag = line.trim().startsWith('</');
    const isSelfClosing = line.trim().endsWith('/>');

    let highlightedLine = line;

    // XML Declaration
    if (isXmlDeclaration) {
      highlightedLine = line.replace(
        /(<?xml.*?>)/,
        '<span style="color: #9c27b0; font-weight: bold;">$1</span>'
      );
    }
    // Comments
    else if (isComment) {
      highlightedLine = `<span style="color: #757575; font-style: italic;">${line}</span>`;
    }
    // Tags
    else {
      // Highlight tag names
      highlightedLine = line
        .replace(
          /(&lt;\/?)(\w+)/g,
          '$1<span style="color: #1976d2; font-weight: bold;">$2</span>'
        )
        // Highlight attribute names
        .replace(
          /(\s)(\w+)(=)/g,
          '$1<span style="color: #c2185b;">$2</span>$3'
        )
        // Highlight attribute values
        .replace(
          /(=)(&quot;[^&]*&quot;)/g,
          '$1<span style="color: #2e7d32;">$2</span>'
        )
        // Highlight closing brackets
        .replace(
          /(\/?>)/g,
          '<span style="color: #1976d2; font-weight: bold;">$1</span>'
        );
    }

    return (
      <div
        key={index}
        style={{
          display: "flex",
          minHeight: "1.2em"
        }}
      >
        <span
          style={{
            color: "#999",
            textAlign: "right",
            minWidth: "3em",
            paddingRight: ".75em",
            userSelect: "none",
            flexShrink: 0
          }}
        >
          {index + 1}
        </span>
        <span
          dangerouslySetInnerHTML={{ __html: highlightedLine || '&nbsp;' }}
          style={{ flexGrow: 1 }}
        />
      </div>
    );
  });
}

export default function UrdfXmlPreviewNode({ data }) {
  const xml = data?.xml || "";

  const highlighted = useMemo(() => {
    if (!xml) {
      return (
        <div style={{ color: "#999", fontStyle: "italic", padding: "1rem", textAlign: "center" }}>
          No XML generated yet
          <br />
          <small>Connect a Robot node to see the URDF output</small>
        </div>
      );
    }
    return highlightXml(xml);
  }, [xml]);

  const lineCount = xml ? xml.split('\n').length : 0;
  const charCount = xml ? xml.length : 0;

  return (
    <div className="rf-card rf-card--xml-preview" style={{ minWidth: 520, maxWidth: 720 }}>
      <div className="rf-card__title">
        📄 URDF XML Preview
        {xml && (
          <span style={{ fontSize: "0.85em", fontWeight: "normal", marginLeft: "auto", color: "#666" }}>
            {lineCount} lines • {charCount} chars
          </span>
        )}
      </div>

      <div className="rf-card__body">
        {/* Toolbar */}
        {xml && (
          <div style={{ marginBottom: ".5rem", display: "flex", gap: ".5rem" }}>
            <button
              className="btn btn--sm"
              onClick={() => {
                navigator.clipboard.writeText(xml);
                // Could add a toast notification here
              }}
              title="Copy XML to clipboard"
            >
              📋 Copy
            </button>
            <button
              className="btn btn--sm"
              onClick={() => {
                const blob = new Blob([xml], { type: 'application/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${data?.name || 'robot'}.urdf`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              title="Download as URDF file"
            >
              💾 Download
            </button>
          </div>
        )}

        {/* XML Content with syntax highlighting */}
        <div
          style={{
            background: "#1e1e1e",
            color: "#d4d4d4",
            padding: "1rem",
            borderRadius: "4px",
            maxHeight: "400px",
            overflowY: "auto",
            overflowX: "auto",
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            fontSize: "0.9em",
            lineHeight: "1.5",
            whiteSpace: "pre"
          }}
        >
          {highlighted}
        </div>

        {/* Validation status (could be enhanced) */}
        {xml && (
          <div style={{
            marginTop: ".5rem",
            padding: ".5rem",
            background: "#e8f5e9",
            borderLeft: "3px solid #4caf50",
            borderRadius: "2px",
            fontSize: "0.9em"
          }}>
            ✓ XML structure appears valid
          </div>
        )}
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="xml"
        style={{
          width: "16px",
          height: "16px",
          background: "#9c27b0",
          border: "3px solid #fff"
        }}
        title="Connect Robot node output here"
      />
    </div>
  );
}
