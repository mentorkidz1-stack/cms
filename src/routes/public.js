const express = require('express');
const prisma = require('../db');
const { buildWhatsAppLink, formationMessage, serviceMessage } = require('../utils/whatsapp');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const s = res.locals.settings;
    const [formations, posts, team, testimonials, partners] = await Promise.all([
      s.showFormations
        ? prisma.formation.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' }, take: 6 })
        : [],
      s.showBlog
        ? prisma.post.findMany({
            where: { published: true },
            orderBy: { publishedAt: 'desc' },
            take: 3,
            include: { category: true },
          })
        : [],
      s.showEquipe
        ? prisma.teamMember.findMany({ where: { published: true }, orderBy: { order: 'asc' }, take: 4 })
        : [],
      s.showTemoignages
        ? prisma.testimonial.findMany({ where: { published: true }, orderBy: { order: 'asc' }, take: 6 })
        : [],
      s.showPartenaires
        ? prisma.partner.findMany({ where: { published: true }, orderBy: { order: 'asc' } })
        : [],
    ]);
    res.render('public/home', { title: s.siteName, formations, posts, team, testimonials, partners });
  } catch (err) {
    next(err);
  }
});

router.get('/formations', async (req, res, next) => {
  try {
    if (!res.locals.settings.showFormations) return next();
    const formations = await prisma.formation.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    });
    res.render('public/formations-list', { title: res.locals.settings.formationsLabel, formations });
  } catch (err) {
    next(err);
  }
});

router.get('/formations/:slug', async (req, res, next) => {
  try {
    if (!res.locals.settings.showFormations) return next();
    const formation = await prisma.formation.findUnique({ where: { slug: req.params.slug } });
    if (!formation || !formation.published) {
      return res.status(404).render('public/404', { title: `${res.locals.settings.formationsLabelSingular} introuvable` });
    }
    const whatsappLink = buildWhatsAppLink(
      res.locals.settings.whatsappNumber,
      formationMessage(formation, res.locals.settings.formationsLabelSingular)
    );
    const related = await prisma.formation.findMany({
      where: { published: true, NOT: { id: formation.id } },
      take: 3,
    });
    res.render('public/formation-detail', { title: formation.title, formation, whatsappLink, related });
  } catch (err) {
    next(err);
  }
});

router.get('/services', async (req, res, next) => {
  try {
    if (!res.locals.settings.showServices) return next();
    const services = await prisma.service.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    });
    res.render('public/services-list', { title: res.locals.settings.servicesLabel, services });
  } catch (err) {
    next(err);
  }
});

router.get('/services/:slug', async (req, res, next) => {
  try {
    if (!res.locals.settings.showServices) return next();
    const service = await prisma.service.findUnique({ where: { slug: req.params.slug } });
    if (!service || !service.published) {
      return res.status(404).render('public/404', { title: `${res.locals.settings.servicesLabelSingular} introuvable` });
    }
    const whatsappLink = buildWhatsAppLink(
      res.locals.settings.whatsappNumber,
      serviceMessage(service, res.locals.settings.servicesLabelSingular)
    );
    const related = await prisma.service.findMany({
      where: { published: true, NOT: { id: service.id } },
      take: 3,
    });
    res.render('public/service-detail', { title: service.title, service, whatsappLink, related });
  } catch (err) {
    next(err);
  }
});

router.get('/blog', async (req, res, next) => {
  try {
    if (!res.locals.settings.showBlog) return next();
    const categorySlug = req.query.categorie;
    const where = { published: true };
    if (categorySlug) where.category = { slug: categorySlug };
    const [posts, categories] = await Promise.all([
      prisma.post.findMany({ where, orderBy: { publishedAt: 'desc' }, include: { category: true } }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
    ]);
    res.render('public/blog-list', {
      title: res.locals.settings.blogLabel,
      posts,
      categories,
      activeCategory: categorySlug || null,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/blog/:slug', async (req, res, next) => {
  try {
    if (!res.locals.settings.showBlog) return next();
    const post = await prisma.post.findUnique({
      where: { slug: req.params.slug },
      include: { category: true },
    });
    if (!post || !post.published) {
      return res.status(404).render('public/404', { title: 'Article introuvable' });
    }
    const related = await prisma.post.findMany({
      where: { published: true, NOT: { id: post.id } },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      include: { category: true },
    });
    res.render('public/blog-detail', { title: post.title, post, related });
  } catch (err) {
    next(err);
  }
});

router.get('/equipe', async (req, res, next) => {
  try {
    if (!res.locals.settings.showEquipe) return next();
    const team = await prisma.teamMember.findMany({
      where: { published: true },
      orderBy: { order: 'asc' },
    });
    res.render('public/equipe-list', { title: res.locals.settings.equipeLabel, team });
  } catch (err) {
    next(err);
  }
});

router.get('/equipe/:slug', async (req, res, next) => {
  try {
    if (!res.locals.settings.showEquipe) return next();
    const member = await prisma.teamMember.findUnique({ where: { slug: req.params.slug } });
    if (!member || !member.published) {
      return res.status(404).render('public/404', { title: 'Membre introuvable' });
    }
    res.render('public/equipe-detail', { title: member.name, member });
  } catch (err) {
    next(err);
  }
});

router.get('/about', (req, res, next) => {
  if (!res.locals.settings.showAbout) return next();
  res.render('public/about', { title: 'À propos' });
});

router.get('/contact', (req, res) => {
  res.render('public/contact', { title: 'Contact' });
});

router.get('/galerie', async (req, res, next) => {
  try {
    if (!res.locals.settings.showGalerie) return next();
    const categoryFilter = req.query.categorie || null;
    const where = { published: true };
    if (categoryFilter) where.category = categoryFilter;
    const items = await prisma.galleryItem.findMany({ where, orderBy: { order: 'asc' } });
    const allItems = await prisma.galleryItem.findMany({ where: { published: true }, select: { category: true } });
    const categories = [...new Set(allItems.map((i) => i.category).filter(Boolean))];
    res.render('public/galerie', { title: 'Galerie', items, categories, activeCategory: categoryFilter });
  } catch (err) {
    next(err);
  }
});

router.get('/temoignages', async (req, res, next) => {
  try {
    if (!res.locals.settings.showTemoignages) return next();
    const testimonials = await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: { order: 'asc' },
    });
    res.render('public/temoignages', { title: 'Témoignages', testimonials });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
