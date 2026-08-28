// components/ide/TerminalTabs.jsx
//
// Wraps multiple <Terminal> instances behind a tab bar. Each tab opens its
// own WebSocket → its own PTY in the same Docker container, so opening a
// second tab does NOT kill the first tab's running process.
//
// All tabs stay mounted (display:none on inactive ones) so xterm history,
// running processes, and the PTY survive switching back and forth.
//
// Only the active tab listens for ConvertToCodeNode's "executeCommand"
// events — see Terminal's `isActive` prop.

import React, { useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { IoTerminal } from "react-icons/io5";
import { Terminal } from "./Terminal";
import "./TerminalTabs.scss";

export function TerminalTabs({
  canvasId,
  onCommandExecute,
  workingDirectory,
  username,
}) {
  const nextIdRef = useRef(2);

  const [tabs, setTabs] = useState([{ id: 1, name: "Terminal 1" }]);
  const [activeTabId, setActiveTabId] = useState(1);

  const addTab = useCallback(() => {
    const id = nextIdRef.current++;
    setTabs((prev) => [...prev, { id, name: `Terminal ${id}` }]);
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((id) => {
    setTabs((prev) => {
      if (prev.length <= 1) return prev; // always keep one tab open
      const next = prev.filter((t) => t.id !== id);
      // If the closed tab was active, focus the previous one.
      setActiveTabId((cur) => {
        if (cur !== id) return cur;
        const closedIdx = prev.findIndex((t) => t.id === id);
        const fallback = prev[closedIdx - 1] || prev[closedIdx + 1] || next[0];
        return fallback.id;
      });
      return next;
    });
  }, []);

  return (
    <div className="terminal-tabs">
      <div className="terminal-tabs__bar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={`terminal-tabs__tab ${isActive ? "terminal-tabs__tab--active" : ""}`}
              onClick={() => setActiveTabId(tab.id)}
              role="tab"
              aria-selected={isActive}
            >
              <IoTerminal className="terminal-tabs__tab-icon" />
              <span className="terminal-tabs__tab-label">{tab.name}</span>
              {tabs.length > 1 && (
                <button
                  className="terminal-tabs__tab-close"
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                  title="Close tab"
                  aria-label={`Close ${tab.name}`}
                >
                  <IoMdClose />
                </button>
              )}
            </div>
          );
        })}
        <button
          className="terminal-tabs__add"
          onClick={addTab}
          title="New terminal"
          aria-label="New terminal"
        >
          <IoMdAdd />
        </button>
      </div>

      <div className="terminal-tabs__panes">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className="terminal-tabs__pane"
              style={{ display: isActive ? "block" : "none" }}
            >
              <Terminal
                canvasId={canvasId}
                onCommandExecute={onCommandExecute}
                workingDirectory={workingDirectory}
                username={username}
                isActive={isActive}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

TerminalTabs.propTypes = {
  canvasId:          PropTypes.string,
  onCommandExecute:  PropTypes.func,
  workingDirectory:  PropTypes.string,
  username:          PropTypes.string,
};

export default TerminalTabs;
