// Registre des modèles de site disponibles. Chaque modèle correspond à une
// mise en page d'accueil différente (src/views/public/templates/<id>/home.ejs),
// partageant toutes les mêmes données CMS (logo, catalogue, WhatsApp, contact...).
const TEMPLATES = [
  {
    id: 'cabinet-pro',
    name: 'Cabinet Pro',
    category: 'Formation',
    thumbnail: '/images/templates/cabinet-pro.jpg',
    description: "Axé sur la crédibilité : catalogue de formations, équipe, témoignages, attestations et prise de contact.",
  },
  {
    id: 'boutique-catalog',
    name: 'Boutique & Catalogue',
    category: 'Commerce',
    thumbnail: '/images/templates/boutique-catalog.jpg',
    description: "Axé sur l'affichage visuel du catalogue avec prix et commande directe sur WhatsApp.",
  },
  {
    id: 'service-express',
    name: 'Services & Devis',
    category: 'Service',
    thumbnail: '/images/templates/service-express.jpg',
    description: "Axé sur la présentation des prestations, la localisation et la demande de devis rapide.",
  },
  {
    id: 'agency-dark',
    name: 'Agency Dark',
    category: 'Agence',
    thumbnail: '/images/templates/agency-dark.jpg',
    description: "Design sombre et premium façon agence digitale — crédibilité, équipe et conversion WhatsApp.",
  },
];

const DEFAULT_TEMPLATE_ID = 'cabinet-pro';
const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID);
}

function isValidTemplateId(id) {
  return TEMPLATE_IDS.includes(id);
}

// Vue EJS à rendre pour la page d'accueil selon le modèle actif.
function homeViewFor(id) {
  const resolved = isValidTemplateId(id) ? id : DEFAULT_TEMPLATE_ID;
  return `public/templates/${resolved}/home`;
}

module.exports = { TEMPLATES, DEFAULT_TEMPLATE_ID, TEMPLATE_IDS, getTemplate, isValidTemplateId, homeViewFor };
