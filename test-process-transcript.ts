// Script untuk menguji integrasi transcript enhancement dan segmentation
import fs from "fs";
import { getTimedTranscript } from "./services/youtube/transcript";
import { processTranscript } from "./services/ai/transcriptProcessor";

// ID video YouTube yang ingin diuji
const TEST_VIDEO_ID = "E7kKQ8p6AlE";
// Nama ustadz untuk konteks
const USTADZ_NAME = "Adi Hidayat";

async function main() {
  try {
    console.log(
      `Mengambil dan memproses transcript untuk video ID: ${TEST_VIDEO_ID}`
    );

    // 1. Ambil transcript dari YouTube
    console.log("\nMengambil transcript dari YouTube...");
    const transcript = await getTimedTranscript(TEST_VIDEO_ID);
    console.log(`Berhasil mendapatkan ${transcript.length} segmen transcript`);

    // 2. Proses transcript (enhance dan segment)
    console.log("\nMemproses transcript (enhance dan segment)...");
    console.log("(Ini mungkin memerlukan waktu beberapa saat)");

    const processedTranscript = await processTranscript(
      transcript,
      TEST_VIDEO_ID,
      USTADZ_NAME
    );

    // 3. Simpan hasil pemrosesan
    console.log("\nMenyimpan hasil pemrosesan...");

    // Buat direktori results jika belum ada
    if (!fs.existsSync("./results")) {
      fs.mkdirSync("./results");
    }

    // Simpan hasil pemrosesan dalam format JSON
    fs.writeFileSync(
      `./results/processed-${TEST_VIDEO_ID}.json`,
      JSON.stringify(processedTranscript, null, 2)
    );

    console.log(
      `Hasil pemrosesan disimpan ke file: ./results/processed-${TEST_VIDEO_ID}.json`
    );

    // 4. Tampilkan ringkasan hasil
    console.log("\n=== RINGKASAN HASIL PEMROSESAN ===");
    console.log(`Video ID: ${processedTranscript.metadata.videoId}`);
    console.log(`URL Video: ${processedTranscript.metadata.url}`);
    console.log(
      `Durasi: ${Math.floor(
        processedTranscript.metadata.duration / 60
      )} menit ${Math.floor(processedTranscript.metadata.duration % 60)} detik`
    );
    console.log(`Jumlah segmen: ${processedTranscript.segmented_texts.length}`);

    // Tampilkan summary
    console.log("\n=== RINGKASAN CERAMAH ===");
    console.log(processedTranscript.summary);

    // Tampilkan topics
    console.log("\n=== TOPIK ===");
    console.log(processedTranscript.topics.join(", "));

    // Tampilkan questions
    console.log("\n=== PERTANYAAN ===");
    console.log(processedTranscript.questions.join("\n"));

    // Tampilkan contoh segmen (3 segmen pertama)
    console.log("\n=== CONTOH SEGMEN ===");
    processedTranscript.segmented_texts.slice(0, 3).forEach((text, index) => {
      console.log(`\nSegmen #${index + 1}:`);
      console.log(`- Text: "${text}"`);
    });

    // Tampilkan contoh timestamp (3 timestamp pertama)
    console.log("\n=== CONTOH TIMESTAMP ===");
    processedTranscript.timestamp.slice(0, 3).forEach((item, index) => {
      console.log(`\nTimestamp #${index + 1}:`);
      console.log(`- Start: ${item.start} detik`);
      console.log(`- End: ${item.end} detik`);
      console.log(`- Text: "${item.text}"`);
    });

    console.log("\nProses selesai!");
  } catch (error) {
    console.error("\nError saat memproses transcript:", error);
  }
}

// Jalankan fungsi main
main();
