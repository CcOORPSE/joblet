import { uploadResumeFile, getSignedResumeUrl } from './utils/uploadResumeFile.js';
import { uploadCompanyLogo } from './utils/uploadCompanyLogo.js';

console.log('🎯 Final Storage Integration Test\n');

// Test 1: Resume Upload
console.log('1️⃣  Testing Resume Upload...');
const mockResume = {
  buffer: Buffer.from('This is a test PDF resume content'),
  mimetype: 'application/pdf',
  originalname: 'test-resume.pdf'
};

try {
  const { url, storagePath } = await uploadResumeFile(mockResume);
  console.log('   ✅ Resume uploaded successfully!');
  console.log('   📄 Storage path:', storagePath);
  console.log('   🔗 Signed URL:', url ? 'Generated ✓' : 'Failed ✗');
  
  // Test getting signed URL again
  if (storagePath && !storagePath.startsWith('http')) {
    const newUrl = await getSignedResumeUrl(storagePath);
    console.log('   🔄 Re-generated URL:', newUrl ? 'Success ✓' : 'Failed ✗');
  }
  
  console.log('   ✅ Resume upload system: WORKING');
} catch (error) {
  console.log('   ❌ Resume upload failed:', error.message);
}

// Test 2: Logo Upload
console.log('\n2️⃣  Testing Company Logo Upload...');
const mockLogo = {
  buffer: Buffer.from('This is a test PNG logo content'),
  mimetype: 'image/png',
  originalname: 'test-logo.png'
};

try {
  const logoUrl = await uploadCompanyLogo(mockLogo);
  console.log('   ✅ Logo uploaded successfully!');
  console.log('   🔗 Public URL:', logoUrl ? 'Generated ✓' : 'Failed ✗');
  console.log('   ✅ Logo upload system: WORKING');
} catch (error) {
  console.log('   ❌ Logo upload failed:', error.message);
  if (error.message.includes('not found')) {
    console.log('   💡 Create a "logos" bucket (PUBLIC) in Supabase Storage');
    console.log('   🔗 https://supabase.com/dashboard/project/xflfaecwzdwhlykjazcl/storage');
  }
}

console.log('\n📊 Test Summary:');
console.log('   Storage Backend: Supabase Storage (FREE)');
console.log('   Resume Bucket: resume (private)');
console.log('   Logo Bucket: logos (public) - create if needed');
console.log('\n✅ Integration test complete!');
