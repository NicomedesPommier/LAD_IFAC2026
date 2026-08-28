#!/usr/bin/env node
// scripts/set-ip.js - Manually set the IP address for L.A.D platform

const fs = require('fs');
const path = require('path');

// Get IP from command line argument
const newIP = process.argv[2];

if (!newIP) {
  console.error('\n❌ Error: Please provide an IP address\n');
  console.log('Usage:');
  console.log('  node scripts/set-ip.js <IP_ADDRESS>\n');
  console.log('Example:');
  console.log('  node scripts/set-ip.js 0.0.0.0\n');
  process.exit(1);
}

// Validate IP format
const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
if (!ipRegex.test(newIP)) {
  console.error('\n❌ Error: Invalid IP address format\n');
  console.log('Please provide a valid IPv4 address\n');
  process.exit(1);
}

// Validate IP ranges
const parts = newIP.split('.');
if (parts.some(part => parseInt(part) > 255)) {
  console.error('\n❌ Error: IP address octets must be between 0-255\n');
  process.exit(1);
}

// Update config file
const configPath = path.join(__dirname, '../config/ip_config.json');

try {
  // Ensure config directory exists
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Read existing config or create new
  let config = { exposed_ip: newIP };
  if (fs.existsSync(configPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config = { ...existing, exposed_ip: newIP };
    } catch (err) {
      console.warn('⚠️  Could not parse existing config, creating new one');
    }
  }

  // Write updated config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

  console.log('\n✅ Successfully updated IP configuration!\n');
  console.log(`   IP Address: ${newIP}\n`);
  console.log('📝 Updated file: config/ip_config.json\n');
  console.log('🔄 Next steps:');
  console.log('   1. Restart your backend (Django)');
  console.log('   2. Restart your ROS Docker container');
  console.log('   3. Restart your frontend (npm start)');
  console.log('\n💡 Or simply run: npm start (for frontend only)\n');

} catch (err) {
  console.error('\n❌ Error updating IP config:', err.message);
  process.exit(1);
}
