import { TimedTranscriptItem } from "../types";

export function TranscriptToText(transcript: TimedTranscriptItem[]): string {
  return transcript.map((i) => i.text).join(" ");
}

export function YtLinkToId(link: string): string {
  const url = new URL(link);
  const id = url.pathname.replace("/watch?v=", "");
  const params = new URLSearchParams(url.search);
  if (params.has("v")) {
    return params.get("v") || "";
  }
  if (url.hostname === "youtu.be") {
    return id.replace("/", "");
  }
  return id;
}
