# ROS Visualization Components

This directory contains React components for visualizing ROS2 topics and sensor data in the browser using `ros3d` and `ros2d` libraries.

## Components

### LidarVisualizer

Real-time LIDAR (LaserScan) visualization component with dual 3D and 2D views.

#### Usage

```jsx
import LidarVisualizer from '../../components/visualization/LidarVisualizer';
import { useRoslib } from '../../hooks/useRoslib';

function MyComponent() {
  const { ros, connected } = useRoslib();

  return (
    <LidarVisualizer
      ros={ros.current}
      lidarTopic="/qcar/lidar/scan"
      fixedFrame="base_link"
      mode="both"
    />
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ros` | `ROSLIB.Ros` | *required* | ROS connection instance |
| `lidarTopic` | `string` | `'/qcar/lidar/scan'` | Topic name for LaserScan messages |
| `fixedFrame` | `string` | `'base_link'` | TF frame for coordinate system |
| `mode` | `'3d' \| '2d' \| 'both'` | `'both'` | Visualization mode |

#### Features

- ✅ **3D View** (ros3d):
  - Interactive camera controls (rotate, zoom, pan)
  - Cyan point cloud for LIDAR detections
  - Coordinate axes and grid
  - TF frame support

- ✅ **2D Top-Down View** (ros2d):
  - Bird's-eye map view
  - Orange robot position marker
  - Cyan LIDAR scan points
  - Grid overlay

- ✅ **Status Monitoring**:
  - Connection indicator
  - Topic name display
  - Scan count tracker
  - Frame info

#### Example Scenarios

**Obstacle Detection**:
```jsx
<LidarVisualizer
  ros={ros.current}
  lidarTopic="/scan"
  mode="2d"  // Top-down view best for obstacle avoidance
/>
```

**3D Environment Mapping**:
```jsx
<LidarVisualizer
  ros={ros.current}
  lidarTopic="/velodyne/scan"
  mode="3d"  // 3D view for complex environments
  fixedFrame="map"
/>
```

**Educational Demonstration**:
```jsx
<LidarVisualizer
  ros={ros.current}
  lidarTopic="/qcar/lidar/scan"
  mode="both"  // Show both views for learning
/>
```

---

## Future Components

### CameraVisualizer (Planned)

Display camera feeds with computer vision overlays.

```jsx
// Coming soon!
<CameraVisualizer
  ros={ros.current}
  imageTopic="/camera/image_raw"
  detectionsTopic="/detected_objects"
  showBoundingBoxes={true}
/>
```

### PathPlanningVisualizer (Planned)

Visualize navigation paths and waypoints.

```jsx
// Coming soon!
<PathPlanningVisualizer
  ros={ros.current}
  pathTopic="/planned_path"
  goalTopic="/goal_pose"
  mode="both"
/>
```

### OccupancyGridVisualizer (Planned)

Display SLAM maps and occupancy grids.

```jsx
// Coming soon!
<OccupancyGridVisualizer
  ros={ros.current}
  mapTopic="/map"
  robotTopic="/robot_pose"
  showPath={true}
/>
```

### TFTreeVisualizer (Planned)

Interactive TF tree visualization.

```jsx
// Coming soon!
<TFTreeVisualizer
  ros={ros.current}
  fixedFrame="world"
  showLabels={true}
/>
```

---

## Development Guidelines

### Creating New Visualizers

1. **Use ros3d/ros2d when possible**:
   - Don't reinvent the wheel
   - Leverage standard ROS visualization tools
   - Follow established patterns

2. **Component Structure**:
   ```jsx
   export default function MyVisualizer({ ros, topic, options }) {
     const viewerRef = useRef(null);
     const [viewer, setViewer] = useState(null);
     const [isConnected, setIsConnected] = useState(false);

     // Initialize ROS connection
     useEffect(() => {
       if (!ros) return;
       // Setup connection handlers
     }, [ros]);

     // Initialize viewer
     useEffect(() => {
       if (!isConnected) return;
       // Create ros3d.Viewer or ros2d.Viewer
     }, [isConnected]);

     return <div ref={viewerRef} id="viewer" />;
   }
   ```

