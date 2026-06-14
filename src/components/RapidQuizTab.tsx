import React, { useState } from "react";
import { Course, Question } from "../types";
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, Heart, Trophy, RefreshCw, Star } from "lucide-react";

interface RapidQuizTabProps {
  activeCourse: Course;
  onReward: (xp: number, gems: number) => void;
  hearts: number;
  onDeductHeart: () => void;
}

export default function RapidQuizTab({ activeCourse, onReward, hearts, onDeductHeart }: RapidQuizTabProps) {
  // Aggregate all questions across all units of the current course
  const allQuestions: { questionData: Question; lessonTitle: string }[] = [];
  activeCourse.units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.questions.forEach((q) => {
        allQuestions.push({ questionData: q, lessonTitle: lesson.title });
      });
    });
  });

  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Restart quiz wrapper
  const handleStart = () => {
    if (allQuestions.length === 0) return;
    setStarted(true);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  const currentItem = allQuestions[currentIdx];

  const handleSelectOption = (option: string) => {
    if (answered) return;
    setSelectedAnswer(option);
  };

  const handleValidate = () => {
    if (!selectedAnswer || !currentItem) return;
    const correct = selectedAnswer === currentItem.questionData.answer;
    setIsCorrect(correct);
    setAnswered(true);
    if (correct) {
      setScore((prev) => prev + 1);
    } else {
      onDeductHeart();
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < allQuestions.length && hearts > 0) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      // Finished!
      setQuizFinished(true);
      // Reward dynamic XP (10 per correct answer, 2 gems)
      const earnedXp = score * 10;
      const earnedGems = score * 2;
      onReward(earnedXp, earnedGems);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4">
      {/* Quiz Visual Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 bg-amber-100 text-amber-500 rounded-2xl border border-amber-200 shadow-sm">
          <Trophy className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-black font-display text-[#4B4B4B]">Quiz Rapide d'{activeCourse.courseName}</h2>
          <p className="text-xs text-gray-500 font-medium">
            Entraînez-vous instantanément sur toutes les notions de ce cours pour accumuler des récompenses !
          </p>
        </div>
      </div>

      {allQuestions.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-[#E5E5E5] p-8 text-center">
          <p className="text-sm font-bold text-gray-500">Aucune question n'est configurée dans ce cours pour l'instant.</p>
        </div>
      ) : !started ? (
        <div className="bg-white rounded-3xl border-2 border-[#E5E5E5] p-8 md:p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">⏱️</div>
          <h3 className="text-lg font-black font-display text-[#4B4B4B]">Prêt(e) pour le Défi ?</h3>
          <p className="text-xs text-gray-500 font-medium mt-2 max-w-md mx-auto leading-relaxed">
            Répondez correctement à notre série de <strong>{allQuestions.length} questions</strong> d'évaluation rapide. 
            Chaque bonne réponse vous octroie <strong>+10 XP</strong> et de précieuses ressources d'apprentissage !
          </p>

          <div className="mt-6 flex justify-center gap-6 text-xs text-gray-400 font-bold bg-slate-50 p-3 rounded-2xl max-w-sm mx-auto border border-gray-100">
            <span>❤️ Vies : {hearts} / 5</span>
            <span>⚡ Niveau Actuel : Niv.1</span>
          </div>

          <button
            onClick={handleStart}
            disabled={hearts <= 0}
            className="mt-8 px-8 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black text-sm uppercase rounded-2xl tracking-widest border-b-4 border-amber-700 active:translate-y-0.5 active:border-b-0 cursor-pointer shadow-sm"
          >
            {hearts <= 0 ? "Rechargez vos vies d'abord !" : "LANCER LE QUIZ RAPIDE ! 🚀"}
          </button>
        </div>
      ) : quizFinished ? (
        <div className="bg-white rounded-3xl border-2 border-[#E5E5E5] p-8 md:p-12 text-center shadow-sm animate-fade-in">
          <span className="text-6xl">🎓</span>
          <h3 className="text-xl font-black text-[#4B4B4B] font-display mt-4">Quiz Complété !</h3>
          <p className="text-xs font-bold text-emerald-500 uppercase mt-2">
            Résultats : {score} / {allQuestions.length} Corrects !
          </p>

          {/* XP & Gems rewards widget */}
          <div className="mt-8 bg-[#DDF4FF]/60 border border-[#84D8FF]/30 p-5 rounded-3xl max-w-sm mx-auto flex items-center justify-around">
            <div className="text-center">
              <div className="text-xl font-semibold">✨ +{score * 10} XP</div>
              <p className="text-[9px] text-gray-400 font-bold">EXPÉRENCE REÇUE</p>
            </div>
            <div className="w-1.5 h-10 bg-[#84D8FF]/30 rounded-full"></div>
            <div className="text-center">
              <div className="text-xl font-semibold text-rose-500">💎 +{score * 2} Gemmes</div>
              <p className="text-[9px] text-gray-400 font-bold">RÉCOMPENSÉ</p>
            </div>
          </div>

          <button
            onClick={() => setStarted(false)}
            className="mt-10 px-8 py-3 bg-[#58cc02] text-white border-b-4 border-[#388301] hover:brightness-110 font-black text-xs uppercase tracking-widest rounded-2xl active:translate-y-0.5 cursor-pointer shadow-sm"
          >
            Fermer l'arène
          </button>
        </div>
      ) : hearts <= 0 ? (
        <div className="bg-white rounded-3xl border-2 border-red-200 p-8 text-center">
          <span className="text-5xl">💔</span>
          <h3 className="text-lg font-black text-red-600 font-display mt-3">Plus de vies restantes !</h3>
          <p className="text-xs text-gray-500 mt-2">Le quiz a été interrompu car vous n'avez plus de cœurs d'études.</p>
          <button
            onClick={() => setStarted(false)}
            className="mt-6 px-6 py-2.5 bg-[#1CB0F6] text-white rounded-2xl font-black text-xs uppercase tracking-wide cursor-pointer border-b-2 border-blue-700"
          >
            Retourner au menu
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-[#E5E5E5] p-6 shadow-sm animate-fade-in text-[#4B4B4B]">
          {/* Question Progression */}
          <div className="flex items-center justify-between border-b-2 border-gray-100 pb-3 mb-5 text-xs text-gray-400 font-bold">
            <span>Question {currentIdx + 1} sur {allQuestions.length}</span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-500 fill-red-500 shrink-0" />
              {hearts} vies
            </span>
          </div>

          {/* Question Text */}
          <p className="text-xs text-gray-400 uppercase tracking-widest font-black leading-none mb-1">
            Section : {currentItem.lessonTitle}
          </p>
          <h3 className="text-base font-black text-slate-800 leading-snug">
            {currentItem.questionData.question}
          </h3>

          {/* Options List */}
          <div className="mt-6 space-y-2.5">
            {currentItem.questionData.type === "true_false" ? (
              ["Vrai", "Faux"].map((opt) => {
                const isSelected = selectedAnswer === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all font-bold text-xs cursor-pointer ${
                      isSelected 
                        ? "border-[#1CB0F6] bg-[#DDF4FF] text-[#1cb5ff]" 
                        : "border-gray-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })
            ) : currentItem.questionData.type === "choice" && currentItem.questionData.options ? (
              currentItem.questionData.options.map((opt) => {
                const isSelected = selectedAnswer === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all font-bold text-xs cursor-pointer ${
                      isSelected 
                        ? "border-[#1CB0F6] bg-[#DDF4FF] text-[#1cb5ff]" 
                        : "border-gray-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })
            ) : (
              // Simple text input for Fill questions inside the quiz
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Tapez votre réponse ici..."
                  value={selectedAnswer || ""}
                  onChange={(e) => handleSelectOption(e.target.value)}
                  disabled={answered}
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl text-xs focus:ring-2 focus:ring-[#1CB0F6] outline-none font-bold"
                />
              </div>
            )}
          </div>

          {/* Feedback Section */}
          {answered && (
            <div className={`mt-6 p-4 rounded-2xl flex items-start gap-2.5 border-2 ${
              isCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
            }`}>
              {isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-xs font-black uppercase">
                  {isCorrect ? "Excellent travail !" : "Incorrect.."}
                </h4>
                <p className="text-[11px] font-medium leading-relaxed mt-1">
                  {currentItem.questionData.explanation || `La réponse attendue était : ${currentItem.questionData.answer}`}
                </p>
              </div>
            </div>
          )}

          {/* Control Button Action */}
          <div className="mt-8 pt-4 border-t-2 border-gray-100 flex justify-end">
            {!answered ? (
              <button
                onClick={handleValidate}
                disabled={!selectedAnswer}
                className="px-6 py-2.5 bg-[#1CB0F6] border-b-2 border-blue-700 hover:brightness-110 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                VÉRIFIER
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-slate-800 border-b-2 border-slate-900 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <span>CONTINUER</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
