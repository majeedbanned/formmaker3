/**
 * BBB Connection Test Script
 * Run this with: node test-bbb-connection.js <schoolCode> <domain>
 * Example: node test-bbb-connection.js 96098445 localhost:3000
 * Or set environment variables: SCHOOL_CODE and DOMAIN
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Get schoolCode and domain from command line arguments or environment variables
const schoolCode = process.argv[2] || process.env.SCHOOL_CODE;
const domain = process.argv[3] || process.env.DOMAIN || 'localhost:3000';

if (!schoolCode) {
  console.error('❌ Error: schoolCode is required');
  console.error('Usage: node test-bbb-connection.js <schoolCode> [domain]');
  console.error('   Or set environment variables: SCHOOL_CODE and DOMAIN');
  process.exit(1);
}

// Load database configuration
let databaseConfig = {};
try {
  const configPath = path.join(__dirname, 'src/config/database.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  databaseConfig = JSON.parse(configData);
} catch (error) {
  console.error('❌ Failed to load database configuration:', error.message);
  process.exit(1);
}

// Get connection string for domain
function getConnectionString(domain) {
  const config = databaseConfig[domain];
  if (!config || !config.connectionString) {
    throw new Error(`No database configuration found for domain: ${domain}`);
  }
  return config.connectionString;
}

// Fetch BBB configuration from schools collection
async function getBBBConfig(schoolCode, domain) {
  try {
    const connectionString = getConnectionString(domain);
    const connection = mongoose.createConnection(connectionString, {
      serverSelectionTimeoutMS: 15000,
    });

    await connection.asPromise();

    const schoolsCollection = connection.collection('schools');
    const school = await schoolsCollection.findOne({ 
      'data.schoolCode': schoolCode 
    });

    await connection.close();

    if (!school || !school.data) {
      throw new Error(`School not found: ${schoolCode}`);
    }

    const bbbUrl = school.data.BBB_URL;
    const bbbSecret = school.data.BBB_SECRET;

    if (!bbbUrl || !bbbSecret) {
      throw new Error(`BBB configuration not found for school: ${schoolCode}. Please configure BBB_URL and BBB_SECRET in school settings.`);
    }

    return {
      url: bbbUrl,
      secret: bbbSecret,
    };
  } catch (error) {
    console.error(`❌ Error fetching BBB config for school ${schoolCode}:`, error.message);
    throw error;
  }
}

// Test meeting parameters
const TEST_MEETING_NAME = 'Test Meeting';

function generateChecksum(callName, queryString, secret) {
  const data = callName + queryString + secret;
  return crypto.createHash('sha1').update(data).digest('hex');
}

function buildUrl(callName, params, secret, bbbUrl) {
  const queryString = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const checksum = generateChecksum(callName, queryString, secret);
  return `${bbbUrl}/bigbluebutton/api/${callName}?${queryString}&checksum=${checksum}`;
}

async function testConnection() {
  console.log('🧪 Testing BigBlueButton Connection...\n');
  console.log('Configuration:');
  console.log('- School Code:', schoolCode);
  console.log('- Domain:', domain);
  console.log('- Fetching BBB config from database...\n');

  // Fetch BBB configuration from schools collection
  let BBB_URL, BBB_SECRET;
  try {
    const bbbConfig = await getBBBConfig(schoolCode, domain);
    BBB_URL = bbbConfig.url;
    BBB_SECRET = bbbConfig.secret;
    console.log('- BBB_URL:', BBB_URL);
    console.log('- BBB_SECRET:', BBB_SECRET.substring(0, 10) + '...');
  } catch (error) {
    console.error('❌ Failed to fetch BBB configuration:', error.message);
    return;
  }

  const TEST_MEETING_ID = 'test-meeting-' + Date.now();
  console.log('- Test Meeting ID:', TEST_MEETING_ID);
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 1: Create Meeting
  // console.log('Test 1: Creating meeting...');
  const voiceBridge = Math.floor(70000 + Math.random() * 10000).toString();
  
  const createParams = {
    meetingID: TEST_MEETING_ID,
    name: TEST_MEETING_NAME,
    attendeePW: 'ap',
    moderatorPW: 'mp',
    welcome: 'Welcome to test meeting',
    voiceBridge,
    maxParticipants: '100',
    record: 'false',
    autoStartRecording: 'false',
    allowStartStopRecording: 'true',
  };

  const createUrl = buildUrl('create', createParams, BBB_SECRET, BBB_URL);
  // console.log('Create URL:', createUrl);
  // console.log('\nSending request...');

  try {
    const response = await fetch(createUrl);
    const text = await response.text();
    
    // console.log('\n📨 Response Status:', response.status);
    // console.log('📨 Response Body:\n', text);
    
    const successMatch = text.match(/<returncode>(.*?)<\/returncode>/);
    const messageMatch = text.match(/<message>(.*?)<\/message>/);
    const messageKeyMatch = text.match(/<messageKey>(.*?)<\/messageKey>/);
    
    if (successMatch && successMatch[1] === 'SUCCESS') {
      // console.log('\n✅ Meeting created successfully!');
    } else {
      // console.log('\n❌ Failed to create meeting');
      // if (messageMatch) console.log('Error Message:', messageMatch[1]);
      // if (messageKeyMatch) console.log('Error Key:', messageKeyMatch[1]);
      return;
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return;
  }

  // console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Check if meeting is running
  // console.log('Test 2: Checking if meeting is running...');
  const runningParams = { meetingID: TEST_MEETING_ID };
  const runningUrl = buildUrl('isMeetingRunning', runningParams, BBB_SECRET, BBB_URL);
  // console.log('Running URL:', runningUrl);

  try {
    const response = await fetch(runningUrl);
    const text = await response.text();
    
    // console.log('\n📨 Response:\n', text);
    
    const runningMatch = text.match(/<running>(.*?)<\/running>/);
    if (runningMatch) {
      // console.log('\n✅ Meeting running status:', runningMatch[1]);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  // console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Generate join URLs
  // console.log('Test 3: Generating join URLs...');
  
  const moderatorJoinParams = {
    meetingID: TEST_MEETING_ID,
    fullName: 'Test Moderator',
    password: 'mp',
    redirect: 'true',
  };
  const moderatorUrl = buildUrl('join', moderatorJoinParams, BBB_SECRET, BBB_URL);
  
  const attendeeJoinParams = {
    meetingID: TEST_MEETING_ID,
    fullName: 'Test Attendee',
    password: 'ap',
    redirect: 'true',
  };
  const attendeeUrl = buildUrl('join', attendeeJoinParams, BBB_SECRET, BBB_URL);
  
  // console.log('\n👨‍🏫 Moderator Join URL:');
  // console.log(moderatorUrl);
  // console.log('\n👨‍🎓 Attendee Join URL:');
  // console.log(attendeeUrl);
  
  // console.log('\n✅ All tests completed!');
  // console.log('\nYou can now open the URLs above in your browser to test joining.');
}

// Run the test
testConnection().catch(console.error);

