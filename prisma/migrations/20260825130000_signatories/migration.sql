-- CreateTable
CREATE TABLE "Signatory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "signatureUrl" TEXT,
    "stampUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Certificate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "certificateNumber" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "formationTitle" TEXT NOT NULL,
    "completionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatoryId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certificate_signatoryId_fkey" FOREIGN KEY ("signatoryId") REFERENCES "Signatory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Certificate" ("certificateNumber", "completionDate", "createdAt", "formationTitle", "id", "studentName") SELECT "certificateNumber", "completionDate", "createdAt", "formationTitle", "id", "studentName" FROM "Certificate";
DROP TABLE "Certificate";
ALTER TABLE "new_Certificate" RENAME TO "Certificate";
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");
CREATE TABLE "new_Receipt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiptNumber" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT,
    "itemLabel" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "signatoryId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Receipt_signatoryId_fkey" FOREIGN KEY ("signatoryId") REFERENCES "Signatory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Receipt" ("amount", "clientName", "clientPhone", "createdAt", "id", "itemLabel", "notes", "paymentDate", "paymentMethod", "receiptNumber") SELECT "amount", "clientName", "clientPhone", "createdAt", "id", "itemLabel", "notes", "paymentDate", "paymentMethod", "receiptNumber" FROM "Receipt";
DROP TABLE "Receipt";
ALTER TABLE "new_Receipt" RENAME TO "Receipt";
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "whatsappNumber" TEXT NOT NULL DEFAULT '',
    "siteName" TEXT NOT NULL DEFAULT 'CtechAfrica',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "heroTitle" TEXT NOT NULL DEFAULT 'Vos données, votre code, votre {{avantage compétitif}}',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'CtechAfrica accompagne les entreprises et les particuliers avec des formations, des services et des solutions en analyse de données, développement informatique et intelligence artificielle.',
    "bannerImageUrl" TEXT,
    "logoUrl" TEXT,
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

