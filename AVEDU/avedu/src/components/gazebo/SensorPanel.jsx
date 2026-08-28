// src/components/gazebo/SensorPanel.jsx
import React from "react";

export default function SensorPanel({ title, icon, data }) {
  return (
    <div className="sensor-panel">
      <div className="sensor-panel__header">
        <span className="sensor-panel__icon">{icon}</span>
        <h4 className="sensor-panel__title">{title}</h4>
      </div>

      <div className="sensor-panel__body">
        {data && Object.keys(data).length > 0 ? (
          <table className="sensor-table">
            <tbody>
              {Object.entries(data).map(([key, value]) => (
                <tr key={key}>
                  <td className="sensor-table__label">{key}:</td>
                  <td className="sensor-table__value">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="sensor-panel__empty">
            No data
          </div>
        )}
      </div>
    </div>
  );
}
