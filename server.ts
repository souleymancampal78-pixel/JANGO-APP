import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  image?: {
    mimeType: string;
    data: string; // base64
  };
}

// System prompt defining JANGO's new persona: L'IA Tout-Terrain du Monde
const JANGOIA_SYSTEM_PROMPT = `Tu es JANGO, l'IA Tout-Terrain du Monde. Tu n'es PLUS seulement un prof scolaire.

Tu as désormais 6 casquettes d'expert indispensables :
1. 🎓 UN PROF EXPERT (BFEM, BAC, LICENCE, MASTER, et toutes les matières : Mathématiques, Physique-Chimie, SVT, Français, Philosophie, Histoire-Géographie, Anglais, Économie, Droit, etc.) :
   - Tu expliques avec une pédagogie lumineuse, rigoureuse et accessible.
   - Pour les devoirs, calculs et sciences : insère impérativement un bloc de calcul détaillé pas à pas avant le résultat final.
   - RÈGLE STRICTE ET ABSOLUE : N'utilise AUCUN signe dollar ($ ou $$). Écris les formules en caractères mathématiques Unicode clairs (², ³, √, ×, ÷, Δ, π, etc.).

2. 🤝 UN GRAND FRÈRE QUI CONSEILLE (Vie, motivation, relations, confiance en soi, gestion du stress, ambitions) :
   - Tu donnes des conseils fraternels, réalistes, pleins de sagesse et ultra-motivants.
   - Tu soutiens avec force et empathie, tu boostes l'estime de soi, sans jamais porter de jugement.

3. 💼 UN EXPERT BUSINESS (Comment gagner de l'argent, e-commerce, élevage, agriculture, transport, investissements concrets) :
   - Des stratégies concrètes et adaptées au terrain : création de micro-entreprises, e-commerce, élevage (poulets de chair, pondeuses, moutons Ladoum, embouche bovine), agriculture (maraîchage, irrigation goutte-à-goutte), transport (VTC, livraisons, motos, taxis), gestion du budget et rentabilité chiffrée.

4. 💻 UN EXPERT TECH (Comment créer des applications, des sites web, gagner avec TikTok, réseaux sociaux, IA) :
   - Guide pas à pas pour coder ou concevoir des sites web et applications (React, JavaScript, Python, No-Code, WordPress).
   - Méthodes précises pour monétiser TikTok, YouTube et les réseaux sociaux.
   - Maîtrise pratique des outils d'IA pour automatiser, créer du contenu et générer des revenus.

5. 🌍 UN EXPERT CULTURE DANS LE MONDE ENTIER (Toutes les histoires du monde, civilisations, religions, traditions, wolof, cuisine) :
   - Histoires universelles, grandes civilisations, Afrique, Asie, Europe, Amériques, religions et traditions.
   - Maîtrise complète de la langue et de la sagesse wolof : traductions 100% fidèles, proverbes, expressions du terroir.
   - Cuisines du monde entier et gastronomie locale (Thiéboudienne, Yassa, Mafé, et cuisines internationales).

6. 🏡 UN ASSISTANT VIE QUOTIDIENNE (Recettes pas à pas, santé simple et bien-être, sport et entraînement, prières, traductions multilingues) :
   - Recettes détaillées, santé préventive et hygiène de vie simple, entraînements sportifs adaptés, rappels spirituels et prières, traductions instantanées en toutes langues.

================================================================================
RÈGLES D'OR STRICTES ET OBLIGATOIRES POUR CHACUNE DE TES RÉPONSES :
================================================================================
1. EXPERTISE & EXEMPLES 100% PRÉCIS : Quel que soit le sujet abordé par l'élève, réponds toujours de façon experte, simple, avec des exemples 100% Précis (des chiffres concrets, des étapes réelles, des situations vécues).
2. FRANÇAIS SIMPLE : Tu parles toujours en français simple, percutant, fluide et accessible à tous, sans jargon inutile.
3. BIENVEILLANCE ABSOLUE : Tu restes toujours bienveillant, chaleureux, fraternel, respectueux, JAMAIS de jugement.
4. CALCULS MATHÉMATIQUES : Pour toute question de calcul ou de maths, insère toujours les étapes de calcul détaillées pas à pas avant le résultat final. ZÉRO SIGNE DOLLAR ($) : utilise uniquement la typographie Unicode réelle.
5. FINALE VOCALE OBLIGATOIRE : Tu termines TOUJOURS par une petite question stimulante et bienveillante pour continuer la discussion vocale.`;

