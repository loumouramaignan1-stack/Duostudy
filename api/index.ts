import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import os from "os";
import { createRequire } from "module";

const requireFn = typeof require !== "undefined"
  ? require
  : createRequire(import.meta.url || ("file://" + (typeof __filename !== "undefined" ? __filename : "")));

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Helper to resolve CJS/ESM default exports and interop wrappers
function getModuleExports(mod: any): any {
  if (!mod) return null;
  if (mod.default !== undefined) {
    return getModuleExports(mod.default);
  }
  return mod;
}

// Helper function to write a temporary binary file, parse text using specialized libraries, and clean up
async function parseFile(name: string, base64Data: string, mimeType: string): Promise<string> {
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `${Date.now()}-${name}`);
  const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(base64Clean, "base64");

  await fs.promises.writeFile(tempFilePath, buffer);

  try {
    const nameLower = name.toLowerCase();
    if (nameLower.endsWith(".pdf") || mimeType === "application/pdf") {
      let pdfParserRaw;
      try {
        pdfParserRaw = requireFn("pdf-parse");
      } catch (e) {
        console.warn("Failed to require pdf-parse, trying dynamic import:", e);
        pdfParserRaw = await import("pdf-parse");
      }
      
      const pdfParser = getModuleExports(pdfParserRaw);
      
      if (pdfParser && typeof pdfParser.PDFParse === "function") {
        try {
          const parser = new pdfParser.PDFParse(new Uint8Array(buffer));
          await parser.load();
          const res = await parser.getText();
          const extractedText = (res && typeof res === "object" ? res.text : res) || "";
          if (extractedText.trim().length > 0) return extractedText;
        } catch (err) {
          console.error("Constructed pdfParser.PDFParse failed:", err);
        }
      }
      
      if (pdfParserRaw && typeof pdfParserRaw.PDFParse === "function") {
        try {
          const parser = new pdfParserRaw.PDFParse(new Uint8Array(buffer));
          await parser.load();
          const res = await parser.getText();
          const extractedText = (res && typeof res === "object" ? res.text : res) || "";
          if (extractedText.trim().length > 0) return extractedText;
        } catch (err) {
          console.error("Constructed pdfParserRaw.PDFParse failed:", err);
        }
      }

      let pdfCallable: any = null;
      if (typeof pdfParser === "function") {
        pdfCallable = pdfParser;
      } else if (pdfParser && typeof pdfParser.default === "function") {
        pdfCallable = pdfParser.default;
      } else if (pdfParserRaw && typeof pdfParserRaw === "function") {
        pdfCallable = pdfParserRaw;
      } else if (pdfParserRaw && typeof pdfParserRaw.default === "function") {
        pdfCallable = pdfParserRaw.default;
      }

      if (pdfCallable) {
        try {
          const parsed = await pdfCallable(buffer);
          return parsed.text || "";
        } catch (fnErr) {
          console.warn("Functional pdf-parse failed, trying constructor fallback:", fnErr);
          try {
            const parser = new pdfCallable(new Uint8Array(buffer));
            await parser.load();
            const res = await parser.getText();
            return (res && typeof res === "object" ? res.text : res) || "";
          } catch (consErr) {
            console.error("Both functional and constructor paths failed for PDF parse:", consErr);
          }
        }
      }

      throw new Error("Could not find a valid parser mechanism in pdf-parse module exports.");
    } else if (
      nameLower.endsWith(".pptx") || 
      nameLower.endsWith(".ppt") || 
      nameLower.endsWith(".docx") || 
      nameLower.endsWith(".xlsx") || 
      nameLower.endsWith(".odt") || 
      nameLower.endsWith(".odp") || 
      nameLower.endsWith(".ods")
    ) {
      let officeParserRaw;
      try {
        officeParserRaw = requireFn("officeparser");
      } catch (e) {
        console.warn("Failed to require officeparser, trying dynamic import:", e);
        officeParserRaw = await import("officeparser");
      }
      
      const officeParser = getModuleExports(officeParserRaw);
      const parserObj = officeParser || officeParserRaw;

      if (!parserObj || typeof parserObj.parseOffice !== "function") {
        throw new Error("No parseOffice function available in officeparser exports.");
      }

      return new Promise<string>((resolve, reject) => {
        try {
          parserObj.parseOffice(tempFilePath, (data: any, err: any) => {
            if (err) {
              console.error("OfficeParser callback error side:", err);
              if (data && typeof data === "string" && data.trim().length > 0) {
                resolve(data);
              } else {
                reject(typeof err === "string" ? new Error(err) : err);
              }
            } else {
              resolve(data || "");
            }
          });
        } catch (cbErr) {
          console.error("OfficeParser invocation error catch:", cbErr);
          reject(cbErr);
        }
      });
    } else {
      return buffer.toString("utf-8");
    }
  } catch (err) {
    console.error("Error parsing file inside helper:", err);
    throw err;
  } finally {
    try {
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath);
      }
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }
}

