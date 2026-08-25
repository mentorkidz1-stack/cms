require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { slugify } = require('../src/utils/slugify');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ctechafrica.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'change-this-password';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  });
  console.log(`Compte admin prêt : ${adminEmail}`);

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteName: 'CtechAfrica',
      whatsappNumber: '',
      contactEmail: 'contact@ctechafrica.com',
    },
  });

  const formations = [
    {
      title: 'Analyse de données avec Python',
      description: "Maîtrisez l'analyse et la visualisation de données avec Python, Pandas et Power BI.",
      program: '<p>Introduction à Python pour la data, manipulation avec Pandas, visualisation, et étude de cas réels.</p>',
      price: 75000,
    },
    {
      title: 'Développement Web Full-Stack',
      description: 'Formation complète pour devenir développeur full-stack (JavaScript, Node.js, bases de données).',
      program: '<p>HTML/CSS/JS, Node.js et Express, bases de données relationnelles, déploiement.</p>',
      price: 120000,
    },
    {
      title: "Introduction à l'Intelligence Artificielle",
      description: "Comprenez les fondamentaux du machine learning et de l'IA appliquée à l'entreprise.",
      program: '<p>Concepts clés du machine learning, cas d\'usage en entreprise, initiation aux modèles de langage.</p>',
      price: 95000,
    },
  ];

  for (const f of formations) {
    const slug = slugify(f.title);
    await prisma.formation.upsert({
      where: { slug },
      update: {},
      create: { ...f, slug },
    });
  }

  const services = [
    {
      title: 'Audit et stratégie data',
      description: '<p>Nous analysons vos données existantes et proposons une feuille de route pour en tirer de la valeur.</p>',
      price: null,
    },
    {
      title: "Développement d'applications sur mesure",
      description: '<p>Conception et développement de logiciels et applications web adaptés à vos besoins métier.</p>',
      price: null,
    },
    {
      title: "Intégration de solutions IA",
      description: '<p>Automatisez vos processus grâce à des solutions d\'intelligence artificielle intégrées à vos outils.</p>',
      price: null,
    },
  ];

  for (const s of services) {
    const slug = slugify(s.title);
    await prisma.service.upsert({
      where: { slug },
      update: {},
      create: { ...s, slug },
    });
  }

  const categorySlug = slugify('Actualités');
  const category = await prisma.category.upsert({
    where: { slug: categorySlug },
    update: {},
    create: { name: 'Actualités', slug: categorySlug },
  });

  const postSlug = slugify('Bienvenue sur le blog de CtechAfrica');
  await prisma.post.upsert({
    where: { slug: postSlug },
    update: {},
    create: {
      title: 'Bienvenue sur le blog de CtechAfrica',
      slug: postSlug,
      excerpt: "Découvrez nos actualités en analyse de données, développement et intelligence artificielle.",
      contentHtml: '<p>Bienvenue sur le blog de CtechAfrica ! Nous y partagerons nos actualités, conseils et retours d\'expérience.</p>',
      categoryId: category.id,
      published: true,
    },
  });

  const teamMembers = [
    { name: 'Ctech Africa', role: 'Fondateur', bio: 'Expert en analyse de données, développement et intelligence artificielle.', order: 0 },
  ];

  for (const m of teamMembers) {
    const slug = slugify(m.name);
    await prisma.teamMember.upsert({
      where: { slug },
      update: {},
      create: { ...m, slug },
    });
  }

  console.log('Données de démonstration créées.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
