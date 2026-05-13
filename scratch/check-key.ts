
const key = process.env.FIREBASE_PRIVATE_KEY;
if (!key) {
  console.log('Key not found');
} else {
  console.log('Key length:', key.length);
  console.log('First 20 chars:', JSON.stringify(key.substring(0, 20)));
  console.log('Last 20 chars:', JSON.stringify(key.substring(key.length - 20)));
  console.log('Contains \\n literal:', key.includes('\\n'));
  console.log('Contains actual newline:', key.includes('\n'));
}
