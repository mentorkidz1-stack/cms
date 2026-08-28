const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const prisma = require('../db');
const upload = require('../middleware/upload');
const { uploadTestimonial, uploadSettings, uploadSignatory } = require('../middleware/upload');
const { requireAdmin, redirectIfAuthenticated } = require('../middleware/auth');
const { uniqueSlug } = require('../utils/slugify');
const { generateReceiptPdf, generateCertificatePdf } = require('../utils/pdf');
const { TEMPLATES, getTemplate, isValidTemplateId } = require('../templates/registry');
const { optimizeLogoImage } = require('../utils/image');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.',
});

function uploadedPath(file) {
  return file ? `/uploads/${file.filename}` : undefined;
}

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');

// Décode une signature dessinée à la main (canvas.toDataURL) et l'enregistre
// comme un fichier PNG classique dans /uploads, au même titre qu'un upload.
function saveSignatureDataUrl(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) return null;
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  const filename = `sig-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.png`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(base64, 'base64'));
  return `/uploads/${filename}`;
}

// ---------- Auth ----------

router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('admin/login', { title: 'Connexion admin', layout: false });
});

router.post('/login', loginLimiter, redirectIfAuthenticated, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await prisma.admin.findUnique({ where: { email: (email || '').toLowerCase().trim() } });
    const valid = admin ? await bcrypt.compare(password || '', admin.passwordHash) : false;
    if (!valid) {
      req.flash('error', 'Identifiants incorrects.');
      return res.redirect('/admin/login');
    }
    req.session.adminId = admin.id;
    return res.redirect('/admin');
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.use(requireAdmin);

// ---------- Dashboard ----------

router.get('/', async (req, res, next) => {
  try {
    const [formationsCount, servicesCount, postsCount, teamCount, galleryCount, testimonialsCount, partnersCount] =
      await Promise.all([
        prisma.formation.count(),
        prisma.service.count(),
        prisma.post.count(),
        prisma.teamMember.count(),
        prisma.galleryItem.count(),
        prisma.testimonial.count(),
        prisma.partner.count(),
      ]);
    res.render('admin/dashboard', {
      title: 'Tableau de bord',
      counts: {
        formations: formationsCount,
        services: servicesCount,
        posts: postsCount,
        team: teamCount,
        gallery: galleryCount,
        testimonials: testimonialsCount,
        partners: partnersCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Mon compte ----------

router.get('/mon-compte', async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({ where: { id: req.session.adminId } });
    res.render('admin/account', { title: 'Mon compte', adminEmail: admin.email });
  } catch (err) {
    next(err);
  }
});

router.post('/mon-compte/mot-de-passe', async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const admin = await prisma.admin.findUnique({ where: { id: req.session.adminId } });

    const valid = await bcrypt.compare(currentPassword || '', admin.passwordHash);
    if (!valid) {
      req.flash('error', 'Mot de passe actuel incorrect.');
      return res.redirect('/admin/mon-compte');
    }
    if (!newPassword || newPassword.length < 8) {
      req.flash('error', 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return res.redirect('/admin/mon-compte');
    }
    if (newPassword !== confirmPassword) {
      req.flash('error', 'La confirmation ne correspond pas au nouveau mot de passe.');
      return res.redirect('/admin/mon-compte');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash } });
    req.flash('success', 'Mot de passe mis à jour.');
    res.redirect('/admin/mon-compte');
  } catch (err) {
    next(err);
  }
});

// ---------- Formations ----------

router.get('/formations', async (req, res, next) => {
  try {
    const formations = await prisma.formation.findMany({ orderBy: { createdAt: 'desc' } });
    res.render('admin/formations/list', { title: 'Formations', formations });
  } catch (err) {
    next(err);
  }
});

router.get('/formations/new', (req, res) => {
  res.render('admin/formations/form', { title: 'Nouvelle formation', formation: null });
});

router.post('/formations', upload.single('image'), async (req, res, next) => {
  try {
    const { title, description, program, price, sessionDate, totalSeats, seatsTaken, published } = req.body;
    const slug = await uniqueSlug(prisma.formation, title);
    await prisma.formation.create({
      data: {
        title,
        slug,
        description,
        program,
        price: parseInt(price, 10) || 0,
        imageUrl: uploadedPath(req.file),
        sessionDate: sessionDate ? new Date(sessionDate) : null,
        totalSeats: totalSeats ? parseInt(totalSeats, 10) : null,
        seatsTaken: parseInt(seatsTaken, 10) || 0,
        published: published === 'on',
      },
    });
    req.flash('success', 'Formation créée.');
    res.redirect('/admin/formations');
  } catch (err) {
    next(err);
  }
});

router.get('/formations/:id/edit', async (req, res, next) => {
  try {
    const formation = await prisma.formation.findUnique({ where: { id: Number(req.params.id) } });
    if (!formation) return res.status(404).send('Formation introuvable');
    res.render('admin/formations/form', { title: 'Modifier la formation', formation });
  } catch (err) {
    next(err);
  }
});

router.put('/formations/:id', upload.single('image'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, description, program, price, sessionDate, totalSeats, seatsTaken, published } = req.body;
    const existing = await prisma.formation.findUnique({ where: { id } });
    if (!existing) return res.status(404).send('Formation introuvable');
    const slug = title !== existing.title ? await uniqueSlug(prisma.formation, title, id) : existing.slug;
    await prisma.formation.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        program,
        price: parseInt(price, 10) || 0,
        imageUrl: uploadedPath(req.file) || existing.imageUrl,
        sessionDate: sessionDate ? new Date(sessionDate) : null,
        totalSeats: totalSeats ? parseInt(totalSeats, 10) : null,
        seatsTaken: parseInt(seatsTaken, 10) || 0,
        published: published === 'on',
      },
    });
    req.flash('success', 'Formation mise à jour.');
    res.redirect('/admin/formations');
  } catch (err) {
    next(err);
  }
});

