const fs = require('fs-extra');
const path = require('path');

console.log('🔧 Starting build script...');

// Validate that at least one environment file exists
const envFiles = ['.env', '.env.dev', '.env.staging'];
const existingEnvFiles = envFiles.filter((file) => fs.existsSync(file));

if (existingEnvFiles.length === 0) {
  console.warn(
    '⚠️  Warning: No environment files found. Create .env.example as a template.'
  );
} else {
  console.log(`✅ Found environment files: ${existingEnvFiles.join(', ')}`);
}

// Copy environment files if they exist
envFiles.forEach((envFile) => {
  if (fs.existsSync(envFile)) {
    try {
      fs.copySync(envFile, `dist/${envFile}`);
      console.log(`✅ Copied ${envFile} to dist/${envFile}`);
    } catch (error) {
      console.error(`❌ Failed to copy ${envFile}:`, error.message);
    }
  }
});

// Copy public folder to dist
const publicSrcPath = path.join(__dirname, 'public');
const publicDestPath = path.join(__dirname, 'dist', 'public');

if (fs.existsSync(publicSrcPath)) {
  try {
    // Remove existing public folder in dist if it exists
    if (fs.existsSync(publicDestPath)) {
      fs.removeSync(publicDestPath);
    }

    // Copy public folder
    fs.copySync(publicSrcPath, publicDestPath);
    console.log('✅ Copied public folder to dist/public');

    // Verify files were copied
    const files = fs.readdirSync(publicDestPath);
    console.log(
      `📁 Files in dist/public (${files.length}):`,
      files.slice(0, 5).join(', ') + (files.length > 5 ? '...' : '')
    );
  } catch (error) {
    console.error('❌ Failed to copy public folder:', error.message);
  }
} else {
  console.log('📁 No public folder found - skipping copy');
}

console.log('🎉 Build script completed successfully!');
