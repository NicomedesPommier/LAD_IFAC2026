// Catalogue of dockable widgets shown in MapRunner.
// `id` → { title, icon }. Rendering of each id's content lives in MapRunner
// (renderContent), since it needs the runner's refs and canvasId.

export const WIDGETS = {
  'camera-ros': { title: 'ROS Camera' },
  'cameras':    { title: 'All Cameras' },
  'lidar':      { title: 'LIDAR 2D' },
  'ros-params': { title: 'ROS Params' },
};
