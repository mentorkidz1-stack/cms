function escapeHtml(text) {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Permet à l'admin de marquer une partie de phrase à mettre en avant
// en l'entourant de {{...}}, sans lui exposer un éditeur riche pour un simple titre.
function renderHighlighted(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(/\{\{(.+?)\}\}/g, '<span class="hl-style">$1</span>');
}

// Logo texte : colore la première occurrence de `highlightWord` dans le nom
// du site (ex: "Africa" dans "CtechAfrica"), sans toucher au nom brut utilisé
// ailleurs (titre de page, meta description, PDF...).
function renderLogoText(siteName, highlightWord) {
  const escaped = escapeHtml(siteName);
  if (!highlightWord) return escaped;
  const escapedWord = escapeHtml(highlightWord);
  const idx = escaped.toLowerCase().indexOf(escapedWord.toLowerCase());
  if (idx === -1) return escaped;
  return (
    escaped.slice(0, idx) +
    `<span class="hl-style">${escaped.slice(idx, idx + escapedWord.length)}</span>` +
    escaped.slice(idx + escapedWord.length)
  );
}

module.exports = { renderHighlighted, renderLogoText };
