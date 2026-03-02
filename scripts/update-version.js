#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📱 Updating app version...');

function getNextVersion(currentVersion, type = 'patch') {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function getNextBuildNumber(currentBuildNumber) {
  return (parseInt(currentBuildNumber) + 1).toString();
}

function updateAppConfig(newVersion, newBuildNumber) {
  const configPath = path.join(__dirname, '../app.config.ts');
  
  if (!fs.existsSync(configPath)) {
    console.log('❌ app.config.ts not found');
    return false;
  }
  
  try {
    let content = fs.readFileSync(configPath, 'utf8');
    
    content = content.replace(
      /version:\s*['"`][^'"`]*['"`]/,
      `version: '${newVersion}'`
    );
    
    content = content.replace(
      /buildNumber:\s*['"`][^'"`]*['"`]/,
      `buildNumber: '${newBuildNumber}'`
    );
    
    fs.writeFileSync(configPath, content, 'utf8');
    console.log('✅ app.config.ts updated');
    return true;
  } catch (error) {
    console.error('❌ Error updating app.config.ts:', error.message);
    return false;
  }
}

function updatePackageJson(newVersion) {
  const packagePath = path.join(__dirname, '../package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('⚠️  package.json not found, skipping...');
    return true;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    packageJson.version = newVersion;
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    console.log('✅ package.json updated');
    return true;
  } catch (error) {
    console.error('❌ Error updating package.json:', error.message);
    return false;
  }
}

function updateIOSInfoPlist(newVersion, newBuildNumber) {
  const infoPlistPath = path.join(__dirname, '../ios/Riseonly/Info.plist');
  
  if (!fs.existsSync(infoPlistPath)) {
    console.log('⚠️  iOS Info.plist not found, skipping...');
    return true;
  }
  
  try {
    let content = fs.readFileSync(infoPlistPath, 'utf8');
    
    content = content.replace(
      /<key>CFBundleShortVersionString<\/key>\s*<string>[^<]*<\/string>/,
      `<key>CFBundleShortVersionString</key>\n\t<string>${newVersion}</string>`
    );
    
    content = content.replace(
      /<key>CFBundleVersion<\/key>\s*<string>[^<]*<\/string>/,
      `<key>CFBundleVersion</key>\n\t<string>${newBuildNumber}</string>`
    );
    
    fs.writeFileSync(infoPlistPath, content, 'utf8');
    console.log('✅ iOS Info.plist updated');
    return true;
  } catch (error) {
    console.error('❌ Error updating iOS Info.plist:', error.message);
    return false;
  }
}

function updateAndroidBuildGradle(newVersion, newBuildNumber) {
  const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
  
  if (!fs.existsSync(buildGradlePath)) {
    console.log('⚠️  Android build.gradle not found, skipping...');
    return true;
  }
  
  try {
    let content = fs.readFileSync(buildGradlePath, 'utf8');
    
    content = content.replace(
      /versionName\s+["'][^"']*["']/,
      `versionName "${newVersion}"`
    );
    
    content = content.replace(
      /versionCode\s+\d+/,
      `versionCode ${newBuildNumber}`
    );
    
    fs.writeFileSync(buildGradlePath, content, 'utf8');
    console.log('✅ Android build.gradle updated');
    return true;
  } catch (error) {
    console.error('❌ Error updating Android build.gradle:', error.message);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch';
  
  if (!['major', 'minor', 'patch'].includes(versionType)) {
    console.log('❌ Invalid version type. Use: major, minor, or patch');
    console.log('Usage: node scripts/update-version.js [major|minor|patch]');
    process.exit(1);
  }
  
  try {
    const configPath = path.join(__dirname, '../app.config.ts');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    const versionMatch = configContent.match(/version:\s*['"`]([^'"`]*)['"`]/);
    const buildNumberMatch = configContent.match(/buildNumber:\s*['"`]([^'"`]*)['"`]/);
    
    if (!versionMatch || !buildNumberMatch) {
      console.log('❌ Could not find version or buildNumber in app.config.ts');
      process.exit(1);
    }
    
    const currentVersion = versionMatch[1];
    const currentBuildNumber = buildNumberMatch[1];
    
    const newVersion = getNextVersion(currentVersion, versionType);
    const newBuildNumber = getNextBuildNumber(currentBuildNumber);
    
    console.log(`📊 Current version: ${currentVersion} (${currentBuildNumber})`);
    console.log(`📊 New version: ${newVersion} (${newBuildNumber})`);
    console.log(`📊 Version type: ${versionType}`);
    
    const results = [
      updateAppConfig(newVersion, newBuildNumber),
      updatePackageJson(newVersion),
      updateIOSInfoPlist(newVersion, newBuildNumber),
      updateAndroidBuildGradle(newVersion, newBuildNumber)
    ];
    
    const successCount = results.filter(Boolean).length;
    
    if (successCount === results.length) {
      console.log('🎉 All files updated successfully!');
      console.log(`📱 New version: ${newVersion} (${newBuildNumber})`);
    } else {
      console.log(`⚠️  ${successCount}/${results.length} files updated successfully`);
    }
    
  } catch (error) {
    console.error('❌ Error updating version:', error.message);
    process.exit(1);
  }
}

main();
