# Déploiement sur un VPS OVH

## 1. Préparer le serveur

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2
```

## 2. Copier le projet

Depuis votre machine, envoyez le dossier `server/` sur le VPS (SCP, Git, ou autre) dans par exemple `/var/www/ctechafrica`.

## 3. Configurer l'environnement

```bash
cd /var/www/ctechafrica
cp .env.example .env
nano .env   # renseigner SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
```

## 4. Installer et initialiser

```bash
npm install
npx prisma migrate deploy
npm run seed
```

## 5. Lancer avec PM2

```bash
pm2 start src/server.js --name ctechafrica
pm2 save
pm2 startup   # suivre l'instruction affichée pour démarrer PM2 au boot
```

## 6. Reverse proxy Nginx + HTTPS

Créer `/etc/nginx/sites-available/ctechafrica` :

```nginx
server {
    listen 80;
    server_name votredomaine.com www.votredomaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ctechafrica /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votredomaine.com -d www.votredomaine.com
```

## 7. Mises à jour futures

```bash
cd /var/www/ctechafrica
git pull            # ou renvoyer les fichiers modifiés
npm install
npx prisma migrate deploy
pm2 restart ctechafrica
```

## 8. Sauvegardes

La base de données est un simple fichier SQLite (`prisma/dev.db` par défaut, renommable via `DATABASE_URL`).
Sauvegardez-le régulièrement (cron + copie vers un stockage externe), ainsi que le dossier `public/uploads/`
qui contient les images envoyées depuis le back-office.

```bash
# exemple de sauvegarde quotidienne
0 3 * * * cp /var/www/ctechafrica/prisma/dev.db /backups/ctechafrica-$(date +\%F).db
```
