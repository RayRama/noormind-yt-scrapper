import { TimedTranscriptItem } from "../types";

export function TranscriptToText(transcript: TimedTranscriptItem[]): string {
  return transcript.map((i) => i.text).join(" ");
}
