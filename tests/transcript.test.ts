import { getTimedTranscript } from '../services/youtube/transcript';

// ID video YouTube yang ingin diuji
const TEST_VIDEO_ID = 'dQw4w9WgXcQ'; // Ganti dengan ID video yang ingin diuji

async function testGetTimedTranscript() {
  console.log(`Mengambil transcript untuk video ID: ${TEST_VIDEO_ID}`);
  
  try {
    const transcript = await getTimedTranscript(TEST_VIDEO_ID);
    
    console.log(`Berhasil mendapatkan transcript dengan ${transcript.length} segmen.`);
    
    // Tampilkan beberapa segmen pertama sebagai contoh
    if (transcript.length > 0) {
      console.log('\nContoh segmen transcript:');
      transcript.slice(0, 3).forEach((segment, index) => {
        console.log(`\nSegmen #${index + 1}:`);
        console.log(`- Start: ${segment.start} detik`);
        console.log(`- Duration: ${segment.duration} detik`);
        console.log(`- Text: "${segment.text}"`);
      });
    }
    
    return transcript;
  } catch (error) {
    console.error('Error saat mengambil transcript:', error);
    throw error;
  }
}

// Jalankan test
testGetTimedTranscript()
  .then(() => console.log('\nTest selesai dengan sukses!'))
  .catch(error => console.error('\nTest gagal:', error));
