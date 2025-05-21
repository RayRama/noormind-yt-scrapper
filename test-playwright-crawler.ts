// Script untuk menguji YouTubePlaywrightCrawler
import { YouTubePlaywrightCrawler, CrawlerOptions } from './services/youtube/playwrightCrawler';

// Kata kunci pencarian untuk pengujian
const TEST_KEYWORD = "ceramah adi hidayat";

async function main() {
  try {
    console.log(`Memulai crawling YouTube dengan kata kunci: "${TEST_KEYWORD}"`);
    
    // Konfigurasi crawler
    const options: CrawlerOptions = {
      keyword: TEST_KEYWORD,
      maxVideos: 100,       // Ambil maksimal 100 video
      scrollDelay: 2000,    // Delay 2 detik antara scroll
      outputPath: './results',
      headless: false       // Set false untuk melihat browser, true untuk headless
    };
    
    // Inisialisasi crawler
    const crawler = new YouTubePlaywrightCrawler(options);
    
    // Mulai proses crawling
    console.log('Memulai proses crawling...');
    console.log('Proses ini mungkin memerlukan waktu beberapa menit tergantung koneksi internet');
    console.log('dan jumlah video yang ingin diambil.');
    
    const videos = await crawler.crawl();
    
    // Tampilkan hasil
    console.log(`\n=== HASIL CRAWLING ===`);
    console.log(`Kata kunci: "${TEST_KEYWORD}"`);
    console.log(`Jumlah video yang berhasil diambil: ${videos.length}`);
    
    // Tampilkan 5 video pertama sebagai contoh
    console.log(`\n=== CONTOH VIDEO ===`);
    videos.slice(0, 5).forEach((video, index) => {
      console.log(`\nVideo #${index + 1}:`);
      console.log(`- ID: ${video.id}`);
      console.log(`- Judul: ${video.title}`);
      console.log(`- Link: ${video.link}`);
    });
    
    console.log('\nProses crawling selesai!');
    console.log('Hasil lengkap telah disimpan dalam format JSON di folder results');
  } catch (error) {
    console.error('\nError saat menjalankan crawler:', error);
  }
}

// Jalankan fungsi main
main();
