// scripts/detect-ip.js
const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Detects the local network IP address (not localhost/127.0.0.1)
 * @returns {string} The first non-internal IPv4 address found
 */
function detectLocalIP() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) addresses and IPv6
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  // Fallback to localhost if no network interface found
  return '127.0.0.1';
}

/**
 * Updates the config/ip_config.json file with the detected IP
 */
function updateIPConfig() {
  const detectedIP = detectLocalIP();
  const configPath = path.resolve(__dirname, '../../../config/ip_config.json');

  console.log(`\n🔍 Detected local IP: ${detectedIP}`);

  try {
    // Ensure config directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Read existing config or create new
    let config = { exposed_ip: detectedIP };
    if (fs.existsSync(configPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (existing.exposed_ip === detectedIP) {
          console.log(`✅ IP config already up to date: ${detectedIP}`);
          return detectedIP;
        }
        config = { ...existing, exposed_ip: detectedIP };
      } catch (err) {
        console.warn('⚠️  Could not parse existing config, creating new one');
      }
    }

    // Write updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    console.log(`✅ Updated config/ip_config.json with IP: ${detectedIP}\n`);

  } catch (err) {
    console.error('❌ Error updating IP config:', err.message);
  }

  return detectedIP;
}

// Run if called directly
if (require.main === module) {
  const ip = updateIPConfig();
  console.log(`\n🌐 Your app will be accessible at:`);
  console.log(`   Local:   http://localhost:3000`);
  console.log(`   Network: http://${ip}:3000\n`);
}

module.exports = { detectLocalIP, updateIPConfig };