router.delete('/formations/:id', async (req, res, next) => {
  try {
    await prisma.formation.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Formation supprimée.');
    res.redirect('/admin/formations');
  } catch (err) {
    next(err);
  }
});

// ---------- Services ----------

router.get('/services', async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({ orderBy: { createdAt: 'desc' } });
    res.render('admin/services/list', { title: 'Services', services });
  } catch (err) {
    next(err);
  }
});

router.get('/services/new', (req, res) => {
  res.render('admin/services/form', { title: 'Nouveau service', service: null });
});

router.post('/services', upload.single('image'), async (req, res, next) => {
  try {
    const { title, description, price, published } = req.body;
    const slug = await uniqueSlug(prisma.service, title);
    await prisma.service.create({
      data: {
        title,
        slug,
        description,
        price: price ? parseInt(price, 10) : null,
        imageUrl: uploadedPath(req.file),
        published: published === 'on',
      },
    });
    req.flash('success', 'Service créé.');
    res.redirect('/admin/services');
  } catch (err) {
    next(err);
  }
});

router.get('/services/:id/edit', async (req, res, next) => {
  try {
    const service = await prisma.service.findUnique({ where: { id: Number(req.params.id) } });
    if (!service) return res.status(404).send('Service introuvable');
    res.render('admin/services/form', { title: 'Modifier le service', service });
  } catch (err) {
    next(err);
  }
});

router.put('/services/:id', upload.single('image'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, description, price, published } = req.body;
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return res.status(404).send('Service introuvable');
    const slug = title !== existing.title ? await uniqueSlug(prisma.service, title, id) : existing.slug;
    await prisma.service.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        price: price ? parseInt(price, 10) : null,
        imageUrl: uploadedPath(req.file) || existing.imageUrl,
        published: published === 'on',
      },
    });
    req.flash('success', 'Service mis à jour.');
    res.redirect('/admin/services');
  } catch (err) {
    next(err);
  }
});

router.delete('/services/:id', async (req, res, next) => {
  try {
    await prisma.service.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Service supprimé.');
    res.redirect('/admin/services');
  } catch (err) {
    next(err);
  }
});

// ---------- Blog ----------

router.get('/blog', async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' }, include: { category: true } });
    res.render('admin/blog/list', { title: 'Articles de blog', posts });
  } catch (err) {
    next(err);
  }
});

router.get('/blog/new', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.render('admin/blog/form', { title: 'Nouvel article', post: null, categories });
  } catch (err) {
    next(err);
  }
});

async function resolveCategoryId(body) {
  if (body.categoryId === 'new' && body.newCategoryName && body.newCategoryName.trim()) {
    const name = body.newCategoryName.trim();
    const slug = await uniqueSlug(prisma.category, name);
    const category = await prisma.category.create({ data: { name, slug } });
    return category.id;
  }
  return body.categoryId ? Number(body.categoryId) : null;
}