app.post("/api/parse-file", async (req, res) => {
  try {
    const { name, base64, mimeType } = req.body;
    if (!base64) {
      return res.status(400).json({ error: "Le contenu du fichier en base64 est requis." });
    }
    const text = await parseFile(name, base64, mimeType);
    return res.json({ success: true, text });
  } catch (error: any) {
    console.error("Error inside /api/parse-file route:", error);
    return res.status(500).json({ error: "Erreur lors de l'extraction de texte du diaporama / document." });
  }
});

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in the environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

function generateQuestionsForSentences(sentenceList: string[]): any[] {
  if (sentenceList.length === 0) {
    sentenceList = ["La révision systématique est la clé de la mémorisation de vos cours."];
  }

  const questions: any[] = [];

  for (let i = 0; i < sentenceList.length; i++) {
    const s = sentenceList[i];
    const typeVal = i % 3;

    if (typeVal === 0) {
      questions.push({
        type: "true_false",
        question: `D'après le cours, l'affirmation suivante est-elle correcte ?\n\n« ${s} »`,
        options: ["Vrai", "Faux"],
        answer: "Vrai",
        explanation: `En effet ! Votre cours confirme précisément que : « ${s} »`
      });
    } else if (typeVal === 1) {
      let altered = s;
      if (s.includes(" est ")) altered = s.replace(" est ", " n'est pas forcément ");
      else if (s.includes(" de ")) altered = s.replace(" de ", " sans lien direct avec de ");
      else if (s.includes(" et ")) altered = s.replace(" et ", " sans toutefois inclure ");
      else altered = s + " (affirmation erronée)";

      let altered2 = s;
      if (s.includes(".")) altered2 = s.replace(".", " (cette règle comporte néanmoins des exceptions majeures).");
      else altered2 = s + " (seulement dans de très rares cas d'études).";

      questions.push({
        type: "choice",
        question: `Laquelle des affirmations suivantes décrit correctement une notion clé du cours ?`,
        options: [s, altered, altered2],
        answer: s,
        explanation: `Excellent choix. Le cours enseigne cette notion : « ${s} »`
      });
    } else {
      const words = s.split(/\s+/).filter(w => w.length > 5);
      if (words.length > 0) {
        const targetWord = words[Math.floor(Math.random() * words.length)].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        if (targetWord && targetWord.length > 3) {
          const blanked = s.replace(targetWord, "_______");
          questions.push({
            type: "fill",
            question: `Quel mot clé complète correctement cet énoncé ?\n\n« ${blanked} »`,
            answer: targetWord,
            explanation: `Bien vu ! Le terme manquant était "${targetWord}". Phrase complète : « ${s} »`
          });
          continue;
        }
      }

      questions.push({
        type: "match",
        question: s,
        options: [],
        answer: "Concept clé du cours à mémoriser",
        explanation: "Félicitations, vous avez parfaitement validé et intégré cette notion !"
      });
    }
  }

  return questions;
}

