// Test script for participant API endpoints
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const AUTH_TOKEN = 'YOUR_CLERK_TOKEN_HERE'; // Replace with actual token

// Test participant ID - replace with an actual participant ID from your database
const TEST_PARTICIPANT_ID = 'REPLACE_WITH_ACTUAL_ID';

async function testRevokeParticipant() {
  console.log('\n=== Testing Revoke Participant ===');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/participants/${TEST_PARTICIPANT_ID}/revoke`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({
        revoke: true,
        reason: 'Test revocation'
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('❌ Revoke failed:', data);
    } else {
      console.log('✅ Revoke successful');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testRestoreParticipant() {
  console.log('\n=== Testing Restore Participant ===');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/participants/${TEST_PARTICIPANT_ID}/revoke`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({
        revoke: false
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('❌ Restore failed:', data);
    } else {
      console.log('✅ Restore successful');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testDeleteParticipant() {
  console.log('\n=== Testing Delete Participant ===');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/participants/${TEST_PARTICIPANT_ID}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    console.log('Response status:', response.status);
    
    if (response.status === 204) {
      console.log('✅ Delete successful (204 No Content)');
    } else {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      if (!response.ok) {
        console.error('❌ Delete failed:', data);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Instructions
console.log(`
========================================
PARTICIPANT API TEST SCRIPT
========================================

Before running tests:
1. Make sure backend is running on port 3001
2. Replace AUTH_TOKEN with your actual Clerk token
3. Replace TEST_PARTICIPANT_ID with an actual participant ID

To get your auth token:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Make any admin request in the app
4. Look for Authorization header in request

To get a participant ID:
1. Check browser DevTools Network tab when viewing participants
2. Or check Supabase dashboard

Uncomment the test you want to run:
`);

// Uncomment the test you want to run:
// testRevokeParticipant();
// testRestoreParticipant();
// testDeleteParticipant();