router.post('/blog', upload.single('cover'), async (req, res, next) => {
  try {
    const { title, excerpt, contentHtml, published } = req.body;
    const slug = await uniqueSlug(prisma.post, title);
    const categoryId = await resolveCategoryId(req.body);
    await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        contentHtml,
        coverImageUrl: uploadedPath(req.file),
        categoryId,
        published: published === 'on',
        publishedAt: new Date(),
      },
    });
    req.flash('success', 'Article créé.');
    res.redirect('/admin/blog');
  } catch (err) {
    next(err);
  }
});

router.get('/blog/:id/edit', async (req, res, next) => {
  try {
    const [post, categories] = await Promise.all([
      prisma.post.findUnique({ where: { id: Number(req.params.id) } }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
    ]);
    if (!post) return res.status(404).send('Article introuvable');
    res.render('admin/blog/form', { title: 'Modifier l\'article', post, categories });
  } catch (err) {
    next(err);
  }
});

router.put('/blog/:id', upload.single('cover'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, excerpt, contentHtml, published } = req.body;
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return res.status(404).send('Article introuvable');
    const slug = title !== existing.title ? await uniqueSlug(prisma.post, title, id) : existing.slug;
    const categoryId = await resolveCategoryId(req.body);
    await prisma.post.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt,
        contentHtml,
        coverImageUrl: uploadedPath(req.file) || existing.coverImageUrl,
        categoryId,
        published: published === 'on',
      },
    });
    req.flash('success', 'Article mis à jour.');
    res.redirect('/admin/blog');
  } catch (err) {
    next(err);
  }
});

router.delete('/blog/:id', async (req, res, next) => {
  try {
    await prisma.post.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Article supprimé.');
    res.redirect('/admin/blog');
  } catch (err) {
    next(err);
  }
});

// ---------- Équipe ----------

router.get('/equipe', async (req, res, next) => {
  try {
    const team = await prisma.teamMember.findMany({ orderBy: { order: 'asc' } });
    res.render('admin/equipe/list', { title: 'Équipe', team });
  } catch (err) {
    next(err);
  }
});

router.get('/equipe/new', (req, res) => {
  res.render('admin/equipe/form', { title: 'Nouveau membre', member: null });
});

router.post('/equipe', upload.single('photo'), async (req, res, next) => {
  try {
    const { name, role, bio, linkedin, email, order, published } = req.body;
    const slug = await uniqueSlug(prisma.teamMember, name);
    await prisma.teamMember.create({
      data: {
        name,
        slug,
        role,
        bio,
        linkedin,
        email,
        order: parseInt(order, 10) || 0,
        photoUrl: uploadedPath(req.file),
        published: published === 'on',
      },
    });
    req.flash('success', 'Membre ajouté.');
    res.redirect('/admin/equipe');
  } catch (err) {
    next(err);
  }
});

router.get('/equipe/:id/edit', async (req, res, next) => {
  try {
    const member = await prisma.teamMember.findUnique({ where: { id: Number(req.params.id) } });
    if (!member) return res.status(404).send('Membre introuvable');
    res.render('admin/equipe/form', { title: 'Modifier le membre', member });
  } catch (err) {
    next(err);
  }
});

router.put('/equipe/:id', upload.single('photo'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, role, bio, linkedin, email, order, published } = req.body;
    const existing = await prisma.teamMember.findUnique({ where: { id } });
    if (!existing) return res.status(404).send('Membre introuvable');
    const slug = name !== existing.name ? await uniqueSlug(prisma.teamMember, name, id) : existing.slug;
    await prisma.teamMember.update({
      where: { id },
      data: {
        name,
        slug,
        role,
        bio,
        linkedin,
        email,
        order: parseInt(order, 10) || 0,
        photoUrl: uploadedPath(req.file) || existing.photoUrl,
        published: published === 'on',
      },
    });
    req.flash('success', 'Membre mis à jour.');
    res.redirect('/admin/equipe');
  } catch (err) {
    next(err);
  }
});

router.delete('/equipe/:id', async (req, res, next) => {
  try {
    await prisma.teamMember.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Membre supprimé.');
    res.redirect('/admin/equipe');
  } catch (err) {
    next(err);
  }
});

// ---------- Témoignages ----------

