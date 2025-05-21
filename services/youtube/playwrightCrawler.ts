// Pastikan playwright sudah diinstall: npm install playwright
// @ts-ignore -- Abaikan error jika tidak menemukan module playwright
import { Browser, BrowserContext, Page, chromium } from 'playwright';
// @ts-ignore -- Abaikan error jika tidak menemukan module playwright
import type { ConsoleMessage, ElementHandle } from 'playwright';
import fs from 'fs';
import path from 'path';
import { YtLinkToId } from '../../utils/text';

/**
 * Interface untuk hasil crawling video YouTube
 */
export interface CrawledVideo {
  id: string;
  title: string;
  link: string;
}

/**
 * Opsi untuk crawler YouTube
 */
export interface CrawlerOptions {
  /** Kata kunci pencarian */
  keyword: string;
  /** Jumlah maksimum video yang akan diambil */
  maxVideos?: number;
  /** Delay antara scroll (ms) */
  scrollDelay?: number;
  /** Path untuk menyimpan hasil */
  outputPath?: string;
  /** Mode headless (true = browser tidak terlihat) */
  headless?: boolean;
}

/**
 * Crawler YouTube menggunakan Playwright
 * Melakukan infinite scroll dan mengambil data video dari hasil pencarian
 */
export class YouTubePlaywrightCrawler {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private videos: CrawledVideo[] = [];
  private options: CrawlerOptions;

  constructor(options: CrawlerOptions) {
    this.options = {
      maxVideos: 100,
      scrollDelay: 1500,
      outputPath: './results',
      headless: true,
      ...options
    };
  }

