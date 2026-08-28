// src/pages/SimPage.jsx
// Route: /sim
// Renders the Rapier physics scene — QCar dropping onto a flat ground plane.

import React from 'react';
import QCarPhysicsScene from '../components/gazebo/QCarPhysicsScene';

export default function SimPage() {
  return <QCarPhysicsScene />;
}
