#!/usr/bin/env node

/**
 * Production Readiness Check
 * Run this script to verify the backend is ready for Koyeb deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking backend production readiness...\n');

const checks = [
  {
    name: 'Package.json exists',
    check: () => fs.existsSync(path.join(__dirname, 'backend', 'package.json')),
    fix: 'Ensure backend/package.json exists'
  },
  {
    name: 'Server.js exists',
    check: () => fs.existsSync(path.join(__dirname, 'backend', 'server.js')),
    fix: 'Ensure backend/server.js exists'
  },
  {
    name: 'Environment example exists',
    check: () => fs.existsSync(path.join(__dirname, '.env.production.example')),
    fix: 'Environment example file created'
  },
  {
    name: 'Git repository initialized',
    check: () => fs.existsSync(path.join(__dirname, '.git')),
    fix: 'Run: git init'
  },
  {
    name: 'Gitignore exists',
    check: () => fs.existsSync(path.join(__dirname, '.gitignore')),
    fix: 'Create .gitignore file'
  }
];

let allPassed = true;

checks.forEach(({ name, check, fix }) => {
  const passed = check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  
  if (!passed) {
    console.log(`   Fix: ${fix}`);
    allPassed = false;
  }
});

console.log('\n📋 Pre-deployment checklist:');
console.log('□ MongoDB Atlas cluster created and accessible');
console.log('□ GitHub repository pushed with latest code');
console.log('□ Environment variables prepared');
console.log('□ Koyeb account created');
console.log('□ CORS domains configured for production');

if (allPassed) {
  console.log('\n🚀 Backend is ready for Koyeb deployment!');
  console.log('📖 Follow the guide in KOYEB_DEPLOYMENT_STEPS.md');
} else {
  console.log('\n⚠️  Please fix the issues above before deploying.');
}

console.log('\n🔗 Useful links:');
console.log('• Koyeb Dashboard: https://app.koyeb.com');
console.log('• MongoDB Atlas: https://cloud.mongodb.com');
console.log('• GitHub Repository: https://github.com/TechGriffo254/IotSmartGreenHouseProject');
