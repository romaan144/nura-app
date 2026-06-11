import { HELPERS } from '../data/helpers';

// Diccionario de categorías con palabras clave
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
  logopedia: 'professional',
  tecnico: 'professional',
  cuidado: 'experienced',
  mascotas: 'experienced',
  limpieza: 'experienced',
  matematicas: 'student',
  entrenador: 'professional',
};

export function analyzeNeed(userText) {
  const text = userText.toLowerCase();

  // Detectar categoría
  let categoria = 'otro';
  let maxMatches = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter(k => text.includes(k)).length;
    if (matches > maxMatches) { maxMatches = matches; categoria = cat; }
  }

  // Detectar urgencia
  const urgente = URGENCY_KEYWORDS.some(k => text.includes(k));

  // Detectar presencialidad
  const hasOnline = ONLINE_KEYWORDS.some(k => text.includes(k));
  const hasPresential = PRESENTIAL_KEYWORDS.some(k => text.includes(k));
  const presencial = hasPresential || (!hasOnline && ['tecnico','cuidado','limpieza','mascotas'].includes(categoria));

  // Nivel requerido
  const nivelRequerido = QUALIFICATION_MAP[categoria] || 'experienced';

  // Palabras clave para matching
  const palabrasClave = CATEGORY_KEYWORDS[categoria]?.filter(k => text.includes(k)) || [];

  // Resumen
  const resumenMap = {
    logopedia: 'Busca un logopeda',
    tecnico: 'Necesita un técnico',
    limpieza: 'Busca servicio de limpieza',
    cuidado: 'Busca cuidado para persona mayor',
    mascotas: 'Necesita cuidado de mascota',
    matematicas: 'Busca clases particulares',
    entrenador: 'Busca entrenador personal',
    otro: 'Busca ayuda',
  };

  return Promise.resolve({
    categoria,
    presencial,
    urgente,
    nivelRequerido,
    resumen: resumenMap[categoria],
    razon: 'Análisis basado en las palabras clave de tu búsqueda',
    palabrasClave,
  });
}

export function matchHelpers(analysis, limit = 4) {
  const levelOrder = { student: 0, experienced: 1, professional: 2 };
  const required = levelOrder[analysis.nivelRequerido] ?? 1;

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

  // Si no hay matches con categoria, mostrar todos ordenados por rating
  const filtered = scored.filter(h => h.score > 20);
  if (filtered.length === 0) {
    return scored.sort((a, b) => b.rating - a.rating).slice(0, limit);
  }

  return filtered.sort((a, b) => b.score - a.score).slice(0, limit);
}
