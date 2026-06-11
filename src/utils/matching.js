import { HELPERS } from '../data/helpers';

export async function analyzeNeed(userText) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: userText }),
  });

  if (!response.ok) throw new Error('API error')

  return response.json()
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

  return scored
    .filter(h => h.score > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
