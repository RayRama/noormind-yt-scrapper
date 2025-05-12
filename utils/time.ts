export function ToSeconds(time: string): number {
  const match = time.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h = "0", m = "0", s = "0"] = match;
  return +h * 3600 + +m * 60 + +s;
}
