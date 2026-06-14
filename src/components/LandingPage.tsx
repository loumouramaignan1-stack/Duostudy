import React, { useState } from "react";
import { 
  BookOpen, 
  Sparkles, 
  BrainCircuit, 
  Calendar, 
  Trophy, 
  ChevronDown, 
  Play, 
  ArrowRight, 
  CheckCircle, 
  Loader2, 
  UploadCloud, 
  Gem, 
  Heart, 
  Flame, 
  HelpCircle,
  Code
} from "lucide-react";
import DuoStudyLogo from "./DuoStudyLogo";

interface LandingPageProps {
  onNavigateToLearn: () => void;
  onNavigateToAuth: () => void;
  hasUser: boolean;
}

export default function LandingPage({ onNavigateToLearn, onNavigateToAuth, hasUser }: LandingPageProps) {
  // Demo quiz states for interactive demo
  const [demoSelectedOption, setDemoSelectedOption] = useState<number | null>(null);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoScore, setDemoScore] = useState(0);

  // Accordion faq states
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const demoQuestion = {
    question: "Quelle méthode scientifique utilise DuoStudy pour stopper l'oubli de vos cours ?",
    options: [
      "La relecture passive répétée de vos fiches la veille de l'épreuve",
      "La répétition espacée (Spaced Repetition) basée sur l'algorithme cognitif SM-2",
      "Le surlignage intensif de 100% du texte avec 4 stabilos différents",
      "La prière intensive 5 minutes avant d'entrer dans la salle d'examen"
    ],
    correctIdx: 1,
    explanation: "Exact ! L'algorithme de répétition espacée SM-2 calcule automatiquement la date optimale de votre prochaine révision juste avant que votre cerveau n'oublie l'information, consolidant la trace mnésique profondément !"
  };

  const faqs = [
    {
      q: "DuoStudy héberge-t-il vraiment mes documents de cours ?",
      a: "Oui, vos cours importés sont convertis en blocs pédagogiques d'apprentissage et sauvegardés sur notre base de données sécurisée Firebase. Vous pouvez y accéder depuis n'importe quel ordinateur ou appareil mobile connecté à votre compte."
    },
    {
      q: "Est-ce que l'importation de documents (PDF, PowerPoint, Word) est gratuite ?",
      a: "Absolument ! Le cœur de DuoStudy est entièrement gratuit. Vous pouvez importer vos fiches de révision, vos notes saisies au clavier ou vos diaporamas de cours pour en générer des exercices interactifs."
    },
    {
      q: "Comment fonctionne l'algorithme de réapprentissage (Spaced Repetition) ?",
      a: "DuoStudy utilise le modèle de mémoire SM-2 (SuperMemo-2). Chaque fois que vous complétez une leçon, la date du prochain entraînement est planifiée (de 1 à 12 jours). Si vous répondez correctement, l'intervalle s'allonge ; en cas d'erreur, il se raccourcit pour vous forcer à réviser au moment parfait."
    },
    {
      q: "Le système fonctionne-t-il hors-ligne ?",
      a: "DuoStudy sauvegarde une copie locale cryptée de vos cours et de votre progression directement dans votre navigateur (localStorage). Cela vous évite de perdre vos précieux points d'expérience en cas de micro-coupure réseau !"
    }
  ];

  const handleDemoOptionClick = (idx: number) => {
    if (demoSubmitted) return;
    setDemoSelectedOption(idx);
  };

  const handleDemoSubmit = () => {
    if (demoSelectedOption === null) return;
    setDemoSubmitted(true);
    if (demoSelectedOption === demoQuestion.correctIdx) {
      setDemoScore(100);
    }
  };

  const handleDemoReset = () => {
    setDemoSelectedOption(null);
    setDemoSubmitted(false);
    setDemoScore(0);
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div id="landing-page-root" className="min-h-screen bg-[#FCFDFE] text-[#4B4B4B] font-sans overflow-x-hidden selection:bg-[#58cc02] selection:text-white">
      
      {/* 1. NAVIGATION BAR */}
      <nav className="border-b-2 border-[#E5E5E5] bg-white/95 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="cursor-pointer" onClick={onNavigateToLearn}>
            <DuoStudyLogo size="md" />
          </div>

          <div className="hidden md:flex items-center gap-7 text-[#777777] font-black text-xs tracking-wider uppercase">
            <a href="#features" className="hover:text-[#1C1C1C] transition-all">Fonctionnalités</a>
            <a href="#how-it-works" className="hover:text-[#1C1C1C] transition-all">Comment ça marche ?</a>
            <a href="#demo" className="hover:text-[#1C1C1C] transition-all">Démonstration</a>
            <a href="#faq" className="hover:text-[#1C1C1C] transition-all">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            {hasUser ? (
              <button 
                onClick={onNavigateToLearn}
                className="px-5 py-2.5 bg-[#58cc02] border-b-4 border-[#388301] hover:brightness-105 active:translate-y-0.5 active:border-b-0 text-white font-black text-xs rounded-2xl uppercase tracking-wider transition-all cursor-pointer select-none"
              >
                Mon Tableau de Bord
              </button>
            ) : (
              <>
                <button 
                  onClick={onNavigateToAuth}
                  className="hidden sm:block px-5 py-2.5 bg-white border-2 border-b-4 border-[#E5E5E5] hover:bg-slate-50 active:translate-y-0.5 active:border-b-2 text-slate-700 font-black text-xs rounded-2xl uppercase tracking-wider transition-all cursor-pointer select-none"
                >
                  Se connecter
                </button>
                <button 
                  onClick={onNavigateToLearn}
                  className="px-5 py-2.5 bg-[#58cc02] border-b-4 border-[#388301] hover:brightness-105 active:translate-y-0.5 active:border-b-0 text-white font-black text-xs rounded-2xl uppercase tracking-wider transition-all cursor-pointer select-none"
                >
                  Essayer l'application
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative py-16 md:py-24 overflow-hidden border-b-2 border-gray-100 bg-gradient-to-b from-emerald-50/20 to-transparent">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
          
          {/* Main Hero texts */}
          <div className="md:col-span-7 flex flex-col items-start space-y-6">

            <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black font-display text-[#1C1C1C] tracking-tight leading-[1.05] text-left">
              Révisez vos cours <br />
              <span className="text-[#58cc02] relative inline-block">
                comme un jeu.
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-md text-[#4B4B4B] leading-relaxed font-medium font-sans">
              Importez simplement vos PDF, fiches de révision, diaporamas ou notes de cours. Notre IA de pointe les transforme instantanément en un parcours d'apprentissage adaptatif, gamifié et propulsé par les sciences cognitives.
            </p>

            {/* CTA action buttons */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button 
                onClick={onNavigateToLearn}
                className="px-8 py-4 bg-[#58cc02] border-b-4 border-[#357a01] hover:brightness-105 active:translate-y-0.5 active:border-b-0 text-white font-black text-sm rounded-2xl uppercase tracking-widest transition-all cursor-pointer select-none flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <span>Commencer à apprendre</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a 
                href="#demo"
                className="px-8 py-4 bg-white border-2 border-b-4 border-[#E5E5E5] hover:bg-slate-50 hover:border-gray-300 active:translate-y-0.5 active:border-b-2 text-slate-700 font-black text-sm rounded-2xl uppercase tracking-widest text-center transition-all cursor-pointer select-none"
              >
                Tester la démo libre
              </a>
            </div>
          </div>

          {/* Duolingo UI representation preview cards */}
          <div className="md:col-span-5 relative flex justify-center">
            
            {/* Ambient decoration bubbles */}
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-emerald-100/40 blur-3xl -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-blue-100/30 blur-3xl -z-10"></div>

            {/* App UI Visual Showcase Mockup */}
            <div className="w-full max-w-sm rounded-[32px] border-4 border-[#E5E5E5] bg-white shadow-2xl p-5 relative select-none">
              
              {/* Fake top HUD */}
              <div className="flex items-center justify-between border-b-2 border-gray-100 pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <DuoStudyLogo size="sm" showText={false} />
                  <span className="text-[10px] font-black tracking-wider text-slate-700">DuoStudy Pro</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black">
                  <span className="text-amber-500">🔥 7 Jours</span>
                  <span className="text-red-500">❤️ 5/5</span>
                  <span className="text-sky-500">💎 150</span>
                </div>
              </div>

              {/* Active course */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 mb-4 text-left">
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-wider block">Cours Actif</span>
                <span className="text-xs font-extrabold text-[#1C1C1C] truncate block">📘 Cardiologie & Système Circulatoire</span>
              </div>

              {/* Study Path representation */}
              <div className="space-y-4 py-2 flex flex-col items-center">
                
                {/* Visual Unit header */}
                <div className="w-full bg-[#58cc02] text-white rounded-2xl p-3 text-left shadow-sm">
                  <span className="text-[8px] font-bold text-emerald-100 uppercase block tracking-wider leading-none">Unité 1</span>
                  <span className="text-xs font-black block mt-0.5 leading-tight">Anatomie fondamentale du coeur</span>
                  <p className="text-[9px] text-emerald-50 mt-1 leading-snug">Identifier les oreillettes, ventricules et cycles de pressions.</p>
                </div>

                {/* Vertical aligned circular duolingo nodes */}
                <div className="relative flex flex-col items-center gap-3 py-1">
                  
                  {/* Dotted path lines */}
                  <div className="absolute top-4 bottom-4 w-1 border-l-2 border-dashed border-gray-200"></div>

                  {/* Node 1: Completed */}
                  <div className="relative z-10 w-11 h-10 bg-[#58cc02] rounded-full flex items-center justify-center border-b-4 border-[#439b02] text-white text-xs font-black shadow-sm transform -translate-x-1.5 duration-150 hover:scale-105 cursor-pointer">
                    ✓
                  </div>

                  {/* Node 2: Active pulsing with popup indicator */}
                  <div className="relative z-10 w-11 h-10 bg-amber-400 rounded-full flex items-center justify-center border-b-4 border-amber-600 text-white text-xs font-black shadow-sm glow-active transform translate-x-1 duration-150 hover:scale-105 cursor-pointer">
                    ★
                    {/* Floating Level Bubble */}
                    <div className="absolute -top-7 px-2 py-0.5 bg-amber-500 text-white text-[7px] font-black rounded-full uppercase tracking-widest whitespace-nowrap shadow-md">
                      Niveau 2
                    </div>
                  </div>

                  {/* Node 3: Locked */}
                  <div className="relative z-10 w-11 h-10 bg-gray-200 rounded-full flex items-center justify-center border-b-4 border-gray-400 text-gray-400 text-xs font-black shadow-sm transform -translate-x-2">
                    🔒
                  </div>

                </div>

                {/* Bottom interactive card mockup */}
                <div className="w-full border-t border-gray-100 pt-3 flex justify-between items-center text-[9px] text-gray-400 font-bold">
                  <span>🎯 Score de rétention: 94%</span>
                  <span className="text-[#388301]">Révision optimale requise dans 2 jours</span>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 3. FEATURES BENTO GRID */}
      <section id="features" className="py-20 md:py-28 bg-[#FDFDFD] border-b-2 border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-black text-[#58cc02] tracking-widest uppercase">Méthodologie Scientifique</span>
            <h2 className="text-3xl font-black font-display text-[#1C1C1C] tracking-tight leading-none sm:text-4xl">
              Spaciation, Rappel Actif & Gamification
            </h2>
            <p className="text-sm font-medium text-gray-500 leading-relaxed">
              Nous avons réuni des neurosciences de l'apprentissage et les mécaniques de jeu pour créer la plateforme de révision étudiante la plus efficace jamais conçue.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid md:grid-cols-12 gap-6">
            
            {/* Bento 1: IA parsing */}
            <div className="md:col-span-8 bg-white border-2 border-[#E5E5E5] rounded-3xl p-8 flex flex-col justify-between hover:border-gray-300 transition-all shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4f46e5]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black font-display text-[#1C1C1C]">
                  Parser Intelligent de Cours & Diapositives
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 font-medium max-w-xl">
                  Glissez-déposez n'importe quel fichier de cours (PDF, PowerPoint, Word ou de simples captures de notes). Notre parseur de documents extrait la structure pédagogique et structure vos cours en sections d'apprentissage en un clin d'œil.
                </p>
              </div>
              
              {/* Simulated draft upload panel */}
              <div className="mt-8 border-2 border-dashed border-[#E5E5E5] rounded-2xl p-5 bg-[#F9FAFB] flex items-center justify-between text-xs font-bold text-gray-400">
                <div className="flex items-center gap-3">
                  <UploadCloud className="w-5 h-5 text-gray-400 shrink-0" />
                  <div>
                    <span className="text-[#1C1C1C] block font-extrabold text-[11px]">cours_cardiologie.pptx</span>
                    <span className="text-[10px] text-gray-400 block font-medium leading-none mt-1">Génération en cours — 128 Mo</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> Extrait par IA
                </span>
              </div>
            </div>

            {/* Bento 2: SM-2 */}
            <div className="md:col-span-4 bg-white border-2 border-[#E5E5E5] rounded-3xl p-8 flex flex-col justify-between hover:border-gray-300 transition-all shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#58cc02]">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black font-display text-[#1C1C1C]">
                  Répétition Espacée SM-2
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 font-medium">
                  Ne révisez plus au hasard. Notre algorithme SM-2 calcule la date optimale de votre réentraînement en fonction de vos succès et vos doutes passés, luttant précisément contre l'oubli.
                </p>
              </div>

              {/* Graphic curve simulation */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-end justify-between h-20 text-[9px] font-black text-gray-400 uppercase tracking-wider">
                <div className="flex flex-col items-center gap-1.5 w-full">
                  <div className="w-full bg-red-100 h-16 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 bg-red-400 h-1/5"></div>
                  </div>
                  <span>Jour 1 (20%)</span>
                </div>
                <div className="w-2"></div>
                <div className="flex flex-col items-center gap-1.5 w-full">
                  <div className="w-full bg-amber-100 h-16 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 bg-amber-400 h-3/5"></div>
                  </div>
                  <span>Jour 3 (60%)</span>
                </div>
                <div className="w-2"></div>
                <div className="flex flex-col items-center gap-1.5 w-full">
                  <div className="w-full bg-emerald-100 h-16 rounded-lg relative overflow-hidden text-center">
                    <div className="absolute inset-x-0 bottom-0 bg-[#58cc02] h-full"></div>
                  </div>
                  <span>Jour 7 (100% Retenu)</span>
                </div>
              </div>
            </div>

            {/* Bento 3: Streak  */}
            <div className="md:col-span-4 bg-white border-2 border-[#E5E5E5] rounded-3xl p-8 flex flex-col justify-between hover:border-gray-300 transition-all shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black font-display text-[#1C1C1C]">
                  Ludique et Addictif
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 font-medium">
                  Gagnez de l'expérience, achetez des multiplicateurs d'XP ou protégez votre série quotidienne ! Protégez vos 5 vies d'affilée pour prouver votre maîtrise du cours.
                </p>
              </div>

              <div className="mt-6 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-center justify-between text-xs font-black">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <span className="text-slate-700 block text-xs font-extrabold leading-none">Série active</span>
                    <span className="text-gray-400 text-[10px] font-bold leading-none block mt-1">7 Jours d'étude consécutifs</span>
                  </div>
                </div>
                <span className="text-[#388301] text-[10px] uppercase font-black tracking-wider bg-white px-2 py-1 rounded-md border border-gray-100">Défis du jour OK</span>
              </div>
            </div>

            {/* Bento 4: Exam mapping dashboard */}
            <div className="md:col-span-8 bg-white border-2 border-[#E5E5E5] rounded-3xl p-8 flex flex-col justify-between hover:border-gray-300 transition-all shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1899d6]/10 flex items-center justify-center text-[#1899d6]">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black font-display text-[#1C1C1C]">
                  Rappels et Agenda de Jours d'Examens
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 font-medium">
                  Renseignez la date officielle de votre examen de médecine, d'économie ou votre partiel universitaire. DuoStudy ajuste dynamiquement l'intensité conseillée des sessions et la vitesse de franchissement de vos sections pour optimiser votre score de réussite.
                </p>
              </div>

              {/* simulated exam date progress tracker bar */}
              <div className="mt-8">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400 mb-2">
                  <span>Partiel Cardiologie Clinique</span>
                  <span className="text-indigo-600 font-extrabold">25 jours restants</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-[#58cc02] w-2/3 rounded-full"></div>
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 mt-1">
                  <span>Inscrit le 12 mai</span>
                  <span>Maîtrise estimée: 82%</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. CHRONOLOGICAL WORKFLOW */}
      <section id="how-it-works" className="py-20 md:py-28 bg-[#F6F8F9] border-b-2 border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-black text-[#58cc02] tracking-widest uppercase">Processus Fluide</span>
            <h2 className="text-3xl font-black font-display text-[#1C1C1C] tracking-tight leading-none sm:text-4xl">
              Prêt En Moins De 60 Secondes
            </h2>
            <p className="text-sm font-medium text-gray-500 leading-relaxed">
              Trois étapes sans friction pour abandonner la simple relecture passive inefficace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-white border-2 border-[#E5E5E5] rounded-3xl p-8 relative flex flex-col justify-between h-full hover:shadow-md transition-all">
              <span className="absolute -top-5 left-8 w-11 h-11 bg-[#58cc02] text-white font-black text-md rounded-full border-4 border-[#F6F8F9] flex items-center justify-center shadow-sm select-none">
                1
              </span>
              <div className="space-y-4 pt-4">
                <h3 className="text-md font-black text-[#1C1C1C] font-display">Téléversez vos supports</h3>
                <p className="text-xs leading-relaxed text-gray-500 font-medium">
                  Glissez un PDF structuré, vos diapositives PowerPoint ou saisissez simplement vos notes brutes au clavier dans l'onglet d'importation.
                </p>
              </div>
              <div className="text-3xl pt-8 text-right filter saturate-200">📂</div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border-2 border-[#E5E5E5] rounded-3xl p-8 relative flex flex-col justify-between h-full hover:shadow-md transition-all">
              <span className="absolute -top-5 left-8 w-11 h-11 bg-[#1cb5ff] text-white font-black text-md rounded-full border-4 border-[#F6F8F9] flex items-center justify-center shadow-sm select-none">
                2
              </span>
              <div className="space-y-4 pt-4">
                <h3 className="text-md font-black text-[#1C1C1C] font-display">L'IA génère vos quiz</h3>
                <p className="text-xs leading-relaxed text-gray-500 font-medium">
                  Notre intelligence artificielle conçoit des questionnaires exclusifs : cartes d'association conceptuelle, questions Vrai/Faux ou textes lacunaires adaptés.
                </p>
              </div>
              <div className="text-3xl pt-8 text-right filter saturate-200">🧠</div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border-2 border-[#E5E5E5] rounded-3xl p-8 relative flex flex-col justify-between h-full hover:shadow-md transition-all">
              <span className="absolute -top-5 left-8 w-11 h-11 bg-amber-400 text-white font-black text-md rounded-full border-4 border-[#F6F8F9] flex items-center justify-center shadow-sm select-none">
                3
              </span>
              <div className="space-y-4 pt-4">
                <h3 className="text-md font-black text-[#1C1C1C] font-display">Progressez en vous amusant</h3>
                <p className="text-xs leading-relaxed text-gray-500 font-medium">
                  Révisez 5 à 10 minutes par jour pour déjouer la courbe de l'oubli, décrocher de nouvelles gemmes virtuelles et réussir vos partiels haut la main !
                </p>
              </div>
              <div className="text-3xl pt-8 text-right filter saturate-200">🎓</div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE LIVE DEMO WIDGET */}
      <section id="demo" className="py-20 md:py-28 bg-white border-b-2 border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <span className="text-xs font-black text-[#58cc02] tracking-widest uppercase">Essayable sur le champ</span>
            <h2 className="text-3xl font-black font-display text-[#1C1C1C] tracking-tight leading-none sm:text-4xl">
              Faites le test directement
            </h2>
            <p className="text-sm font-medium text-gray-500">
              Découvrez la typologie d'un exercice DuoStudy en direct sans installer d'application ni valider de compte !
            </p>
          </div>

          {/* Interactive Quiz Frame Widget */}
          <div className="bg-slate-50 border-2 border-[#E5E5E5] rounded-[32px] p-6 sm:p-10 shadow-inner relative overflow-hidden">
            
            <div className="absolute top-4 right-4 text-[10px] font-black text-[#58cc02] bg-[#58cc02]/15 px-2.5 py-1 rounded-full uppercase tracking-wider select-none">
              Widget Démo DuoStudy ⭐
            </div>

            <div className="space-y-6">
              
              {/* Question */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none block">Question d'entraînement</span>
                <p className="text-md sm:text-lg font-extrabold text-[#1C1C1C] font-sans leading-snug">
                  {demoQuestion.question}
                </p>
              </div>

              {/* Options */}
              <div className="grid gap-3 pt-2">
                {demoQuestion.options.map((opt, idx) => {
                  let optStyle = "border-[#E5E5E5] bg-white hover:bg-slate-50 text-slate-700";
                  if (demoSelectedOption === idx) {
                    if (demoSubmitted) {
                      optStyle = idx === demoQuestion.correctIdx 
                        ? "border-[#58cc02] bg-[#58cc02]/15 text-[#388301]"
                        : "border-rose-400 bg-rose-50 text-rose-600";
                    } else {
                      optStyle = "border-[#1cb5ff] bg-sky-50 text-[#1079ab]";
                    }
                  } else if (demoSubmitted && idx === demoQuestion.correctIdx) {
                    optStyle = "border-[#58cc02] bg-[#58cc02]/15 text-[#388301]";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={demoSubmitted}
                      onClick={() => handleDemoOptionClick(idx)}
                      className={`w-full text-left px-5 py-4 border-2 border-b-4 rounded-2xl font-bold text-xs transition-all cursor-pointer ${optStyle} ${demoSubmitted ? "" : "active:translate-y-0.5 active:border-b-2"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-lg border-2 border-gray-200 flex items-center justify-center font-black text-[9px] uppercase shrink-0 bg-slate-50 text-slate-600 select-none">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Interactive evaluation footer */}
              {demoSubmitted ? (
                <div className={`rounded-2xl p-4 border flex items-start gap-4 ${demoScore > 0 ? "bg-emerald-50 border-emerald-200 text-[#388301]" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
                  <span className="text-2xl shrink-0">{demoScore > 0 ? "🎉" : "💡"}</span>
                  <div className="text-xs leading-relaxed space-y-1 font-semibold">
                    <p className="font-extrabold text-[13px] uppercase tracking-wide">
                      {demoScore > 0 ? "Excellent !" : "Oups ! La réponse correcte était l'option B"}
                    </p>
                    <p className="font-medium text-gray-500">{demoQuestion.explanation}</p>
                    <button 
                      onClick={demoScore > 0 ? onNavigateToLearn : handleDemoReset}
                      className={`mt-3 px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all select-none cursor-pointer ${demoScore > 0 ? "bg-[#58cc02] text-white outline-none btn-3d-green border-b-2" : "bg-white border-2 border-gray-200 hover:bg-slate-50 text-slate-700 active:translate-y-0.5"}`}
                    >
                      {demoScore > 0 ? "Continuer la révision réelle !" : "Réessayer la question"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleDemoSubmit}
                    disabled={demoSelectedOption === null}
                    className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all select-none cursor-pointer ${demoSelectedOption === null ? "bg-gray-200 text-gray-400 border-b-4 border-gray-300 disabled:opacity-50" : "bg-[#58cc02] border-b-4 border-[#357a01] hover:brightness-105 active:translate-y-0.5 active:border-b-0 text-white shadow-sm"}`}
                  >
                    Vérifier la réponse
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* 6. FAQ SECTION ACCORDIONS */}
      <section id="faq" className="py-20 md:py-28 bg-[#FDFDFD] border-b-2 border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-black text-[#58cc02] tracking-widest uppercase">FAQ rapide</span>
            <h2 className="text-3xl font-black font-display text-[#1C1C1C] tracking-tight leading-none sm:text-4xl">
              Foire Aux Questions
            </h2>
            <p className="text-sm font-medium text-gray-500">
              Des réponses claires pour vous guider sereinement vers la réussite académique.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white border-2 border-[#E5E5E5] rounded-2xl overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-extrabold text-[#1C1C1C] text-xs uppercase tracking-wide cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-all ${isOpen ? "rotate-180 text-[#58cc02]" : ""}`} />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 text-xs text-gray-500 leading-relaxed font-semibold border-t border-gray-50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 7. CTA BANNER FOOTER */}
      <section className="py-16 md:py-24 bg-gradient-to-t from-emerald-50/25 to-transparent relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#58cc02] rounded-full border-b-4 border-[#398402] text-white text-2xl font-black select-none">
            🎓
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black font-display text-[#1C1C1C] tracking-tight leading-none">
              Prêt à pulvériser vos scores d'examens ?
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 leading-relaxed">
              Rejoignez les étudiants qui révisent intelligemment grâce aux neurosciences. Importez vos cours et commencez à apprendre d'affilée en luttant contre la courbe de l'oubli.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onNavigateToLearn}
              className="px-8 py-4 bg-[#58cc02] border-b-4 border-[#357a01] hover:brightness-105 active:translate-y-0.5 active:border-b-0 text-white font-black text-xs rounded-2xl uppercase tracking-widest transition-all cursor-pointer select-none shadow-md hover:shadow-lg inline-flex items-center gap-2"
            >
              <span>Accéder gratuitement</span>
              <ArrowRight className="w-4 h-4 tracking-normal" />
            </button>
          </div>

        </div>
      </section>

      {/* 8. MINI FOOTER */}
      <footer className="border-t-2 border-[#E5E5E5] bg-white py-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 DuoStudy Inc. Tous droits réservés.</span>
          <span>Fait pour encourager la persévérance étudiante 💡</span>
        </div>
      </footer>

    </div>
  );
}