  /**
   * Inisialisasi browser dan page
   */
  private async initialize(): Promise<void> {
    console.log('Menginisialisasi browser...');
    this.browser = await chromium.launch({ headless: this.options.headless });
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      viewport: { width: 1280, height: 800 }
    });
    this.page = await this.context.newPage();

    // Set timeout yang lebih lama untuk navigasi
    this.page.setDefaultNavigationTimeout(60000);
    
    // Tambahkan event listener untuk console logs
    this.page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`Browser ${msg.type()}: ${msg.text()}`);
      }
    });
  }

  /**
   * Navigasi ke halaman hasil pencarian YouTube
   */
  private async navigateToSearchResults(): Promise<void> {
    if (!this.page) throw new Error('Browser belum diinisialisasi');
    
    const encodedKeyword = encodeURIComponent(this.options.keyword);
    const url = `https://www.youtube.com/results?search_query=${encodedKeyword}`;
    
    console.log(`Navigasi ke ${url}...`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Tunggu sampai hasil pencarian muncul
    await this.page.waitForSelector('ytd-video-renderer, ytd-compact-video-renderer', { timeout: 30000 });
    console.log('Halaman hasil pencarian berhasil dimuat');
  }

  /**
   * Ekstrak data video dari halaman
   */
  private async extractVideos(): Promise<CrawledVideo[]> {
    if (!this.page) throw new Error('Browser belum diinisialisasi');
    
    console.log('Mengekstrak data video...');
    
    // Selector untuk video items
    const videoSelector = 'ytd-video-renderer, ytd-compact-video-renderer';
    
    // Dapatkan semua elemen video yang saat ini terlihat
    // Gunakan type casting untuk mengatasi masalah type safety
    type VideoData = { title: string; link: string };
    
    const newVideos = await this.page.evaluate<VideoData[], string>((selector: string) => {
      // Dalam konteks browser, document tersedia
      // TypeScript tidak mengenali objek document dalam konteks evaluasi Playwright
      // @ts-ignore -- Abaikan error terkait document
      const doc = document;
      // @ts-ignore -- Abaikan error terkait querySelectorAll
      const videoElements = Array.from(doc.querySelectorAll(selector));
      
      return videoElements.map((videoElement: any) => {
        // Ambil judul video
        // @ts-ignore -- Abaikan error terkait querySelector
        const titleElement = videoElement.querySelector('#video-title, #title-wrapper a');
        const title = titleElement ? titleElement.textContent?.trim() || '' : '';
        
        // Ambil link video
        // @ts-ignore -- Abaikan error terkait querySelector
        const linkElement = videoElement.querySelector('#video-title, #title-wrapper a');
        const link = linkElement ? linkElement.getAttribute('href') || '' : '';
        
        // Buat link lengkap jika link relatif
        const fullLink = link.startsWith('/watch') 
          ? `https://www.youtube.com${link}` 
          : link;
        
        return { title, link: fullLink };
      }).filter((video: VideoData) => video.title && video.link && video.link.includes('/watch?v='));
    }, videoSelector);
    
    // Tambahkan ID video
    return newVideos.map((video: VideoData) => ({
      ...video,
      id: YtLinkToId(video.link)
    }));
  }

  /**
   * Scroll halaman untuk memuat lebih banyak hasil
   */
  private async scrollPage(): Promise<void> {
    if (!this.page) throw new Error('Browser belum diinisialisasi');
    
    console.log('Scrolling halaman untuk memuat lebih banyak hasil...');
    
    await this.page.evaluate(() => {
      // TypeScript tidak mengenali objek window dalam konteks evaluasi Playwright
      // @ts-ignore -- Abaikan error terkait window
      window.scrollBy(0, window.innerHeight * 2);
    });
    
    // Tunggu sebentar setelah scroll untuk memuat konten baru
    await this.page.waitForTimeout(this.options.scrollDelay || 1500);
  }

  /**
   * Simpan hasil crawling ke file
   */
  private async saveResults(): Promise<string> {
    // Buat direktori output jika belum ada
    const outputDir = this.options.outputPath || './results';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Buat nama file berdasarkan keyword dan timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filename = `youtube-${this.options.keyword.replace(/\s+/g, '-')}-${timestamp}.json`;
    const outputPath = path.join(outputDir, filename);
    
    // Tulis hasil ke file
    fs.writeFileSync(outputPath, JSON.stringify(this.videos, null, 2));
    
    console.log(`Hasil crawling disimpan ke ${outputPath}`);
    return outputPath;
  }

  /**
   * Tutup browser
   */
  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      console.log('Menutup browser...');
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  /**
   * Mulai proses crawling
   */
  public async crawl(): Promise<CrawledVideo[]> {
    try {
      // Inisialisasi browser
      await this.initialize();
      
      // Navigasi ke halaman hasil pencarian
      await this.navigateToSearchResults();
      
      // Lakukan crawling sampai mendapatkan jumlah video yang diinginkan
      let previousLength = 0;
      let noNewVideosCount = 0;
      
      while (this.videos.length < (this.options.maxVideos || 100)) {
        // Ekstrak video dari halaman saat ini
        const newVideos = await this.extractVideos();
        
        // Filter video yang belum ada di koleksi
        const uniqueNewVideos = newVideos.filter(newVideo => 
          !this.videos.some(existingVideo => existingVideo.id === newVideo.id)
        );
        
        // Tambahkan video baru ke koleksi
        this.videos.push(...uniqueNewVideos);
        
        // Hapus duplikat (untuk jaga-jaga)
        this.videos = this.videos.filter((video, index, self) =>
          index === self.findIndex(v => v.id === video.id)
        );
        
        console.log(`Jumlah video yang ditemukan: ${this.videos.length}/${this.options.maxVideos || 100}`);
        
        // Jika tidak ada video baru yang ditemukan setelah beberapa kali scroll, hentikan
        if (this.videos.length === previousLength) {
          noNewVideosCount++;
          if (noNewVideosCount >= 5) {
            console.log('Tidak ada video baru yang ditemukan setelah beberapa kali scroll, menghentikan crawling');
            break;
          }
        } else {
          noNewVideosCount = 0;
        }
        
        previousLength = this.videos.length;
        
        // Jika sudah mencapai target, hentikan
        if (this.videos.length >= (this.options.maxVideos || 100)) {
          break;
        }
        
        // Scroll untuk memuat lebih banyak hasil
        await this.scrollPage();
      }
      
      // Batasi jumlah video sesuai dengan maxVideos
      this.videos = this.videos.slice(0, this.options.maxVideos || 100);
      
      // Simpan hasil
      await this.saveResults();
      
      return this.videos;
    } catch (error) {
      console.error('Error saat melakukan crawling:', error);
      throw error;
    } finally {
      // Pastikan browser ditutup
      await this.closeBrowser();
    }
  }
}
