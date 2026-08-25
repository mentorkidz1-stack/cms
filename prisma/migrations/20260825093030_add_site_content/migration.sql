-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "whatsappNumber" TEXT NOT NULL DEFAULT '',
    "siteName" TEXT NOT NULL DEFAULT 'CtechAfrica',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "heroTitle" TEXT NOT NULL DEFAULT 'Vos données, votre code, votre {{avantage compétitif}}',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'CtechAfrica accompagne les entreprises et les particuliers avec des formations, des services et des solutions en analyse de données, développement informatique et intelligence artificielle.',
    "aboutContent" TEXT NOT NULL DEFAULT '<p>CtechAfrica est une entreprise spécialisée en <strong>analyse de données</strong>, <strong>développement informatique</strong> et <strong>intelligence artificielle</strong>. Nous accompagnons les entreprises et les particuliers grâce à des formations pratiques, des services sur mesure et l''expertise de notre équipe.</p><p>Notre mission : rendre la donnée, le code et l''IA accessibles et utiles, avec des solutions concrètes et un accompagnement humain à chaque étape.</p>'
);
INSERT INTO "new_Settings" ("contactEmail", "id", "siteName", "whatsappNumber") SELECT "contactEmail", "id", "siteName", "whatsappNumber" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
