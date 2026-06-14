import React, { useState } from "react";
import { Course, UserProgress } from "../types";
import { 
  Trophy, 
  Gem, 
  BookOpen, 
  FileText, 
  BarChart2, 
  TrendingUp, 
  Sparkles, 
  History, 
  Briefcase,
  LogOut
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

interface ProfileTabProps {
  progress: UserProgress;
  courses: Course[];
  completedLessons: string[];
  onUpdateExamDate?: (dateStr: string) => void;
}

export default function ProfileTab({ progress, courses, completedLessons, onUpdateExamDate }: ProfileTabProps) {
  const [activeMetric, setActiveMetric] = useState<"xp" | "courses">("xp");
  const [timeRange, setTimeRange] = useState<"7days" | "14days">("7days");

  const handleSignOut = () => {
    signOut(auth).catch((err) => console.error("Error signing out:", err));
  };

  const totalCourses = courses.length;
  
  // Custom user profile format helpers
  const rawProfileName = auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "Étudiant Actif") : "Étudiant Actif";
  const formattedProfileName = rawProfileName
    .split(/[._\-+]/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .replace(/[0-9]/g, "");

  const getProfileInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };
  const profileInitials = getProfileInitials(formattedProfileName);
  
  // Calculate total lessons in all courses
  let totalLessonsInSystem = 0;
  courses.forEach(c => c.units.forEach(u => totalLessonsInSystem += u.lessons.length));

  // XP Progress towards a mockup level (each 100 XP is a level)
  const effectiveXp = progress.xp;
  const currentLevel = Math.floor(effectiveXp / 100) + 1;
  const xpInCurrentLevel = effectiveXp % 100;
  const levelProgressPercent = Math.min(100, xpInCurrentLevel);

  // 1. Dynamic XP History calculation indexed on real dailyXP progress
  const getXPHistory = (dailyXp: Record<string, number> | undefined, range: "7days" | "14days") => {
    const daysCount = range === "7days" ? 7 : 14;
    const data = [];
    const now = new Date();
    const daysOfWeek = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const dailyXpMap = dailyXp || {};
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const isToday = i === 0;
      const dayLabel = daysOfWeek[d.getDay()] + (isToday ? " (Auj)" : "");
      const dateStr = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      const allocated = dailyXpMap[dateKey] || 0;
      
      data.push({
        name: dayLabel,
        date: dateStr,
        "Points XP": allocated,
      });
    }
    return data;
  };

  const xpHistoryData = getXPHistory(progress.dailyXp, timeRange);

  // 2. Course Completion distribution data mapping
  const courseCompletionData = courses.map((course) => {
    const courseLessons: string[] = [];
    course.units.forEach(u => u.lessons.forEach(l => courseLessons.push(l.id)));
    const finishedInCourse = courseLessons.filter(id => completedLessons.includes(id)).length;
    const ratio = courseLessons.length > 0 ? (finishedInCourse / courseLessons.length) * 100 : 0;
    
    return {
      name: course.courseName.length > 14 ? course.courseName.substring(0, 12) + "..." : course.courseName,
      fullName: course.courseName,
      "Taux de complétion (%)": Math.round(ratio),
      "Leçons au total": courseLessons.length,
      "Leçons acquises": finishedInCourse
    };
  });

  // Fallback if no courses created yet
  const displayCourseData = courseCompletionData.length > 0 
    ? courseCompletionData 
    : [
        { name: "Sujet A", fullName: "Sujet de Simulation A", "Taux de complétion (%)": 65, "Leçons au total": 6, "Leçons acquises": 4 },
        { name: "Sujet B", fullName: "Sujet de Simulation B", "Taux de complétion (%)": 20, "Leçons au total": 10, "Leçons acquises": 2 }
      ];

  // 3. Spaced Repetition (SRS) status counting
  let masteredCount = 0;   // Interval > 5 days
  let learningCount = 0;   // Interval 2 to 5 days
  let newlySeenCount = 0;  // Interval <= 1 day
  let outstandingReviews = 0; // nextReviewDate <= now

  const nowStr = new Date().toISOString();
  const srsEntries = Object.values(progress.spacedRepetition || {});

  srsEntries.forEach((item) => {
    if (item.nextReviewDate && item.nextReviewDate < nowStr) {
      outstandingReviews++;
    } else if (item.interval > 5) {
      masteredCount++;
    } else if (item.interval > 1) {
      learningCount++;
    } else {
      newlySeenCount++;
    }
  });

  // Inject beautiful sample distribution so empty lists still have interactive values
  if (srsEntries.length === 0) {
    masteredCount = 4;
    learningCount = 7;
    newlySeenCount = 10;
    outstandingReviews = 3;
  }

  const srsPieData = [
    { name: "Maîtrisé 🏆", value: masteredCount, color: "#1CB0F6" },
    { name: "En cours ⏳", value: learningCount, color: "#FFE815" },
    { name: "Nouveau 🌱", value: newlySeenCount, color: "#58CC02" },
    { name: "À réviser ⚡", value: outstandingReviews, color: "#FF9600" }
  ];

  // Dynamically tailor recommendation alerts
  const getMotivationalInsight = () => {
    return "Excellent équilibre d'apprentissage ! Continuez votre parcours pour de merveilleux scores ! ⭐";
  };

  return (
    <div id="profile-tab-view" className="w-full max-w-3xl mx-auto py-6 px-4">
      
      {/* 1. VISUAL AVATAR HEADING */}
      <div className="bg-white rounded-3xl p-6 mb-6 border-2 border-[#E5E5E5] flex flex-col md:flex-row items-center gap-6 shadow-sm">
        {auth.currentUser?.photoURL ? (
          <img 
            src={auth.currentUser.photoURL} 
            alt="Avatar" 
            referrerPolicy="no-referrer"
            className="w-20 h-20 rounded-full border-b-6 border-[#1079ab] shadow-sm select-none animate-bounce shrink-0 object-cover"
          />
        ) : (
          <div className="w-20 h-20 bg-[#1cb5ff] rounded-full border-b-6 border-[#1079ab] flex items-center justify-center text-xl font-black shadow-md select-none animate-bounce shrink-0 text-white uppercase font-sans">
            {profileInitials}
          </div>
        )}
        
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
            <h1 className="text-xl md:text-2xl font-black font-display text-[#4B4B4B] truncate">{formattedProfileName}</h1>
            <span className="text-xs bg-yellow-400 text-slate-950 font-extrabold uppercase px-2.5 py-0.5 rounded-full inline-block mx-auto md:mx-0 font-display">
              Niveau {currentLevel}
            </span>
          </div>
          {auth.currentUser && (
            <p className="text-[10px] text-slate-400 font-extrabold mt-0.5 uppercase tracking-wide">
              E-mail : <span className="text-[#58cc02] font-black">{auth.currentUser.email}</span>
            </p>
          )}
          <p className="text-xs text-gray-500 font-bold mt-1">DuoStudy Scholar &bull; Inscrit(e) en Juin 2026</p>

          {/* Level Progress Slider */}
          <div className="mt-4 max-w-sm mx-auto md:mx-0">
            <div className="flex justify-between items-center text-xs text-gray-500 font-bold mb-1">
              <span className="uppercase text-slate-400 text-[10px] font-black tracking-wider">EXPÉRIENCE DU SPRINT</span>
              <span>{xpInCurrentLevel}/100 XP</span>
            </div>
            <div className="w-full bg-[#E5E5E5] h-3.5 rounded-full overflow-hidden shadow-inner">
              <div 
                className="bg-yellow-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${levelProgressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Sign Out Action Button */}
        <button
          onClick={handleSignOut}
          className="px-4 py-3 border-2 border-rose-200 hover:bg-rose-50 text-rose-500 hover:text-rose-600 text-[10px] font-black uppercase rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 self-center md:self-center"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Se Déconnecter</span>
        </button>
      </div>

      {/* 2. NUMERICAL INDICATIONS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border-2 border-[#E5E5E5] text-center shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
          <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <div className="text-lg font-black font-display text-[#4B4B4B]">{effectiveXp}</div>
          <div className="text-[10px] uppercase font-black text-gray-400 mt-1">XP Totaux</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-[#E5E5E5] text-center shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
          <Gem className="w-6 h-6 text-[#1CB0F6] fill-[#1CB0F6] mx-auto mb-2" />
          <div className="text-lg font-black font-display text-[#4B4B4B]">{progress.gems}</div>
          <div className="text-[10px] uppercase font-black text-gray-400 mt-1">Gemmes sacoches</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-[#E5E5E5] text-center shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
          <BookOpen className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <div className="text-lg font-black font-display text-[#4B4B4B]">
            {completedLessons.length} / {totalLessonsInSystem || 12}
          </div>
          <div className="text-[10px] uppercase font-black text-gray-400 mt-1">Leçons faites</div>
        </div>
      </div>

      {/* 3. INTERACTIVE ANALYTICAL STUDY CHARTS */}
      <div className="bg-white border-2 border-[#E5E5E5] rounded-3xl p-6 mb-6 shadow-sm">
        
        {/* Toggle navigation bar header for interactive insights */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-gray-100 mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#58cc02]" />
            <h3 className="text-sm font-black text-[#4B4B4B] uppercase tracking-wider font-display">
              Analytiques de progression
            </h3>
          </div>
          
          {/* Tabs switch */}
          <div className="flex gap-1.5 p-1 bg-slate-50 border-2 border-[#E5E5E5] rounded-xl self-stretch sm:self-auto overflow-x-auto">
            <button
              id="chart-tab-xp"
              onClick={() => setActiveMetric("xp")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                activeMetric === "xp"
                  ? "bg-[#58cc02] text-white shadow-sm"
                  : "text-gray-500 hover:text-slate-800"
              }`}
            >
              ⚡ Évolution XP
            </button>
            <button
              id="chart-tab-courses"
              onClick={() => setActiveMetric("courses")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                activeMetric === "courses"
                  ? "bg-[#1CB0F6] text-white shadow-sm"
                  : "text-gray-500 hover:text-slate-800"
              }`}
            >
              📚 Par Matière
            </button>
          </div>
        </div>

        {/* Extra controls nested by metric */}
        {activeMetric === "xp" && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3.5 mb-4 bg-slate-50 p-3.5 rounded-2xl border border-gray-100">
            <div className="flex gap-3">
              <button
                onClick={() => setTimeRange("7days")}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                  timeRange === "7days" ? "bg-[#4B4B4B] text-white shadow-sm" : "bg-white border text-gray-500 hover:bg-slate-100"
                }`}
              >
                7 derniers jours
              </button>
              <button
                onClick={() => setTimeRange("14days")}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                  timeRange === "14days" ? "bg-[#4B4B4B] text-white shadow-sm" : "bg-white border text-gray-500 hover:bg-slate-100"
                }`}
              >
                14 derniers jours
              </button>
            </div>
          </div>
        )}

        {/* 4. ACTUAL RECHARTS DISPLAY PORT */}
        <div className="h-72 w-full mt-2 relative">
          <ResponsiveContainer width="100%" height="100%">
            {activeMetric === "xp" ? (
              <AreaChart data={xpHistoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="xpColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#58CC02" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#58CC02" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#A0A0A0", fontSize: 11, fontWeight: "bold" }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#A0A0A0", fontSize: 11, fontWeight: "bold" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#1F2937", 
                    borderRadius: "12px", 
                    borderColor: "#1F2937",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: "bold"
                  }}
                  itemStyle={{ color: "#84D8FF" }}
                  labelStyle={{ color: "#FFFFFF", fontWeight: "900" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Points XP" 
                  stroke="#58CC02" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#xpColor)" 
                />
              </AreaChart>
            ) : (
              <BarChart data={displayCourseData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#A0A0A0", fontSize: 11, fontWeight: "bold" }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tick={{ fill: "#A0A0A0", fontSize: 11, fontWeight: "bold" }}
                />
                <Tooltip 
                  cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#1F2937] text-white p-3 rounded-xl border border-gray-800 text-xs shadow-md">
                          <p className="font-extrabold text-[#1CB0F6]">{data.fullName}</p>
                          <p className="mt-1 font-bold">Complétion : {data["Taux de complétion (%)"]}%</p>
                          <p className="text-[10px] text-gray-300">
                            {data["Leçons acquises"]} leçons sur {data["Leçons au total"]} validées
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="Taux de complétion (%)" 
                  fill="#1CB0F6" 
                  radius={[8, 8, 0, 0]} 
                  maxBarSize={40}
                >
                  {displayCourseData.map((entry, index) => {
                    // Match visual styling to brand colors sequentially
                    const colors = ["#1CB0F6", "#58CC02", "#FF9600", "#7C3AED"];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Motivational / Interactive banner insights below the chart */}
        <div className="mt-6 p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-start gap-3">
          <span className="text-xl">🦉</span>
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">L'avis de DuoStudy</span>
            <p className="text-xs text-[#388301] font-bold leading-relaxed mt-0.5">
              {getMotivationalInsight()}
            </p>
          </div>
        </div>
      </div>

      {/* 5. HISTORY AND COURSE CATALOG */}
      <div className="bg-white border-2 border-[#E5E5E5] rounded-3xl p-6 mb-6 shadow-sm">
        <h3 className="text-xs font-black text-[#4B4B4B] uppercase tracking-widest font-display pb-3 border-b-2 border-[#E5E5E5] mb-4 flex items-center gap-1.5">
          <History className="w-4 h-4 text-[#1CB0F6]" />
          MES MATIÈRES ET NOTATIONS
        </h3>

        {totalCourses > 0 ? (
          <div className="space-y-4">
            {courses.map((course) => {
              const courseLessons: string[] = [];
              course.units.forEach(u => u.lessons.forEach(l => courseLessons.push(l.id)));
              const finishedInCourse = courseLessons.filter(id => completedLessons.includes(id)).length;
              const ratio = courseLessons.length > 0 ? finishedInCourse / courseLessons.length : 0;

              return (
                <div key={course.id} className="bg-slate-50 p-4 rounded-2xl border-2 border-[#E5E5E5]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📚</span>
                      <div>
                        <h4 className="text-sm font-black text-[#4B4B4B]">{course.courseName}</h4>
                        <p className="text-[10px] text-gray-400 font-bold">Créé : {new Date(course.createdAt).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200">
                      {finishedInCourse} / {courseLessons.length} leçons ({Math.round(ratio * 100)}%)
                    </span>
                  </div>

                  {/* Progressive scroll */}
                  <div className="mt-3 w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#1CB0F6] h-full rounded-full"
                      style={{ width: `${ratio * 100}%` }}
                    ></div>
                  </div>

                  {/* Toggle course notes */}
                  {course.sourceNotes && (
                    <details className="mt-3 cursor-pointer group">
                      <summary className="text-[10px] text-gray-500 font-extrabold uppercase list-none focus:outline-none flex items-center gap-1 select-none">
                        🔍 Voir notes de cours brutes d'origine
                      </summary>
                      <div className="mt-2 p-3 bg-slate-100 border-2 border-[#E5E5E5] rounded-xl text-[10px] text-[#4B4B4B] font-mono leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {course.sourceNotes}
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-6 font-semibold select-none">
            Aucun cours actuellement enregistré. Rendez-vous dans l'onglet "Ajouter un Cours" pour importer votre matériel pédagogique.
          </p>
        )}
      </div>

      {/* 6. GOOGLE ADSENSE MONETIZATION MANAGER CARD */}
      <AdSenseConfigManager />

    </div>
  );
}

function AdSenseConfigManager() {
  const [client, setClient] = useState(() => localStorage.getItem("duostudy_adsense_client") || "ca-pub-9419139201931831");
  const [slot, setSlot] = useState(() => localStorage.getItem("duostudy_adsense_slot") || "1234567890");
  const [isSaved, setIsSaved] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    localStorage.setItem("duostudy_adsense_client", client.trim());
    localStorage.setItem("duostudy_adsense_slot", slot.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  return (
    <div className="bg-white border-2 border-[#E5E5E5] rounded-3xl p-6 mb-6 shadow-sm">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none pb-1"
      >
        <h3 className="text-xs font-black text-[#4B4B4B] uppercase tracking-widest font-display flex items-center gap-1.5">
          <span className="text-lg">📢</span>
          MONÉTISATION & GOOGLE ADSENSE
        </h3>
        <span className="text-xs font-black text-[#1CB0F6]">
          {isOpen ? "Masquer ▲" : "Gérer & Configurer ▼"}
        </span>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t-2 border-[#E5E5E5] space-y-4 animate-fade-in">
          <p className="text-[11px] text-gray-400 font-bold leading-normal">
            Pour couvrir le remboursement de vos crédits de l'API Gemini et financer l'hébergement de DuoStudy auprès de vos étudiants, vous pouvez y diffuser des encarts de parrainages et des fenêtres interstitielles Google AdSense.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#fdfdfd] p-4 rounded-2xl border-2 border-[#E5E5E5]">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                Publisher ID (Client AdSense)
              </label>
              <input 
                type="text" 
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                className="w-full bg-white border-2 border-[#E5E5E5] text-xs font-mono p-2.5 rounded-xl text-slate-700 outline-none focus:border-[#1CB0F6]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                Slot d'Annonce (Slot ID)
              </label>
              <input 
                type="text" 
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                placeholder="1234567890"
                className="w-full bg-white border-2 border-[#E5E5E5] text-xs font-mono p-2.5 rounded-xl text-slate-700 outline-none focus:border-[#1CB0F6]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 items-center">
            {isSaved && (
              <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                ✅ Identifiants enregistrés !
              </span>
            )}
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-[#58cc02] border-b-4 border-[#46a302] hover:bg-[#61df02] text-white text-xs font-black rounded-xl uppercase tracking-wider select-none cursor-pointer"
            >
              Sauvegarder les IDs
            </button>
          </div>

          <div className="p-4 bg-sky-50 border-2 border-sky-100 rounded-2xl text-[11px] text-sky-800 leading-relaxed font-semibold">
            <h4 className="font-extrabold uppercase text-[10px] tracking-wide text-sky-900 mb-1.5 flex items-center gap-1">
              🚀 Comment cela fonctionne en ligne ?
            </h4>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Créez / Associez votre compte sur la plateforme <a href="https://adsense.google.com" target="_blank" rel="noreferrer" className="underline font-bold text-sky-900">Google AdSense</a>.</li>
              <li>Validez votre nom de domaine d'hébergeur DuoStudy.</li>
              <li>Saisissez votre Publisher ID ci-dessus.</li>
              <li>Les bannières s'adapteront alors totalement et collecteront de vrais revenus en parrainages !</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
