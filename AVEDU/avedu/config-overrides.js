// config-overrides.js
const { detectLocalIP } = require('./scripts/detect-ip');

module.exports = function override(config, env) {
  // Enable async WebAssembly for @react-three/rapier (@dimforge/rapier3d-compat)
  config.experiments = {
    ...(config.experiments || {}),
    asyncWebAssembly: true,
  };

  // Only modify in development
  if (env === 'development') {
    const localIP = detectLocalIP();

    // Configure webpack dev server to allow LAN connections
    if (!config.devServer) {
      config.devServer = {};
    }

    // Allow connections from any host
    config.devServer.allowedHosts = 'all';

    // Bind to all interfaces
    config.devServer.host = '0.0.0.0';

    // Optional: Add custom headers
    config.devServer.headers = {
      'Access-Control-Allow-Origin': '*',
    };

    console.log(`\n🌐 Dev server configured for LAN access on ${localIP}:3000\n`);
  }

  return config;
};
