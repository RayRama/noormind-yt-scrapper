import { OpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Interface untuk hasil enhancement transcript
 */
export interface EnhancedTranscript {
  text: string;
  cleanedText: string;
  summary: string;
  keywords: string[];
  topics: string[];
}

/**
 * Meningkatkan kualitas teks transcript menggunakan OpenAI
 * - Memperbaiki tata bahasa dan ejaan
 * - Menghilangkan filler words dan repetisi
 * - Menambahkan tanda baca yang tepat
 * - Memberikan summary dan keywords
 * 
 * @param transcriptText - Teks transcript mentah dari YouTube
 * @param ustadzName - Nama ustadz untuk konteks
 * @returns EnhancedTranscript object dengan teks yang sudah ditingkatkan
 */
export async function enhanceTranscript(
  transcriptText: string,
  ustadzName: string
): Promise<EnhancedTranscript> {
  try {
    // Validasi input
    if (!transcriptText || transcriptText.trim() === '') {
      throw new Error('Transcript text tidak boleh kosong');
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY tidak ditemukan di environment variables');
    }

    console.log(`Meningkatkan kualitas transcript dari ${ustadzName}...`);

    // Prompt untuk OpenAI
    const prompt = `
    Kamu adalah asisten AI yang ahli dalam meningkatkan kualitas transcript ceramah Islam.
    
    Berikut adalah transcript mentah dari ceramah Ustadz ${ustadzName}:
    
    """
    ${transcriptText.substring(0, 15000)} // Batasi panjang untuk menghindari token limit
    """
    
    Tolong lakukan hal berikut:
    
    1. Perbaiki tata bahasa dan ejaan
    2. Hilangkan filler words (seperti "um", "uh", "eh") dan repetisi yang tidak perlu
    3. Tambahkan tanda baca yang tepat
    4. Perbaiki kapitalisasi
    5. Pastikan nama Allah, istilah Islam, dan ayat Al-Quran ditulis dengan benar
    
    Berikan output dalam format JSON dengan struktur berikut:
    {
      "cleanedText": "Teks transcript yang sudah dibersihkan dan diperbaiki",
      "summary": "Ringkasan singkat (maksimal 3 paragraf) tentang isi ceramah",
      "keywords": ["kata kunci 1", "kata kunci 2", ...],
      "topics": ["topik 1", "topik 2", ...]
    }
    
    Hanya berikan JSON, tanpa penjelasan tambahan.
    `;

    // Panggil OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Kamu adalah asisten AI yang ahli dalam meningkatkan kualitas transcript ceramah Islam.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    // Parse response
    const responseContent = completion.choices[0].message.content;
    
    if (!responseContent) {
      throw new Error('Tidak ada respons dari OpenAI');
    }

    const enhancedData = JSON.parse(responseContent) as Omit<EnhancedTranscript, 'text'>;

    // Kembalikan hasil dengan teks asli
    return {
      text: transcriptText,
      cleanedText: enhancedData.cleanedText,
      summary: enhancedData.summary,
      keywords: enhancedData.keywords,
      topics: enhancedData.topics
    };
  } catch (error: any) {
    console.error('Error saat meningkatkan kualitas transcript:', error.message);
    
    // Jika error, kembalikan teks asli tanpa enhancement
    return {
      text: transcriptText,
      cleanedText: transcriptText, // Gunakan teks asli jika gagal
      summary: 'Tidak dapat membuat ringkasan',
      keywords: [],
      topics: []
    };
  }
}

/**
 * Fungsi untuk membersihkan teks transcript tanpa menggunakan OpenAI
 * Berguna sebagai fallback jika OpenAI tidak tersedia atau untuk menghemat biaya
 * 
 * @param transcriptText - Teks transcript mentah dari YouTube
 * @returns Teks yang sudah dibersihkan
 */
export function cleanTranscriptBasic(transcriptText: string): string {
  if (!transcriptText) return '';
  
  return transcriptText
    // Hapus karakter HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    
    // Hapus tag [Musik] dan sejenisnya
    .replace(/\[.*?\]/g, '')
    
    // Hapus repetisi kata yang sama berturut-turut
    .replace(/\b(\w+)\s+\1\b/gi, '$1')
    
    // Hapus spasi berlebih
    .replace(/\s+/g, ' ')
    
    // Trim
    .trim();
}
