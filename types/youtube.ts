/**
 * Interface untuk hasil scraping video YouTube lengkap
 */
export interface YoutubeVideoFull {
  id: string;
  title: string;
  link: string;
  thumbnail: string;
  channel: {
    id: string;
    name: string;
    link: string;
    handle: string | null;
    verified: boolean;
    thumbnail: string;
  };
  description: string;
  views: number;
  uploaded: string;
  duration: number;
  durationString: string;
}

/**
 * Interface untuk hasil scraping video YouTube yang disederhanakan
 * Hanya berisi id, title, link, dan channel
 */
export interface YoutubeVideo {
  id: string;
  title: string;
  link: string;
  channel: {
    id: string;
    name: string;
    link: string;
  };
}

/**
 * Interface untuk opsi pencarian YouTube
 */
export interface YoutubeSearchOptions {
  type: string;
  request: {
    headers: {
      Cookie: string;
      "Accept-Language": string;
    };
  };
}
