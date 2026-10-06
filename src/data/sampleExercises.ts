// High-contrast, clean SVGs encoded as data URLs representing real homework exercises
export interface SampleExercise {
  id: string;
  title: string;
  subject: string;
  level: string;
  question: string;
  imageDataUrl: string;
  description: string;
}

// Helper to generate clean SVG homework exercise cards as data URLs
function createExerciseSVG(title: string, problemText: string[], formula: string, tag: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
    <rect width="600" height="380" rx="16" fill="#111827" stroke="#374151" stroke-width="2"/>
    <rect x="24" y="24" width="552" height="50" rx="8" fill="#1F2937"/>
    <text x="40" y="55" fill="#38BDF8" font-family="sans-serif" font-size="18" font-weight="bold">${tag} - ${title}</text>
    <rect x="24" y="90" width="552" height="260" rx="8" fill="#030712" stroke="#1F2937" stroke-width="1.5"/>
    <text x="44" y="130" fill="#E5E7EB" font-family="sans-serif" font-size="16" font-weight="600">Énoncé du devoir :</text>
    ${problemText.map((line, idx) => `<text x="44" y="${165 + idx * 28}" fill="#9CA3AF" font-family="sans-serif" font-size="15">${line}</text>`).join('')}
    <rect x="44" y="270" width="512" height="56" rx="8" fill="#0F172A" stroke="#0284C7" stroke-dasharray="4"/>
    <text x="60" y="305" fill="#38BDF8" font-family="monospace" font-size="16" font-weight="bold">${formula}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export const SAMPLE_EXERCISES: SampleExercise[] = [
  {
    id: 'math-poly',
    title: 'Équation du 2nd Degré',
    subject: 'Mathématiques',
    level: 'Lycée (1ère)',
    question: 'Peux-tu résoudre cette équation étape par étape avec le calcul du discriminant Delta ?',
    description: 'Calcul du discriminant et des racines réelles.',
    imageDataUrl: createExerciseSVG(
      'Exercice 1 : Trinôme du second degré',
      [
        'Soit la fonction polynôme f définie sur ℝ par :',
        '1) Calculer le discriminant Δ de l\'équation f(x) = 0.',
        '2) En déduire le nombre de solutions réelles et les calculer.',
        '3) Factoriser l\'expression f(x) et dresser le tableau de signes.'
      ],
      'f(x) = 2x² - 8x + 6 = 0',
      'MATHS'
    ),
  },
  {
    id: 'phys-energie',
    title: 'Énergie Cinétique & Vitesse',
    subject: 'Physique-Chimie',
    level: 'Collège / Lycée',
    question: 'Comment calculer la vitesse de la voiture à partir de son énergie cinétique ?',
    description: 'Application de la formule Ec = 1/2 * m * v².',
    imageDataUrl: createExerciseSVG(
      'Exercice 2 : Mécanique et Énergie',
      [
        'Un véhicule de masse m = 1200 kg roule sur une autoroute.',
        'Son énergie cinétique mesurée est Ec = 375 000 Joules.',
        '1) Exprimer la vitesse v en fonction de Ec et m.',
        '2) Calculer v en m/s puis convertir la vitesse en km/h.',
        '3) Le conducteur respecte-t-il la limitation à 130 km/h ?'
      ],
      'Ec = 1/2 · m · v²   avec m = 1200 kg, Ec = 375 kJ',
      'PHYSIQUE'
    ),
  },
  {
    id: 'fr-figure',
    title: 'Figures de Style & Poésie',
    subject: 'Français',
    level: 'Collège (3ème) / 2nde',
    question: 'Peux-tu analyser cet extrait de poème et identifier les figures de style ?',
    description: 'Repérage de métaphores, allitérations et anaphores.',
    imageDataUrl: createExerciseSVG(
      'Exercice 3 : Analyse Littéraire',
      [
        'Extrait étudié : "Le temps est un joueur avide qui gagne',
        'Sans tricher, à tout coup ! C\'est la loi."',
        '1) Identifie la figure de style principale présente au vers 1.',
        '2) Quel est l\'effet recherché par le poète à travers cette image ?',
        '3) Rédige un court paragraphe d\'analyse littéraire argumenté.'
      ],
      'Charles Baudelaire, "L\'Horloge" (Les Fleurs du Mal)',
      'FRANÇAIS'
    ),
  },
  {
    id: 'svt-cellule',
    title: 'Génétique & Mitose',
    subject: 'SVT',
    level: 'Lycée',
    question: 'Explique les étapes de la division cellulaire représentées.',
    description: 'Cycle cellulaire, chromosomes et étapes de la mitose.',
    imageDataUrl: createExerciseSVG(
      'Exercice 4 : SVT & Cycle Cellulaire',
      [
        'Observation microscopique de racines d\'oignon :',
        '1) Citer les 4 phases consécutives de la mitose.',
        '2) À quelle phase les chromosomes s\'alignent-ils sur le plan équatorial ?',
        '3) Expliquer l\'importance de la réplication de l\'ADN en phase S.'
      ],
      'Prophase ➔ Métaphase ➔ Anaphase ➔ Télophase',
      'SVT'
    ),
  },
];