// API endpoint for chat completions
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, image, mode, level, mathDetailLevel } = req.body as {
      messages: { role: 'user' | 'ai'; text: string }[];
      image?: { mimeType: string; base64: string } | null;
      mode?: string;
      level?: string;
      mathDetailLevel?: 'summary' | 'standard' | 'ultra';
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Aucun message fourni' });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: "Clé GEMINI_API_KEY manquante sur le serveur. Veuillez vérifier la configuration de l'environnement.",
      });
    }

    const currentMsg = messages[messages.length - 1];
    const userText = currentMsg.text.toLowerCase();

    // Detect if the message involves mathematics, science, or calculation
    const isMathOrCalculation = 
      mode === 'math' ||
      userText.includes('calcul') ||
      userText.includes('équation') ||
      userText.includes('math') ||
      userText.includes('dérivée') ||
      userText.includes('intégrale') ||
      userText.includes('pythagore') ||
      userText.includes('thalès') ||
      userText.includes('trigonométrie') ||
      userText.includes('fraction') ||
      userText.includes('pourcentage') ||
      userText.includes('vitesse') ||
      userText.includes('énergie') ||
      /\d+[\+\-\*\/x=]\d+/.test(userText);

    // Build context-adapted system instruction
    let contextualPrompt = JANGOIA_SYSTEM_PROMPT;

    // Context-adapted instructions based on the question type
    if (isMathOrCalculation) {
      contextualPrompt += `\n\n[CONSIGNE SPÉCIFIQUE : RÉSOLUTION DE DEVOIR / CALCUL MATHÉMATIQUE] :
1. DÉTAIL DES ÉTAPES DE CALCUL : Tu DOIS IMPÉRATIVEMENT insérer un bloc de détail de calcul avant le résultat final. Dresse toutes les étapes intermédiaires sans omission.
2. INTERDICTION DES SIGNES DOLLAR ($) : N'utilise AUCUN symbole dollar ($ ou $$). Utilise les symboles mathématiques Unicode clairs (², ³, √, ×, ÷, Δ, π, etc.).
3. CONTRÔLE NUMÉRIQUE PRÉALABLE : Vérifie scrupuleusement tous les résultats chiffrés.
4. RÈGLE FINALE : Termine TOUJOURS ta réponse par une petite question pour continuer la discussion vocale.`;

      const detailLevel = mathDetailLevel || 'standard';
      if (detailLevel === 'summary') {
        contextualPrompt += `\n- Niveau de détail sélectionné : Résumé (concentre-toi sur les formules indispensables et les transitions clés).`;
      } else if (detailLevel === 'ultra') {
        contextualPrompt += `\n- Niveau de détail sélectionné : Ultra-détaillé (explicite chaque micro-étape de calcul, priorités PEMDAS, substitutions et simplifications).`;
      }
    } else {
      contextualPrompt += `\n\n[CONSIGNE SPÉCIFIQUE : RÉPONSE TOUT-TERRAIN (GRAND FRÈRE / BUSINESS / TECH / CULTURE / VIE QUOTIDIENNE)] :
1. EXPERTISE & EXEMPLES 100% PRÉCIS : Réponds avec une immense clarté, des conseils pragmatiques, des chiffres concrets, des étapes réelles et des exemples immédiatement utiles.
2. STYLE & TON : Parle toujours en français simple, direct, percutant et ultra-bienveillant. Jamais aucun jugement négatif. Sois encourageant et stimulant comme un grand frère d'élite.
3. RÈGLE FINALE OBLIGATOIRE : Termine TOUJOURS impérativement par une petite question chaleureuse et engageante pour continuer la discussion vocale.`;
    }

    if (mode === 'voice') {
      contextualPrompt += `\n\n[MODE CONVERSATION VOCALE ACTIF] : Rédige des phrases fluides, naturelles, captivantes à l'écoute orale, faciles à prononcer par la synthèse vocale, et termine impérativement par une courte question orale stimulante.`;
    }

    if (level) {
      contextualPrompt += `\nNiveau de l'élève : ${level}. Adapte tes exemples et ton niveau d'explication.`;
    }

    // Construct conversation parts for Gemini
    // For previous turns, we include the dialogue context
    const contents: any[] = [];

    // History turns (last 6 max for good context without token bloat)
    const historySlice = messages.slice(0, -1).slice(-6);
    for (const msg of historySlice) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }

    // Current turn parts
    const currentParts: any[] = [];
    if (image && image.base64 && image.mimeType) {
      // Clean base64 header if present
      const cleanBase64 = image.base64.replace(/^data:[^;]+;base64,/, '');
      currentParts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: cleanBase64,
        },
      });
    }

    currentParts.push({
      text: currentMsg.text || "Analyse et résous l'exercice présent sur cette image étape par étape en vérifiant scrupuleusement tous les calculs numériques.",
    });

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    let replyText = '';
    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

    // Low temperature for math/science to enforce deterministic arithmetic accuracy
    const temperatureToUse = isMathOrCalculation ? 0.1 : 0.6;

    let lastError: any = null;
    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: contextualPrompt,
            temperature: temperatureToUse,
          },
        });
        if (response.text) {
          replyText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed, trying next fallback:`, err.message);
      }
    }

    if (!replyText && lastError) {
      throw lastError;
    }

    if (!replyText) {
      replyText = 'Désolé, je n’ai pas pu formuler de réponse. Peux-tu reformuler ta question ?';
    }

    return res.json({
      text: replyText,
    });
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return res.status(500).json({
      error: error?.message || "Une erreur est survenue lors de la communication avec l'IA.",
    });
  }
});

// API endpoint for Audio TTS generation (Gemini Flash Lite TTS)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice } = req.body as { text: string; voice?: string };
    if (!text) {
      return res.status(400).json({ error: 'Texte requis' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Clé API manquante' });
    }

    // Limit text length for TTS to prevent timeouts
    const cleanText = text.slice(0, 1000).replace(/[*#`_]/g, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Chaleureux, pédagogue et clair en français',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: "Impossible de générer l'audio" });
    }

    return res.json({
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
    });
  } catch (err: any) {
    console.error('TTS error:', err);
    return res.status(500).json({ error: err.message || 'TTS failure' });
  }
});

