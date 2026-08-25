# CtechAfrica — Site + Back-office

Site Node.js/Express + EJS + SQLite (Prisma), avec back-office pour gérer Formations, Services,
Blog, Équipe, Galerie, Témoignages et Partenaires, et un tunnel de conversion WhatsApp sur les
fiches Formations/Services.

## Démarrage local

```bash
npm install
cp .env.example .env      # puis éditer .env (SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD)
npx prisma migrate dev
npm run seed               # crée le compte admin + quelques données de démonstration
npm run dev
```

Le site est accessible sur `http://localhost:3000`, le back-office sur `http://localhost:3000/admin`
(identifiants = `ADMIN_EMAIL` / `ADMIN_PASSWORD` du fichier `.env`).

## Première configuration

1. Se connecter sur `/admin/login`
2. Aller dans **Paramètres** et renseigner le numéro WhatsApp (format international, ex: `22990000000`)
   et l'email de contact — sans ce numéro, les boutons WhatsApp du site pointent vers la page Contact
3. Depuis **Paramètres**, modifier aussi le titre et le sous-titre de la page d'accueil, ainsi que le
   texte de la page "À propos" (éditeur riche) — pour mettre un passage du titre en couleur, entourez-le
   de doubles accolades, ex: `Vos données, votre code, votre {{avantage compétitif}}`
4. Créer/modifier les Formations, Services, articles de Blog et membres de l'Équipe depuis le menu latéral

## Déploiement

Voir [DEPLOY.md](./DEPLOY.md) pour la mise en production sur un VPS OVH (Node, PM2, Nginx, HTTPS).