router.get('/temoignages', async (req, res, next) => {
  try {
    const testimonials = await prisma.testimonial.findMany({ orderBy: { order: 'asc' } });
    res.render('admin/temoignages/list', { title: 'Témoignages', testimonials });
  } catch (err) {
    next(err);
  }
});

router.get('/temoignages/new', (req, res) => {
  res.render('admin/temoignages/form', { title: 'Nouveau témoignage', testimonial: null });
});

function testimonialMediaFields(req, existing) {
  const { mediaType, videoUrl } = req.body;
  const photoFile = req.files && req.files.photo ? req.files.photo[0] : null;
  const audioFile = req.files && req.files.audioFile ? req.files.audioFile[0] : null;

  let mediaUrl = existing ? existing.mediaUrl : null;
  if (mediaType === 'audio') {
    mediaUrl = uploadedPath(audioFile) || (existing && existing.mediaType === 'audio' ? existing.mediaUrl : null);
  } else if (mediaType === 'video') {
    mediaUrl = videoUrl || null;
  } else {
    mediaUrl = null;
  }

  return {
    photoUrl: uploadedPath(photoFile) || (existing ? existing.photoUrl : undefined),
    mediaType: ['audio', 'video'].includes(mediaType) ? mediaType : 'text',
    mediaUrl,
  };
}

router.post('/temoignages', uploadTestimonial, async (req, res, next) => {
  try {
    const { authorName, authorRole, quote, rating, order, published } = req.body;
    const media = testimonialMediaFields(req, null);
    await prisma.testimonial.create({
      data: {
        authorName,
        authorRole,
        quote,
        rating: rating ? parseInt(rating, 10) : null,
        order: parseInt(order, 10) || 0,
        published: published === 'on',
        ...media,
      },
    });
    req.flash('success', 'Témoignage ajouté.');
    res.redirect('/admin/temoignages');
  } catch (err) {
    next(err);
  }
});

router.get('/temoignages/:id/edit', async (req, res, next) => {
  try {
    const testimonial = await prisma.testimonial.findUnique({ where: { id: Number(req.params.id) } });
    if (!testimonial) return res.status(404).send('Témoignage introuvable');
    res.render('admin/temoignages/form', { title: 'Modifier le témoignage', testimonial });
  } catch (err) {
    next(err);
  }
});

router.put('/temoignages/:id', uploadTestimonial, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { authorName, authorRole, quote, rating, order, published } = req.body;
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) return res.status(404).send('Témoignage introuvable');
    const media = testimonialMediaFields(req, existing);
    await prisma.testimonial.update({
      where: { id },
      data: {
        authorName,
        authorRole,
        quote,
        rating: rating ? parseInt(rating, 10) : null,
        order: parseInt(order, 10) || 0,
        published: published === 'on',
        ...media,
      },
    });
    req.flash('success', 'Témoignage mis à jour.');
    res.redirect('/admin/temoignages');
  } catch (err) {
    next(err);
  }
});

router.delete('/temoignages/:id', async (req, res, next) => {
  try {
    await prisma.testimonial.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Témoignage supprimé.');
    res.redirect('/admin/temoignages');
  } catch (err) {
    next(err);
  }
});

// ---------- Partenaires ----------

router.get('/partenaires', async (req, res, next) => {
  try {
    const partners = await prisma.partner.findMany({ orderBy: { order: 'asc' } });
    res.render('admin/partenaires/list', { title: 'Partenaires', partners });
  } catch (err) {
    next(err);
  }
});

router.get('/partenaires/new', (req, res) => {
  res.render('admin/partenaires/form', { title: 'Nouveau partenaire', partner: null });
});

router.post('/partenaires', upload.single('logo'), async (req, res, next) => {
  try {
    const { name, websiteUrl, order, published } = req.body;
    await prisma.partner.create({
      data: {
        name,
        websiteUrl,
        order: parseInt(order, 10) || 0,
        logoUrl: uploadedPath(req.file) || '',
        published: published === 'on',
      },
    });
    req.flash('success', 'Partenaire ajouté.');
    res.redirect('/admin/partenaires');
  } catch (err) {
    next(err);
  }
});

router.get('/partenaires/:id/edit', async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({ where: { id: Number(req.params.id) } });
    if (!partner) return res.status(404).send('Partenaire introuvable');
    res.render('admin/partenaires/form', { title: 'Modifier le partenaire', partner });
  } catch (err) {
    next(err);
  }
});

