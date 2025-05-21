import { youtube } from "scrape-youtube";
import { YoutubeVideo, YoutubeVideoFull, YoutubeSearchOptions } from "../../types/youtube";

/**
 * Mencari video YouTube berdasarkan kata kunci
 * @param keyword - Kata kunci pencarian
 * @returns Array of YoutubeVideo (hanya id, title, link, dan channel) atau array kosong jika terjadi error
 */
export async function YoutubeScrapper(
  keyword: string
): Promise<YoutubeVideo[]> {
  try {
    // Validasi input
    if (!keyword || keyword.trim() === "") {
      console.error("Error: Kata kunci pencarian tidak boleh kosong");
      return [];
    }

    console.log(`Mencari video YouTube dengan kata kunci: "${keyword}"...`);

    // Opsi pencarian
    const options: YoutubeSearchOptions = {
      type: "video",
      request: {
        headers: {
          Cookie: "PREF=f2=8000000", // Filter untuk mendapatkan hasil dalam bahasa Indonesia
          "Accept-Language": "id",
        },
      },
    };

    // Lakukan pencarian
    const result = await youtube.search(keyword, options);
    
    console.log(`Berhasil mendapatkan ${result.videos.length} video`);
    
    // Konversi hasil ke format yang diinginkan (hanya id, title, link, dan channel)
    const simplifiedResults: YoutubeVideo[] = result.videos.map(video => ({
      id: video.id,
      title: video.title,
      link: video.link,
      channel: {
        id: video.channel.id,
        name: video.channel.name,
        link: video.channel.link
      }
    }));
    
    return simplifiedResults;
  } catch (error: any) {
    console.error(`Error saat mencari video YouTube: ${error.message}`);
    return [];
  }
}
