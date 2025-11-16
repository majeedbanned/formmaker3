/**
 * BBB Connection Test Script
 * Run this with: node test-bbb-connection.js
 */

const crypto = require('crypto');

// Configuration - Update these values
const BBB_URL = 'https://w22.farsamooz.ir';
const BBB_SECRET = 'bVLnYjQPwaHEXr5TCnpS67Cg6Ygy4N8dBzihXuuj5DE';

// Test meeting parameters
const TEST_MEETING_ID = 'test-meeting-' + Date.now();
const TEST_MEETING_NAME = 'Test Meeting';

function generateChecksum(callName, queryString, secret) {
  const data = callName + queryString + secret;
  return crypto.createHash('sha1').update(data).digest('hex');
}

function buildUrl(callName, params, secret) {
  const queryString = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const checksum = generateChecksum(callName, queryString, secret);
  return `${BBB_URL}/bigbluebutton/api/${callName}?${queryString}&checksum=${checksum}`;
}

async function testConnection() {
  // console.log('🧪 Testing BigBlueButton Connection...\n');
  // console.log('Configuration:');
  // console.log('- BBB_URL:', BBB_URL);
  // console.log('- BBB_SECRET:', BBB_SECRET.substring(0, 10) + '...');
  // console.log('- Test Meeting ID:', TEST_MEETING_ID);
  // console.log('\n' + '='.repeat(60) + '\n');

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

  const createUrl = buildUrl('create', createParams, BBB_SECRET);
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
  const runningUrl = buildUrl('isMeetingRunning', runningParams, BBB_SECRET);
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
  const moderatorUrl = buildUrl('join', moderatorJoinParams, BBB_SECRET);
  
  const attendeeJoinParams = {
    meetingID: TEST_MEETING_ID,
    fullName: 'Test Attendee',
    password: 'ap',
    redirect: 'true',
  };
  const attendeeUrl = buildUrl('join', attendeeJoinParams, BBB_SECRET);
  
  // console.log('\n👨‍🏫 Moderator Join URL:');
  // console.log(moderatorUrl);
  // console.log('\n👨‍🎓 Attendee Join URL:');
  // console.log(attendeeUrl);
  
  // console.log('\n✅ All tests completed!');
  // console.log('\nYou can now open the URLs above in your browser to test joining.');
}

// Run the test
testConnection().catch(console.error);

