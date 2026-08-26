const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

const MAX_WIDTH = 600; // largement suffisant pour un affichage ~50px de haut, même en Retina (x2/x3)

// Redimensionne/compresse un logo uploadé pour éviter de stocker des fichiers
// trop lourds tout en gardant un rendu net sur écrans haute densité. Les SVG
// sont déjà vectoriels (résolution infinie) : on les laisse tels quels.
async function optimizeLogoImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.svg') return;

  const pipeline = sharp(filePath).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });

  let output;
  if (ext === '.png') {
    output = await pipeline.png({ compressionLevel: 8 }).toBuffer();
  } else if (ext === '.jpg' || ext === '.jpeg') {
    output = await pipeline.jpeg({ quality: 85 }).toBuffer();
  } else if (ext === '.webp') {
    output = await pipeline.webp({ quality: 85 }).toBuffer();
  } else {
    output = await pipeline.toBuffer();
  }

  await fs.writeFile(filePath, output);
}

module.exports = { optimizeLogoImage };
