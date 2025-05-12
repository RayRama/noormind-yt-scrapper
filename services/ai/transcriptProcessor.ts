import { enhanceTranscript, cleanTranscriptBasic } from './transcriptEnhancer';
import { segmentText } from './segmentation';
import { TimedTranscriptItem } from '../../types';
import { Segment } from '../../types';

/**
 * Interface untuk hasil pemrosesan transcript
 */
export interface ProcessedTranscript {
  originalText: string;
  enhancedText: string;
  segments: Segment[];
  summary: string;
  keywords: string[];
  topics: string[];
  metadata: {
    videoId: string;
    ustadzName: string;
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
    console.log(`Memproses transcript untuk video ${videoId} (Ustadz ${ustadzName})...`);
    
    // 1. Gabungkan transcript menjadi teks utuh
    const originalText = transcript.map(item => item.text).join(' ');
    
    // 2. Bersihkan transcript dengan metode basic terlebih dahulu
    const cleanedBasic = cleanTranscriptBasic(originalText);
    
    // 3. Tingkatkan kualitas transcript dengan OpenAI (jika API key tersedia)
    let enhancedData;
    if (process.env.OPENAI_API_KEY) {
      console.log('Meningkatkan kualitas transcript dengan OpenAI...');
      enhancedData = await enhanceTranscript(cleanedBasic, ustadzName);
    } else {
      console.log('OPENAI_API_KEY tidak tersedia, menggunakan teks yang dibersihkan secara basic');
      enhancedData = {
        text: originalText,
        cleanedText: cleanedBasic,
        summary: 'Tidak tersedia (OpenAI API key tidak ditemukan)',
        keywords: [],
        topics: []
      };
    }
    
    // 4. Lakukan segmentasi pada teks yang sudah ditingkatkan
    console.log('Melakukan segmentasi teks...');
    let segments: Segment[] = [];
    
    try {
      const segmentationResult = await segmentText({
        content: enhancedData.cleanedText,
        return_tokens: false,
        return_chunks: true
      });
      
      if (segmentationResult) {
        segments = segmentationResult;
        console.log(`Berhasil membuat ${segments.length} segmen`);
      } else {
        console.warn('Gagal melakukan segmentasi, menggunakan segmentasi manual sederhana');
        // Segmentasi manual sederhana jika API segmentasi gagal
        segments = simpleSegmentation(enhancedData.cleanedText);
      }
    } catch (error) {
      console.error('Error saat melakukan segmentasi:', error);
      // Segmentasi manual sederhana sebagai fallback
      segments = simpleSegmentation(enhancedData.cleanedText);
    }
    
    // 5. Hitung durasi total
    const lastItem = transcript[transcript.length - 1];
    const duration = lastItem.start + lastItem.duration;
    
    // 6. Kembalikan hasil pemrosesan
    return {
      originalText,
      enhancedText: enhancedData.cleanedText,
      segments,
      summary: enhancedData.summary,
      keywords: enhancedData.keywords,
      topics: enhancedData.topics,
      metadata: {
        videoId,
        ustadzName,
        duration
      }
    };
  } catch (error: any) {
    console.error('Error saat memproses transcript:', error.message);
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
  let position = 0;
  
  paragraphs.forEach((paragraph, index) => {
    // Jika paragraf lebih dari 200 karakter, bagi menjadi kalimat
    if (paragraph.length > 200) {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      
      let currentSegment = '';
      sentences.forEach(sentence => {
        if (currentSegment.length + sentence.length < 200) {
          currentSegment += (currentSegment ? ' ' : '') + sentence;
        } else {
          if (currentSegment) {
            segments.push({
              text: currentSegment.trim(),
              start: position,
              end: position + currentSegment.length
            });
            position += currentSegment.length + 1; // +1 untuk spasi
          }
          currentSegment = sentence;
        }
      });
      
      // Tambahkan sisa kalimat jika ada
      if (currentSegment) {
        segments.push({
          text: currentSegment.trim(),
          start: position,
          end: position + currentSegment.length
        });
        position += currentSegment.length + 2; // +2 untuk double newline
      }
    } else {
      // Paragraf pendek, tambahkan sebagai satu segmen
      segments.push({
        text: paragraph.trim(),
        start: position,
        end: position + paragraph.length
      });
      position += paragraph.length + 2; // +2 untuk double newline
    }
  });
  
  return segments;
}
