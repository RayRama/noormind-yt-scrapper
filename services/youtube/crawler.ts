import { google, youtube_v3 } from "googleapis";
import { ToSeconds } from "../../utils/time";
import { YTVideo } from "../../types/";
import { YOUTUBE_VIDEO_URL } from "../../config/urls";

// Maksimum percobaan jika terjadi error
const MAX_RETRIES = 3;
// Waktu delay antar percobaan (dalam ms)
const RETRY_DELAY = 1000;

// Cek apakah API key tersedia
if (!process.env.YT_API_KEY) {
  console.error("Error: YT_API_KEY tidak ditemukan di environment variables");
}

const youtube = google.youtube({ 
  version: "v3", 
  auth: process.env.YT_API_KEY 
});

/**
 * Fungsi untuk mengambil data video dari YouTube berdasarkan keyword
 * @param keyword - Kata kunci pencarian
 * @param maxResults - Jumlah maksimum hasil yang diinginkan
 * @returns Array of YTVideo objects
 */
export async function crawler(keyword: string, maxResults: number = 20): Promise<YTVideo[]> {
  if (!keyword || typeof keyword !== 'string') {
    console.error("Error: keyword harus berupa string yang valid");
    return [];
  }

  if (maxResults < 1 || maxResults > 50) {
    console.warn("Warning: maxResults harus antara 1-50, menggunakan nilai default 20");
    maxResults = 20;
  }

  let retries = 0;
  let success = false;
  let response: youtube_v3.Schema$SearchListResponse | null = null;

  // Coba search dengan retry mechanism
  while (!success && retries < MAX_RETRIES) {
    try {
      response = (await youtube.search.list({
        part: ["snippet"],
        type: ["video"],
        q: keyword,
        maxResults: maxResults,
      })).data;
      success = true;
    } catch (error: any) {
      retries++;
      console.error(`Error saat melakukan pencarian YouTube (percobaan ${retries}/${MAX_RETRIES}):`, error.message);
      
      if (retries < MAX_RETRIES) {
        console.log(`Mencoba kembali dalam ${RETRY_DELAY/1000} detik...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error("Gagal melakukan pencarian setelah beberapa percobaan");
        return [];
      }
    }
  }

  if (!response || !response.items || response.items.length === 0) {
    console.log(`Tidak ditemukan video untuk keyword: "${keyword}"`);
    return [];
  }

  // Extract video IDs dari hasil pencarian
  const videoIds = response.items
    .map(item => item.id?.videoId)
    .filter(Boolean) as string[];

  if (videoIds.length === 0) {
    console.log(`Tidak ditemukan video ID yang valid untuk keyword: "${keyword}"`);
    return [];
  }

  // Reset untuk percobaan mendapatkan detail video
  retries = 0;
  success = false;
  let videoDetails: youtube_v3.Schema$VideoListResponse | null = null;

  // Coba mendapatkan detail video dengan retry mechanism
  while (!success && retries < MAX_RETRIES) {
    try {
      videoDetails = (await youtube.videos.list({
        part: ["snippet", "contentDetails"],
        id: videoIds,
      })).data;
      success = true;
    } catch (error: any) {
      retries++;
      console.error(`Error saat mengambil detail video (percobaan ${retries}/${MAX_RETRIES}):`, error.message);
      
      if (retries < MAX_RETRIES) {
        console.log(`Mencoba kembali dalam ${RETRY_DELAY/1000} detik...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error("Gagal mengambil detail video setelah beberapa percobaan");
        return [];
      }
    }
  }

  if (!videoDetails || !videoDetails.items || videoDetails.items.length === 0) {
    console.log("Tidak dapat mengambil detail video");
    return [];
  }

  // Map hasil ke format YTVideo
  return videoDetails.items.map<YTVideo>((item) => {
    try {
      if (!item.id) {
        throw new Error("Video ID tidak ditemukan");
      }

      const durationISO = item.contentDetails?.duration ?? "PT0S";

      return {
        id: item.id,
        url: `${YOUTUBE_VIDEO_URL}${item.id}`,
        title: item.snippet?.title ?? "[Tidak ada judul]",
        publishedAt: item.snippet?.publishedAt ?? "",
        duration: ToSeconds(durationISO),
      };
    } catch (error) {
      console.error(`Error saat memproses video ${item.id}:`, error);
      // Skip video yang bermasalah dengan mengembalikan null, kemudian filter
      return null as unknown as YTVideo;
    }
  }).filter(Boolean); // Filter out null values
}