3. **Handle Disconnections**:
   - Show clear "not connected" state
   - Clean up subscriptions on unmount
   - Gracefully handle errors

4. **Performance**:
   - Use throttle_rate for high-frequency topics
   - Clean up Three.js objects properly
   - Avoid memory leaks with useEffect cleanup

5. **Accessibility**:
   - Provide status messages
   - Add helpful instructions
   - Include loading states

### Styling Guidelines

Use inline styles for consistency with the codebase:

```jsx
<div style={{
  backgroundColor: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '8px',
  padding: '1rem'
}}>
  {/* Content */}
</div>
```

### Color Palette

Standard colors for consistency:

- **Background**: `#111111` (dark), `#1a1a1a` (card)
- **Border**: `#333333`
- **Text**: `#ffffff` (primary), `#aaa` (secondary), `#666` (tertiary)
- **Accent**: `#00ffff` (cyan - LIDAR)
- **Success**: `#00ff00` (green - connected)
- **Error**: `#ff0000` (red - obstacles)
- **Warning**: `#ffaa00` (orange - robot)

---

## Dependencies

```json
{
  "ros3d": "^1.1.0",
  "roslib": "^1.4.1",
  "three": "^0.169.0"
}
```

**Note**: The 2D visualization uses native HTML5 Canvas instead of ros2d for better compatibility and no additional dependencies.

### Peer Dependencies

- React 19+
- Modern browser with WebGL support

---

## Testing

### Unit Testing (TODO)

```jsx
import { render, screen } from '@testing-library/react';
import LidarVisualizer from './LidarVisualizer';

test('shows not connected message when ROS is null', () => {
  render(<LidarVisualizer ros={null} />);
  expect(screen.getByText(/not connected/i)).toBeInTheDocument();
});
```

### Integration Testing

1. Start ROS2 simulation
2. Launch frontend: `npm start`
3. Navigate to component
4. Verify:
   - ✅ Connection indicator shows green
   - ✅ Scan count increments
   - ✅ 3D/2D views render
   - ✅ No console errors

### Performance Testing

Monitor performance with React DevTools:
- Component should re-render < 60 times/sec
- Memory usage should be stable (no leaks)
- Frame rate should stay > 25 FPS

---

## Troubleshooting

### "Cannot read property 'Viewer' of undefined"

**Cause**: ros3d or ros2d not imported correctly

**Fix**:
```jsx
import * as ROS3D from 'ros3d';
import * as ROS2D from 'ros2d';
```

### "WebGL context lost"

**Cause**: Too many Three.js contexts or memory leak

**Fix**: Ensure cleanup in useEffect:
```jsx
return () => {
  viewer.scene.clear();
  viewer = null;
};
```

### "Topic not receiving data"

**Cause**: rosbridge not connected or topic mismatch

**Fix**:
1. Check rosbridge: `ros2 node list | grep rosbridge`
2. Verify topic: `ros2 topic list | grep /qcar/lidar`
3. Check message type matches

### "Viewer is black/empty"

**Cause**: Camera position or lighting issues

**Fix**:
```jsx
viewer.camera.position.set(0, -3, 2);
viewer.camera.lookAt(new THREE.Vector3(0, 0, 0));
```

---

## Examples

See these files for implementation examples:
- `AVEDU/avedu/src/levels/slidesSensing/02a-LidarSubscriberInteractive.jsx`
- `AVEDU/avedu/src/hooks/useRoslib.js`

---

## License

Part of the L.A.D (Learning Autonomous Driving) platform.

---

**Contributing**: When adding new visualizers, please:
1. Follow the existing component structure
2. Add comprehensive props documentation
3. Include usage examples
4. Update this README
5. Test with real ROS2 data
