function buildWhatsAppLink(number, message) {
  if (!number) return null;
  const digits = number.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function formationMessage(formation, labelSingular) {
  return `Bonjour, je souhaite m'inscrire à « ${formation.title} » (${labelSingular} — Prix : ${formation.price} FCFA). Comment procéder au paiement ?`;
}

function serviceMessage(service, labelSingular) {
  const priceLine = service.price ? ` — Prix : ${service.price} FCFA` : '';
  return `Bonjour, je suis intéressé(e) par « ${service.title} » (${labelSingular}${priceLine}). Comment procéder ?`;
}

module.exports = { buildWhatsAppLink, formationMessage, serviceMessage };