function generateFallbackSyllabus(courseTitle: string, courseNotes: string, startUnitNumber: number = 1) {
  const paragraphs = courseNotes
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 5);

  const sentences: string[] = [];
  for (const para of paragraphs) {
    const parts = para.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 12);
    sentences.push(...parts);
  }

  const basePredefined = [
    "Les bases fondamentales de votre matière doivent être régulièrement révisées.",
    "La méthode des J (révision espacée) repose sur la répétition à des intervalles optimisés.",
    "Utiliser les fiches synthétiques permet de se focaliser sur l'essentiel à l'examen.",
    "Se tester activement déclenche un processus cérébral d'ancrage durable.",
    "Chaque mauvaise réponse lors de vos quiz est une opportunité d'ajuster votre compréhension.",
    "L'attention soutenue s'accompagne d'une meilleure plasticité synaptique.",
    "La verbalisation (expliquer le cours à voix haute) multiplie par deux les chances de rétention.",
    "Associer une image mentale ou un concept de situation stabilise l'information complexe.",
    "Une séance d'apprentissage brève de 10 minutes est plus profitable qu'une session intensive de 2 heures.",
    "Le sommeil lent profond consolide le transfert des connaissances vers le cortex préfrontal.",
    "Interroger ses acquis sous de multiples angles différents est le pilier de l'apprentissage actif.",
    "Le rappel libre (lister tout ce qu'on sait de mémoire) devance largement la relecture passive."
  ];

  const fallbackSentences = sentences.length >= 12 ? sentences : [...sentences, ...basePredefined.slice(0, 12 - sentences.length)];
  const name = courseTitle || "Mon Cours IA";

  const units = [
    {
      unitNumber: startUnitNumber,
      title: `Unité ${startUnitNumber} : Fondements et Terminologie de ${name}`,
      description: "Apprentissage accéléré des notions et définitions principales.",
      lessons: [
        { id: `fallback-u${startUnitNumber}-l1-${Date.now()}`, title: "Introduction et Concepts de base", type: "vocab" as const, xp: 15, questions: generateQuestionsForSentences(fallbackSentences.slice(0, 2)) },
        { id: `fallback-u${startUnitNumber}-l2-${Date.now()}`, title: "Évaluation de rappel direct", type: "quiz" as const, xp: 15, questions: generateQuestionsForSentences(fallbackSentences.slice(2, 4)) },
        { id: `fallback-u${startUnitNumber}-l3-${Date.now()}`, title: "Ancrage des notions", type: "flashcard" as const, xp: 15, questions: generateQuestionsForSentences(fallbackSentences.slice(4, 5)) }
      ]
    },
    {
      unitNumber: startUnitNumber + 1,
      title: `Unité ${startUnitNumber + 1} : Analyse et Rapprochements d'idées`,
      description: "Assimilation progressive et maîtrise complète sur le long terme.",
      lessons: [
        { id: `fallback-u${startUnitNumber + 1}-l1-${Date.now()}`, title: "Fiches de mémorisation", type: "vocab" as const, xp: 15, questions: generateQuestionsForSentences(fallbackSentences.slice(5, 7)) },
        { id: `fallback-u${startUnitNumber + 1}-l2-${Date.now()}`, title: "Quiz général de consolidation", type: "quiz" as const, xp: 15, questions: generateQuestionsForSentences(fallbackSentences.slice(7, 9)) },
        { id: `fallback-u${startUnitNumber + 1}-l3-${Date.now()}`, title: "Modèle de mise en situation", type: "flashcard" as const, xp: 15, questions: generateQuestionsForSentences(fallbackSentences.slice(9, 10)) }
      ]
    },
    {
      unitNumber: startUnitNumber + 2,
      title: `Unité ${startUnitNumber + 2} : Synthèse et Cas Pratiques`,
      description: "Validation finale approfondie des acquis d'examens.",
      lessons: [
        { id: `fallback-u${startUnitNumber + 2}-l1-${Date.now()}`, title: "Théorie appliquée complexe", type: "vocab" as const, xp: 15, questions: generateQuestionsForSentences(fallbackSentences.slice(10, 11)) },
        { id: `fallback-u${startUnitNumber + 2}-l2-${Date.now()}`, title: "Quiz de synthèse croisée", type: "quiz" as const, xp: 15, questions: generateQuestionsForSentences(fallbackSentences.slice(11, 12)) },
        { id: `fallback-u${startUnitNumber + 2}-l3-${Date.now()}`, title: "Validation finale du parcours", type: "flashcard" as const, xp: 15, questions: generateQuestionsForSentences(fallbackSentences.slice(0, 2)) }
      ]
    }
  ];

  return { courseName: name, themeColor: "indigo" as const, units };
}

function parseCleanJSON(text: string): any {
  let cleanText = text.trim();
  if (cleanText.startsWith("```")) {
    const lines = cleanText.split("\n");
    if (lines[0].startsWith("```")) lines.shift();
    if (lines[lines.length - 1].startsWith("```")) lines.pop();
    cleanText = lines.join("\n").trim();
  }
  const startIdx = cleanText.indexOf("{");
  const endIdx = cleanText.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleanText = cleanText.substring(startIdx, endIdx + 1);
  }
  return JSON.parse(cleanText);
}

