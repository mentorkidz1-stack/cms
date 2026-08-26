function youtubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

module.exports = { youtubeEmbedUrl };
