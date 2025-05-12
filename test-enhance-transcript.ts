// Script untuk menguji fungsi enhanceTranscript
import fs from 'fs';
import { enhanceTranscript, cleanTranscriptBasic } from './services/ai/transcriptEnhancer';

// Nama file transcript yang akan ditingkatkan
const TRANSCRIPT_FILE = 'transcript-T3Yd6HUlfdw.txt';
// Nama ustadz untuk konteks
const USTADZ_NAME = 'Adi Hidayat';

async function main() {
  try {
    console.log(`Membaca file transcript: ${TRANSCRIPT_FILE}`);
    
    // Baca file transcript
    if (!fs.existsSync(TRANSCRIPT_FILE)) {
      console.error(`File transcript tidak ditemukan: ${TRANSCRIPT_FILE}`);
      console.log('Jalankan test-transcript.ts terlebih dahulu untuk menghasilkan file transcript.');
      return;
    }
    
    const transcriptText = fs.readFileSync(TRANSCRIPT_FILE, 'utf-8');
    console.log(`Berhasil membaca transcript (${transcriptText.length} karakter)`);
    
    // Bersihkan transcript dengan metode basic terlebih dahulu
    console.log('\nMembersihkan transcript dengan metode basic...');
    const cleanedBasic = cleanTranscriptBasic(transcriptText);
    
    // Simpan hasil pembersihan basic
    fs.writeFileSync('cleaned-basic-' + TRANSCRIPT_FILE, cleanedBasic);
    console.log(`Transcript basic cleaning disimpan ke file: cleaned-basic-${TRANSCRIPT_FILE}`);
    
    // Periksa apakah OPENAI_API_KEY tersedia
    if (!process.env.OPENAI_API_KEY) {
      console.warn('\nWARNING: OPENAI_API_KEY tidak ditemukan di environment variables.');
      console.warn('Peningkatan kualitas transcript dengan OpenAI tidak dapat dilakukan.');
      console.warn('Pastikan OPENAI_API_KEY telah diatur di file .env');
      return;
    }
    
    // Tingkatkan kualitas transcript dengan OpenAI
    console.log('\nMeningkatkan kualitas transcript dengan OpenAI...');
    console.log('(Ini mungkin memerlukan waktu beberapa saat)');
    
    const enhancedTranscript = await enhanceTranscript(cleanedBasic, USTADZ_NAME);
    
    // Simpan hasil enhancement
    console.log('\nMenyimpan hasil enhancement...');
    
    // Simpan teks yang sudah ditingkatkan
    fs.writeFileSync('enhanced-' + TRANSCRIPT_FILE, enhancedTranscript.cleanedText);
    console.log(`Transcript yang sudah ditingkatkan disimpan ke file: enhanced-${TRANSCRIPT_FILE}`);
    
    // Simpan metadata (summary, keywords, topics)
    const metadata = {
      summary: enhancedTranscript.summary,
      keywords: enhancedTranscript.keywords,
      topics: enhancedTranscript.topics
    };
    
    fs.writeFileSync('metadata-' + TRANSCRIPT_FILE.replace('.txt', '.json'), JSON.stringify(metadata, null, 2));
    console.log(`Metadata disimpan ke file: metadata-${TRANSCRIPT_FILE.replace('.txt', '.json')}`);
    
    // Tampilkan ringkasan
    console.log('\n=== RINGKASAN CERAMAH ===');
    console.log(enhancedTranscript.summary);
    
    // Tampilkan keywords
    console.log('\n=== KATA KUNCI ===');
    console.log(enhancedTranscript.keywords.join(', '));
    
    // Tampilkan topics
    console.log('\n=== TOPIK ===');
    console.log(enhancedTranscript.topics.join(', '));
    
    console.log('\nProses peningkatan kualitas transcript selesai!');
  } catch (error) {
    console.error('\nError saat meningkatkan kualitas transcript:', error);
  }
}

// Jalankan fungsi main
main();
