// Script sederhana untuk menguji fungsi getTimedTranscript
import { getTimedTranscript } from "./services/youtube/transcript";
import { TimedTranscriptItem } from "./types";
import fs from 'fs';

// ID video YouTube yang ingin diuji
const TEST_VIDEO_ID = "T3Yd6HUlfdw"; // Ustadz Adi Hidayat

/**
 * Fungsi untuk menggabungkan teks transcript menjadi satu teks utuh
 */
function combineTranscript(transcript: TimedTranscriptItem[]): string {
  return transcript.map(segment => segment.text).join(" ");
}

/**
 * Fungsi untuk menyimpan transcript ke file
 */
function saveTranscriptToFile(transcript: TimedTranscriptItem[], videoId: string): void {
  const fullText = combineTranscript(transcript);
  const fileName = `transcript-${videoId}.txt`;
  
  // Simpan teks lengkap
  fs.writeFileSync(fileName, fullText);
  
  // Simpan juga versi dengan timestamp
  const timestampedText = transcript.map(segment => {
    const minutes = Math.floor(segment.start / 60);
    const seconds = Math.floor(segment.start % 60);
    return `[${minutes}:${seconds.toString().padStart(2, '0')}] ${segment.text}`;
  }).join("\n");
  
  fs.writeFileSync(`timestamped-${fileName}`, timestampedText);
  
  console.log(`\nTranscript disimpan ke file: ${fileName} dan timestamped-${fileName}`);
}

async function main() {
  try {
    console.log(`Mengambil transcript untuk video ID: ${TEST_VIDEO_ID}`);

    const transcript = await getTimedTranscript(TEST_VIDEO_ID);

    console.log(
      `\nBerhasil mendapatkan transcript dengan ${transcript.length} segmen.`
    );

    // Tampilkan informasi segmen (hanya 5 segmen pertama)
    if (transcript.length > 0) {
      console.log("\nContoh 5 segmen pertama:");
      transcript.slice(0, 5).forEach((segment, index) => {
        console.log(`\nSegmen #${index + 1}:`);
        console.log(`- Start: ${Math.floor(segment.start)} detik`);
        console.log(`- Duration: ${Math.floor(segment.duration)} detik`);
        console.log(`- Text: "${segment.text}"`);
      });
      
      // Gabungkan dan tampilkan teks transcript (hanya 200 karakter pertama dan terakhir)
      const fullText = combineTranscript(transcript);
      const previewLength = 200;
      
      console.log("\n=== PREVIEW TRANSCRIPT ===\n");
      if (fullText.length > previewLength * 2) {
        console.log(fullText.substring(0, previewLength) + " ... " + 
                   fullText.substring(fullText.length - previewLength));
      } else {
        console.log(fullText);
      }
      console.log("\n=== AKHIR PREVIEW ===\n");
      
      // Hitung total durasi berdasarkan timestamp terakhir, bukan jumlah durasi segmen
      // Karena segmen bisa overlap atau memiliki gap
      const lastSegment = transcript[transcript.length - 1];
      const totalDuration = lastSegment.start + lastSegment.duration;
      console.log(`Total durasi: ${Math.floor(totalDuration)} detik (${Math.floor(totalDuration/60)} menit ${Math.floor(totalDuration%60)} detik)`);
      
      // Tampilkan juga perhitungan durasi dengan cara menjumlahkan semua durasi segmen (untuk perbandingan)
      const sumDuration = transcript.reduce((total, segment) => total + segment.duration, 0);
      console.log(`Total durasi (jumlah semua segmen): ${Math.floor(sumDuration)} detik (${Math.floor(sumDuration/60)} menit ${Math.floor(sumDuration%60)} detik)`);
      
      // Simpan transcript ke file
      saveTranscriptToFile(transcript, TEST_VIDEO_ID);
    }

    console.log("\nTest selesai dengan sukses!");
  } catch (error) {
    console.error("\nTest gagal:", error);
  }
}

// Jalankan fungsi main
main();
