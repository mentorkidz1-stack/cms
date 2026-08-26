const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const ALLOWED_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALLOWED_AUDIO_EXT = new Set(['.mp3', '.wav', '.ogg', '.m4a']);

function imageFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_IMAGE_EXT.has(ext)) {
    return cb(new Error('Format d\'image non supporté (jpg, png, webp, gif uniquement).'));
  }
  return cb(null, true);
}

function audioFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_AUDIO_EXT.has(ext)) {
    return cb(new Error('Format audio non supporté (mp3, wav, ogg, m4a uniquement).'));
  }
  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadAudio = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

// Témoignage : une photo d'auteur (image) ET, optionnellement, une note vocale (audio) dans le même formulaire.
const uploadTestimonial = multer({
  storage,
  fileFilter(req, file, cb) {
    if (file.fieldname === 'audioFile') return audioFileFilter(req, file, cb);
    return imageFileFilter(req, file, cb);
  },
  limits: { fileSize: 15 * 1024 * 1024 },
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'audioFile', maxCount: 1 },
]);

const uploadSettings = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'banner', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
]);

const uploadSignatory = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'signature', maxCount: 1 },
  { name: 'stamp', maxCount: 1 },
]);

module.exports = upload;
module.exports.uploadAudio = uploadAudio;
module.exports.uploadTestimonial = uploadTestimonial;
module.exports.uploadSettings = uploadSettings;
module.exports.uploadSignatory = uploadSignatory;
