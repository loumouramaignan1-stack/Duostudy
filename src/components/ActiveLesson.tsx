import React, { useState } from "react";
import { Lesson, Question, SpacedRepetitionData } from "../types";
import { Heart, X, Check, ArrowRight, Sparkles, Smile, Frown, Award, RotateCcw, Brain, Calendar } from "lucide-react";
import { calculateSM2 } from "../data";
import { getQuestionId } from "../utils/pedagogy";
import AdInterstitial from "./AdInterstitial";

function cleanFrenchText(str: string): string {
  let s = str.toLowerCase().trim();
  s = s.replace(/[’'‛`‘’]/g, "'");
  s = s.replace(/^[ld]'\s*/i, "");
  s = s.replace(/\b(le|la|les|un|une|des|du|de)\b/gi, "");
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/[^a-z0-9\s]/gi, "");
  return s.replace(/\s+/g, " ").trim();
}

function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

interface ActiveLessonProps {
  lesson: Lesson;
  courseId: string;
  unitTitle: string;
  doubleXp: boolean;
  onComplete: (
    xpEarned: number, 
    gemsEarned: number, 
    srsUpdated: SpacedRepetitionData, 
    injectedRepairs?: Record<string, boolean>,
    questionFirstTryResults?: Record<string, { correct: boolean, question: Question }>
  ) => void;
  onCancel: () => void;
  hearts: number;
  onDeductHeart: () => void;
  sessionLength?: number;
}

export default function ActiveLesson({
  lesson,
  courseId,
  unitTitle,
  doubleXp,
  onComplete,
  onCancel,
  hearts,
  onDeductHeart,
  sessionLength = 10
}: ActiveLessonProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showCompletionAd, setShowCompletionAd] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [isFlipped, setIsFlipped] = useState(false); // For card flip / match matching
  const [isAnswered, setIsAnswered] = useState(false); // Whether user clicked "VERIFIER"
  const [isCorrect, setIsCorrect] = useState(false);
  const [lessonFinished, setLessonFinished] = useState(false);
  const [injectedReviewResults, setInjectedReviewResults] = useState<Record<string, boolean>>({});
  const [questionFirstTryResults, setQuestionFirstTryResults] = useState<Record<string, { correct: boolean, question: Question }>>({});
  const [shieldLeft, setShieldLeft] = useState<number>(() => {
    if (sessionLength === 10) return 1;
    if (sessionLength && sessionLength >= 15) return 2;
    return 0;
  });
  const [initialShields] = useState<number>(() => {
    if (sessionLength === 10) return 1;
    if (sessionLength && sessionLength >= 15) return 2;
    return 0;
  });
  const [shieldUsedThisTurn, setShieldUsedThisTurn] = useState(false);

  const xpMultiplier = sessionLength === 10 ? 1.25 : (sessionLength && sessionLength >= 15) ? 1.5 : 1.0;
  const baseLessonXp = Math.round(lesson.xp * xpMultiplier);
  const finalXpEarned = doubleXp ? baseLessonXp * 2 : baseLessonXp;

  // Keep track of statistics safely
  const [numCorrect, setNumCorrect] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>(() => [...(lesson.questions || [])]);
  const [totalQuestions] = useState((lesson.questions || []).length);

  const currentQuestion: Question | undefined = activeQuestions[currentIdx];

  // Handle choice select
  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  // Perform answer verification on click "VERIFIER"
  const handleCheckAnswer = () => {
    if (isAnswered || !currentQuestion) return;

    let correct = false;
    const cleanAnswer = String(currentQuestion.answer || "").trim().toLowerCase();

    if (currentQuestion.type === "choice" || currentQuestion.type === "true_false") {
      correct = String(selectedOption || "").trim().toLowerCase() === cleanAnswer;
    } else if (currentQuestion.type === "fill") {
      const uAns = cleanFrenchText(textAnswer || "");
      const cAns = cleanFrenchText(currentQuestion.answer || "");
      correct = uAns === cAns || getLevenshteinDistance(uAns, cAns) <= 1;
    } else if (currentQuestion.type === "match") {
      // In digital flashcards, they review the definition and self-evaluate or match.
      // We count it as correct by default for matching if they flipped and clicked 'I know it'.
      correct = true;
    }

    setIsCorrect(correct);
    setIsAnswered(true);

    const qId = getQuestionId(currentQuestion);
    setQuestionFirstTryResults((prev) => {
      if (prev[qId]) return prev;
      return {
        ...prev,
        [qId]: { correct, question: currentQuestion }
      };
    });

    if (currentQuestion.isInjectedReview && currentQuestion.originalLessonId) {
      setInjectedReviewResults((prev) => ({
        ...prev,
        [currentQuestion.originalLessonId!]: correct
      }));
    }

    if (correct) {
      setNumCorrect((prev) => prev + 1);
      setShieldUsedThisTurn(false);
    } else {
      if (shieldLeft > 0) {
        setShieldLeft((prev) => prev - 1);
        setShieldUsedThisTurn(true);
      } else {
        onDeductHeart(); // Deduct 1 heart
        setShieldUsedThisTurn(false);
      }
    }
  };

  // Move to next question or terminate lesson
  const handleContinue = () => {
    setIsAnswered(false);
    setSelectedOption(null);
    setTextAnswer("");
    setIsFlipped(false);
    setShieldUsedThisTurn(false);

    // If hearts run out, terminate with failure
    if (hearts <= 1 && !isCorrect && !shieldUsedThisTurn) {
      // This was the last heart and it's incorrect
      setLessonFinished(true);
      return;
    }

    // Determine the next dynamic questions array
    let nextQuestions = activeQuestions;
    if (!isCorrect && currentQuestion) {
      nextQuestions = [...activeQuestions, currentQuestion];
      setActiveQuestions(nextQuestions);
    }

    if (currentIdx + 1 < nextQuestions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // All questions completed!
      setLessonFinished(true);
    }
  };

  // Calculate Spaced Repetition interval on success
  const handleFinishLesson = () => {
    const firstTryCorrect = Object.keys(questionFirstTryResults).length > 0
      ? Object.values(questionFirstTryResults).filter((r: any) => r.correct).length
      : numCorrect;
    const rawQuality = firstTryCorrect === totalQuestions ? 5 : firstTryCorrect >= totalQuestions * 0.7 ? 4 : firstTryCorrect >= totalQuestions * 0.5 ? 3 : 1;
    
    // Calculate new spacing values using actual SM-2 formula
    const sm2Result = calculateSM2(
      rawQuality,
      1, // default prevInterval
      0, // default prevReps
      2.5 // default prevEaseFactor
    );

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + sm2Result.interval);

    const srsPayload: SpacedRepetitionData = {
      lessonId: lesson.id,
      courseId: courseId,
      interval: sm2Result.interval,
      reps: sm2Result.reps,
      easeFactor: sm2Result.easeFactor,
      nextReviewDate: nextDate.toISOString()
    };

    const xpEarned = finalXpEarned;
    const gemsEarned = 15; // base lesson prize

    onComplete(xpEarned, gemsEarned, srsPayload, injectedReviewResults, questionFirstTryResults);
  };

  // Progress Bar scale percentage
  const progressPercent = Math.min(100, Math.round((currentIdx / Math.max(1, totalQuestions)) * 100));

  // Format date helper
  const formatDateFrench = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  };

  // Abort check
  const handleCloseClick = () => {
    onCancel();
  };

  // Victory/Defeat screen
  if (lessonFinished) {
    const isWin = hearts > 0;
    const firstTryCorrect = Object.keys(questionFirstTryResults).length > 0
      ? Object.values(questionFirstTryResults).filter((to: any) => to.correct).length
      : numCorrect;
    const finalQuality = firstTryCorrect === totalQuestions ? 5 : firstTryCorrect >= totalQuestions * 0.7 ? 4 : firstTryCorrect >= totalQuestions * 0.5 ? 3 : 1;
    const sm2Result = calculateSM2(finalQuality, 1, 0, 2.5);

    return (
      <div className="fixed inset-0 z-50 bg-[#FDFDFD] text-[#4B4B4B] overflow-y-auto p-6">
        {/* Confetti Decorative Icons */}
        <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-wrap justify-around items-center h-full select-none text-4xl">
          <div>🎓</div><div>🎉</div><div>🦉</div><div>⚡</div><div>🔮</div><div>🔬</div><div>📖</div>
        </div>

        <div className="relative z-10 min-h-full flex flex-col justify-between items-center max-w-md w-full mx-auto text-center py-4">
          {isWin ? (
            <>
              {/* Massive Gold Crown Award visual */}
              <div className="w-24 h-24 bg-[#ffc800] rounded-full border-b-6 border-[#e69900] flex items-center justify-center text-4xl shadow-lg mb-6 animate-bounce">
                👑
              </div>
              <span className="text-xs font-black uppercase text-[#58cc02] tracking-widest font-display">
                Félicitations !
              </span>
              <h2 className="text-3xl font-black font-display mt-1 text-[#4B4B4B]">Leçon Terminée !</h2>
              <p className="text-sm text-gray-500 font-medium mt-2">
                Vous avez consolidé de nouvelles connexions neuronales.
              </p>

              {/* Stats Badges */}
              <div className="grid grid-cols-2 gap-4 w-full mt-8">
                <div className="bg-white p-4 rounded-2xl border-2 border-[#E5E5E5] text-center shadow-sm relative overflow-hidden">
                  {xpMultiplier > 1 && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white font-black text-[7px] uppercase px-1.5 py-0.5 rounded-bl-lg tracking-wider animate-pulse">
                      +{Math.round((xpMultiplier - 1) * 100)}% Boost xp
                    </div>
                  )}
                  <div className="text-2xl font-black text-amber-500 font-display flex items-center justify-center gap-1">
                    +{finalXpEarned} <span className="text-sm">XP</span>
                  </div>
                  <div className="text-[10px] uppercase font-black text-gray-400 mt-1">XP Gagnés</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border-2 border-[#E5E5E5] text-center shadow-sm">
                  <div className="text-2xl font-black text-[#1CB0F6] font-display flex items-center justify-center gap-1">
                    +15 <span className="text-sm">💎</span>
                  </div>
                  <div className="text-[10px] uppercase font-black text-gray-400 mt-1">Gemmes Cadeau</div>
                </div>
              </div>

              {/* Accuracy rating */}
              <div className="w-full bg-white p-4 rounded-2xl border-2 border-[#E5E5E5] shadow-sm mt-4 flex items-center gap-4 text-left">
                <Award className="w-8 h-8 text-yellow-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-gray-400">Précision des réponses (premier essai)</div>
                  <div className="text-sm font-black text-[#4B4B4B]">
                    {firstTryCorrect} correctes sur {totalQuestions} questions ({Math.round((firstTryCorrect / Math.max(1, totalQuestions)) * 100)}%)
                  </div>
                </div>
              </div>

              {/* Spaced Repetition Schedule Report card */}
              <div className="w-full bg-violet-50 border-2 border-violet-100 p-4 rounded-2xl mt-4 text-left flex gap-3.5">
                <Brain className="w-8 h-8 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black text-violet-900 uppercase tracking-wide">Planification SRS active</div>
                  <div className="text-xs text-violet-800 font-medium mt-1">
                    L'algorithme de répétition espacée <strong>SM-2</strong> estime que vous devez réviser ce module dans :
                  </div>
                  <div className="mt-2 flex items-center gap-2 bg-violet-100 p-2 rounded-lg border border-violet-200">
                    <Calendar className="w-4 h-4 text-violet-600" />
                    <span className="text-xs font-black text-violet-900">
                      {sm2Result.interval} jour(s) — le {formatDateFrench(new Date(Date.now() + sm2Result.interval * 86400000).toISOString())}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowCompletionAd(true)}
                className="w-full mt-8 py-3 bg-[#58cc02] border-b-4 border-[#46a302] hover:bg-[#61df02] select-none text-white text-sm font-black rounded-2xl uppercase tracking-widest active:translate-y-1 active:border-b-0 cursor-pointer shadow-md animate-pulse"
              >
                SAUVEGARDER ET CONTINUER
              </button>
            </>
          ) : (
            <>
              {/* Lost heart screen */}
              <div className="w-24 h-24 bg-rose-600 rounded-full border-b-6 border-rose-800 flex items-center justify-center text-4xl shadow-lg mb-6 animate-pulse">
                💔
              </div>
              <span className="text-xs font-black uppercase text-rose-500 tracking-widest font-display">
                Oups !
              </span>
              <h2 className="text-3xl font-black font-display mt-1 text-[#4B4B4B]">Plus de vies !</h2>
              <p className="text-sm text-gray-500 font-medium mt-2">
                Vous avez fait trop de fautes durant cette révision. Ne baissez pas les bras, rechargez vos vies dans l'onglet Boutique ou réessayez !
              </p>

              <div className="flex gap-4 w-full mt-6">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 bg-[#1CB0F6] border-b-4 border-[#127fae] hover:bg-[#20a3e1] text-white text-xs font-black rounded-xl uppercase select-none cursor-pointer"
                >
                  RETOURNER
                </button>
              </div>
            </>
          )}
        </div>

        <AdInterstitial 
          isOpen={showCompletionAd} 
          onClose={() => {
            setShowCompletionAd(false);
            handleFinishLesson();
          }} 
          triggerContext="completion" 
          title="Félicitations pour votre session !" 
        />
      </div>
    );
  }

  // Guard if there is no current question
  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FDFDFD] text-[#4B4B4B] flex flex-col justify-center items-center p-6">
        <div className="text-center p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl max-w-md w-full shadow-md">
          <span className="text-4xl">⚠️</span>
          <h3 className="text-lg font-black text-rose-700 mt-3 font-display">Leçon indisponible</h3>
          <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">
            Cette leçon ne contient aucune question ou est mal configurée. Veuillez essayer une autre leçon ou régénérer le cours.
          </p>
          <button 
            onClick={onCancel} 
            className="mt-6 w-full py-3 bg-[#1CB0F6] border-b-4 border-[#1079ab] hover:brightness-110 text-white text-xs font-black rounded-2xl uppercase tracking-widest cursor-pointer shadow-sm"
          >
            Retourner au parcours
          </button>
        </div>
      </div>
    );
  }

  // Determine active check button validity
  const isCheckDisabled = 
    (currentQuestion.type === "choice" && !selectedOption) ||
    (currentQuestion.type === "true_false" && !selectedOption) ||
    (currentQuestion.type === "fill" && !textAnswer.trim()) ||
    (currentQuestion.type === "match" && !isFlipped);

  return (
    <div className="fixed inset-0 z-50 bg-[#FDFDFD] text-[#4B4B4B] overflow-y-auto">
      <div className="min-h-full flex flex-col justify-between">
      
        {/* Top Header Menu Bar */}
        <div className="max-w-4xl w-full mx-auto p-4 flex items-center justify-between gap-6">
          {/* Cancel Icon Button */}
          <button 
            onClick={handleCloseClick}
            className="text-gray-400 hover:text-[#4B4B4B] transition cursor-pointer select-none"
          >
            <X className="w-6 h-6" />
          </button>
  
          {/* Progress Bar Container */}
          <div className="flex-1 bg-[#E5E5E5] h-4 rounded-full overflow-hidden">
            <div 
              className="bg-[#58cc02] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
  
          {/* Health Hearts & Shields Counters */}
          <div className="flex items-center gap-4">
            {initialShields > 0 && (
              <div 
                title={`Bouclier d'erreur actif : ${shieldLeft} sur ${initialShields} restants`}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 transition-all duration-300 ${
                  shieldLeft > 0 
                    ? "bg-amber-50 border-amber-300 text-amber-600 font-black animate-pulse" 
                    : "bg-slate-50 border-slate-200 text-slate-400 opacity-60 font-black"
                }`}
              >
                <span className="text-base select-none">🛡️</span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold hidden sm:inline">Bouclier:</span>
                <span className="text-xs font-black">{shieldLeft} / {initialShields}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 font-bold text-rose-500">
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
              <span className="text-lg font-black">{hearts}</span>
            </div>
          </div>
        </div>
  
        {/* Main Core Questionnaire Stage Card */}
        <main className="flex-1 flex flex-col justify-center items-center max-w-2xl w-full mx-auto px-6 py-4">
          {/* Small theme guide banner */}
          <div className="mb-4 text-center">
            {currentQuestion.isInjectedReview ? (
              <span className="bg-[#DDF4FF] text-[#1CB0F6] text-[10px] font-black uppercase px-3.5 py-1.5 rounded-full border-2 border-slate-200 inline-block max-w-full text-center break-words whitespace-normal">
                RAPPEL DE NOTION &bull; {currentQuestion.originalCourseName || "Révision"}
              </span>
            ) : (
              <span className="bg-[#DDF4FF] text-[#1CB0F6] text-[10px] font-black uppercase px-4 py-1.5 rounded-full border-2 border-slate-200 inline-block max-w-full text-center break-words whitespace-normal">
                {unitTitle} &bull; {lesson.title}
              </span>
            )}
          </div>
  
          {/* Question Title Header Speech */}
          <div className="text-center w-full mb-8">
            <h1 className="text-xl md:text-2xl font-black font-display text-[#4B4B4B] max-w-xl mx-auto leading-snug">
              {currentQuestion.question}
            </h1>
          </div>
  
          {/* MULTIPLE CHOICE / TRUE FALSE RENDER */}
          {(currentQuestion.type === "choice" || currentQuestion.type === "true_false") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {(() => {
                let opts = [...(currentQuestion.options || [])];
                if (opts.length <= 1) {
                  if (currentQuestion.type === "true_false") {
                    opts = ["Vrai", "Faux"];
                  } else {
                    const ans = currentQuestion.answer || "";
                    let alt = "Autre possibilité d'étude";
                    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(ans)) {
                      alt = "15/02/2026";
                    } else if (/^\d+(\.\d+)?%?$/.test(ans)) {
                      alt = "50%";
                    } else if (ans.length > 0) {
                      alt = `Alternative à : ${ans.substring(0, 15)}...`;
                    }
                    opts = [ans, alt];
                  }
                }
                return opts.map((option, oIdx) => {
                  const isSelected = selectedOption === option;
                  const alphabeticTrigger = String.fromCharCode(65 + oIdx); // A, B, C, D...
    
                  return (
                    <button
                      key={option}
                      onClick={() => handleSelectOption(option)}
                      disabled={isAnswered}
                      className={`w-full p-4 rounded-2xl border-2 text-sm font-extrabold text-left transition-all relative flex items-center justify-between cursor-pointer select-none ${
                        isAnswered
                          ? isSelected
                            ? isCorrect
                              ? "bg-emerald-100/70 border-emerald-500 text-emerald-800"
                              : "bg-rose-100/70 border-rose-500 text-rose-800"
                            : String(option || "").trim().toLowerCase() === String(currentQuestion.answer || "").trim().toLowerCase()
                              ? "bg-emerald-50/50 border-emerald-500/50 text-emerald-600"
                              : "bg-transparent border-[#E5E5E5] text-gray-400"
                          : isSelected
                            ? "bg-[#DDF4FF] border-[#84D8FF] text-[#1CB0F6] translate-y-[2px]"
                            : "bg-white border-2 border-[#E5E5E5] hover:bg-slate-50 text-[#4B4B4B]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 border-2 border-[#E5E5E5] text-gray-500 flex items-center justify-center text-[10px] font-black shrink-0">
                          {alphabeticTrigger}
                        </span>
                        <span>{option}</span>
                      </div>
    
                      {/* Icon details in checked state */}
                      {isAnswered && (isSelected ? (
                        isCorrect ? <Check className="w-5 h-5 text-emerald-500" /> : <X className="w-5 h-5 text-rose-500" />
                      ) : String(option || "").trim().toLowerCase() === String(currentQuestion.answer || "").trim().toLowerCase() ? (
                        <Check className="w-5 h-5 text-emerald-500/50" />
                      ) : null)}
                    </button>
                  );
                });
              })()}
            </div>
          )}
  
          {/* INPUT STRING COMBLER LE BLANC */}
          {currentQuestion.type === "fill" && (
            <div className="w-full flex flex-col items-center gap-4">
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={isAnswered}
                placeholder="Écrivez votre réponse en français..."
                className="max-w-md w-full bg-slate-50 border-2 border-[#E5E5E5] text-[#4B4B4B] p-4 rounded-2xl font-bold text-center focus:border-[#1CB0F6] focus:bg-white focus:outline-none transition-all placeholder:text-gray-400"
              />
              {!isAnswered && (
                <p className="text-[10px] text-gray-500 mt-1 max-w-sm text-center font-bold">
                  Conseil : veillez à l'orthographe exacte et évitez les ponctuations superflues.
                </p>
              )}
            </div>
          )}
  
          {/* MEMO MATCH FLASHCARD FLIPPABLE CARD */}
          {currentQuestion.type === "match" && (
            <div className="flex flex-col items-center gap-6">
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className={`w-80 h-48 cursor-pointer relative perspective transition-all duration-500 rounded-3xl select-none`}
              >
                <div className={`absolute inset-0 bg-white rounded-3xl border-2 p-6 flex flex-col justify-between transition-all duration-300 shadow-md ${
                  isFlipped ? "border-violet-500 shadow-sm ring-4 ring-violet-50" : "border-[#E5E5E5]"
                }`}>
                  {/* Upper badge */}
                  <div className="flex justify-between items-center text-xs font-black text-gray-500">
                    <span className="flex items-center gap-1 text-violet-600">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      FLASHCARD
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">{isFlipped ? "DÉFINITION 💡" : "TERME Clé 🔍"}</span>
                  </div>
  
                  {/* Core body */}
                  <div className="my-auto text-center">
                    <p className="font-extrabold text-[#4B4B4B] text-base md:text-lg">
                      {isFlipped ? currentQuestion.answer : currentQuestion.question}
                    </p>
                    {currentQuestion.options && currentQuestion.options.length > 0 && !isFlipped && (
                      <p className="text-xs text-[#1CB0F6] font-[#AFAFAF] mt-2">
                        Contexte : {currentQuestion.options[0]}
                      </p>
                    )}
                  </div>
  
                  {/* Flip instructions */}
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {isFlipped ? "Cliquez de nouveau pour afficher le terme" : "Cliquez sur la carte pour révéler la définition"}
                    </span>
                  </div>
                </div>
              </div>
  
              {isFlipped && !isAnswered && (
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => {
                      setSelectedOption(""); // Wrong answer
                      setIsCorrect(false);
                      setIsAnswered(true);
                      onDeductHeart(); // Deduct 1 heart
                      if (currentQuestion.isInjectedReview && currentQuestion.originalLessonId) {
                        setInjectedReviewResults((prev) => ({
                          ...prev,
                          [currentQuestion.originalLessonId!]: false
                        }));
                      }
                    }}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 active:translate-y-0.5 text-white text-xs font-black rounded-xl border-b-4 border-rose-800 uppercase tracking-wider select-none cursor-pointer"
                  >
                    J'avais oublié ❌
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOption(currentQuestion.answer); // Right answer
                      setIsCorrect(true);
                      setIsAnswered(true);
                      setNumCorrect((prev) => prev + 1);
                      if (currentQuestion.isInjectedReview && currentQuestion.originalLessonId) {
                        setInjectedReviewResults((prev) => ({
                          ...prev,
                          [currentQuestion.originalLessonId!]: true
                        }));
                      }
                    }}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:translate-y-0.5 text-white text-xs font-black rounded-xl border-b-4 border-emerald-800 uppercase tracking-wider select-none cursor-pointer animate-pulse"
                  >
                    Je m'en souviens ! ✅
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
  
        {/* FOOTER NOTIFY BANNER SLIDING ELEMENT */}
        <footer className={`p-6 border-t-2 ${
          isAnswered
            ? isCorrect
              ? "bg-[#d7ffb9] border-[#a3e660] text-gray-900"
              : "bg-rose-100 border-rose-300 text-gray-900"
            : "bg-white border-[#E5E5E5]"
        }`}>
          <div className="max-w-2xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Output feedback message */}
            {isAnswered ? (
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white ${
                  isCorrect ? "bg-[#58cc02]" : "bg-rose-500"
                }`}>
                  {isCorrect ? <Smile className="w-7 h-7" /> : <Frown className="w-7 h-7" />}
                </div>
                <div>
                  <h4 className={`text-base font-black ${
                    isCorrect ? "text-[#46a302]" : "text-rose-700"
                  }`}>
                    {isCorrect ? "Excellent travail ! ✨" : "Aïe, ce n'est pas tout à fait ça..."}
                  </h4>
                  
                  {/* Incorrect detailed correct answer explanation */}
                  {!isCorrect && (
                    <div className="text-xs text-rose-900 mt-0.5 font-semibold">
                      {shieldUsedThisTurn && (
                        <div className="bg-amber-500/10 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-300/30 text-[10px] inline-flex items-center gap-1 font-black uppercase mb-1.5 select-none animate-bounce">
                          🛡️ Bouclier actif : Erreur Absorbée ! Aucun cœur perdu !
                        </div>
                      )}
                      <div>
                        La bonne réponse était : <strong className="font-extrabold">{currentQuestion.answer}</strong>
                      </div>
                    </div>
                  )}
  
                  {/* Additional AI explanation content block */}
                  {currentQuestion.explanation && (
                    <p className="text-[11px] text-gray-700 mt-1 max-w-md italic leading-tight font-medium">
                      💡 {currentQuestion.explanation}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 font-bold text-left max-w-sm hidden md:block select-none leading-tight py-1.5">
                💡 Sélectionnez l'une des définitions ci-dessus ou répondez précisément pour valider votre progression d'apprentissage.
              </div>
            )}
  
            {/* Action buttons */}
            {isAnswered ? (
              <button
                onClick={handleContinue}
                className={`px-8 py-3.5 select-none font-black text-sm tracking-wider uppercase rounded-2xl w-full md:w-auto text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                  isCorrect 
                    ? "bg-[#58cc02] border-b-4 border-[#388301] hover:bg-[#61df02]" 
                    : "bg-rose-600 border-b-4 border-rose-800 hover:bg-rose-500"
                }`}
              >
                Continuer
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            ) : (
              <button
                disabled={isCheckDisabled}
                onClick={handleCheckAnswer}
                className={`px-8 py-3.5 select-none font-black text-sm tracking-wider uppercase rounded-2xl w-full md:w-auto text-white flex items-center justify-center cursor-pointer transition-colors ${
                  isCheckDisabled
                    ? "bg-[#E5E5E5] text-gray-400 cursor-not-allowed border-none shadow-none"
                    : "bg-[#58cc02] border-b-4 border-[#46a302] hover:bg-[#61df02]"
                }`}
              >
                Vérifier
              </button>
            )}
  
          </div>
        </footer>
      </div>
    </div>
  );
}
