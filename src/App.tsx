import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import StatsBar from "./components/StatsBar";
import LearnPath from "./components/LearnPath";
import ActiveLesson from "./components/ActiveLesson";
import AddCourseTab from "./components/AddCourseTab";
import ShopTab from "./components/ShopTab";
import ProfileTab from "./components/ProfileTab";
import RapidQuizTab from "./components/RapidQuizTab";
import AuthScreen from "./components/AuthScreen";
import AdBlock from "./components/AdBlock";
import LandingPage from "./components/LandingPage";
import DuoStudyLogo from "./components/DuoStudyLogo";
import AdminTabs from "./components/AdminTabs";
import { initGA4, logGA4PageView, setGA4UserContext } from "./utils/analytics";

import { Course, Lesson, Question, UserProgress, LeaderboardUser, ShopItem, SpacedRepetitionData } from "./types";
import { DEFAULT_COURSES, INITIAL_LEADERBOARD, INITIAL_SHOP, calculateSM2, getAdaptationForLevel } from "./data";
import { updateNodeState, getBestNextActivity, buildDynamicSessionQuestions, calculateUserCompetenceRating, getLessonTargetLevel } from "./utils/pedagogy";
import { Menu, X, Gem, Heart, Trophy, BookOpen } from "lucide-react";

import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

