const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const methodOverride = require('method-override');

const prisma = require('./db');
const { stripHtml } = require('./utils/html');
const { renderHighlighted, renderLogoText } = require('./utils/highlight');
const { youtubeEmbedUrl } = require('./utils/video');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.stripHtml = stripHtml;
app.locals.renderHighlighted = renderHighlighted;
app.locals.renderLogoText = renderLogoText;
app.locals.youtubeEmbedUrl = youtubeEmbedUrl;

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'ctechafrica-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(flash());

app.use(async (req, res, next) => {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: 1 } });
    }
    res.locals.settings = settings;
    res.locals.currentPath = req.path;
    res.locals.isAdminLoggedIn = Boolean(req.session && req.session.adminId);
    res.locals.successMessages = req.flash('success');
    res.locals.errorMessages = req.flash('error');
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

app.use((req, res) => {
  res.status(404).render('public/404', { title: 'Page introuvable' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).render('public/error', {
    title: 'Erreur',
    message: err.message || 'Une erreur est survenue.',
  });
});

module.exports = app;
