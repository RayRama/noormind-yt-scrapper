import { OpenAI } from "openai";
import dotenv from "dotenv";

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
  full_transcript: string;
  enhanced_transcript: string;
  summary: string;
  topics: string[];
  questions: string[];
}

/**
 * Meningkatkan kualitas teks transcript menggunakan OpenAI
 * - Memperbaiki tata bahasa dan ejaan
 * - Menghilangkan filler words dan repetisi
 * - Menambahkan tanda baca yang tepat
 * - Memberikan summary, topics, dan questions
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
    if (!transcriptText || transcriptText.trim() === "") {
      throw new Error("Transcript text tidak boleh kosong");
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY tidak ditemukan di environment variables"
      );
    }

    console.log(`Meningkatkan kualitas transcript dari ${ustadzName}...`);

    // Bersihkan transcript dengan metode basic terlebih dahulu
    const rawTranscript = cleanTranscriptBasic(transcriptText);

    // Prompt untuk OpenAI
    const prompt = `
    Kamu adalah asisten AI ahli pemrosesan transcript ceramah Islam.
    
    Berikut adalah isi dari ceramahnya:
    """
    ${rawTranscript.slice(0, 15000)}
    """

     TUGAS
    1. Tingkatkan kualitas transcript:  
       - Perbaiki ejaan, kapitalisasi, tanda baca.  
       - Hilangkan filler ("um", "eh", "…") & repetisi.  
       - Pastikan istilah Islam, nama Allah, dan ayat Al-Qur'an ditulis benar.  
       - Jangan memotong makna asli.
       - Hindari untuk menggunakan newline, cukup degan spasi saja.

    2. Klasifikasi jenis konten:  
       - Jika Q&A: ekstrak daftar pertanyaan dari penanya.  
       - Jika ceramah biasa: buat 3-5 pertanyaan reflektif yang relevan.

    3. Buat ringkasan ≤ 500 karakter atau ≤ 3 paragraf.

    4. Berikan **HANYA** objek JSON VALID berisi:
    
    {
      "full_transcript": "TRANSKRIP_MENTAH_LENGKAP",
      "enhanced_transcript": "TRANSKRIP_SETELAH_DIPERBAIKI",
      "summary": "RINGKASAN",
      "topics": ["TOPIK1", "TOPIK2", "..."],
      "questions": ["Q1", "Q2", "..."]
    }
    `;

    // Panggil OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah asisten AI ahli pemrosesan transcript ceramah Islam.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    // Parse response
    const responseContent = completion.choices[0].message.content;

    if (!responseContent) {
      throw new Error("Tidak ada respons dari OpenAI");
    }

    const enhancedData = JSON.parse(responseContent) as EnhancedTranscript;

    // Validasi hasil
    if (!enhancedData.enhanced_transcript || !enhancedData.summary) {
      throw new Error("Format respons OpenAI tidak valid");
    }

    // Pastikan semua field ada, gunakan default jika tidak ada
    return {
      full_transcript: enhancedData.full_transcript || transcriptText,
      enhanced_transcript: enhancedData.enhanced_transcript,
      summary: enhancedData.summary,
      topics: enhancedData.topics || [],
      questions: enhancedData.questions || [],
    };
  } catch (error: any) {
    console.error(
      "Error saat meningkatkan kualitas transcript:",
      error.message
    );

    // Jika error, kembalikan teks asli tanpa enhancement
    return {
      full_transcript: transcriptText,
      enhanced_transcript: cleanTranscriptBasic(transcriptText), // Gunakan teks yang dibersihkan basic jika gagal
      summary: "Tidak dapat membuat ringkasan",
      topics: [],
      questions: [],
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
  if (!transcriptText) return "";

  return (
    transcriptText
      // Hapus karakter HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")

      // Hapus tag [Musik] dan sejenisnya
      .replace(/\[.*?\]/g, "")

      // Hapus repetisi kata yang sama berturut-turut
      .replace(/\b(\w+)\s+\1\b/gi, "$1")

      // Hapus spasi berlebih
      .replace(/\s+/g, " ")

      // Trim
      .trim()
  );
}
