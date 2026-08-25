const DIACRITICS_RANGE = new RegExp('[\\u0300-\\u036f]', 'g');

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(DIACRITICS_RANGE, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function uniqueSlug(model, baseText, ignoreId) {
  const base = slugify(baseText) || 'item';
  let slug = base;
  let counter = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await model.findUnique({ where: { slug } });
    if (!existing || (ignoreId && existing.id === ignoreId)) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

module.exports = { slugify, uniqueSlug };
