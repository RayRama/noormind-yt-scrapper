# Noormind YouTube Scraper + Vector Store Indexer

Proyek ini digunakan untuk crawling video YouTube berdasarkan kata kunci ustadz, mengambil transcript, melakukan segmentasi, membuat embeddings, dan menyimpan ke Qdrant vector database.

## Fitur Utama

1. **YouTube Crawling**: Mencari video berdasarkan kata kunci ustadz
2. **Transcript Extraction**: Mengambil dan memproses transcript video
3. **AI Enhancement**: Meningkatkan kualitas transcript menggunakan OpenAI
4. **Segmentation**: Membagi transcript menjadi segmen-segmen untuk vector store
5. **Embedding**: Membuat embeddings untuk setiap segmen
6. **Vector Storage**: Menyimpan embeddings dan metadata ke Qdrant

## Prasyarat

- Node.js (versi 16.x atau lebih baru)
- npm atau yarn
- API key YouTube Data v3
- API key OpenAI (opsional, untuk peningkatan kualitas transcript)
- API key Jina AI (opsional, untuk segmentasi)
- Akses ke server Qdrant

## Instalasi

### Mengkloning Repositori

```bash
# Kloning repositori
git clone https://github.com/rayrama/noormind-yt-scrapper.git
cd noormind-yt-scrapper

# Instal dependensi
npm install
```

### Konfigurasi Environment Variables

Buat file `.env` di root proyek dengan konten berikut:

```env
YT_API_KEY="your-youtube-api-key"
QDRANT_URL="your-qdrant-server-url"
EMBEDDING_ENDPOINT="your-embedding-api-endpoint"
JINA_API_ENDPOINT="https://api.jina.ai/v1/segment"
JINA_API_KEY="your-jina-api-key"
OPENAI_API_KEY="your-openai-api-key"
```

Catatan: Jina AI ada versi gratis di website-nya

## Penggunaan

### Testing Komponen Individual

```bash
# Test YouTube transcript extraction
npx ts-node test-transcript.ts

# Test transcript enhancement dengan OpenAI
npx ts-node test-enhance-transcript.ts

# Test integrasi transcript processing
npx ts-node test-process-transcript.ts
```
