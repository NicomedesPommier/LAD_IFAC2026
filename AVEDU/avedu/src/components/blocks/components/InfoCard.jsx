import React from "react";

/**
 * Boxed callout with optional title — used for "📍 Calculated Center"-style
 * info panels. Picks up the parent NodeCard's accent if available, otherwise
 * pass `tone` for a neutral / info / warn variant.
 *
 *   <InfoCard title="📌 World Frame">
 *     This is the root of your TF tree.
 *   </InfoCard>
 *
 *   <InfoCard title="📍 Calculated Center" tone="orange">
 *     <VectorReadout values={[cx, cy, cz]} />
 *   </InfoCard>
 */
export default function InfoCard({ title, children, tone }) {
  const cls = tone ? `rf-info-card rf-info-card--${tone}` : "rf-info-card";
  return (
    <div className={cls}>
      {title && <div className="rf-info-card__title">{title}</div>}
      <div className="rf-info-card__body">{children}</div>
    </div>
  );
}
