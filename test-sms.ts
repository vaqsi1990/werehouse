// Test script for SMS functionality
import { sendSms } from './app/lib/sms';

async function testSMS() {

  
  // Test with +995 prefix format
  const testPhone = '+995599344706';
  const testText = 'Test SMS';
  
  console.log('🧪 Testing SMS functionality...\n');
  console.log('Phone number:', testPhone);
  console.log('Message:', testText);
 
  
  try {
    const result = await sendSms({
      to: testPhone,
      text: testText,
    });
    
    console.log('\n✅ SUCCESS!');
    console.log('Provider Response:', result.providerResponse);
    console.log('\n📱 SMS should be sent successfully!');
  } catch (error: any) {
    console.error('\n❌ ERROR:');
    console.error('Message:', error.message);
    if (error.providerResponse) {
      console.error('Provider Response:', error.providerResponse);
    }
    if (error.status) {
      console.error('HTTP Status:', error.status);
    }
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testSMS();
