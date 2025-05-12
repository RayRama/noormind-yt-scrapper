import { TimedTranscriptItem } from "../../types/";
import { YoutubeTranscript } from "youtube-transcript";

// Maksimum percobaan jika terjadi error
const MAX_RETRIES = 3;
// Waktu delay antar percobaan (dalam ms)
const RETRY_DELAY = 1000;

/**
 * Mengambil transcript dari video YouTube berdasarkan ID video
 * @param videoId - ID video YouTube (bukan URL lengkap)
 * @returns Array of TimedTranscriptItem yang berisi waktu dan teks transcript
 */
export async function getTimedTranscript(
  videoId: string
): Promise<TimedTranscriptItem[]> {
  // Validasi input
  if (!videoId || typeof videoId !== "string") {
    throw new Error("Error: videoId harus berupa string yang valid");
  }

  // Hapus prefix URL jika ada
  if (videoId.includes("youtube.com") || videoId.includes("youtu.be")) {
    console.warn(
      "Warning: videoId seharusnya hanya berupa ID, bukan URL lengkap"
    );
    // Extract ID dari URL
    const match = videoId.match(
      /(?:youtube\.com\/watch\?v=|\/videos\/|youtu\.be\/)([^\?\n]+)/
    );
    if (match && match[1]) {
      videoId = match[1];
      console.log(`Menggunakan ID video: ${videoId}`);
    } else {
      throw new Error("Error: Tidak dapat mengekstrak ID video dari URL");
    }
  }

  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log(
        `Mengambil transcript untuk video ID: ${videoId} (percobaan ${
          retries + 1
        }/${MAX_RETRIES})`
      );

      const raw = await YoutubeTranscript.fetchTranscript(videoId);

      if (!raw || !Array.isArray(raw) || raw.length === 0) {
        throw new Error("Tidak ada transcript yang tersedia untuk video ini");
      }

      console.log(`Berhasil mendapatkan ${raw.length} segmen transcript`);

      return raw.map<TimedTranscriptItem>((item) => ({
        start: item.offset,
        duration: item.duration,
        text: item.text,
      }));
    } catch (error: any) {
      retries++;

      if (
        error.message &&
        error.message.includes("Could not find any transcript")
      ) {
        console.error(
          `Error: Video tidak memiliki transcript atau transcript tidak tersedia dalam bahasa default`
        );
        throw new Error("Video tidak memiliki transcript");
      }

      console.error(
        `Error saat mengambil transcript (percobaan ${retries}/${MAX_RETRIES}):`,
        error.message || error
      );

      // Jika masih ada percobaan tersisa, tunggu sebelum mencoba lagi
      if (retries < MAX_RETRIES) {
        console.log(`Mencoba kembali dalam ${RETRY_DELAY / 1000} detik...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error("Gagal mengambil transcript setelah beberapa percobaan");
        throw error; // Re-throw error untuk ditangani oleh caller
      }
    }
  }

  // Seharusnya tidak sampai ke sini karena semua kasus sudah ditangani di dalam loop
  throw new Error("Gagal mengambil transcript");
}
