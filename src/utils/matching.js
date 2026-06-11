import { HELPERS } from '../data/helpers';

export async function analyzeNeed(userText) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `Eres el motor de análisis de Nüra, una app que conecta personas con necesidades reales con helpers verificados.

Analiza la necesidad del usuario y devuelve SOLO un JSON con esta estructura exacta:
{
  "categoria": string (una de: logopedia, tecnico, limpieza, cuidado, mascotas, matematicas, entrenador, otro),
  "presencial": boolean (true si claramente requiere presencia física),
  "urgente": boolean (true si hay urgencia implícita),
  "nivelRequerido": string (una de: student, experienced, professional),
  "resumen": string (1 frase corta describiendo qué busca),
  "razon": string (explicación en 1 frase de por qué el nivel requerido),
  "palabrasClave": string[] (3-5 términos clave para el matching)
}

Razona sobre lo implícito: "caldera no calienta" = urgente + presencial + profesional. "clases mates hijo 12 años" = no urgente + presencial + student puede servir. "logopeda niño 7 años" = presencial + profesional.`,
      messages: [{ role: 'user', content: userText }],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text.trim();
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {
      categoria: 'otro', presencial: true, urgente: false,
      nivelRequerido: 'experienced', resumen: userText,
      razon: 'Análisis general', palabrasClave: [],
    };
  }
}

export function matchHelpers(analysis, limit = 4) {
  const levelOrder = { student: 0, experienced: 1, professional: 2 };
  const required = levelOrder[analysis.nivelRequerido] ?? 1;

  const scored = HELPERS.map(h => {
    let score = 0;
    // Category match
    if (h.category === analysis.categoria) score += 40;
    // Keywords match
    const keywords = analysis.palabrasClave || [];
    keywords.forEach(kw => {
      const kl = kw.toLowerCase();
      if (h.tags.some(t => t.toLowerCase().includes(kl))) score += 10;
      if (h.bio.toLowerCase().includes(kl)) score += 5;
    });
    // Presential match
    if (analysis.presencial && h.presential) score += 15;
    // Level match — don't overshoot
    const hLevel = levelOrder[h.qualificationLevel] ?? 1;
    if (hLevel >= required) score += 10;
    if (hLevel === required) score += 5;
    // Urgency
    if (analysis.urgente && h.urgent) score += 20;
    // Rating bonus
    score += h.rating * 2;
    // Distance penalty
    score -= h.distance * 3;

    return { ...h, score };
  });

  return scored
    .filter(h => h.score > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
