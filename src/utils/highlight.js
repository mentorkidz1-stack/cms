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

module.exports = { renderHighlighted };
