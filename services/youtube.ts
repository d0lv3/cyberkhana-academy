/**
 * Extract an 11-character YouTube video id from a full URL or a bare id.
 * Handles watch?v=, youtu.be/, /embed/, /shorts/, /live/ and plain ids.
 * Returns '' when nothing usable is found.
 */
export function parseYouTubeId(input: string): string {
  const s = (input || '').trim();
  if (!s) return '';
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|[?&]v=)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : '';
}

/** The embed URL for a video id (or '' if the id is empty). */
export function youtubeEmbedUrl(videoId: string): string {
  return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
}