router.put('/partenaires/:id', upload.single('logo'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, websiteUrl, order, published } = req.body;
    const existing = await prisma.partner.findUnique({ where: { id } });
    if (!existing) return res.status(404).send('Partenaire introuvable');
    await prisma.partner.update({
      where: { id },
      data: {
        name,
        websiteUrl,
        order: parseInt(order, 10) || 0,
        logoUrl: uploadedPath(req.file) || existing.logoUrl,
        published: published === 'on',
      },
    });
    req.flash('success', 'Partenaire mis à jour.');
    res.redirect('/admin/partenaires');
  } catch (err) {
    next(err);
  }
});

router.delete('/partenaires/:id', async (req, res, next) => {
  try {
    await prisma.partner.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Partenaire supprimé.');
    res.redirect('/admin/partenaires');
  } catch (err) {
    next(err);
  }
});

// ---------- Galerie ----------

router.get('/galerie', async (req, res, next) => {
  try {
    const items = await prisma.galleryItem.findMany({ orderBy: { order: 'asc' } });
    res.render('admin/galerie/list', { title: 'Galerie', items });
  } catch (err) {
    next(err);
  }
});

router.get('/galerie/new', (req, res) => {
  res.render('admin/galerie/form', { title: 'Nouvel élément', item: null });
});

router.post('/galerie', upload.single('media'), async (req, res, next) => {
  try {
    const { title, mediaType, videoUrl, category, order, published } = req.body;
    const mediaUrl = mediaType === 'video' ? videoUrl : uploadedPath(req.file) || '';
    await prisma.galleryItem.create({
      data: {
        title,
        mediaType: mediaType === 'video' ? 'video' : 'image',
        mediaUrl,
        category,
        order: parseInt(order, 10) || 0,
        published: published === 'on',
      },
    });
    req.flash('success', 'Élément ajouté à la galerie.');
    res.redirect('/admin/galerie');
  } catch (err) {
    next(err);
  }
});

router.get('/galerie/:id/edit', async (req, res, next) => {
  try {
    const item = await prisma.galleryItem.findUnique({ where: { id: Number(req.params.id) } });
    if (!item) return res.status(404).send('Élément introuvable');
    res.render('admin/galerie/form', { title: "Modifier l'élément", item });
  } catch (err) {
    next(err);
  }
});

router.put('/galerie/:id', upload.single('media'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, mediaType, videoUrl, category, order, published } = req.body;
    const existing = await prisma.galleryItem.findUnique({ where: { id } });
    if (!existing) return res.status(404).send('Élément introuvable');
    const isVideo = mediaType === 'video';
    const mediaUrl = isVideo ? videoUrl : uploadedPath(req.file) || existing.mediaUrl;
    await prisma.galleryItem.update({
      where: { id },
      data: {
        title,
        mediaType: isVideo ? 'video' : 'image',
        mediaUrl,
        category,
        order: parseInt(order, 10) || 0,
        published: published === 'on',
      },
    });
    req.flash('success', 'Élément mis à jour.');
    res.redirect('/admin/galerie');
  } catch (err) {
    next(err);
  }
});

router.delete('/galerie/:id', async (req, res, next) => {
  try {
    await prisma.galleryItem.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Élément supprimé.');
    res.redirect('/admin/galerie');
  } catch (err) {
    next(err);
  }
});

// ---------- Signataires ----------

router.get('/signataires', async (req, res, next) => {
  try {
    const signatories = await prisma.signatory.findMany({ orderBy: [{ isDefault: 'desc' }, { fullName: 'asc' }] });
    res.render('admin/signataires/list', { title: 'Signataires', signatories });
  } catch (err) {
    next(err);
  }
});

router.get('/signataires/new', (req, res) => {
  res.render('admin/signataires/form', { title: 'Nouveau signataire', signatory: null });
});

async function setSingleDefault(newDefaultId) {
  await prisma.signatory.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  if (newDefaultId) {
    await prisma.signatory.update({ where: { id: newDefaultId }, data: { isDefault: true } });
  }
}

router.post('/signataires', uploadSignatory, async (req, res, next) => {
  try {
    const { fullName, title, isDefault, signatureDataUrl } = req.body;
    const signatureFile = req.files && req.files.signature ? req.files.signature[0] : null;
    const stampFile = req.files && req.files.stamp ? req.files.stamp[0] : null;

    const count = await prisma.signatory.count();
    const signatory = await prisma.signatory.create({
      data: {
        fullName,
        title,
        signatureUrl: saveSignatureDataUrl(signatureDataUrl) || uploadedPath(signatureFile),
        stampUrl: uploadedPath(stampFile),
        isDefault: count === 0 ? true : isDefault === 'on',
      },
    });
    if (signatory.isDefault) await setSingleDefault(signatory.id);
    req.flash('success', 'Signataire ajouté.');
    res.redirect('/admin/signataires');
  } catch (err) {
    next(err);
  }
});