export const DELETED_COURSE_IDS = ["course-economie", "course-anatomie", "course-histoire"];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbSyncing, setDbSyncing] = useState(false);

  // Client-side router path state
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState(null, "", path);
    setCurrentPath(path);
  };

  // Global States backed up with localStorage
  const [courses, setCourses] = useState<Course[]>(() => {
    const backup = localStorage.getItem("duostudy_courses");
    const parsed = backup ? JSON.parse(backup) : DEFAULT_COURSES;
    const loadedCourses = (parsed as Course[]).filter((c) => !DELETED_COURSE_IDS.includes(c.id));
    
    // Retroactive lesson ID collision fix for dynamic/generated courses
    loadedCourses.forEach((c) => {
      if (c.id.startsWith("course-") && Array.isArray(c.units)) {
        c.units.forEach((unit) => {
          if (Array.isArray(unit.lessons)) {
            unit.lessons.forEach((lesson) => {
              if (lesson && typeof lesson === "object" && lesson.id) {
                const hasCoursePrefix = lesson.id.startsWith(c.id + "-") || lesson.id.startsWith("gen-");
                if (!hasCoursePrefix) {
                  lesson.id = `${c.id}-${lesson.id}`;
                }
              }
            });
          }
        });
      }
    });

    return loadedCourses;
  });

  const [activeCourseId, setActiveCourseId] = useState<string>(() => {
    const backup = localStorage.getItem("duostudy_active_course_id");
    if (backup && !DELETED_COURSE_IDS.includes(backup)) return backup;
    const tempBackup = localStorage.getItem("duostudy_courses");
    const parsed = tempBackup ? JSON.parse(tempBackup) : DEFAULT_COURSES;
    const filtered = (parsed as Course[]).filter((c) => !DELETED_COURSE_IDS.includes(c.id));
    return filtered && filtered.length > 0 ? filtered[0].id : "";
  });

  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const backup = localStorage.getItem("duostudy_progress");
    const defaultProgress: UserProgress = {
      xp: 0,
      gems: 150,
      hearts: 5,
      streak: 7,
      completedLessons: [],
      spacedRepetition: {},
      lessonLevels: {},
      nodeStates: {},
      examDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // ~25 days away default
      competenceLevel: 1.0,
      streakFreezeActive: false,
      doubleXpActive: false,
      dailyXp: {},
      heartsLastRefilledAt: undefined
    };
    if (backup) {
      try {
        const parsed = JSON.parse(backup);
        return {
          ...defaultProgress,
          ...parsed,
          completedLessons: parsed.completedLessons || [],
          spacedRepetition: parsed.spacedRepetition || {},
          lessonLevels: parsed.lessonLevels || {},
          nodeStates: parsed.nodeStates || {},
          examDate: parsed.examDate || defaultProgress.examDate,
          competenceLevel: parsed.competenceLevel || 1.0,
          dailyXp: parsed.dailyXp || {},
          heartsLastRefilledAt: parsed.heartsLastRefilledAt
        };
      } catch (e) {
        return defaultProgress;
      }
    }
    return defaultProgress;
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(() => {
    const backup = localStorage.getItem("duostudy_leaderboard");
    return backup ? JSON.parse(backup) : INITIAL_LEADERBOARD;
  });

  const [shopItems, setShopItems] = useState<ShopItem[]>(() => {
    const backup = localStorage.getItem("duostudy_shop_items");
    return backup ? JSON.parse(backup) : INITIAL_SHOP;
  });

  const [activeTab, setActiveTab] = useState<string>("learn");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeLessonUnitTitle, setActiveLessonUnitTitle] = useState("");
  const [selectedSessionLength, setSelectedSessionLength] = useState<number>(10);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const lastLoadedProgressRef = React.useRef<string>("");
  const lastLoadedCoursesRef = React.useRef<string>("");
  const currentUserRef = React.useRef<FirebaseUser | null>(null);

  useEffect(() => {
    currentUserRef.current = user;
    if (user) {
      setGA4UserContext(user.uid, user.email);
    }
  }, [user]);

  // Dynamic GA4 telemetry tracking on active workspace changes
  useEffect(() => {
    initGA4();
  }, []);

  useEffect(() => {
    logGA4PageView(`/${activeTab}`, `DuoStudy - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`);
  }, [activeTab]);

  // Firebase Authentication Stage Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // ONLY clear local progression if we are transitioning from an actually logged-in state (explicit log out).
        // This prevents the initial page load (which initially returns null before checking local session)
        // from aggressively wiping the guest or user's local progress / courses.
        if (currentUserRef.current !== null) {
          localStorage.removeItem("duostudy_courses");
          localStorage.removeItem("duostudy_active_course_id");
          localStorage.removeItem("duostudy_progress");
          setCourses([]);
          setActiveCourseId("");
          setUserProgress({
            xp: 0,
            gems: 150,
            hearts: 5,
            streak: 7,
            completedLessons: [],
            spacedRepetition: {},
            lessonLevels: {},
            nodeStates: {},
            examDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
            competenceLevel: 1.0,
            streakFreezeActive: false,
            doubleXpActive: false,
            dailyXp: {},
            heartsLastRefilledAt: undefined
          });
          setIsDataLoaded(false);
          lastLoadedProgressRef.current = "";
          lastLoadedCoursesRef.current = "";
        }
      }
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firebase Firestore data pulling on user authentication
  useEffect(() => {
    if (!user) {
      setIsDataLoaded(false);
      return;
    }

    const loadUserData = async () => {
      console.log(`[Firestore Read] Starting data load for user UID: ${user.uid}`);
      setDbSyncing(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const coursesColRef = collection(db, "users", user.uid, "courses");

        // Fetch user Doc and custom user courses in parallel to prevent intermediate rendering side effects
        const [userDoc, coursesSnaps] = await Promise.all([
          getDoc(userDocRef).catch((err) => {
            console.error(`[Firestore Error] GetDoc failed for users/${user.uid}:`, err);
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          }),
          getDocs(coursesColRef).catch((err) => {
            console.error(`[Firestore Error] GetDocs failed for users/${user.uid}/courses:`, err);
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}/courses`);
          })
        ]);

        console.log(`[Firestore Read] Successfully retrieved user document and courses snaps for UID: ${user.uid}`);

        let latestProgress = userProgress;
        let isNewUser = false;
        let initialProgressData = null;

        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log(`[Firestore Read] Found existing user record under users/${user.uid}:`, data);
          latestProgress = {
            ...userProgress,
            ...data,
          } as UserProgress;
        } else {
          isNewUser = true;
          console.log(`[Firestore Read] User record users/${user.uid} does not exist. Preparing initial progression metadata...`);
          // Sync current progression to Cloud Firestore for new user registration
          initialProgressData = {
            uid: user.uid,
            xp: userProgress.xp,
            gems: userProgress.gems,
            hearts: userProgress.hearts,
            streak: userProgress.streak,
            lastActiveDate: userProgress.lastActiveDate || new Date().toISOString(),
            completedLessons: userProgress.completedLessons,
            spacedRepetition: userProgress.spacedRepetition,
            lessonLevels: userProgress.lessonLevels || {},
            nodeStates: userProgress.nodeStates || {},
            seenExercises: userProgress.seenExercises || {},
            examDate: userProgress.examDate || new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
            competenceLevel: userProgress.competenceLevel || 1.0,
            streakFreezeActive: userProgress.streakFreezeActive,
            doubleXpActive: userProgress.doubleXpActive,
            dailyXp: userProgress.dailyXp || {},
            heartsLastRefilledAt: userProgress.heartsLastRefilledAt || null
          };
        }

        let loadedCourses: Course[] = [];
        let coursesToSaveImmediately: Course[] | null = null;

        if (!coursesSnaps.empty) {
          console.log(`[Firestore Read] Loaded ${coursesSnaps.size} course(s) from subcollection users/${user.uid}/courses`);
          coursesSnaps.forEach((doc) => {
            const courseData = doc.data() as Course;
            if (!DELETED_COURSE_IDS.includes(courseData.id)) {
              loadedCourses.push(courseData);
            }
          });
        } else {
          console.log(`[Firestore Read] Subcollection users/${user.uid}/courses is empty. Preparing automatic course seeding...`);
          const candidateCourses = (courses && courses.length > 0) ? courses : DEFAULT_COURSES;
          coursesToSaveImmediately = candidateCourses.filter((c) => !DELETED_COURSE_IDS.includes(c.id));
        }

        // Perform initial writes first, before updating active React state
        if (isNewUser && initialProgressData) {
          console.log(`[Firestore Write] Provisioning new user in Firestore under users/${user.uid}`);
          await setDoc(userDocRef, initialProgressData).catch((err) => {
            handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
          });
          lastLoadedProgressRef.current = JSON.stringify(initialProgressData);
        } else {
          lastLoadedProgressRef.current = JSON.stringify(latestProgress);
        }

        if (coursesToSaveImmediately) {
          console.log(`[Firestore Write] Seeding ${coursesToSaveImmediately.length} course(s) to users/${user.uid}/courses`);
          for (const course of coursesToSaveImmediately) {
            await setDoc(doc(db, "users", user.uid, "courses", course.id), course).catch((err) => {
              handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/courses/${course.id}`);
            });
          }
          loadedCourses = coursesToSaveImmediately;
          lastLoadedCoursesRef.current = JSON.stringify(coursesToSaveImmediately);
        } else {
          lastLoadedCoursesRef.current = JSON.stringify(loadedCourses);
        }

        // Set all local states simultaneously to keep view in perfect block harmony
        setUserProgress(latestProgress);
        setCourses(loadedCourses);
        if (loadedCourses.length > 0) {
          const activeCourseFound = loadedCourses.find(c => c.id === activeCourseId);
          setActiveCourseId(activeCourseFound ? activeCourseFound.id : loadedCourses[0].id);
        }
        setIsDataLoaded(true);
        console.log(`[Loader] Finished user load successfully. Data matches the active session.`);
      } catch (err) {
        console.error("Error loading user data from firestore: ", err);
      } finally {
        setDbSyncing(false);
      }
    };

    loadUserData();
  }, [user]);

  // Sync state to local storage on changes
  useEffect(() => {
    localStorage.setItem("duostudy_courses", JSON.stringify(courses));
    
    const currentCoursesStr = JSON.stringify(courses);
    if (currentCoursesStr === lastLoadedCoursesRef.current) {
      return;
    }

    if (user && isDataLoaded && !dbSyncing) {
      const saveCourses = async () => {
        console.log(`[Firestore Write] Syncing changes on courses reference database subcollection users/${user.uid}/courses`);
        try {
          const coursesColRef = collection(db, "users", user.uid, "courses");
          const coursesSnaps = await getDocs(coursesColRef).catch((err) => {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}/courses`);
          });
          
          const fsIds: string[] = [];
          coursesSnaps.forEach((doc) => {
            fsIds.push(doc.id);
          });

          const currentIds = courses.map(c => c.id);
          // Delete retirements
          for (const fsId of fsIds) {
            if (!currentIds.includes(fsId)) {
              console.log(`[Firestore Delete] Deleting retired course under users/${user.uid}/courses/${fsId}`);
              await deleteDoc(doc(db, "users", user.uid, "courses", fsId)).catch((err) => {
                handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/courses/${fsId}`);
              });
            }
          }

          // Save active courses
          for (const course of courses) {
            console.log(`[Firestore Write] Writing course under users/${user.uid}/courses/${course.id}`);
            await setDoc(doc(db, "users", user.uid, "courses", course.id), course).catch((err) => {
              handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/courses/${course.id}`);
            });
          }
          lastLoadedCoursesRef.current = currentCoursesStr;
          console.log(`[Firestore Sync] Successfully committed all course(s) to Firestore`);
        } catch (err) {
          console.error("Failed to save courses to firestore:", err);
        }
      };
      saveCourses();
    }
  }, [courses, user, dbSyncing, isDataLoaded]);

  useEffect(() => {
    localStorage.setItem("duostudy_active_course_id", activeCourseId);
  }, [activeCourseId]);

  useEffect(() => {
    localStorage.setItem("duostudy_progress", JSON.stringify(userProgress));
    
    const currentProgressStr = JSON.stringify(userProgress);
    if (currentProgressStr === lastLoadedProgressRef.current) {
      return;
    }

    if (user && isDataLoaded && !dbSyncing) {
      const saveProgress = async () => {
        console.log(`[Firestore Write] Syncing changes on progress representation under users/${user.uid}`);
        try {
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(userDocRef, {
            uid: user.uid,
            xp: userProgress.xp,
            gems: userProgress.gems,
            hearts: userProgress.hearts,
            streak: userProgress.streak,
            lastActiveDate: userProgress.lastActiveDate || new Date().toISOString(),
            completedLessons: userProgress.completedLessons,
            spacedRepetition: userProgress.spacedRepetition,
            lessonLevels: userProgress.lessonLevels || {},
            nodeStates: userProgress.nodeStates || {},
            seenExercises: userProgress.seenExercises || {},
            examDate: userProgress.examDate || "",
            competenceLevel: userProgress.competenceLevel || 1.0,
            streakFreezeActive: userProgress.streakFreezeActive,
            doubleXpActive: userProgress.doubleXpActive,
            dailyXp: userProgress.dailyXp || {},
            heartsLastRefilledAt: userProgress.heartsLastRefilledAt || null
          }).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          });
          lastLoadedProgressRef.current = currentProgressStr;
          console.log(`[Firestore Sync] Successfully committed user progress schema to users/${user.uid}`);
        } catch (err) {
          console.error("Failed to save progress to firestore:", err);
        }
      };
      saveProgress();
    }
  }, [userProgress, user, dbSyncing, isDataLoaded]);

  useEffect(() => {
    localStorage.setItem("duostudy_leaderboard", JSON.stringify(leaderboard));
  }, [leaderboard]);

  useEffect(() => {
    localStorage.setItem("duostudy_shop_items", JSON.stringify(shopItems));
  }, [shopItems]);

  // Periodic background check of heart regeneration (1 heart every 5 hours, max 5 hearts)
  useEffect(() => {
    const checkAndRegenerateHearts = () => {
      setUserProgress((prev) => {
        const hearts = prev.hearts;
        const lastRefilled = prev.heartsLastRefilledAt;
        
        // If hearts is already at max (5), clear the refill timestamp if it was set
        if (hearts >= 5) {
          if (lastRefilled) {
            return {
              ...prev,
              hearts: 5,
              heartsLastRefilledAt: undefined
            };
          }
          return prev;
        }

        // If we have less than 5 hearts, but no timer has been set, initialize it now
        if (!lastRefilled) {
          return {
            ...prev,
            heartsLastRefilledAt: new Date().toISOString()
          };
        }

        // Calculate hours elapsed
        const lastTime = new Date(lastRefilled).getTime();
        const now = Date.now();
        const elapsedMs = now - lastTime;
        const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

        if (elapsedMs >= FIVE_HOURS_MS) {
          const recoveredHeartsCount = Math.floor(elapsedMs / FIVE_HOURS_MS);
          if (recoveredHeartsCount > 0) {
            const nextHearts = Math.min(5, hearts + recoveredHeartsCount);
            const remainingMs = elapsedMs % FIVE_HOURS_MS;
            
            // Set the new anchor timestamp so we preserve the partial progress remainder of the 5h window
            const nextRefilledAt = nextHearts >= 5 
              ? undefined 
              : new Date(now - remainingMs).toISOString();

            return {
              ...prev,
              hearts: nextHearts,
              heartsLastRefilledAt: nextRefilledAt
            };
          }
        }
        
        return prev;
      });
    };

    // Run on startup/render
    checkAndRegenerateHearts();

    // Set up a periodic background interval checking every 15 seconds
    const intervalId = setInterval(checkAndRegenerateHearts, 15000);
    return () => clearInterval(intervalId);
  }, [userProgress.hearts, userProgress.heartsLastRefilledAt]);

  // Ref for course selection dropdown to detect click outside
  const courseDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setCourseDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Find active course details
  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];

  // Refill hearts action
  const handleRefillHearts = () => {
    if (userProgress.gems >= 50) {
      setUserProgress((prev) => ({
        ...prev,
        gems: prev.gems - 50,
        hearts: 5
      }));
      // trigger positive alert
      alert("✅ Vos vies ont été entièrement rechargées à 5/5 ! Unité prête pour l'apprentissage !");
    } else {
      alert("❌ Vous n'avez pas assez de gemmes. Complétez des leçons pour en gagner davantage gratuitement !");
    }
  };

  // Dedux a heart inside a lesson
  const handleDeductHeart = () => {
    setUserProgress((prev) => {
      const nextHearts = Math.max(0, prev.hearts - 1);
      return {
        ...prev,
        hearts: nextHearts,
        heartsLastRefilledAt: (nextHearts < 5 && !prev.heartsLastRefilledAt)
          ? new Date().toISOString()
          : prev.heartsLastRefilledAt
      };
    });
  };

  // Buy Shop items
  const handleBuyShopItem = (itemId: string, cost: number) => {
    if (userProgress.gems < cost) {
      alert("❌ Solde de gemmes insuffisant pour compléter cet achat.");
      return;
    }

    if (itemId === "shop-refill") {
      setUserProgress((prev) => ({
        ...prev,
        gems: prev.gems - cost,
        hearts: 5
      }));
      alert("❤️ Vos vies ont été rechargées avec succès !");
    } else if (itemId === "shop-multiplier") {
      setUserProgress((prev) => ({
        ...prev,
        gems: prev.gems - cost,
        doubleXpActive: true
      }));
      alert("⚡ Boost Double XP activé ! Gagnez deux fois plus de points de révision dans vos prochaines quêtes !");
    } else if (itemId === "shop-no-ads") {
      setUserProgress((prev) => ({
        ...prev,
        gems: prev.gems - cost,
        noAdsActive: true
      }));
      setShopItems((prev) => prev.map((item) => item.id === "shop-no-ads" ? { ...item, purchased: true } : item));
      alert("🚀 Pass' DuoStudy sans pubs activé ! Toutes les fenêtres et bannières publicitaires ont été définitivement désactivées. Merci pour votre soutien !");
    }
  };

  // Triggered when a lesson finishes successfully
  const handleLessonComplete = (
    xpEarned: number, 
    gemsEarned: number, 
    srsUpdated: SpacedRepetitionData,
    injectedReviewResults?: Record<string, boolean>,
    questionFirstTryResults?: Record<string, { correct: boolean, question: Question }>
  ) => {
    setUserProgress((prev) => {
      const completed = [...prev.completedLessons];
      if (!completed.includes(srsUpdated.lessonId)) {
        completed.push(srsUpdated.lessonId);
      }

      // Compute lesson levels update
      const currentLevel = prev.lessonLevels?.[srsUpdated.lessonId] ?? (prev.completedLessons.includes(srsUpdated.lessonId) ? 1 : 0);
      
      // Get dynamic lesson target level
      let targetLevel = 4;
      const foundLesson = courses.flatMap(c => c.units).flatMap(u => u.lessons).find(l => l.id === srsUpdated.lessonId);
      if (foundLesson) {
        targetLevel = getLessonTargetLevel(foundLesson);
      }
      
      const nextLevel = Math.min(targetLevel, currentLevel + 1);
      const newLevels = {
        ...(prev.lessonLevels || {}),
        [srsUpdated.lessonId]: nextLevel
      };

      // Set up spacing repetition modifications & nodeStates memory engine
      const updatedSpacedRepetition = { ...prev.spacedRepetition };
      updatedSpacedRepetition[srsUpdated.lessonId] = srsUpdated;

      const nextNodeStates = { ...(prev.nodeStates || {}) };
      
      // Update the main lesson's knowledge state (success!)
      // Hearts remaining acts as standard confidence scale (1 to 5)
      const userConfidence = prev.hearts || 4;
      nextNodeStates[srsUpdated.lessonId] = updateNodeState(
        nextNodeStates[srsUpdated.lessonId],
        true, // success
        userConfidence,
        2.5, // concept difficulty
        new Date()
      );

      // Save Seen exercises & first try results to progress database
      const nextSeenExercises = { ...(prev.seenExercises || {}) };
      if (questionFirstTryResults) {
        Object.entries(questionFirstTryResults).forEach(([qId, res]) => {
          nextSeenExercises[qId] = {
            exerciseId: qId,
            nodeId: srsUpdated.lessonId,
            seen: true,
            lastSeen: new Date().toISOString(),
            score: res.correct ? 1.0 : 0.0
          };
        });
      }

      let bonusXp = 0;

      if (injectedReviewResults) {
        Object.entries(injectedReviewResults).forEach(([lessonId, isCorrect]) => {
          const prevSrs = prev.spacedRepetition[lessonId];
          if (prevSrs) {
            // Re-calculate spaced repetition SM-2 metrics
            const sm2Result = calculateSM2(
              isCorrect ? 5 : 1,
              prevSrs.interval,
              prevSrs.reps,
              prevSrs.easeFactor
            );
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + sm2Result.interval);

            updatedSpacedRepetition[lessonId] = {
              ...prevSrs,
              interval: sm2Result.interval,
              reps: sm2Result.reps,
              easeFactor: sm2Result.easeFactor,
              nextReviewDate: nextDate.toISOString()
            };

            if (isCorrect) {
              bonusXp += 5; // Reward with 5 XP bonus per correct review question!
            }
          }

          // Update active recall node state too
          nextNodeStates[lessonId] = updateNodeState(
            nextNodeStates[lessonId],
            isCorrect,
            isCorrect ? 4 : 1,  // confidence factor
            2.5,                // concept difficulty
            new Date()
          );
        });
      }

      // Compute adaptive competency
      const dummyProgress = {
        ...prev,
        nodeStates: nextNodeStates
      };
      const updatedCompetence = calculateUserCompetenceRating(dummyProgress);

      const today = new Date().toISOString().split("T")[0];
      const todayXpTotal = (prev.dailyXp?.[today] || 0) + xpEarned + bonusXp;

      return {
        ...prev,
        completedLessons: completed,
        lessonLevels: newLevels,
        nodeStates: nextNodeStates,
        seenExercises: nextSeenExercises,
        competenceLevel: updatedCompetence,
        xp: prev.xp + xpEarned + bonusXp,
        gems: prev.gems + gemsEarned,
        spacedRepetition: updatedSpacedRepetition,
        doubleXpActive: false,
        dailyXp: {
          ...(prev.dailyXp || {}),
          [today]: todayXpTotal
        }
      };
    });

    // Sync leaderboard XP
    setLeaderboard((prev) => {
      return prev.map((usr) => {
        if (usr.isMe) {
          return { ...usr, xp: usr.xp + xpEarned };
        } else {
          const advances = Math.random() < 0.3;
          return advances ? { ...usr, xp: usr.xp + Math.floor(Math.random() * 15) + 10 } : usr;
        }
      });
    });

    setActiveLesson(null);

    // Dynamic congratulatory message
    let repairMessage = "";
    if (injectedReviewResults && Object.keys(injectedReviewResults).length > 0) {
      const correctCount = Object.values(injectedReviewResults).filter(Boolean).length;
      if (correctCount > 0) {
        repairMessage = `\n🧠 Révision Spirale réussie : vous avez consolidé ${correctCount} notion(s) passée(s) (+${correctCount * 5} XP de bonus de rappel !)`;
      }
    }
  };

  // Add customized study course from AI
  const handleAddCourse = (newCourse: Course) => {
    // Sanitize lesson IDs of dynamic course to guarantee uniqueness
    if (newCourse.id.startsWith("course-") && Array.isArray(newCourse.units)) {
      newCourse.units.forEach((unit) => {
        if (Array.isArray(unit.lessons)) {
          unit.lessons.forEach((lesson) => {
            if (lesson && typeof lesson === "object" && lesson.id) {
              const hasPrefix = lesson.id.startsWith(newCourse.id + "-") || lesson.id.startsWith("gen-");
              if (!hasPrefix) {
                lesson.id = `${newCourse.id}-${lesson.id}`;
              }
            }
          });
        }
      });
    }
    setCourses((prev) => [newCourse, ...prev]);
    setActiveCourseId(newCourse.id);
    setActiveTab("learn");
  };

  const handleAppendUnitsToCourse = (courseId: string, additionalUnits: any[], newSourceNotes?: string) => {
    // Sanitize lesson IDs of appended units to guarantee uniqueness
    if (courseId.startsWith("course-") && Array.isArray(additionalUnits)) {
      additionalUnits.forEach((unit) => {
        if (Array.isArray(unit.lessons)) {
          unit.lessons.forEach((lesson) => {
            if (lesson && typeof lesson === "object" && lesson.id) {
              const hasPrefix = lesson.id.startsWith(courseId + "-") || lesson.id.startsWith("gen-");
              if (!hasPrefix) {
                lesson.id = `${courseId}-${lesson.id}`;
              }
            }
          });
        }
      });
    }
    setCourses((prev) => {
      return prev.map((course) => {
        if (course.id === courseId) {
          const currentNotes = course.sourceNotes || "";
          const addedNotes = newSourceNotes ? `\n\n--- PARTIE 2 IMPORTÉE ---\n${newSourceNotes}` : "";
          
          // Let's filter out any units from additionalUnits that might already be present
          const existingUnitNumbers = course.units.map(u => u.unitNumber);
          const filteredUnits = additionalUnits.filter(u => !existingUnitNumbers.includes(u.unitNumber));

          return {
            ...course,
            units: [...course.units, ...filteredUnits],
            sourceNotes: (currentNotes + addedNotes).trim()
          };
        }
        return course;
      });
    });
    setActiveCourseId(courseId);
    setActiveTab("learn");
  };

  const handleSetCourseActive = (courseId: string) => {
    setActiveCourseId(courseId);
    setActiveTab("learn");
  };

  const handleRewardQuiz = (earnedXp: number, earnedGems: number) => {
    setUserProgress((prev) => {
      const today = new Date().toISOString().split("T")[0];
      const todayXpTotal = (prev.dailyXp?.[today] || 0) + earnedXp;
      return {
        ...prev,
        xp: prev.xp + earnedXp,
        gems: prev.gems + earnedGems,
        dailyXp: {
          ...(prev.dailyXp || {}),
          [today]: todayXpTotal
        }
      };
    });
  };

  const handleStartNextLesson = () => {
    if (!activeCourse || courses.length === 0) return;
    const activity = getBestNextActivity(userProgress, [activeCourse]);
    if (activity.lesson) {
      handleStartLessonWithSpiralling(activity.lesson, activity.unitTitle || "Session recommandée");
    } else {
      // Fallback
      if (activeCourse.units[0]?.lessons[0]) {
        handleStartLessonWithSpiralling(activeCourse.units[0].lessons[0], activeCourse.units[0].title);
      }
    }
  };

  // Start a lesson with spiral review injection and adaptive question phrasings
  const handleStartLessonWithSpiralling = (lesson: Lesson, unitTitle: string, sessionLength: number = 10) => {
    if (!activeCourse) return;
    setSelectedSessionLength(sessionLength);
    // Generate dynamic interleaved questions session using the forgetting curve optimizer restricted to this active course
    const dynamicQuestions = buildDynamicSessionQuestions(lesson, [activeCourse], userProgress, sessionLength);
    
    // Count how many questions are injected reviews
    const injectedCount = dynamicQuestions.filter((q) => q.isInjectedReview).length;

    setActiveLesson({
      ...lesson,
      questions: dynamicQuestions
    });
    setActiveLessonUnitTitle(unitTitle);
  };

  if (authLoading) {
    return (
      <div id="app-loading-container" className="h-screen bg-[#F7F9FA] flex flex-col items-center justify-center p-6 text-[#1C1C1C]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-bounce">
            <DuoStudyLogo size="xl" showText={false} />
          </div>
          <div className="text-center font-display tracking-tight text-2xl font-black text-[#2D2D2D] animate-pulse">
            Duo<span className="text-[#58cc02]">Study</span> <span className="text-gray-400 font-sans text-xs tracking-widest uppercase block mt-1">démarre...</span>
          </div>
          <div className="w-24 h-1.5 bg-[#E5E5E5] rounded-full overflow-hidden relative">
            <div className="bg-[#58cc02] h-full w-2/3 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Pure Client-side Routing support
  if (currentPath === "/") {
    return (
      <LandingPage 
        onNavigateToLearn={() => navigateTo("/learn")}
        onNavigateToAuth={() => navigateTo("/learn")}
        hasUser={!!user}
      />
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div id="app-root-container" className="h-screen bg-[#fdfdfd] text-[#4B4B4B] flex flex-col font-sans selection:bg-[#58cc02] selection:text-white overflow-hidden">
      
      {/* MOBILE HUD INTERACTION HEADER */}
      <header className="md:hidden bg-white border-b-2 border-[#E5E5E5] p-3 flex items-center justify-between sticky top-0 z-40 text-[#4B4B4B]">
        <div className="flex items-center gap-2">
          <DuoStudyLogo size="sm" />
        </div>

        {/* Quick mobile indicators */}
        <div className="flex items-center gap-3 text-xs font-black text-[#4B4B4B]">
          <span title="Gemmes">💎 {userProgress.gems}</span>
          <span title="Vies">❤️ {userProgress.hearts}</span>
        </div>

        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-[#777777] hover:text-[#4B4B4B] cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* FULL RESPONSIVE SHELL STRUCTURE */}
      <div id="app-shell-body" className="flex flex-1 relative overflow-hidden">
        
        {/* LEFT SIDEBAR - Desktop */}
        <div className="hidden md:block">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            hearts={userProgress.hearts}
            gems={userProgress.gems}
            streak={userProgress.streak}
            xp={userProgress.xp}
            user={user}
          />
        </div>

        {/* MOBILE NAVIGATION SIDEBAR EXPANSION DRAWER */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 md:hidden animate-fade-in"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-64 h-full bg-white border-r-2 border-[#E5E5E5] flex flex-col"
            >
              <div className="p-4 flex justify-between items-center border-b-2 border-[#E5E5E5]">
                <DuoStudyLogo size="sm" />
                <button onClick={() => setMobileMenuOpen(false)} className="text-[#777777] hover:text-[#4B4B4B]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2 space-y-2.5 flex-1 overflow-y-auto">
                {[
                  { id: "learn", label: "🗺️ COURS" },
                  { id: "add-course", label: "📤 IMPORTER UN COURS" },
                  { id: "quiz", label: "✍️ RAPID-QUIZ" },
                  { id: "profile", label: "📊 TABLEAU DE BORD" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl font-black text-xs tracking-wider transition-all ${
                      activeTab === tab.id
                        ? "bg-[#58cc02]/15 text-[#46a302] border-2 border-[#58cc02]"
                        : "text-gray-500 hover:bg-[#F7F7F7]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Mobile Drawer User Footer */}
              {(() => {
                const mobName = user ? (user.displayName || user.email?.split("@")[0] || "Étudiant") : "Alex Student";
                const fmtName = mobName.split(/[._\-+]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ").replace(/[0-9]/g, "");
                const pts = fmtName.trim().split(/\s+/);
                const init = pts.length >= 2 ? (pts[0].charAt(0) + pts[1].charAt(0)).toUpperCase() : pts[0].substring(0, 2).toUpperCase();
                return (
                  <div 
                    onClick={() => {
                      setActiveTab("profile");
                      setMobileMenuOpen(false);
                    }}
                    className="p-4 border-t-2 border-[#E5E5E5] flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition-all"
                  >
                    {user?.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Avatar" 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#58cc02]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#58cc02]/10 border-2 border-[#58cc02]/25 flex items-center justify-center text-sm font-black text-[#58cc02] shrink-0 select-none">
                        {init}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-black text-[#4B4B4B] truncate font-sans">
                        {fmtName}
                      </span>
                      <span className="text-[9px] font-black text-[#58cc02] uppercase tracking-wider font-sans leading-none mt-1">
                        {user ? "Étudiant Actif" : "Évaluation Gratuite"}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* CENTER VIEWPORT : DYNAMIC SCROLL TAB STAGE */}
        <main className="flex-1 flex flex-col bg-[#fdfdfd] overflow-hidden">
          
          {/* HORIZONTAL STICKY HEADER BAR */}
          <div className="border-b-2 border-gray-100 bg-white py-3.5 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30">
            
            {/* Left drop down selector to switch active course */}
            <div ref={courseDropdownRef} className="relative min-w-0 flex-1 max-w-[200px] xs:max-w-[280px] sm:max-w-xs md:max-w-md lg:max-w-lg mr-3">
              <button 
                onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-50 border-2 border-gray-200 rounded-2xl text-xs font-black text-slate-700 cursor-pointer select-none transition-all"
              >
                <span className="flex items-center gap-2 truncate text-left block">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    activeCourse?.themeColor === "emerald" ? "bg-emerald-500" :
                    activeCourse?.themeColor === "rose" ? "bg-rose-500" :
                    activeCourse?.themeColor === "amber" ? "bg-amber-500" :
                    activeCourse?.themeColor === "sky" ? "bg-[#1CB0F6]" :
                    activeCourse?.themeColor === "violet" ? "bg-violet-500" :
                    "bg-indigo-500"
                  }`} />
                  <span className="truncate">{activeCourse?.courseName || "Aucun cours"}</span>
                </span>
                <span className="text-[9px] text-gray-400 shrink-0">▼</span>
              </button>
              
              {courseDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border-2 border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  {courses.length > 0 ? (
                    courses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          handleSetCourseActive(c.id);
                          setCourseDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 text-left px-4 py-2.5 hover:bg-gray-50 text-xs font-black text-slate-700 block border-b last:border-0 border-gray-100"
                      >
                        <span className="flex items-center gap-2 truncate w-full">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            c.themeColor === "emerald" ? "bg-emerald-500" :
                            c.themeColor === "rose" ? "bg-rose-500" :
                            c.themeColor === "amber" ? "bg-amber-500" :
                            c.themeColor === "sky" ? "bg-[#1CB0F6]" :
                            c.themeColor === "violet" ? "bg-violet-500" :
                            "bg-indigo-500"
                          }`} />
                          <span className="truncate">{c.courseName}</span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-xs font-bold text-gray-400 text-center uppercase tracking-wider">
                      Aucun cours importé
                    </div>
                  )}
                </div>
              )}
            </div>



            {/* Right Quick Actions */}
            <div className="flex items-center gap-3.5 sm:gap-5 shrink-0 ml-1">
              {activeTab !== "add-course" && (
                <button
                  onClick={() => setActiveTab("add-course")}
                  className="hidden sm:block px-3.5 py-1.5 border-2 border-gray-200 hover:bg-slate-50 hover:border-gray-300 text-[10px] font-black uppercase text-slate-500 rounded-2xl cursor-pointer select-none transition-all shrink-0"
                >
                  + Importer
                </button>
              )}

              <button
                onClick={handleStartNextLesson}
                className="px-4 py-1.5 bg-[#58cc02] border-b-4 border-[#388301] hover:brightness-110 active:translate-y-0.5 active:border-b-0 text-white font-black text-[10px] rounded-2xl uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-sm"
              >
                <span>▶</span>
                <span>Continuer</span>
              </button>
            </div>

          </div>

          {/* Dynamic Scroll Tab Area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5">
            {activeTab === "learn" && (
              <div className="space-y-6">
                <LearnPath
                  course={activeCourse || null}
                  completedLessons={userProgress.completedLessons}
                  srsData={userProgress.spacedRepetition}
                  onStartLesson={handleStartLessonWithSpiralling}
                  hearts={userProgress.hearts}
                  lessonLevels={userProgress.lessonLevels}
                  nodeStates={userProgress.nodeStates}
                  progress={userProgress}
                  onUpdateExamDate={(dateStr) => {
                    setUserProgress((prev) => ({
                      ...prev,
                      examDate: dateStr
                    }));
                  }}
                  mobileMenuOpen={mobileMenuOpen}
                  onSwitchTab={setActiveTab}
                />
                <AdBlock type="horizontal" />
              </div>
            )}

            {activeTab === "add-course" && (
              <AddCourseTab
                onAddCourse={handleAddCourse}
                onAppendUnitsToCourse={handleAppendUnitsToCourse}
                onSetCourseActive={handleSetCourseActive}
                availableCourses={courses}
                activeCourseId={activeCourseId}
              />
            )}

            {activeTab === "quiz" && activeCourse && (
              <RapidQuizTab
                activeCourse={activeCourse}
                onReward={handleRewardQuiz}
                hearts={userProgress.hearts}
                onDeductHeart={handleDeductHeart}
              />
            )}

            {activeTab === "profile" && (
              <ProfileTab
                progress={userProgress}
                courses={courses}
                completedLessons={userProgress.completedLessons}
                onUpdateExamDate={(dateStr) => {
                  setUserProgress(prev => ({
                    ...prev,
                    examDate: dateStr
                  }));
                }}
              />
            )}

            {activeTab === "shop" && (
              <ShopTab
                gems={userProgress.gems}
                onBuyItem={handleBuyShopItem}
                shopItems={shopItems}
                hearts={userProgress.hearts}
                streakFreezeActive={userProgress.streakFreezeActive}
                doubleXpActive={userProgress.doubleXpActive}
              />
            )}

            {(activeTab === "admin-users" || activeTab === "admin-config") && (
              <AdminTabs
                user={user}
                activeTab={activeTab as any}
              />
            )}
          </div>
        </main>

        {/* RIGHT STATS SIDE PANEL - Desktop */}
        {!["admin-users", "admin-config"].includes(activeTab) && (
          <div className="hidden lg:block">
            <StatsBar
              xp={userProgress.xp}
              gems={userProgress.gems}
              hearts={userProgress.hearts}
              streak={userProgress.streak}
              leaderboard={leaderboard.map((item) => item.isMe ? { ...item, xp: userProgress.xp } : item)}
              activeCourseName={activeCourse ? activeCourse.courseName : ""}
              doubleXpActive={userProgress.doubleXpActive}
              onRefillHearts={handleRefillHearts}
              dailyXp={userProgress.dailyXp}
            />
          </div>
        )}

      </div>

      {/* FULLSCREEN ACTIVE LESSON OVERLAY SYSTEM */}
      {activeLesson && (
        <ActiveLesson
          lesson={activeLesson}
          courseId={activeCourseId}
          unitTitle={activeLessonUnitTitle}
          doubleXp={userProgress.doubleXpActive}
          onComplete={handleLessonComplete}
          onCancel={() => setActiveLesson(null)}
          hearts={userProgress.hearts}
          onDeductHeart={handleDeductHeart}
          sessionLength={selectedSessionLength}
        />
      )}

    </div>
  );
}
