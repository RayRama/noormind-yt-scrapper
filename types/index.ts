export interface KeywordConfig {
  /** Kata kunci pencarian YouTube */
  searchTerm: string;
  /** Nama ustadz untuk metadata */
  ustadzName: string;
}

export interface YTVideo {
  id: string;
  url: string;
  title: string;
  publishedAt: string;
  /** Durasi video (detik) */
  duration: number;
}

export interface TimedTranscriptItem {
  /** detik sejak awal video */
  start: number;
  /** panjang teks (detik) */
  duration: number;
  text: string;
}

export interface Segment {
  start: number;
  end: number;
  text: string;
}

export type Embedding = number[];

export interface Payload {
  start: number;
  end: number;
  text: string;
  ustadz: string;
  keyword: string;
  /** URL ke video + timestamp */
  url: string;
}
