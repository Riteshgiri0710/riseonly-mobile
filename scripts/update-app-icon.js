#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🎨 Updating app icon with transparency fix...');

try {
  const fixScriptPath = path.join(__dirname, 'fix-icon-transparency.js');
  execSync(`node ${fixScriptPath}`, { stdio: 'inherit' });
  
  console.log('✅ App icon updated and transparency fixed successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Error updating app icon:', error.message);
  process.exit(1);
}
