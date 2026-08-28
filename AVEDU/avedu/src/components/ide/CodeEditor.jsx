// components/ide/CodeEditor.jsx
import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import Editor from "@monaco-editor/react";
import "./CodeEditor.scss";

/**
 * Code editor component using Monaco Editor
 * Supports syntax highlighting for Python, C++, XML, YAML, etc.
 *
 * @param {Object} props
 * @param {string} props.content - File content to display
 * @param {string} props.language - Programming language for syntax highlighting
 * @param {Function} props.onChange - Callback when content changes
 * @param {boolean} props.readOnly - Whether editor is read-only
 * @param {string} props.theme - Editor theme ("vs-dark" or "light")
 */
export function CodeEditor({
  content = "",
  language = "python",
  onChange,
  readOnly = false,
  theme = "vs-dark",
}) {
  const editorRef = useRef(null);

  // Detect language from filename extension
  const detectLanguage = (filename) => {
    if (!filename) return language;

    const ext = filename.split(".").pop().toLowerCase();
    const languageMap = {
      py: "python",
      cpp: "cpp",
      c: "c",
      h: "cpp",
      hpp: "cpp",
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      xml: "xml",
      urdf: "xml",
      xacro: "xml",
      yaml: "yaml",
      yml: "yaml",
      json: "json",
      md: "markdown",
      txt: "plaintext",
      sh: "shell",
      bash: "shell",
    };

    return languageMap[ext] || "plaintext";
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure Monaco editor
    monaco.editor.defineTheme("ros-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0b1020",
        "editor.foreground": "#e6f1ff",
        "editorCursor.foreground": "#7df9ff",
        "editor.lineHighlightBackground": "#1a1f2e",
        "editorLineNumber.foreground": "#475569",
        "editor.selectionBackground": "#7df9ff40",
        "editor.inactiveSelectionBackground": "#7df9ff20",
      },
    });

    monaco.editor.setTheme("ros-dark");

    // Enable format on paste
    editor.updateOptions({
      formatOnPaste: true,
      formatOnType: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: "on",
      renderWhitespace: "selection",
      tabSize: 4,
      insertSpaces: true,
    });
  };

  const handleChange = (value) => {
    onChange?.(value);
  };

  return (
    <div className="code-editor">
      <Editor
        height="100%"
        language={language}
        value={content}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme={theme === "light" ? "light" : "ros-dark"}
        options={{
          readOnly,
          automaticLayout: true, // Auto-layout handles resize (container constraints prevent infinite growth)
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
          },
        }}
        loading={
          <div className="code-editor__loading">
            <div className="code-editor__spinner"></div>
            <span>Loading editor...</span>
          </div>
        }
      />
    </div>
  );
}

CodeEditor.propTypes = {
  content: PropTypes.string,
  language: PropTypes.string,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  theme: PropTypes.string,
};

export default CodeEditor;
