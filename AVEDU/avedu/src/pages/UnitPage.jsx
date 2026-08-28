import React from "react";
import { useOutletContext, useParams, Outlet } from "react-router-dom";

export default function UnitPage() {
  // Fallback to an empty object so destructuring doesn't crash
  const outlet = useOutletContext?.() || {};
  const units = outlet.units ?? [];            // ⬅️ safe default
  const reload = outlet.reload ?? (() => {});  // optional

  const { unitSlug, levelSlug } = useParams();
  const unit = units.find(u => u.slug === unitSlug);  // ⬅️ now safe, units is []

  if (levelSlug) return <Outlet />;

  if (!unit) return <div className="placeholder">Select a Unit</div>;

  return (
    <div className="level-wrap">
      <header className="level-header">
        <h1>{unit.title}</h1>
        <ul className="objectives">
          <li><span>Levels in this unit:</span></li>
          {unit.levels.map(l => (
            <li key={l.slug}>
              <span>{l.title}</span>
              {l.user_progress?.completed && <b> ✔ </b>}
            </li>
          ))}
        </ul>
      </header>
      <div className="placeholder">Choose a level from the left to start</div>
    </div>
  );
}
