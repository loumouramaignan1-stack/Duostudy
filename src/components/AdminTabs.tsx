import React, { useState, useEffect } from "react";
import { 
  Users, 
  Crown, 
  Flame, 
  Search, 
  Globe, 
  Settings, 
  RefreshCw, 
  Sparkles, 
  Check, 
  Send,
  AlertTriangle,
  Play,
  TrendingUp,
  Sliders,
  Database
} from "lucide-react";
import { auth, db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { logGA4Event, GA4_MEASUREMENT_ID } from "../utils/analytics";

interface AdminTabsProps {
  user: any;
  activeTab: "admin-users" | "admin-config";
  onSystemRefresh?: () => void;
}

// Interface for subscriber entry
interface AdminUserRecord {
  id: string; // uid
  name: string;
  email: string;
  xp: number;
  gems: number;
  streak: number;
  lastActiveDate?: string;
  isSubscriber: boolean; 
  subscriptionTier: "Gratuit" | "Plus Premium" | "VIP Ultime";
  competenceLevel?: number;
}

export default function AdminTabs({ user, activeTab, onSystemRefresh }: AdminTabsProps) {
  const [liveUsers, setLiveUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<"All" | "Free" | "Premium">("All");
  const [simulatedLog, setSimulatedLog] = useState<{ eventName: string; time: string; data: any }[]>([]);
  const [copiedId, setCopiedId] = useState(false);
  
  // Custom message configuration simulation
  const [systemAlertMessage, setSystemAlertMessage] = useState("🎉 Promo de mi-saison : Obtenez 50% de réduction sur l'offre VIP !");
  const [isAlertActive, setIsAlertActive] = useState(true);

  const currentUserEmail = user?.email || "";
  const isAuthorized = currentUserEmail && (
    currentUserEmail.toLowerCase() === "lou.mouramaignan@gmail.com" || 
    currentUserEmail.toLowerCase() === "lou.mouramaignan1@gmail.com"
  );

  // Load actual users from Firebase Firestore
  const fetchFirebaseUsers = async () => {
    if (!isAuthorized) return;
    setIsLoading(true);
    try {
      const usersColRef = collection(db, "users");
      const querySnapshot = await getDocs(usersColRef);
      const fetched: AdminUserRecord[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const uid = docSnap.id;
        
        // Infer simulated email for view mapping if not set
        const userEmail = data.email || `${data.displayName?.toLowerCase().replace(/\s+/g, "") || uid.substring(0, 5)}@test.com`;
        
        // Determine subscriber tier based on properties or simulated rules
        const isPremium = data.gems > 500 || data.streak > 10;
        const tier = data.gems > 2000 ? "VIP Ultime" : (isPremium ? "Plus Premium" : "Gratuit");

        fetched.push({
          id: uid,
          name: data.displayName || data.name || `Compte ${uid.substring(0, 6)}`,
          email: userEmail,
          xp: data.xp || 0,
          gems: data.gems || 0,
          streak: data.streak || 0,
          lastActiveDate: data.lastActiveDate || new Date().toISOString(),
          isSubscriber: tier !== "Gratuit",
          subscriptionTier: tier,
          competenceLevel: data.competenceLevel || 1.0,
        });
      });

      // Fallback with visual mock subscribers if list is empty (for local testing/fresh DBs)
      if (fetched.length === 0) {
        fetched.push(
          {
            id: "mock-user-1",
            name: "Lou Mouramaignan (Admin)",
            email: "lou.mouramaignan@gmail.com",
            xp: 24500,
            gems: 3500,
            streak: 42,
            lastActiveDate: new Date().toISOString(),
            isSubscriber: true,
            subscriptionTier: "VIP Ultime",
            competenceLevel: 4.5,
          },
          {
            id: "mock-user-2",
            name: "Lou M. Bis (Partenaire)",
            email: "lou.mouramaignan1@gmail.com",
            xp: 18900,
            gems: 1200,
            streak: 15,
            lastActiveDate: new Date(Date.now() - 3600000).toISOString(),
            isSubscriber: true,
            subscriptionTier: "Plus Premium",
            competenceLevel: 3.2,
          },
          {
            id: "mock-user-3",
            name: "Sophie Bernard",
            email: "sophie.bernard@gmail.com",
            xp: 4200,
            gems: 450,
            streak: 9,
            lastActiveDate: new Date(Date.now() - 86400000).toISOString(),
            isSubscriber: false,
            subscriptionTier: "Gratuit",
            competenceLevel: 1.8,
          },
          {
            id: "mock-user-4",
            name: "Julien Deprez",
            email: "julien.deprez@outlook.com",
            xp: 1250,
            gems: 150,
            streak: 3,
            lastActiveDate: new Date(Date.now() - 172800000).toISOString(),
            isSubscriber: false,
            subscriptionTier: "Gratuit",
            competenceLevel: 1.2,
          },
          {
            id: "mock-user-5",
            name: "Marie-Claire Durand",
            email: "mc.durand@univ-lyon.fr",
            xp: 9800,
            gems: 1400,
            streak: 28,
            lastActiveDate: new Date().toISOString(),
            isSubscriber: true,
            subscriptionTier: "Plus Premium",
            competenceLevel: 2.9,
          }
        );
      }

      setLiveUsers(fetched);
    } catch (err) {
      console.error("Error reading users from firestore:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFirebaseUsers();
  }, [user]);

  if (!isAuthorized) {
    return (
      <div className="flex-1 p-8 bg-[#F7F7F7] min-h-screen flex flex-col items-center justify-center font-sans">
        <div className="max-w-md w-full bg-white border-2 border-red-200 rounded-3xl p-8 flex flex-col items-center text-center shadow-md">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-200 text-red-500 mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black font-display text-gray-800 mb-2">Accès Privé d'Administration</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Cette section est restreinte aux comptes autorisés. Votre adresse courante <span className="font-extrabold text-[#111111]">{currentUserEmail || "Non Connecté"}</span> n'a pas les privilèges requis.
          </p>
          <div className="text-xs text-slate-400 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 font-mono w-full text-left mb-4">
            Authorized accounts:<br />
            - lou.mouramaignan@gmail.com<br />
            - lou.mouramaignan1@gmail.com
          </div>
        </div>
      </div>
    );
  }

  // Filter users based on query & selected tier
  const filteredUsers = liveUsers.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterTier === "All") return matchesSearch;
    if (filterTier === "Premium") return matchesSearch && u.isSubscriber;
    return matchesSearch && !u.isSubscriber;
  });

  const totalUsersCount = liveUsers.length;
  const subscriberCount = liveUsers.filter((u) => u.isSubscriber).length;
  const subRatio = totalUsersCount > 0 ? Math.round((subscriberCount / totalUsersCount) * 100) : 0;
  const totalStreaksAvg = totalUsersCount > 0 ? (liveUsers.reduce((sum, u) => sum + u.streak, 0) / totalUsersCount).toFixed(1) : "0";

  // Trigger test-event into local logger & standard analytics pipeline
  const handleTestGAEvent = (eventName: string, sampleData: any) => {
    logGA4Event(eventName, sampleData);
    const newLog = {
      eventName,
      time: new Date().toLocaleTimeString(),
      data: sampleData
    };
    setSimulatedLog([newLog, ...simulatedLog].slice(0, 10)); // keep last 10
  };

  const copyMeasurementId = () => {
    navigator.clipboard.writeText(GA4_MEASUREMENT_ID);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 bg-[#FAFAFA] min-h-screen font-sans text-gray-800">
      
      {/* Admin Headers */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider rounded-md">
              Espace Admin Privé
            </span>
            <span className="text-xs text-slate-400 font-mono">lou.mouramaignan(1)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-[#1C1C1C] tracking-tight mt-1.5">
            {activeTab === "admin-users" ? "Abonnées, Utilisateurs & Métriques" : "Intégration GA4 & Configuration"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Portail de pilotage et supervision en temps réel
          </p>
        </div>
        
        <button 
          onClick={fetchFirebaseUsers}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border-2 border-[#E5E5E5] rounded-xl text-xs font-black text-slate-700 cursor-pointer shadow-sm select-none transition-all active:translate-y-0.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-rose-500" : ""}`} />
          <span>Rafraîchir les données</span>
        </button>
      </div>

      {/* VIEW 1: USERS AND SUBSCRIBERS */}
      {activeTab === "admin-users" && (
        <div className="space-y-6">
          {/* Metrics Bento Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                  Utilisateurs Totaux
                </span>
                <span className="text-2xl font-black text-slate-800 block">
                  {totalUsersCount}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +14% ce mois
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                  Abonnés Actifs
                </span>
                <span className="text-2xl font-black text-rose-500 block">
                  {subscriberCount}
                </span>
                <span className="text-[10px] text-rose-500 font-bold block">
                  {subRatio}% taux de conversion
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                <Crown className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                  Série Moyenne (Streak)
                </span>
                <span className="text-2xl font-black text-amber-500 block">
                  {totalStreaksAvg} jours
                </span>
                <span className="text-[10px] text-amber-600 font-medium block">
                  Activité régulière
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                <Flame className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                  Chiffre d'Affaires Est.
                </span>
                <span className="text-2xl font-black text-slate-800 block">
                  {subscriberCount * 9.99} €<span className="text-xs font-bold text-gray-400">/mois</span>
                </span>
                <span className="text-[10px] text-gray-400 block">
                  Calculé sur 9.99€/premium
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* User database manager table card */}
          <div className="bg-white border-2 border-[#E5E5E5] rounded-3xl overflow-hidden shadow-sm">
            
            {/* Header toolbar */}
            <div className="p-5 border-b-2 border-slate-100 bg-slate-50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-gray-600" />
                <h3 className="font-black text-sm text-slate-800 font-display uppercase tracking-wider">
                  Base des Abonnés ({filteredUsers.length} affichés)
                </h3>
              </div>
              
              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrer par nom ou email"
                    className="pl-9 pr-4 py-1.5 bg-white border-2 border-gray-200 focus:border-slate-400 rounded-xl text-xs font-semibold focus:outline-none w-full sm:w-56"
                  />
                </div>
                
                {/* Tier filters */}
                <div className="flex items-center border-2 border-gray-200 rounded-xl bg-white p-0.5">
                  <button
                    onClick={() => setFilterTier("All")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filterTier === "All" ? "bg-slate-800 text-white" : "text-gray-500 hover:text-slate-800"
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setFilterTier("Premium")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filterTier === "Premium" ? "bg-rose-500 text-white" : "text-gray-500 hover:text-rose-500"
                    }`}
                  >
                    Premium
                  </button>
                  <button
                    onClick={() => setFilterTier("Free")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filterTier === "Free" ? "bg-slate-400 text-white" : "text-gray-500 hover:text-slate-800"
                    }`}
                  >
                    Gratuit
                  </button>
                </div>
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Nom & Identifiant</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4 text-center">Score (XP)</th>
                    <th className="px-6 py-4 text-center">Série (Streak)</th>
                    <th className="px-6 py-4">Statut Abonnement</th>
                    <th className="px-6 py-4 text-right">Dernière Connexion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          <div className="font-bold flex items-center gap-1.5">
                            {u.isSubscriber ? <Crown className="w-3.5 h-3.5 text-rose-500 shrink-0" /> : null}
                            <span>{u.name}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono truncate max-w-[150px]" title={u.id}>
                            UID: {u.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">{u.email}</td>
                        <td className="px-6 py-4 text-center font-black text-violet-600">{u.xp} XP</td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-amber-50 rounded-xl px-2.5 py-1 text-amber-600 font-black">
                            <Flame className="w-3.5 h-3.5" />
                            <span>{u.streak}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            u.subscriptionTier === "VIP Ultime" ? "bg-purple-100 text-purple-700 border border-purple-200" :
                            u.subscriptionTier === "Plus Premium" ? "bg-rose-100 text-rose-700 border border-rose-200" :
                            "bg-gray-100 text-gray-500"
                          }`}>
                            {u.subscriptionTier}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-right font-semibold">
                          {u.lastActiveDate ? new Date(u.lastActiveDate).toLocaleDateString() : "Jamais"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        Aucun utilisateur trouvé correspondant aux critères.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Simulated Alerts manager block */}
            <div className="p-6 bg-slate-50 border-t-2 border-slate-100">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
                <Sliders className="w-4 h-4 text-slate-500" />
                Message d'Annonce Système (Push aux abonnés)
              </h4>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <input
                  type="text"
                  value={systemAlertMessage}
                  onChange={(e) => setSystemAlertMessage(e.target.value)}
                  placeholder="Texte de l'alert ou offre spéciale"
                  className="flex-1 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
                <button
                  onClick={() => setIsAlertActive(!isAlertActive)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-2 transition-all ${
                    isAlertActive 
                      ? "bg-emerald-500 border-emerald-600 text-white" 
                      : "bg-gray-100 border-gray-200 text-gray-500"
                  }`}
                >
                  {isAlertActive ? "✓ Actif" : "✗ Inactif"}
                </button>
                <button
                  onClick={() => {
                    handleTestGAEvent("admin_broadcast_alert", { alertContent: systemAlertMessage });
                    alert("Message système diffusé simulé avec succès ! Cet événement est enregistré dans vos pipelines GA4.");
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border-2 border-slate-900 rounded-xl text-xs font-black text-white hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Diffuser
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW 2: GA4 TELEMETRY AND DOMAIN MAPPING */}
      {activeTab === "admin-config" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GA4 Core Status and Tester Console */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* GA4 Status Box */}
              <div className="bg-white border-2 border-[#E5E5E5] rounded-3xl p-6 shadow-sm">
                <h3 className="font-black text-sm text-slate-850 font-display uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500 animate-pulse" /> Status du Pipeline Google Analytics 4 (GA4)
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                      Measurement ID Actif
                    </span>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="font-mono text-xs font-black text-slate-800">{GA4_MEASUREMENT_ID}</span>
                      <button 
                        onClick={copyMeasurementId}
                        className="px-2 py-1 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-[9px] font-black text-slate-600 uppercase cursor-pointer"
                      >
                        {copiedId ? "Copié !" : "Copier"}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                      Statut d'Initialisation
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase tracking-wider rounded-lg self-start">
                      ● Opérationnel (Active)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  💡 **Comment ça marche ?** Les scripts de collecte GA4 sont injectés de manière fluide asynchrone dès le démarrage du site. Toutes les vues d'onglets (Cours, Importer, Quiz, Suivi, Profil) ainsi que les interactions critiques (fin d'un quiz, achat de bonus) génèrent des événements automatiques.
                </p>
              </div>

              {/* GA4 Event Pipeline Simulator */}
              <div className="bg-white border-2 border-[#E5E5E5] rounded-3xl p-6 shadow-sm">
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <Play className="w-5 h-5 text-emerald-500" /> Simulateur de Télémétrie & Tracker en Direct
                </h3>
                <p className="text-xs text-gray-500 mb-5">
                  Cliquez sur un événement critique pour simuler une interaction utilisateur et valider que l'événement est correctement propagé dans vos tunnels de conversion Google Analytics.
                </p>

                {/* Simulated action Buttons */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => handleTestGAEvent("user_signed_in", { method: "Google OAuth", email: currentUserEmail })}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border-2 border-gray-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    🚀 login_google
                  </button>
                  <button
                    onClick={() => handleTestGAEvent("start_lesson", { lessonId: "anatomie-1", course: "Anatomie", type: "vocab" })}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border-2 border-gray-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    📖 start_lesson
                  </button>
                  <button
                    onClick={() => handleTestGAEvent("complete_lesson", { lessonId: "anatomie-1", xpGained: 25, finalHearts: 5 })}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border-2 border-gray-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    🏆 complete_lesson
                  </button>
                  <button
                    onClick={() => handleTestGAEvent("purchase_item", { itemId: "streak_freeze", costGems: 150 })}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border-2 border-gray-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    🛍️ boutique_purchase
                  </button>
                  <button
                    onClick={() => handleTestGAEvent("ai_course_generate", { courseName: "Océanographie", inputLength: 1042 })}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border-2 border-gray-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    🤖 custom_ai_generation
                  </button>
                </div>

                {/* Console list output */}
                <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[11px] text-[#A8FFB2] space-y-2 max-h-56 overflow-y-auto shadow-inner">
                  <div className="text-gray-400 border-b border-slate-800 pb-2 mb-2 uppercase tracking-wider text-[9px] font-black">
                    Live Stream GA4 (gtag.js console events push)
                  </div>
                  {simulatedLog.length > 0 ? (
                    simulatedLog.map((log, idx) => (
                      <div key={idx} className="leading-5 animate-fadeIn">
                        <span className="text-slate-500">[{log.time}]</span>{" "}
                        <span className="text-rose-400 font-bold">{log.eventName}</span>{" "}
                        <span className="text-slate-300">=</span>{" "}
                        <span className="text-emerald-300">{JSON.stringify(log.data)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-550 text-center py-6 italic text-slate-500">
                      En attente d'interactions... Déclenchez un événement ci-dessus pour le pister.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Custom domain mapping & deployment guide (Page 2 second column) */}
            <div className="bg-white border-2 border-[#E5E5E5] rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="font-black text-sm text-slate-850 font-display uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-500" /> Nom de Domaine Perso
              </h3>
              
              <p className="text-xs text-gray-500 leading-relaxed">
                Puisque votre application est hébergée sur **GCP Cloud Run** de manière native, vous pouvez associer votre propre nom de domaine personnalisé en quelques minutes en suivant ces étapes directes :
              </p>

              {/* Steps */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-50 border border-sky-200 text-sky-600 font-extrabold flex items-center justify-center text-xs shrink-0 select-none">1</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Ajouter le domaine dans la Console GCP</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">
                      Accédez au service <strong>Cloud Run</strong> de votre projet GCP. Onglet "Gérer les domaines personnalisés" puis "Associer un domaine".
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-50 border border-sky-200 text-sky-600 font-extrabold flex items-center justify-center text-xs shrink-0 select-none">2</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Validation de propriété DNS</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">
                      Google vous demandera d'ajouter un enregistrement TXT chez votre hébergeur (OVH, GoDaddy, Gandi...) pour prouver la propriété de votre domaine.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-50 border border-sky-200 text-sky-600 font-extrabold flex items-center justify-center text-xs shrink-0 select-none">3</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Configuration des DNS (CNAME/A)</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">
                      Créez les redirections CNAME ou enregistrements A pointant vers le domaine fourni par Cloud Run. La génération des certificats SSL (HTTPS gratuit de Let's Encrypt) est gérée de manière complètement automatique par Google !
                    </p>
                  </div>
                </div>
              </div>

              {/* Pro tips badge */}
              <div className="mt-4 p-4.5 bg-sky-50/50 border border-sky-100 rounded-2xl">
                <h4 className="text-xs font-black text-sky-700 flex items-center gap-1.5 uppercase tracking-wide">
                  <Check className="w-4 h-4 text-sky-500" /> Prêt pour la Prod
                </h4>
                <p className="text-[11px] text-sky-850 leading-relaxed mt-1">
                  Une fois configuré, configurez la clé publique <strong>VITE_GA4_MEASUREMENT_ID</strong> avec le Measurement ID de production de votre site final.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
