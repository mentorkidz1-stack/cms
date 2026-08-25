function stripHtml(html, maxLength) {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (maxLength && text.length > maxLength) {
    return `${text.slice(0, maxLength).trim()}…`;
  }
  return text;
}

module.exports = { stripHtml };
