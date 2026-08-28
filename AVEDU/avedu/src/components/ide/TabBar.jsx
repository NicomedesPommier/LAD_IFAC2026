// components/ide/TabBar.jsx
import React from "react";
import PropTypes from "prop-types";
import { FaPython } from "react-icons/fa";
import { IoTerminal } from "react-icons/io5";
import "./TabBar.scss";

/**
 * TabBar component for managing multiple open files
 *
 * @param {Object} props
 * @param {Array} props.tabs - Array of tab objects {path, name, unsaved, type}
 * @param {string} props.activeTab - Path of the currently active tab
 * @param {Function} props.onTabSelect - Callback when tab is selected
 * @param {Function} props.onTabClose - Callback when tab is closed
 * @param {Function} props.onNewTab - Callback to create new tab
 */
export function TabBar({
  tabs = [],
  activeTab = null,
  onTabSelect,
  onTabClose,
  onNewTab,
}) {
  // Get file icon based on extension
  const getFileIcon = (name, type) => {
    if (type === "terminal") return <IoTerminal />;

    const ext = name.split(".").pop().toLowerCase();
    const iconMap = {
      py: <FaPython />,
      cpp: "⚙️",
      h: "⚙️",
      xml: "📄",
      yaml: "📋",
      yml: "📋",
      urdf: "🤖",
      xacro: "🤖",
      launch: "🚀",
      md: "📝",
      txt: "📝",
      js: "📜",
      jsx: "⚛️",
      ts: "📘",
      tsx: "⚛️",
    };

    return iconMap[ext] || "📄";
  };

  return (
    <div className="tab-bar">
      <div className="tab-bar__tabs">
        {tabs.map((tab) => (
          <div
            key={tab.path}
            className={`tab ${activeTab === tab.path ? "tab--active" : ""}`}
            onClick={() => onTabSelect?.(tab.path)}
            title={tab.path}
          >
            <span className="tab__icon">
              {getFileIcon(tab.name, tab.type)}
            </span>
            <span className="tab__name">{tab.name}</span>
            {tab.unsaved && (
              <span className="tab__badge" title="Unsaved changes">
                ●
              </span>
            )}
            <button
              className="tab__close"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose?.(tab.path);
              }}
              title="Close tab"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {onNewTab && (
        <button
          className="tab-bar__new"
          onClick={onNewTab}
          title="New file"
        >
          +
        </button>
      )}
    </div>
  );
}

TabBar.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      unsaved: PropTypes.bool,
      type: PropTypes.string,
    })
  ),
  activeTab: PropTypes.string,
  onTabSelect: PropTypes.func,
  onTabClose: PropTypes.func,
  onNewTab: PropTypes.func,
};

export default TabBar;
