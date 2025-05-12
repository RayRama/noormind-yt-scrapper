/**
 * Konfigurasi URL untuk API dan layanan eksternal
 * Semua URL yang digunakan dalam aplikasi harus diambil dari sini
 *
 * Nilai-nilai ini diambil dari file .env
 */

// URL untuk Qdrant Vector Database
export const QDRANT_URL = process.env.QDRANT_URL || "";

// URL untuk layanan embedding
export const EMBEDDING_ENDPOINT = process.env.EMBEDDING_POINT || "";

// URL untuk layanan segmentasi Jina AI
export const JINA_API_ENDPOINT = process.env.JINA_API_ENDPOINT || "";

// URL untuk YouTube video (base URL)
export const YOUTUBE_VIDEO_URL = "https://youtu.be/";

/**
 * Catatan: Untuk penggunaan production, sebaiknya nilai-nilai di atas
 * diambil dari environment variables. Contoh implementasi:
 *
 * // Memerlukan @types/node untuk TypeScript
 * export const QDRANT_URL = process.env.QDRANT_URL || "";
 */
