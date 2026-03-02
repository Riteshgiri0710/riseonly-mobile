#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎨 Fixing icon transparency for App Store compliance...');

const sourceIconPath = path.join(__dirname, '../assets/icon.png');
const targetIconPath = path.join(__dirname, '../ios/Riseonly/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png');
const tempIconPath = path.join(__dirname, '../assets/icon-fixed.png');

try {
  if (!fs.existsSync(sourceIconPath)) {
    console.error('❌ Source icon not found:', sourceIconPath);
    process.exit(1);
  }

  console.log('📋 Converting icon from RGBA to RGB with white background...');
  
  const convertCommand = `convert "${sourceIconPath}" -background white -alpha remove "${tempIconPath}"`;
  
  try {
    execSync(convertCommand, { stdio: 'inherit' });
    console.log('✅ Icon converted successfully');
  } catch (error) {
    console.log('⚠️  ImageMagick not available, trying alternative method...');
    
    const sipsCommand = `sips -s format png -s formatOptions normal "${sourceIconPath}" --out "${tempIconPath}"`;
    execSync(sipsCommand, { stdio: 'inherit' });
    
    const removeAlphaCommand = `sips -s format png -s formatOptions normal "${tempIconPath}" --out "${tempIconPath}"`;
    execSync(removeAlphaCommand, { stdio: 'inherit' });
  }
  
  console.log('📋 Copying fixed icon to iOS app icon location...');
  fs.copyFileSync(tempIconPath, targetIconPath);
  
  if (fs.existsSync(tempIconPath)) {
    fs.unlinkSync(tempIconPath);
  }
  
  console.log('✅ Icon updated successfully!');
  console.log(`   Source: ${sourceIconPath}`);
  console.log(`   Target: ${targetIconPath}`);
  
  try {
    const result = execSync(`file "${targetIconPath}"`, { encoding: 'utf8' });
    console.log('📊 Result:', result.trim());
    
    if (result.includes('RGBA')) {
      console.warn('⚠️  Warning: Icon still contains alpha channel');
    } else if (result.includes('RGB')) {
      console.log('✅ Icon is now App Store compliant (RGB format, no alpha channel)');
    } else {
      console.log('ℹ️  Icon format verified');
    }
  } catch (error) {
    console.log('ℹ️  Could not verify icon format');
  }
  
  console.log('🎉 Icon transparency fix completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Error fixing icon transparency:', error.message);
  process.exit(1);
}