router.get('/signataires/:id/edit', async (req, res, next) => {
  try {
    const signatory = await prisma.signatory.findUnique({ where: { id: Number(req.params.id) } });
    if (!signatory) return res.status(404).send('Signataire introuvable');
    res.render('admin/signataires/form', { title: 'Modifier le signataire', signatory });
  } catch (err) {
    next(err);
  }
});

router.put('/signataires/:id', uploadSignatory, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { fullName, title, isDefault, signatureDataUrl } = req.body;
    const existing = await prisma.signatory.findUnique({ where: { id } });
    if (!existing) return res.status(404).send('Signataire introuvable');
    const signatureFile = req.files && req.files.signature ? req.files.signature[0] : null;
    const stampFile = req.files && req.files.stamp ? req.files.stamp[0] : null;

    await prisma.signatory.update({
      where: { id },
      data: {
        fullName,
        title,
        signatureUrl: saveSignatureDataUrl(signatureDataUrl) || uploadedPath(signatureFile) || existing.signatureUrl,
        stampUrl: uploadedPath(stampFile) || existing.stampUrl,
        isDefault: isDefault === 'on',
      },
    });
    if (isDefault === 'on') await setSingleDefault(id);
    req.flash('success', 'Signataire mis à jour.');
    res.redirect('/admin/signataires');
  } catch (err) {
    next(err);
  }
});

router.delete('/signataires/:id', async (req, res, next) => {
  try {
    await prisma.signatory.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Signataire supprimé.');
    res.redirect('/admin/signataires');
  } catch (err) {
    next(err);
  }
});

// ---------- FAQ ----------

router.get('/faq', async (req, res, next) => {
  try {
    const faqs = await prisma.faq.findMany({ orderBy: { order: 'asc' } });
    res.render('admin/faq/list', { title: 'FAQ', faqs });
  } catch (err) {
    next(err);
  }
});

router.get('/faq/new', (req, res) => {
  res.render('admin/faq/form', { title: 'Nouvelle question', faq: null });
});

router.post('/faq', async (req, res, next) => {
  try {
    const { question, answer, order, published } = req.body;
    await prisma.faq.create({
      data: { question, answer, order: parseInt(order, 10) || 0, published: published === 'on' },
    });
    req.flash('success', 'Question ajoutée.');
    res.redirect('/admin/faq');
  } catch (err) {
    next(err);
  }
});

router.get('/faq/:id/edit', async (req, res, next) => {
  try {
    const faq = await prisma.faq.findUnique({ where: { id: Number(req.params.id) } });
    if (!faq) return res.status(404).send('Question introuvable');
    res.render('admin/faq/form', { title: 'Modifier la question', faq });
  } catch (err) {
    next(err);
  }
});

router.put('/faq/:id', async (req, res, next) => {
  try {
    const { question, answer, order, published } = req.body;
    await prisma.faq.update({
      where: { id: Number(req.params.id) },
      data: { question, answer, order: parseInt(order, 10) || 0, published: published === 'on' },
    });
    req.flash('success', 'Question mise à jour.');
    res.redirect('/admin/faq');
  } catch (err) {
    next(err);
  }
});

router.delete('/faq/:id', async (req, res, next) => {
  try {
    await prisma.faq.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Question supprimée.');
    res.redirect('/admin/faq');
  } catch (err) {
    next(err);
  }
});

// ---------- Reçus ----------

async function nextNumber(model, prefix) {
  const count = await model.count();
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
}

router.get('/recus', async (req, res, next) => {
  try {
    const receipts = await prisma.receipt.findMany({ orderBy: { createdAt: 'desc' } });
    res.render('admin/recus/list', { title: 'Reçus', receipts });
  } catch (err) {
    next(err);
  }
});

