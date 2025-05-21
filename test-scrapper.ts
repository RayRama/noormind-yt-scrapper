// Script untuk menguji fungsi YoutubeScrapper
import fs from "fs";
import { YoutubeScrapper } from "./services/youtube/scrapper";

// Kata kunci pencarian untuk pengujian
const TEST_KEYWORD = "ceramah adi hidayat";

async function main() {
  try {
    console.log(`Mencari video YouTube dengan kata kunci: "${TEST_KEYWORD}"`);

    // 1. Panggil fungsi YoutubeScrapper
    console.log("\nMenjalankan YoutubeScrapper...");
    const videos = await YoutubeScrapper(TEST_KEYWORD);
    console.log(`Berhasil mendapatkan ${videos.length} video`);

    // 2. Simpan hasil pencarian
    console.log("\nMenyimpan hasil pencarian...");

    // Buat direktori results jika belum ada
    if (!fs.existsSync("./results")) {
      fs.mkdirSync("./results");
    }

    // Simpan hasil pencarian dalam format JSON
    const filename = `./results/search-${TEST_KEYWORD.replace(/\s+/g, "-")}.json`;
    fs.writeFileSync(
      filename,
      JSON.stringify(videos, null, 2)
    );

    console.log(`Hasil pencarian disimpan ke file: ${filename}`);

    // 3. Tampilkan ringkasan hasil
    console.log("\n=== RINGKASAN HASIL PENCARIAN ===");
    console.log(`Kata kunci: "${TEST_KEYWORD}"`);
    console.log(`Jumlah video ditemukan: ${videos.length}`);

    // 4. Tampilkan detail video (5 video pertama)
    console.log("\n=== DETAIL VIDEO ===");
    videos.slice(0, 5).forEach((video, index) => {
      console.log(`\nVideo #${index + 1}:`);
      console.log(`- ID: ${video.id}`);
      console.log(`- Judul: ${video.title}`);
      console.log(`- Channel: ${video.channel.name}`);
      console.log(`- Link: ${video.link}`);
      console.log(`- Channel Link: ${video.channel.link}`);
    });

    // 5. Tampilkan statistik dasar
    if (videos.length > 0) {
      console.log("\n=== STATISTIK ===");
      console.log(`Total video ditemukan: ${videos.length}`);
      
      // Tampilkan channel yang paling banyak muncul
      const channelCounts: Record<string, number> = {};
      videos.forEach(video => {
        const channelName = video.channel.name;
        channelCounts[channelName] = (channelCounts[channelName] || 0) + 1;
      });
      
      // Temukan channel dengan jumlah video terbanyak
      let mostFrequentChannel = '';
      let maxCount = 0;
      
      for (const [channel, count] of Object.entries(channelCounts)) {
        if (count > maxCount) {
          mostFrequentChannel = channel;
          maxCount = count as number;
        }
      }
      
      console.log(`Channel dengan video terbanyak: ${mostFrequentChannel} (${maxCount} video)`);
    }

    console.log("\nProses selesai!");
  } catch (error) {
    console.error("\nError saat menjalankan YoutubeScrapper:", error);
  }
}

// Jalankan fungsi main
main();
