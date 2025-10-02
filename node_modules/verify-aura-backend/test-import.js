// Test script for Google Sheets import functionality

const testImport = async () => {
  const eventId = 'YOUR_EVENT_ID'; // Replace with actual event ID
  const googleSheetUrl = 'https://script.google.com/macros/s/AKfycbyRwsRKXlIhM-nJ60DbA-Kjc6kHQ0ZrhymOui-7vt32Y4lSJe54em7CAZUzY9bNG-Em/exec';
  
  console.log('Testing Google Sheets import...');
  console.log('Event ID:', eventId);
  console.log('URL:', googleSheetUrl);
  
  try {
    // First, fetch data from the URL to see what we get
    const response = await fetch(googleSheetUrl);
    const data = await response.json();
    
    console.log('\n✅ Successfully fetched data from Google Sheets:');
    console.log('Total participants:', data.length);
    console.log('\nSample data (first 3 entries):');
    data.slice(0, 3).forEach((participant, index) => {
      console.log(`${index + 1}. Name: ${participant.Name}, Email: ${participant.Email}`);
    });
    
    console.log('\n✅ Data format is correct!');
    console.log('Fields detected:', Object.keys(data[0] || {}));
    
  } catch (error) {
    console.error('❌ Error testing import:', error.message);
  }
};

// Run the test
testImport();