router.get('/recus/new', async (req, res, next) => {
  try {
    const formations = await prisma.formation.findMany({ orderBy: { title: 'asc' } });
    const services = await prisma.service.findMany({ orderBy: { title: 'asc' } });
    const signatories = await prisma.signatory.findMany({ orderBy: [{ isDefault: 'desc' }, { fullName: 'asc' }] });
    res.render('admin/recus/form', { title: 'Nouveau reçu', formations, services, signatories });
  } catch (err) {
    next(err);
  }
});

router.post('/recus', async (req, res, next) => {
  try {
    const { clientName, clientPhone, itemLabel, amount, paymentMethod, paymentDate, notes, signatoryId } = req.body;
    const receiptNumber = await nextNumber(prisma.receipt, 'REC');
    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        clientName,
        clientPhone,
        itemLabel,
        amount: parseInt(amount, 10) || 0,
        paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        notes,
        signatoryId: signatoryId ? Number(signatoryId) : null,
      },
    });
    req.flash('success', 'Reçu créé.');
    res.redirect(`/admin/recus/${receipt.id}/pdf`);
  } catch (err) {
    next(err);
  }
});

router.get('/recus/:id/pdf', async (req, res, next) => {
  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id: Number(req.params.id) },
      include: { signatory: true },
    });
    if (!receipt) return res.status(404).send('Reçu introuvable');
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const signatory = receipt.signatory || (await prisma.signatory.findFirst({ where: { isDefault: true } }));
    generateReceiptPdf(res, receipt, settings, signatory);
  } catch (err) {
    next(err);
  }
});

router.delete('/recus/:id', async (req, res, next) => {
  try {
    await prisma.receipt.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Reçu supprimé.');
    res.redirect('/admin/recus');
  } catch (err) {
    next(err);
  }
});

// ---------- Attestations ----------

router.get('/attestations', async (req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({ orderBy: { createdAt: 'desc' } });
    res.render('admin/attestations/list', { title: 'Attestations', certificates });
  } catch (err) {
    next(err);
  }
});

router.get('/attestations/new', async (req, res, next) => {
  try {
    const formations = await prisma.formation.findMany({ orderBy: { title: 'asc' } });
    const signatories = await prisma.signatory.findMany({ orderBy: [{ isDefault: 'desc' }, { fullName: 'asc' }] });
    res.render('admin/attestations/form', { title: 'Nouvelle attestation', formations, signatories });
  } catch (err) {
    next(err);
  }
});

router.post('/attestations', async (req, res, next) => {
  try {
    const { studentName, formationTitle, completionDate, signatoryId } = req.body;
    const certificateNumber = await nextNumber(prisma.certificate, 'CERT');
    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        studentName,
        formationTitle,
        completionDate: completionDate ? new Date(completionDate) : new Date(),
        signatoryId: signatoryId ? Number(signatoryId) : null,
      },
    });
    req.flash('success', 'Attestation créée.');
    res.redirect(`/admin/attestations/${certificate.id}/pdf`);
  } catch (err) {
    next(err);
  }
});

router.get('/attestations/:id/pdf', async (req, res, next) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: Number(req.params.id) },
      include: { signatory: true },
    });
    if (!certificate) return res.status(404).send('Attestation introuvable');
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const signatory = certificate.signatory || (await prisma.signatory.findFirst({ where: { isDefault: true } }));
    const verifyUrl = `${req.protocol}://${req.get('host')}/verify/${certificate.certificateNumber}`;
    await generateCertificatePdf(res, certificate, settings, signatory, verifyUrl);
  } catch (err) {
    next(err);
  }
});

router.delete('/attestations/:id', async (req, res, next) => {
  try {
    await prisma.certificate.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Attestation supprimée.');
    res.redirect('/admin/attestations');
  } catch (err) {
    next(err);
  }
});

// ---------- Modèles de site ----------

router.get('/templates', async (req, res, next) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    res.render('admin/templates/list', {
      title: 'Modèles de site',
      templates: TEMPLATES,
      activeTemplateId: settings.templateId,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/templates/apply', async (req, res, next) => {
  try {
    const { templateId } = req.body;
    if (!isValidTemplateId(templateId)) {
      req.flash('error', 'Modèle inconnu.');
      return res.redirect('/admin/templates');
    }
    await prisma.settings.update({ where: { id: 1 }, data: { templateId } });
    req.flash('success', `Modèle « ${getTemplate(templateId).name} » appliqué à votre site.`);
    res.redirect('/admin/templates');
  } catch (err) {
    next(err);
  }
});

// ---------- Paramètres ----------

router.get('/settings', async (req, res, next) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    res.render('admin/settings', { title: 'Paramètres', settingsForm: settings });
  } catch (err) {
    next(err);
  }
});

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