function repairGeneratedCurriculum(data: any): any {
  if (!data || typeof data !== "object") return data;
  if (!data.courseName) data.courseName = "Notes de cours";
  if (!Array.isArray(data.units)) data.units = [];

  const courseName = data.courseName;

  if (data.units.length < 3) {
    const startNum = data.units.length > 0 ? (data.units[data.units.length - 1].unitNumber || data.units.length) + 1 : 1;
    for (let u = data.units.length; u < 3; u++) {
      const nextNum = startNum + (u - data.units.length);
      data.units.push({
        unitNumber: nextNum,
        title: `Unité ${nextNum} : Approfondissement et Maîtrise de ${courseName}`,
        description: "Assimilation progressive et consolidation des concepts clés.",
        lessons: []
      });
    }
  }

  data.units.forEach((unit: any, uIdx: number) => {
    if (Array.isArray(unit.lessons)) {
      const courseSlug = String(courseName || "course").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20);
      const repairTimestamp = Date.now();
      unit.lessons.forEach((lesson: any, lIdx: number) => {
        if (lesson && typeof lesson === "object") {
          const titleSlug = String(lesson.title || `lesson-${lIdx + 1}`).toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 15);
          lesson.id = `gen-${courseSlug}-${titleSlug}-${repairTimestamp}-u${unit.unitNumber || uIdx + 1}-l${lIdx + 1}`;
        }
      });
    }

    if (unit.lessons.length === 0) {
      unit.lessons = [
        { id: `manual-u${unit.unitNumber || uIdx + 1}-l1-${Date.now()}`, title: "Introduction et Fondements", type: "vocab", xp: 15, questions: [{ type: "true_false", question: `Le sujet traité est essentiel pour maîtriser ${courseName}.`, options: ["Vrai", "Faux"], answer: "Vrai", explanation: "Ce point fait partie des fiches d'étude importantes à acquérir." }] },
        { id: `manual-u${unit.unitNumber || uIdx + 1}-l2-${Date.now()}`, title: "Quiz d'assimilation", type: "quiz", xp: 15, questions: [{ type: "choice", question: "Quelle méthode active d'entraînement est à privilégier ?", options: ["La répétition espacée active", "La relecture passive répétée", "Ignorer les erreurs", "Le bachotage la veille"], answer: "La répétition espacée active", explanation: "Répéter activement l'effort de rappel renforce considérablement les connexions neuronales." }] },
        { id: `manual-u${unit.unitNumber || uIdx + 1}-l3-${Date.now()}`, title: "Défis de mémorisation finale", type: "flashcard", xp: 15, questions: [{ type: "true_false", question: "L'apprentissage fractionné sur plusieurs jours est plus efficace que l'apprentissage condensé.", options: ["Vrai", "Faux"], answer: "Vrai", explanation: "La mémoire a besoin de phases de sommeil et de repos pour consolider les notions." }] }
      ];
    } else if (unit.lessons.length === 1) {
      const originalLesson = unit.lessons[0];
      const questions = originalLesson.questions || [];
      while (questions.length < 3) {
        questions.push({ type: "true_false", question: `Le concept phare de "${originalLesson.title}" nécessite des révisions régulières.`, options: ["Vrai", "Faux"], answer: "Vrai", explanation: "La régularité est le premier facteur de réussite de votre cursus." });
      }
      const results: any[][] = [[], [], []];
      questions.forEach((q: any, qIdx: number) => { results[qIdx % 3].push(q); });
      unit.lessons = [
        { id: `${originalLesson.id}-p1`, title: `${originalLesson.title} - Fondement`, type: originalLesson.type || "vocab", xp: 15, questions: results[0] },
        { id: `${originalLesson.id}-p2`, title: `${originalLesson.title} - Pratique`, type: "quiz", xp: 15, questions: results[1] },
        { id: `${originalLesson.id}-p3`, title: `${originalLesson.title} - Consolidation`, type: "flashcard", xp: 15, questions: results[2] }
      ];
    } else if (unit.lessons.length === 2) {
      const l1 = unit.lessons[0];
      const l2 = unit.lessons[1];
      const l2q = l2.questions || [];
      if (l2q.length >= 2) {
        const mid = Math.floor(l2q.length / 2);
        unit.lessons = [
          l1,
          { ...l2, id: `${l2.id}-p1`, title: `${l2.title} - Partie A`, questions: l2q.slice(0, mid) },
          { ...l2, id: `${l2.id}-p2`, title: `${l2.title} - Partie B`, type: l2.type === "vocab" ? "quiz" : "flashcard", questions: l2q.slice(mid) }
        ];
      } else {
        unit.lessons.push({ id: `${l1.id}-extra-${Date.now()}`, title: `${l1.title} - Approfondissement`, type: "flashcard", xp: 15, questions: [{ type: "true_false", question: `La réactivation régulière de ${courseName} aide à lutter contre la courbe de l'oubli.`, options: ["Vrai", "Faux"], answer: "Vrai", explanation: "Prenez de l'avance en consolidant ces concepts maintenant." }] });
      }
    }

    unit.lessons.forEach((lesson: any) => {
      if (!Array.isArray(lesson.questions)) lesson.questions = [];
      lesson.questions.forEach((q: any) => {
        if (!q.type) q.type = "choice";
        if (!q.question) q.question = "Question d'étude pédagogique";
        if (!q.answer) q.answer = "Réponse correcte";
        const type = q.type;
        const answer = q.answer;
        if (type === "true_false") {
          q.options = ["Vrai", "Faux"];
        } else if (type === "choice") {
          if (!Array.isArray(q.options) || q.options.length < 2) {
            const answerClean = String(answer).trim();
            q.options = [answerClean, `Une autre approche alternative de ${answerClean}`, `L'effet inverse ou l'opposé de ${answerClean}`, `Une mauvaise interprétation courante de ${answerClean}`];
          } else {
            const answerClean = String(answer).trim().toLowerCase();
            const hasCorrect = q.options.some((opt: string) => String(opt).trim().toLowerCase() === answerClean);
            if (!hasCorrect) q.options[0] = answer;
          }
        } else {
          q.options = [];
        }
      });
    });
  });

  return data;
}