// API endpoint for AI-generated study revision schedule
app.post('/api/study-plan', async (req, res) => {
  try {
    const { sessions, currentLevel } = req.body as {
      sessions?: {
        title: string;
        mode: string;
        level: string;
        topics: string[];
      }[];
      currentLevel?: string;
    };

    if (!apiKey) {
      return res.status(500).json({ error: 'Clé GEMINI_API_KEY manquante sur le serveur' });
    }

    const level = currentLevel || 'lycée';

    // Build topics summary from student's history
    let topicsSummary = '';
    if (sessions && Array.isArray(sessions) && sessions.length > 0) {
      topicsSummary = sessions
        .map((s, idx) => {
          const sample = s.topics && s.topics.length > 0 ? s.topics.join(', ') : s.title;
          return `- Session ${idx + 1} (${s.mode || 'Général'}, niveau ${s.level || level}) : ${s.title}. Notions/Questions : ${sample}`;
        })
        .join('\n');
    }

    const prompt = `Tu es JANGOIA, tuteur scolaire expert et coach méthodologique.
Génère un planning de révision personnalisé sur 5 à 7 jours pour un élève de niveau "${level}".
Ce planning doit être directement fondé sur les sujets, questions et devoirs qu'il a abordés dans ses sessions précédentes ci-dessous :

${topicsSummary || "L'élève débute ses révisions générales en Mathématiques, Sciences et Français."}

Consignes pédagogiques :
1. Crée un planning hebdomadaire concret, motivant et structuré.
2. Pour chaque jour (ex: Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi) :
   - Indique la matière et le thème précis à réviser (ex: "Maths - Équations du second degré & Discriminant")
   - Durée estimée en minutes (ex: 35, 45, 60)
   - Niveau de priorité : "Haute", "Moyenne" ou "Normale"
   - Une liste de 2 à 4 micro-tâches concrètes (ex: "Relire la formule Delta = b² - 4ac", "Refaire 2 équations type bac", "Quiz d'auto-évaluation")
   - Une astuce ou règle d'or méthodologique de JANGOIA
3. Définis 2 à 3 objectifs clés clairs.
4. Rédige un conseil global stimulant.

IMPORTANT : Tu DOIS répondre EXCLUSIVEMENT au format JSON valide suivant :
{
  "summary": "Résumé en 1 phrase du planning de révision personnalisé",
  "level": "${level}",
  "goals": ["Objectif 1", "Objectif 2", "Objectif 3"],
  "days": [
    {
      "dayName": "Lundi",
      "focus": "Matière & Chapitre précis",
      "durationMinutes": 45,
      "priority": "Haute",
      "tasks": [
        { "id": "t1", "text": "Intitulé de la tâche", "completed": false }
      ],
      "tip": "Conseil méthodologique"
    }
  ],
  "advice": "Conseil méthodologique global (ex: technique Pomodoro, répétition espacée...)"
}`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let planData: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawJson = response.text || '';
        planData = JSON.parse(rawJson);
        if (planData && Array.isArray(planData.days)) {
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed for study plan:`, err);
      }
    }

    if (!planData) {
      throw lastError || new Error("Échec de la génération du planning");
    }

    // Ensure IDs on tasks
    planData.id = `plan-${Date.now()}`;
    planData.createdAt = Date.now();
    if (Array.isArray(planData.days)) {
      planData.days.forEach((day: any, dIdx: number) => {
        if (Array.isArray(day.tasks)) {
          day.tasks = day.tasks.map((task: any, tIdx: number) => ({
            id: task.id || `task-${dIdx}-${tIdx}`,
            text: typeof task === 'string' ? task : task.text || 'Tâche de révision',
            completed: false,
          }));
        }
      });
    }

    return res.json(planData);
  } catch (err: any) {
    console.error('Study plan generation error:', err);
    return res.status(500).json({ error: err.message || "Impossible de générer le planning" });
  }
});

// API endpoint for AI Quiz generation with 5 questions
app.post('/api/quiz', async (req, res) => {
  try {
    const { topic, level } = req.body as {
      topic: string;
      level?: string;
    };

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Sujet requis pour le quiz' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Clé GEMINI_API_KEY manquante sur le serveur' });
    }

    const currentLevel = level || 'lycée';

    const prompt = `Tu es JANGOIA, tuteur scolaire expert et concepteur de quiz pédagogiques stimulants.
Génère un Quiz Rapide d'entraînement composé d'exactement 5 questions à choix multiples (QCM) sur le sujet suivant :
"${topic}" (Niveau scolaire ciblé : ${currentLevel}).

Critères pédagogiques :
1. Crée exactement 5 questions progressives (de la vérification de cours basique aux exercices d'application directe).
2. Pour chaque question :
   - Un énoncé clair et sans ambiguïté.
   - Exactement 4 options de réponse plausibles.
   - L'index de la bonne réponse ("correctAnswerIndex", entier de 0 à 3).
   - Une explication pédagogique bienveillante ("explanation") détaillée qui explique pourquoi cette réponse est la bonne et rappelle la formule ou règle utile.

IMPORTANT : Tu DOIS répondre EXCLUSIVEMENT au format JSON valide strict suivant :
{
  "topic": "${topic}",
  "level": "${currentLevel}",
  "questions": [
    {
      "id": "q1",
      "question": "Énoncé de la question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Explication pédagogique avec la règle ou formule"
    }
  ]
}`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let quizData: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawJson = response.text || '';
        quizData = JSON.parse(rawJson);
        if (quizData && Array.isArray(quizData.questions) && quizData.questions.length >= 3) {
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed for quiz:`, err);
      }
    }

    if (!quizData || !Array.isArray(quizData.questions)) {
      throw lastError || new Error("Impossible de générer les questions de quiz");
    }

    // Ensure IDs on questions
    quizData.questions = quizData.questions.slice(0, 5).map((q: any, idx: number) => ({
      id: q.id || `q-${idx + 1}`,
      question: q.question || `Question ${idx + 1}`,
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Vrai', 'Faux'],
      correctAnswerIndex: typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex < (q.options?.length || 4)
        ? q.correctAnswerIndex
        : 0,
      explanation: q.explanation || 'Bonne réponse démontrée par le cours.',
    }));

    return res.json(quizData);
  } catch (err: any) {
    console.error('Quiz generation error:', err);
    return res.status(500).json({ error: err.message || "Erreur lors de la génération du quiz" });
  }
});

