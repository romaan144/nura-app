import { HELPERS } from '../data/helpers';

const CATEGORY_KEYWORDS = {
  logopedia: ['logopeda','logopedia','habla','lenguaje','pronunciación','fonema','tartamudez','voz'],
  tecnico: ['caldera','fontanero','fontanería','electricista','técnico','reparar','avería','instalación','grifo','tubería','luz','calefacción','aire acondicionado'],
  limpieza: ['limpiar','limpieza','fregar','barrer','hogar','casa','ordenar','cristales'],
  cuidado: ['cuidar','cuidadora','mayor','anciano','abuelo','acompañar','acompañamiento','geriatría','dependencia'],
  mascotas: ['perro','gato','mascota','animal','pasear','cuidar perro','veterinario'],
  matematicas: ['matemáticas','mates','clases','profesor','refuerzo','estudiar','deberes','física','química','inglés','idioma'],
  entrenador: ['entrenador','gym','gimnasio','deporte','ejercicio','fitness','correr','adelgazar','musculación'],
};

const URGENCY_KEYWORDS = ['urgente','urgencia','hoy','ahora','inmediatamente','rápido','no funciona','roto','avería'];
const PRESENTIAL_KEYWORDS = ['casa','domicilio','presencial','venir','viene','zona','cerca','barrio'];
const ONLINE_KEYWORDS = ['online','videoconferencia','remoto','internet','videollamada'];
const QUALIFICATION_MAP = {
  logopedia: 'professional', tecnico: 'professional', cuidado: 'experienced',
  mascotas: 'experienced', limpieza: 'experienced', matematicas: 'student', entrenador: 'professional',
};

// Filtros de refinamiento
function applyRefinement(helpers, refinementText) {
  const text = refinementText.toLowerCase();
  let filtered = [...helpers];

  // Género
  if (text.includes('hombre') || text.includes('chico') || text.includes('varón')) {
    filtered = filtered.filter(h => {
      const femaleNames = ['sara','maría','elena','marta','lucía','carmen','ana','laura','nuria','patricia'];
      const first = h.name.split(' ')[0].toLowerCase();
      return !femaleNames.includes(first);
    });
  }
  if (text.includes('mujer') || text.includes('chica') || text.includes('femenina')) {
    filtered = filtered.filter(h => {
      const femaleNames = ['sara','maría','elena','marta','lucía','carmen','ana','laura','nuria','patricia'];
      const first = h.name.split(' ')[0].toLowerCase();
      return femaleNames.includes(first);
    });
  }

  // Edad aproximada
  if (text.includes('joven') || text.includes('menor de 30') || text.includes('menos de 30')) {
    filtered = filtered.filter(h => h.qualificationLevel === 'student' ||
      (h.education && h.education[0]?.year?.includes('2020') || h.education?.[0]?.year?.includes('2021')));
  }

  // Online
  if (text.includes('online') || text.includes('videoconferencia') || text.includes('remoto')) {
    filtered = filtered.filter(h => h.online);
  }

  // A domicilio
  if (text.includes('domicilio') || text.includes('casa') || text.includes('venga')) {
    filtered = filtered.filter(h => h.presential);
  }

  // Urgente / disponible hoy
  if (text.includes('hoy') || text.includes('urgente') || text.includes('ahora')) {
    filtered = filtered.filter(h => h.urgent || h.available);
    filtered.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
  }

  // Distancia máxima
  const distMatch = text.match(/menos de (\d+)\s*km/);
  if (distMatch) {
    const maxDist = parseInt(distMatch[1]);
    filtered = filtered.filter(h => h.distance <= maxDist);
  }

  // Precio máximo
  const priceMatch = text.match(/menos de (\d+)€|máximo (\d+)€|hasta (\d+)€/);
  if (priceMatch) {
    const maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]);
    filtered = filtered.filter(h => {
      const p = parseInt(h.price.replace(/[^0-9]/g, ''));
      return p <= maxPrice;
    });
  }

  // Rating mínimo
  if (text.includes('mejor valorado') || text.includes('más valorado')) {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  // Más cercano
  if (text.includes('más cercano') || text.includes('cerca')) {
    filtered.sort((a, b) => a.distance - b.distance);
  }

  // Founder
  if (text.includes('fundador') || text.includes('original')) {
    filtered = filtered.filter(h => h.founder);
  }

  return filtered.length > 0 ? filtered : helpers;
}

export function analyzeNeed(userText) {
  const text = userText.toLowerCase();

  let categoria = 'otro';
  let maxMatches = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter(k => text.includes(k)).length;
    if (matches > maxMatches) { maxMatches = matches; categoria = cat; }
  }

  const urgente = URGENCY_KEYWORDS.some(k => text.includes(k));
  const hasOnline = ONLINE_KEYWORDS.some(k => text.includes(k));
  const hasPresential = PRESENTIAL_KEYWORDS.some(k => text.includes(k));
  const presencial = hasPresential || (!hasOnline && ['tecnico','cuidado','limpieza','mascotas'].includes(categoria));
  const nivelRequerido = QUALIFICATION_MAP[categoria] || 'experienced';
  const palabrasClave = CATEGORY_KEYWORDS[categoria]?.filter(k => text.includes(k)) || [];

  const resumenMap = {
    logopedia: 'Busca un logopeda', tecnico: 'Necesita un técnico',
    limpieza: 'Busca servicio de limpieza', cuidado: 'Busca cuidado para persona mayor',
    mascotas: 'Necesita cuidado de mascota', matematicas: 'Busca clases particulares',
    entrenador: 'Busca entrenador personal', otro: 'Busca ayuda',
  };

  return Promise.resolve({
    categoria, presencial, urgente, nivelRequerido,
    resumen: resumenMap[categoria],
    razon: 'Análisis basado en las palabras clave de tu búsqueda',
    palabrasClave,
  });
}

export function matchHelpers(analysis, limit = 5, refinement = null, previousResults = null) {
  const levelOrder = { student: 0, experienced: 1, professional: 2 };
  const required = levelOrder[analysis.nivelRequerido] ?? 1;

  // Si hay refinamiento, aplicarlo sobre los resultados previos
  if (refinement && previousResults && previousResults.length > 0) {
    const refined = applyRefinement(previousResults, refinement);
    return refined.slice(0, limit);
  }

  const scored = HELPERS.map(h => {
    let score = 0;
    if (h.category === analysis.categoria) score += 40;
    const keywords = analysis.palabrasClave || [];
    keywords.forEach(kw => {
      const kl = kw.toLowerCase();
      if (h.tags.some(t => t.toLowerCase().includes(kl))) score += 10;
      if (h.bio.toLowerCase().includes(kl)) score += 5;
    });
    if (analysis.presencial && h.presential) score += 15;
    const hLevel = levelOrder[h.qualificationLevel] ?? 1;
    if (hLevel >= required) score += 10;
    if (hLevel === required) score += 5;
    if (analysis.urgente && h.urgent) score += 20;
    score += h.rating * 2;
    score -= h.distance * 3;
    return { ...h, score };
  });

  const filtered = scored.filter(h => h.score > 20);
  if (filtered.length === 0) {
    return scored.sort((a, b) => b.rating - a.rating).slice(0, limit);
  }
  return filtered.sort((a, b) => b.score - a.score).slice(0, limit);
}