app.post("/api/generate-learning-path", async (req, res) => {
  const { courseTitle, courseNotes, language = "fr", startUnitNumber = 1 } = req.body;
  try {
    if (!courseNotes || courseNotes.trim().length === 0) {
      return res.status(400).json({ error: "Les notes de cours sont requises." });
    }

    if (process.env.GEMINI_API_KEY === undefined || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      return res.status(200).json({
        isMock: true,
        message: "Key missing",
        data: {
          courseName: courseTitle || "Mon Cours IA",
          themeColor: "emerald",
          units: [{ unitNumber: startUnitNumber, title: `Unité ${startUnitNumber} : Fondements de ` + (courseTitle || "votre cours"), description: "Découvrir les concepts essentiels découlant de vos notes de cours.", lessons: [{ id: `mock-lesson-${startUnitNumber}-1`, title: "Termes et Vocabulaire", type: "vocab", xp: 15, questions: [{ type: "match", question: "Associer le concept à sa description", options: [], answer: "Mode Simulation : Configurez votre clé GEMINI_API_KEY dans l'onglet Secrets pour utiliser la vraie IA.", explanation: "Veuillez configurer la clé API dans les secrets de l'application." }] }] }]
        }
      });
    }

    const ai = getGeminiClient();
    const textPrompt = `Veuillez analyser les notes de cours suivantes pour concevoir un programme d'apprentissage complet, progressif et hautement granulaire de style Duolingo.
    
    Titre souhaité : "${courseTitle || "Notes de cours"}"
    Notes de cours :
    ---
    ${courseNotes}
    ---

    Directives d'Ingénierie Pédagogique d'Elite (RÈGLES D'OR DUOLINGO ADAPTÉES) :

    1. IDENTIFICATION DE LA MATIÈRE ET DE LA COMPÉTENCE :
       - Identifiez automatiquement la matière dominante (Mathématiques, Physique, Chimie, Biologie, SVT, Histoire, Géographie, Économie, Philosophie, Droit, Informatique, Médecine, Langues, Psychologie, Sciences politiques, ou Autre).
       - Pour chaque question, déterminez précisément la compétence visée (Mémorisation, Reconnaissance, Compréhension, Comparaison, Analyse, Raisonnement, Application, Résolution de problème, Interprétation, Chronologie, Classification, Détection d'erreur, Argumentation, Synthèse).

    2. CHOIX ET STRATÉGIE PAR TYPE D'EXERCICE :
       - 'choice' : 4 options homogènes et hautement plausibles.
       - 'true_false' : exactement ["Vrai", "Faux"].
       - 'fill' : réponse courte, options vides [].
       - 'match' : terme clé → définition, options vides [].

    3. EXIGENCES DE QUALITÉ ABSOLUES POUR LES QCM :
       - Jamais de distracteurs absurdes ou évidents.
       - Questions directes et techniques, 100% contextualisées.
       - Toutes les options de longueur similaire.

    4. DECOUPAGE ATOMIQUE SANS SAUT DE DIFFICULTÉ :
       - Au moins 3 unités, au moins 3 leçons par unité.
       - 20 à 25 questions par leçon, formats variés.
       - Numérotez la première unité avec le numéro : ${startUnitNumber}.

    Répondez uniquement en JSON valide avec la structure demandée. Tout le contenu en français.`;

    let response;
    let attempts = 0;
    const maxAttempts = 3;
    const currentModel = "gemini-2.0-flash";

    while (attempts < maxAttempts) {
      try {
        console.log(`Sending learning path request to ${currentModel} (attempt ${attempts + 1}/${maxAttempts})...`);
        response = await ai.models.generateContent({
          model: currentModel,
          contents: textPrompt,
          config: {
            systemInstruction: "Vous êtes un expert mondial en ingénierie pédagogique et en conception de parcours d'apprentissage gamifiés interactifs. Répondez uniquement avec du JSON valide, sans markdown, sans backticks.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                courseName: { type: Type.STRING },
                themeColor: { type: Type.STRING },
                units: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      unitNumber: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      lessons: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            type: { type: Type.STRING },
                            xp: { type: Type.INTEGER },
                            questions: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  type: { type: Type.STRING },
                                  question: { type: Type.STRING },
                                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                  answer: { type: Type.STRING },
                                  explanation: { type: Type.STRING }
                                },
                                required: ["type", "question", "options", "answer", "explanation"]
                              }
                            }
                          },
                          required: ["id", "title", "type", "xp", "questions"]
                        }
                      }
                    },
                    required: ["unitNumber", "title", "description", "lessons"]
                  }
                }
              },
              required: ["courseName", "units"]
            },
          },
        });

        if (response) {
          console.log(`Successfully generated learning path using ${currentModel}!`);
          break;
        }
      } catch (err: any) {
        attempts++;
        console.error(`Attempt ${attempts} failed with error:`, err);
        const errMsg = String(err.message || "").toLowerCase();
        if (errMsg.includes("key_invalid") || errMsg.includes("api key") || err.status === 400) {
          console.warn("Permanent API key error. Falling back instantly.");
          throw err;
        }
        if (attempts >= maxAttempts) throw err;
        const delayMs = attempts * 1500;
        console.log(`Waiting ${delayMs}ms before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const resultText = response?.text;
    if (!resultText) throw new Error("Aucune réponse générée par l'IA.");

    let data;
    try {
      data = parseCleanJSON(resultText);
    } catch (parseErr: any) {
      const jsonStart = resultText.indexOf("{");
      const jsonEnd = resultText.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        data = JSON.parse(resultText.substring(jsonStart, jsonEnd + 1));
      } else {
        throw parseErr;
      }
    }
    data = repairGeneratedCurriculum(data);
    return res.json({ success: true, data });

  } catch (error: any) {
    console.error("Gemini failed, using fallback syllabus generator:", error);
    try {
      const fallbackData = generateFallbackSyllabus(courseTitle, courseNotes, startUnitNumber);
      return res.json({ success: true, isFallback: true, data: fallbackData });
    } catch (fallbackErr: any) {
      console.error("Fatal: Fallback builder also failed:", fallbackErr);
      return res.status(500).json({ error: "Impossible de générer le cours de révision." });
    }
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === "production" && process.env.VERCEL !== "1") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

if (process.env.VERCEL !== "1") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DuoStudy Server] running on http://localhost:${PORT}`);
  });
}

export default app;
