const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const prisma = require('../db');
const upload = require('../middleware/upload');
const { requireAdmin, redirectIfAuthenticated } = require('../middleware/auth');
const { uniqueSlug } = require('../utils/slugify');

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
    const { title, description, program, price, published } = req.body;
    const slug = await uniqueSlug(prisma.formation, title);
    await prisma.formation.create({
      data: {
        title,
        slug,
        description,
        program,
        price: parseInt(price, 10) || 0,
        imageUrl: uploadedPath(req.file),
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
    const { title, description, program, price, published } = req.body;
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

router.post('/temoignages', upload.single('photo'), async (req, res, next) => {
  try {
    const { authorName, authorRole, quote, rating, order, published } = req.body;
    await prisma.testimonial.create({
      data: {
        authorName,
        authorRole,
        quote,
        rating: rating ? parseInt(rating, 10) : null,
        order: parseInt(order, 10) || 0,
        photoUrl: uploadedPath(req.file),
        published: published === 'on',
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

router.put('/temoignages/:id', upload.single('photo'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { authorName, authorRole, quote, rating, order, published } = req.body;
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) return res.status(404).send('Témoignage introuvable');
    await prisma.testimonial.update({
      where: { id },
      data: {
        authorName,
        authorRole,
        quote,
        rating: rating ? parseInt(rating, 10) : null,
        order: parseInt(order, 10) || 0,
        photoUrl: uploadedPath(req.file) || existing.photoUrl,
        published: published === 'on',
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

router.post('/settings', upload.single('banner'), async (req, res, next) => {
  try {
    const {
      whatsappNumber, siteName, contactEmail,
      heroTitle, heroSubtitle, aboutContent, primaryColor,
      formationsLabel, formationsLabelSingular, formationsSubheading,
      servicesLabel, servicesLabelSingular, servicesSubheading,
      blogLabel, blogSubheading,
      equipeLabel, equipeSubheading,
      contactHeading, contactSubheading,
      showFormations, showServices, showBlog, showEquipe,
      showGalerie, showTemoignages, showPartenaires, showAbout,
    } = req.body;

    const existing = await prisma.settings.findUnique({ where: { id: 1 } });

    const data = {
      whatsappNumber, siteName, contactEmail,
      heroTitle, heroSubtitle, aboutContent,
      primaryColor: HEX_COLOR.test(primaryColor) ? primaryColor : (existing ? existing.primaryColor : '#356DF1'),
      bannerImageUrl: uploadedPath(req.file) || (existing ? existing.bannerImageUrl : null),
      formationsLabel, formationsLabelSingular, formationsSubheading,
      servicesLabel, servicesLabelSingular, servicesSubheading,
      blogLabel, blogSubheading,
      equipeLabel, equipeSubheading,
      contactHeading, contactSubheading,
      showFormations: showFormations === 'on',
      showServices: showServices === 'on',
      showBlog: showBlog === 'on',
      showEquipe: showEquipe === 'on',
      showGalerie: showGalerie === 'on',
      showTemoignages: showTemoignages === 'on',
      showPartenaires: showPartenaires === 'on',
      showAbout: showAbout === 'on',
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
