import { enhanceTranscript, cleanTranscriptBasic } from "./transcriptEnhancer";
import { segmentText, Segment } from "./segmentation";
import { TimedTranscriptItem } from "../../types";

/**
 * Interface untuk timestamp item dalam hasil pemrosesan
 */
export interface TimestampItem {
  text: string;
  start: number;
  end: number;
}

/**
 * Interface untuk hasil pemrosesan transcript
 */
export interface ProcessedTranscript {
  full_transcript: string;
  enhanced_transcript: string;
  segmented_texts: string[];
  summary: string;
  topics: string[];
  questions: string[];
  timestamp: TimestampItem[];
  metadata: {
    videoId: string;
    url: string;
    duration: number;
  };
}

/**
 * Memproses transcript dari awal hingga akhir:
 * 1. Mengambil transcript dari YouTube
 * 2. Meningkatkan kualitas teks dengan AI
 * 3. Melakukan segmentasi untuk vector store
 *
 * @param transcript - Array TimedTranscriptItem dari YouTube
 * @param videoId - ID video YouTube
 * @param ustadzName - Nama ustadz untuk konteks
 * @returns ProcessedTranscript dengan teks yang sudah ditingkatkan dan disegmentasi
 */
export async function processTranscript(
  transcript: TimedTranscriptItem[],
  videoId: string,
  ustadzName: string
): Promise<ProcessedTranscript> {
  try {
    console.log(
      `Memproses transcript untuk video ${videoId} (Ustadz ${ustadzName})...`
    );

    // 1. Gabungkan transcript menjadi teks utuh
    const originalText = transcript.map((item) => item.text).join(" ");

    // 2. Tingkatkan kualitas transcript dengan OpenAI (jika API key tersedia)
    let enhancedData;
    if (process.env.OPENAI_API_KEY) {
      console.log("Meningkatkan kualitas transcript dengan OpenAI...");
      enhancedData = await enhanceTranscript(originalText, ustadzName);
    } else {
      console.log(
        "OPENAI_API_KEY tidak tersedia, menggunakan teks yang dibersihkan secara basic"
      );
      enhancedData = {
        full_transcript: originalText,
        enhanced_transcript: cleanTranscriptBasic(originalText),
        summary: "Tidak tersedia (OpenAI API key tidak ditemukan)",
        topics: [],
        questions: [],
      };
    }

    // 3. Lakukan segmentasi pada teks yang sudah ditingkatkan
    console.log("Melakukan segmentasi teks...");
    let segments: Segment[] = [];

    try {
      const segmentationResult = await segmentText({
        content: enhancedData.enhanced_transcript,
        return_tokens: false,
        return_chunks: true,
      });

      if (segmentationResult) {
        segments = segmentationResult;
        console.log(`Berhasil membuat ${segments.length} segmen`);
      } else {
        console.warn(
          "Gagal melakukan segmentasi, menggunakan segmentasi manual sederhana"
        );
        // Segmentasi manual sederhana jika API segmentasi gagal
        segments = simpleSegmentation(enhancedData.enhanced_transcript);
      }
    } catch (error) {
      console.error("Error saat melakukan segmentasi:", error);
      // Segmentasi manual sederhana sebagai fallback
      segments = simpleSegmentation(enhancedData.enhanced_transcript);
    }

    // 4. Buat array segmented_texts dari segments
    const segmented_texts = segments.map((segment) => segment.text);

    // 5. Buat timestamp dari transcript asli
    const timestamp: TimestampItem[] = transcript.map((item) => ({
      text: item.text,
      start: Math.floor(item.start),
      end: Math.floor(item.start + item.duration),
    }));

    // 6. Hitung durasi total
    const lastItem = transcript[transcript.length - 1];
    const duration = lastItem.start + lastItem.duration;

    // 7. Buat URL video
    const url = `https://youtu.be/${videoId}`;

    // 8. Kembalikan hasil pemrosesan
    return {
      full_transcript: enhancedData.full_transcript,
      enhanced_transcript: enhancedData.enhanced_transcript,
      segmented_texts,
      summary: enhancedData.summary,
      topics: enhancedData.topics,
      questions: enhancedData.questions,
      timestamp,
      metadata: {
        videoId,
        url,
        duration,
      },
    };
  } catch (error: any) {
    console.error("Error saat memproses transcript:", error.message);
    throw new Error(`Gagal memproses transcript: ${error.message}`);
  }
}

/**
 * Fungsi segmentasi sederhana sebagai fallback jika API segmentasi gagal
 * Membagi teks menjadi segmen berdasarkan kalimat atau paragraf
 *
 * @param text - Teks yang akan disegmentasi
 * @returns Array of Segment
 */
function simpleSegmentation(text: string): Segment[] {
  if (!text) return [];

  // Bagi teks menjadi paragraf
  const paragraphs = text.split(/\n\n+/);

  // Jika paragraf terlalu panjang, bagi menjadi kalimat
  const segments: Segment[] = [];

  paragraphs.forEach((paragraph) => {
    // Jika paragraf lebih dari 200 karakter, bagi menjadi kalimat
    if (paragraph.length > 200) {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);

      let currentSegment = "";
      sentences.forEach((sentence) => {
        if (currentSegment.length + sentence.length < 200) {
          currentSegment += (currentSegment ? " " : "") + sentence;
        } else {
          if (currentSegment) {
            segments.push({
              text: currentSegment.trim(),
            });
          }
          currentSegment = sentence;
        }
      });

      // Tambahkan sisa kalimat jika ada
      if (currentSegment) {
        segments.push({
          text: currentSegment.trim(),
        });
      }
    } else {
      // Paragraf pendek, tambahkan sebagai satu segmen
      segments.push({
        text: paragraph.trim(),
      });
    }
  });

  return segments;
}
