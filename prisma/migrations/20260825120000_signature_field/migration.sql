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
    "bannerImageUrl" TEXT,
    "logoUrl" TEXT,
    "signatureUrl" TEXT,
    "signatoryName" TEXT NOT NULL DEFAULT 'Le Fondateur',
    "aboutContent" TEXT NOT NULL DEFAULT '<p>CtechAfrica est une entreprise spécialisée en <strong>analyse de données</strong>, <strong>développement informatique</strong> et <strong>intelligence artificielle</strong>. Nous accompagnons les entreprises et les particuliers grâce à des formations pratiques, des services sur mesure et l''expertise de notre équipe.</p><p>Notre mission : rendre la donnée, le code et l''IA accessibles et utiles, avec des solutions concrètes et un accompagnement humain à chaque étape.</p>',
    "primaryColor" TEXT NOT NULL DEFAULT '#356DF1',
    "formationsLabel" TEXT NOT NULL DEFAULT 'Formations',
    "formationsLabelSingular" TEXT NOT NULL DEFAULT 'Formation',
    "formationsSubheading" TEXT NOT NULL DEFAULT 'Des parcours pratiques en analyse de données, développement et intelligence artificielle.',
    "servicesLabel" TEXT NOT NULL DEFAULT 'Services',
    "servicesLabelSingular" TEXT NOT NULL DEFAULT 'Service',
    "servicesSubheading" TEXT NOT NULL DEFAULT 'Des solutions sur mesure en data, développement et intelligence artificielle pour votre organisation.',
    "blogLabel" TEXT NOT NULL DEFAULT 'Blog',
    "blogSubheading" TEXT NOT NULL DEFAULT 'Actualités, conseils et retours d''expérience en data, développement et intelligence artificielle.',
    "equipeLabel" TEXT NOT NULL DEFAULT 'Équipe',
    "equipeSubheading" TEXT NOT NULL DEFAULT 'Des experts en analyse de données, développement informatique et intelligence artificielle.',
    "contactHeading" TEXT NOT NULL DEFAULT 'Contactez {{nous}}',
    "contactSubheading" TEXT NOT NULL DEFAULT 'Une question sur nos formations ou nos services ? Écrivez-nous.',
    "showFormations" BOOLEAN NOT NULL DEFAULT true,
    "showServices" BOOLEAN NOT NULL DEFAULT true,
    "showBlog" BOOLEAN NOT NULL DEFAULT true,
    "showEquipe" BOOLEAN NOT NULL DEFAULT true,
    "showGalerie" BOOLEAN NOT NULL DEFAULT true,
    "showTemoignages" BOOLEAN NOT NULL DEFAULT true,
    "showPartenaires" BOOLEAN NOT NULL DEFAULT true,
    "showAbout" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Settings" ("aboutContent", "bannerImageUrl", "blogLabel", "blogSubheading", "contactEmail", "contactHeading", "contactSubheading", "equipeLabel", "equipeSubheading", "formationsLabel", "formationsLabelSingular", "formationsSubheading", "heroSubtitle", "heroTitle", "id", "logoUrl", "primaryColor", "servicesLabel", "servicesLabelSingular", "servicesSubheading", "showAbout", "showBlog", "showEquipe", "showFormations", "showGalerie", "showPartenaires", "showServices", "showTemoignages", "siteName", "whatsappNumber") SELECT "aboutContent", "bannerImageUrl", "blogLabel", "blogSubheading", "contactEmail", "contactHeading", "contactSubheading", "equipeLabel", "equipeSubheading", "formationsLabel", "formationsLabelSingular", "formationsSubheading", "heroSubtitle", "heroTitle", "id", "logoUrl", "primaryColor", "servicesLabel", "servicesLabelSingular", "servicesSubheading", "showAbout", "showBlog", "showEquipe", "showFormations", "showGalerie", "showPartenaires", "showServices", "showTemoignages", "siteName", "whatsappNumber" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