router.post('/settings', uploadSettings, async (req, res, next) => {
  try {
    const {
      whatsappNumber, siteName, contactEmail,
      heroTitle, heroSubtitle, aboutContent, primaryColor,
      formationsLabel, formationsLabelSingular, formationsSubheading,
      servicesLabel, servicesLabelSingular, servicesSubheading,
      blogLabel, blogSubheading,
      equipeLabel, equipeSubheading,
      contactHeading, contactSubheading,
      logoType, logoHighlightWord, logoFontFamily, logoFontSize,
      defaultWhatsappMessage, phoneNumber, addressCity, addressLandmarks,
      googleMapsUrl, openingHours, showOnlineBadge, momoDetails,
      showFormations, showServices, showBlog, showEquipe,
      showGalerie, showTemoignages, showPartenaires, showAbout,
      settingsFormSubmitted,
    } = req.body;

    const existing = await prisma.settings.findUnique({ where: { id: 1 } });
    const bannerFile = req.files && req.files.banner ? req.files.banner[0] : null;
    const logoFile = req.files && req.files.logo ? req.files.logo[0] : null;

    // Une case à cocher absente du formulaire est ambiguë : "décochée" (vrai
    // formulaire complet, marqué par settingsFormSubmitted) ou "non envoyée"
    // (appel partiel) ? Sans le marqueur, on préserve la valeur existante
    // plutôt que de désactiver silencieusement une section du site.
    const isFullFormSubmit = settingsFormSubmitted === '1';
    function boolField(value, existingValue, fallback) {
      if (isFullFormSubmit) return value === 'on';
      if (value !== undefined) return value === 'on';
      return existing ? existingValue : fallback;
    }

    if (logoFile) {
      try {
        await optimizeLogoImage(logoFile.path);
      } catch (err) {
        // Le fichier original reste utilisable même si l'optimisation échoue
        console.error('Échec optimisation du logo :', err.message);
      }
    }

    const data = {
      whatsappNumber, siteName, contactEmail,
      heroTitle, heroSubtitle, aboutContent,
      primaryColor: HEX_COLOR.test(primaryColor) ? primaryColor : (existing ? existing.primaryColor : '#356DF1'),
      bannerImageUrl: uploadedPath(bannerFile) || (existing ? existing.bannerImageUrl : null),
      logoUrl: uploadedPath(logoFile) || (existing ? existing.logoUrl : null),
      logoType: logoType !== undefined
        ? (logoType === 'image' ? 'image' : 'text')
        : (existing ? existing.logoType : 'text'),
      logoHighlightWord: logoHighlightWord !== undefined
        ? logoHighlightWord
        : (existing ? existing.logoHighlightWord : ''),
      logoFontFamily: logoFontFamily !== undefined
        ? (logoFontFamily === 'serif' ? 'serif' : 'sans')
        : (existing ? existing.logoFontFamily : 'sans'),
      logoFontSize: logoFontSize !== undefined
        ? (parseInt(logoFontSize, 10) || 24)
        : (existing ? existing.logoFontSize : 24),
      formationsLabel, formationsLabelSingular, formationsSubheading,
      servicesLabel, servicesLabelSingular, servicesSubheading,
      blogLabel, blogSubheading,
      equipeLabel, equipeSubheading,
      contactHeading, contactSubheading,
      defaultWhatsappMessage, phoneNumber, addressCity, addressLandmarks,
      googleMapsUrl, openingHours, momoDetails,
      showOnlineBadge: boolField(showOnlineBadge, existing && existing.showOnlineBadge, true),
      showFormations: boolField(showFormations, existing && existing.showFormations, true),
      showServices: boolField(showServices, existing && existing.showServices, true),
      showBlog: boolField(showBlog, existing && existing.showBlog, true),
      showEquipe: boolField(showEquipe, existing && existing.showEquipe, true),
      showGalerie: boolField(showGalerie, existing && existing.showGalerie, true),
      showTemoignages: boolField(showTemoignages, existing && existing.showTemoignages, true),
      showPartenaires: boolField(showPartenaires, existing && existing.showPartenaires, true),
      showAbout: boolField(showAbout, existing && existing.showAbout, true),
    };
    await prisma.settings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    req.flash('success', 'Paramètres enregistrés.');
    res.redirect('/admin/settings');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
