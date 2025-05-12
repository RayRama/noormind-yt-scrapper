import axios, { AxiosError } from "axios";
import { JINA_API_ENDPOINT } from "../../config/urls";

// Maksimum percobaan jika terjadi error
const MAX_RETRIES = 3;
// Waktu delay antar percobaan (dalam ms)
const RETRY_DELAY = 1000;
// Timeout untuk request (dalam ms)
const REQUEST_TIMEOUT = 30000; // 30 detik

// Tipe untuk parameter fungsi segmentText
interface SegmentationRequest {
  content: string;
  return_tokens: boolean;
  return_chunks: boolean;
}

// Tipe untuk respons segmentasi
interface Segment {
  text: string;
  start: number;
  end: number;
  [key: string]: any; // Untuk properti tambahan yang mungkin ada
}

/**
 * Fungsi untuk melakukan segmentasi teks menggunakan Jina AI API
 * @param postData - Parameter untuk segmentasi
 * @returns Array of segments atau null jika terjadi error
 */
export async function segmentText(postData: SegmentationRequest): Promise<Segment[] | null> {
  // Validasi input
  if (!postData.content || typeof postData.content !== 'string' || postData.content.trim() === '') {
    console.error("Error: content tidak boleh kosong");
    return null;
  }

  // Validasi API key
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    console.error("Error: JINA_API_KEY tidak ditemukan di environment variables");
    return null;
  }

  // Validasi endpoint
  if (!JINA_API_ENDPOINT) {
    console.error("Error: JINA_API_ENDPOINT tidak dikonfigurasi");
    return null;
  }

  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      console.log(`Mengirim request segmentasi ke Jina AI (percobaan ${retries + 1}/${MAX_RETRIES})...`);
      
      const response = await axios.post(
        JINA_API_ENDPOINT,
        postData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: REQUEST_TIMEOUT
        }
      );

      // Validasi respons
      if (!response.data || !response.data.chunks || !Array.isArray(response.data.chunks)) {
        console.error("Error: Format respons tidak valid", response.data);
        return null;
      }

      console.log(`Berhasil mendapatkan ${response.data.chunks.length} segmen`);
      return response.data.chunks;
      
    } catch (error) {
      retries++;
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // Request diterima server tapi status code di luar range 2xx
        console.error(
          `Error saat melakukan segmentasi (percobaan ${retries}/${MAX_RETRIES}):`,
          `Status: ${axiosError.response.status}`,
          `Data: ${JSON.stringify(axiosError.response.data)}`
        );
      } else if (axiosError.request) {
        // Request dibuat tapi tidak ada respons
        console.error(
          `Error: Tidak ada respons dari server Jina AI (percobaan ${retries}/${MAX_RETRIES}):`,
          axiosError.message
        );
      } else {
        // Error saat setup request
        console.error(
          `Error saat setup request segmentasi (percobaan ${retries}/${MAX_RETRIES}):`,
          axiosError.message
        );
      }
      
      // Jika masih ada percobaan tersisa, tunggu sebelum mencoba lagi
      if (retries < MAX_RETRIES) {
        console.log(`Mencoba kembali dalam ${RETRY_DELAY/1000} detik...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error("Gagal melakukan segmentasi setelah beberapa percobaan");
        return null;
      }
    }
  }
  
  // Seharusnya tidak sampai ke sini karena semua kasus sudah ditangani di dalam loop
  return null;
}