// Cache for dictionary lookups
const dictionaryCache = new Map<string, any>();

// API endpoint for Dictionary & Etymology definition
app.get('/api/dictionary', async (req, res) => {
  try {
    const rawWord = req.query.word as string;
    if (!rawWord || !rawWord.trim()) {
      return res.status(400).json({ error: 'Mot requis pour la recherche dans le dictionnaire' });
    }

    const cleanWord = rawWord.trim().toLowerCase().slice(0, 60);

    // Check in-memory cache first
    if (dictionaryCache.has(cleanWord)) {
      return res.json(dictionaryCache.get(cleanWord));
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Clé GEMINI_API_KEY manquante sur le serveur' });
    }

    const prompt = `Tu es un lexicographe et étymologiste expert de la langue française, spécialisé dans l'apprentissage scolaire et académique.
Fournis la fiche de dictionnaire complète du mot suivant : "${cleanWord}".

Tu DOIS répondre STRICTEMENT au format JSON valide suivant :
{
  "word": "${cleanWord}",
  "phonetic": "Transcription phonétique API (ex: [me.ta.fɔʁ])",
  "category": "Classe grammaticale précise (ex: nom féminin, verbe transitif, adjectif qualificatif)",
  "definition": "Définition claire, pédagogique et précise adaptée aux élèves et étudiants (avec contexte scolaire si pertinent)",
  "etymology": "Étymologie détaillée et fascinante : langue d'origine (grec, latin, ancien français...), sens premier des racines et morphèmes, évolution historique",
  "example": "Une phrase d'exemple soignée et inspirante démontrant l'utilisation exacte du mot",
  "pedagogicalTip": "Astuce pour bien mémoriser ce mot, piège orthographique à éviter ou lien avec une règle de cours"
}`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let dictionaryEntry: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const rawJson = response.text || '';
        dictionaryEntry = JSON.parse(rawJson);
        if (dictionaryEntry && dictionaryEntry.definition && dictionaryEntry.etymology) {
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed for dictionary lookup:`, err);
      }
    }

    if (!dictionaryEntry || !dictionaryEntry.definition) {
      throw lastError || new Error("Impossible de trouver la définition pour ce mot");
    }

    // Ensure all expected fields exist
    const result = {
      word: dictionaryEntry.word || cleanWord,
      phonetic: dictionaryEntry.phonetic || '',
      category: dictionaryEntry.category || 'terme',
      definition: dictionaryEntry.definition || 'Définition non disponible.',
      etymology: dictionaryEntry.etymology || 'Origine étymologique non renseignée.',
      example: dictionaryEntry.example || '',
      pedagogicalTip: dictionaryEntry.pedagogicalTip || '',
    };

    // Store in cache (limit to 300 entries to prevent memory leak)
    if (dictionaryCache.size > 300) {
      const firstKey = dictionaryCache.keys().next().value;
      if (firstKey) dictionaryCache.delete(firstKey);
    }
    dictionaryCache.set(cleanWord, result);

    return res.json(result);
  } catch (err: any) {
    console.error('Dictionary API error:', err);
    return res.status(500).json({ error: err.message || "Erreur lors de la recherche dans le dictionnaire" });
  }
});




// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JANGOIA server is running on http://localhost:${PORT}`);
  });
}

startServer();
