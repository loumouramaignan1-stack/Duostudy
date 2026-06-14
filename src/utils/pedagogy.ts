import { Course, Lesson, Question, UserProgress, NodeKnowledgeState } from "../types";

// Constant for logarithmic decay
const LN_2 = Math.log(2);

/**
 * Calculates current recall probability based on the forgetting curve:
 * P(recall) = e^(-ln(2) * t / h)
 */
export function calculateRecallProbability(state: NodeKnowledgeState, targetDate: Date = new Date()): number {
  const lastDate = new Date(state.lastReviewDate);
  const t = Math.max(0, (targetDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)); // t in days
  const h = Math.max(0.1, state.halfLife); // half-life in days
  return Math.exp(-LN_2 * t / h);
}

/**
 * Returns current visible mastery adjusted for memory decay.
 */
export function getDecayedMastery(state: NodeKnowledgeState, targetDate: Date = new Date()): number {
  const recall = calculateRecallProbability(state, targetDate);
  return Math.min(100, Math.max(0, state.mastery * recall));
}

/**
 * Default initial knowledge state for a node.
 */
export function createDefaultNodeState(curDate: Date = new Date()): NodeKnowledgeState {
  return {
    mastery: 0,
    confidence: 3,
    halfLife: 2.5, // 2.5 days initial half-life
    recallProbability: 1.0,
    reviewCount: 0,
    successCount: 0,
    failureCount: 0,
    lastReviewDate: curDate.toISOString(),
    nextReviewDate: curDate.toISOString(),
  };
}

/**
 * Regression model for updating half-life and mastery values.
 */
export function updateNodeState(
  currentState: NodeKnowledgeState | undefined,
  success: boolean,
  confidence: number, // 1 to 5
  conceptDifficulty: number, // 1 to 5 (default 2.5)
  curDate: Date = new Date()
): NodeKnowledgeState {
  const state = currentState ? { ...currentState } : createDefaultNodeState(curDate);
  
  state.reviewCount += 1;
  const oldHalfLife = state.halfLife;

  if (success) {
    state.successCount += 1;
    state.confidence = Math.min(5, Math.max(1, confidence));
    
    // Active recall success boosts mastery significantly
    state.mastery = Math.min(100, state.mastery + (100 - state.mastery) * 0.45 + 10);
    
    // Half-Life Regression formula: Incorporate achievements, failures, difficulty, and delay
    const successWeight = 1.0 + 0.3 * state.successCount;
    const failureWeight = 1.0 / (1.0 + 0.5 * state.failureCount);
    const difficultyFactor = 1.0 / Math.max(0.4, conceptDifficulty / 2.5); // lower difficulty -> longer half-life
    
    // Reward spaced retrieval (testing yourself right before forgetting increases memory strength more)
    const lastDate = new Date(state.lastReviewDate);
    const tSinceLast = Math.max(0, (curDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    const delayReward = Math.min(3.0, 1.0 + (tSinceLast / Math.max(1.0, oldHalfLife)));

    let newHalfLife = oldHalfLife * (1.5 + 0.8 * (state.confidence / 5)) * delayReward * difficultyFactor * (successWeight / (successWeight + failureWeight * 0.5));
    
    state.halfLife = Math.min(180, Math.max(1.0, newHalfLife)); // cap half-life at 180 days
  } else {
    state.failureCount += 1;
    // Active recall failure reduces mastery
    state.mastery = Math.max(0, state.mastery * 0.4);
    
    // Penalize half-life
    let newHalfLife = oldHalfLife * 0.45;
    state.halfLife = Math.max(0.5, newHalfLife);
  }

  // Update dates
  state.lastReviewDate = curDate.toISOString();
  state.recallProbability = calculateRecallProbability(state, curDate);
  
  const nextDate = new Date(curDate);
  nextDate.setDate(nextDate.getDate() + Math.max(1, Math.round(state.halfLife)));
  state.nextReviewDate = nextDate.toISOString();

  return state;
}

/**
 * Calculates user competency rate.
 * Ideal target success bounds: 70% to 85%
 */
export function calculateUserCompetenceRating(user: UserProgress): number {
  let totalReviews = 0;
  let totalSuccess = 0;
  if (user.nodeStates) {
    Object.values(user.nodeStates).forEach((node) => {
      totalReviews += node.reviewCount;
      totalSuccess += node.successCount;
    });
  }
  if (totalReviews === 0) return 1.0; // standard starting competence
  const successPct = totalSuccess / totalReviews;

  // Adaptive feedback adjustments
  if (successPct > 0.85) {
    return Math.min(2.0, (user.competenceLevel ?? 1.0) * 1.05); // boost competency (increase difficulty)
  } else if (successPct < 0.70) {
    return Math.max(0.5, (user.competenceLevel ?? 1.0) * 0.95); // drop competency (decrease difficulty)
  }
  return user.competenceLevel ?? 1.0;
}

/**
 * Predictive model: Forecast the student's exam score (0 to 100) based on target examDate.
 */
export function predictExamScore(user: UserProgress, courses: Course[]): number {
  const targetDateStr = user.examDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const targetDate = new Date(targetDateStr);
  
  let totalNodes = 0;
  let runningScoreSum = 0;

  courses.forEach((course) => {
    course.units.forEach((unit) => {
      unit.lessons.forEach((lesson) => {
        totalNodes++;
        const state = user.nodeStates?.[lesson.id];
        if (state) {
          const decayed = getDecayedMastery(state, targetDate);
          runningScoreSum += decayed;
        } else {
          // unstarted nodes are predicted at 0
          runningScoreSum += 0;
        }
      });
    });
  });

  if (totalNodes === 0) return 0;
  return Math.round(runningScoreSum / totalNodes);
}

/**
 * Optimizes the Expected Exam Score and yields the most beneficial next learning path action.
 */
export function getBestNextActivity(
  user: UserProgress, 
  courses: Course[]
): { 
  type: 'new_node' | 'review' | 'custom_session' | 'exam_sim'; 
  lesson?: Lesson; 
  courseId?: string; 
  unitTitle?: string; 
  reason: string; 
  expectedScoreImprovement: number;
} {
  const now = new Date();
  const examDateStr = user.examDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const examDate = new Date(examDateStr);

  const daysToExam = Math.max(1, (examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  let bestAction: any = {
    type: 'new_node',
    reason: "Commencez un nouveau concept pour élargir vos connaissances fondamentales.",
    expectedScoreImprovement: 0
  };

  // 1. Evaluate possible "Review of an old fragile concept"
  let highestUrgency = 0;
  let fallbackReview: any = null;

  courses.forEach((course) => {
    course.units.forEach((unit) => {
      unit.lessons.forEach((lesson) => {
        const state = user.nodeStates?.[lesson.id];
        if (state) {
          const recall = calculateRecallProbability(state, now);
          const decayed = getDecayedMastery(state, now);
          
          // Priority metrics: Urgency = (1 - recall) * (criticality multiplier in exam window)
          const isExamClose = daysToExam <= 7;
          const criticalityMultiplier = isExamClose ? 2.5 : 1.0;
          const urgency = (1.0 - recall) * criticalityMultiplier + (100 - decayed) / 100;

          if (urgency > highestUrgency) {
            highestUrgency = urgency;
            fallbackReview = {
              type: 'review',
              lesson,
              courseId: course.id,
              unitTitle: unit.title,
              reason: `Révision de '${lesson.title}' : votre probabilité de rappel est tombée à ${Math.round(recall * 100)}%. Répéter maintenant doublera la rétention pour le jour de l'épreuve !`,
              expectedScoreImprovement: Math.round((100 - decayed) * 0.4)
            };
          }
        }
      });
    });
  });

  // 2. Evaluate "Next Lock/Prerequisite Unstarted Node"
  let nextNewNode: any = null;
  for (const course of courses) {
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        const state = user.nodeStates?.[lesson.id];
        // If unstarted
        if (!state || state.successCount === 0) {
          nextNewNode = {
            type: 'new_node',
            lesson,
            courseId: course.id,
            unitTitle: unit.title,
            reason: `Nouveau concept '${lesson.title}' : l'élargissement de votre base théorique est prioritaire pour débloquer les notions avancées !`,
            expectedScoreImprovement: 25 // base potential improvement score weight
          };
          break;
        }
      }
      if (nextNewNode) break;
    }
    if (nextNewNode) break;
  }

  // 3. Select based on exam proximity and urgency
  if (daysToExam < 3) {
    // Exam simulation takes immediate precedence if exam is in < 3 days
    return {
      type: 'exam_sim',
      reason: `⚠️ EXAMEN COLLÉ DANS ${Math.round(daysToExam)} JOURS ! Le simulateur de mélange intensif de l'intégralité des chapitres est recommandé pour minimiser le coût d'oubli passif.`,
      expectedScoreImprovement: 35
    };
  }

  if (highestUrgency > 1.2 && fallbackReview) {
    return fallbackReview;
  }

  if (nextNewNode) {
    return nextNewNode;
  }

  // Fallback to custom session or exam practice
  return bestAction;
}

/**
 * Assembles a dynamic multi-concept session mixing multiple sources.
 * - 20% New nodes (starting lesson)
 * - 50% Scheduled reviews
 * - 20% Fragile nodes / concepts
 * - 10% Exam-simulation nodes
 * Supports customizable target session lengths for longer revision sessions.
 */
/**
 * Generates a stable and unique identifier for any given question.
 */
export function getQuestionId(question: Question, lessonId?: string): string {
  if ((question as any).id) return (question as any).id;
  const baseText = question.question || "";
  const prefix = lessonId ? `${lessonId}_` : "";
  let hash = 0;
  for (let i = 0; i < baseText.length; i++) {
    const char = baseText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${prefix}${Math.abs(hash)}`;
}

export function findSimilarityScore(q1: Question, q2: Question): number {
  const getCleanWords = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4); // only keep significant semantic terms
  };

  const w1 = getCleanWords(q1.question || "");
  const w2 = getCleanWords(q2.question || "");
  
  if (w1.length === 0 || w2.length === 0) return 0;
  
  // Count overlapping key terms
  let matchCount = 0;
  w1.forEach((word) => {
    if (w2.includes(word)) matchCount++;
  });
  
  // Strong penalty weight if they share the exact same answer
  const answerOverlap = q1.answer && q2.answer && q1.answer.trim().toLowerCase() === q2.answer.trim().toLowerCase();
  if (answerOverlap) matchCount += 3;
  
  return matchCount / Math.max(w1.length, w2.length);
}

export function staggerQuestions(questions: Question[]): Question[] {
  if (questions.length <= 2) return questions;
  
  const result: Question[] = [];
  const pool = [...questions];
  
  // Seed with first question
  result.push(pool.shift()!);
  
  while (pool.length > 0) {
    let bestIdx = 0;
    let minPenalty = Infinity;
    
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      let penalty = 0;
      
      // Weight 2.0: consecutive similarity
      if (result.length >= 1) {
        const last = result[result.length - 1];
        penalty += findSimilarityScore(candidate, last) * 2.5;
        if (candidate.type === last.type) {
          penalty += 0.6; // penalty for identical format (eg choice, choice) back-to-back
        }
      }
      
      // Weight 1.0: distance of 2 questions
      if (result.length >= 2) {
        const prevLast = result[result.length - 2];
        penalty += findSimilarityScore(candidate, prevLast) * 1.2;
        if (candidate.type === prevLast.type) {
          penalty += 0.3;
        }
      }
      
      if (penalty < minPenalty) {
        minPenalty = penalty;
        bestIdx = i;
      }
    }
    
    result.push(pool.splice(bestIdx, 1)[0]);
  }
  
  return result;
}

export function buildDynamicSessionQuestions(
  startingLesson: Lesson,
  courses: Course[],
  userProgress: UserProgress,
  targetLength: number = 10
): Question[] {
  const now = new Date();
  const currentCompetence = userProgress.competenceLevel ?? 1.0;

  // If exam is very close (e.g. < 7 days), automatically boost standard/intensive review depth
  let actualTargetLength = targetLength;
  if (userProgress.examDate) {
    const target = new Date(userProgress.examDate);
    const daysLeft = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0 && daysLeft <= 7 && targetLength >= 10) {
      actualTargetLength = targetLength === 10 ? 14 : 18;
    }
  }

  // Banque d'exercices + Tirage Aléatoire Contrôlé :
  // Prioritize unseen, then low performance, then oldest seen questions, with active cooling periods
  const poolQuestions = startingLesson.questions || [];
  const requiredExercises = Math.min(poolQuestions.length, Math.max(3, Math.ceil(poolQuestions.length * 0.6)));

  const sortedPool = [...poolQuestions].sort((a, b) => {
    const aId = getQuestionId(a, startingLesson.id);
    const bId = getQuestionId(b, startingLesson.id);
    const aRecord = userProgress.seenExercises?.[aId];
    const bRecord = userProgress.seenExercises?.[bId];

    // Compute temporal penalty for very recent evaluations
    const getTemporalPriority = (record: any) => {
      if (!record) return 0; // high priority for unseen
      const lastSeenTime = new Date(record.lastSeen).getTime();
      const hoursSinceSeen = (now.getTime() - lastSeenTime) / (1000 * 60 * 60);

      if (record.score >= 1.0) {
        // Correct answer: 12h cooldown period
        if (hoursSinceSeen < 12) {
          return 100000 + (12 - hoursSinceSeen) * 10000;
        }
      } else {
        // Failed answer: 3 minutes guard to avoid immediate repetition on click restart
        if (hoursSinceSeen < 0.05) {
          return 50000;
        }
      }
      return 0;
    };

    const aPenalty = getTemporalPriority(aRecord);
    const bPenalty = getTemporalPriority(bRecord);

    if (aPenalty !== bPenalty) {
      return aPenalty - bPenalty;
    }

    // 1. Unseen first
    if (!aRecord && bRecord) return -1;
    if (aRecord && !bRecord) return 1;
    if (!aRecord && !bRecord) {
      // both unseen: randomize slightly but stably using coordinates
      return Math.sin(aId.length) - Math.cos(bId.length);
    }

    // 2. Lower score first
    if (aRecord.score !== bRecord.score) {
      return aRecord.score - bRecord.score;
    }

    // 3. Oldest seen first
    const aTime = new Date(aRecord.lastSeen).getTime();
    const bTime = new Date(bRecord.lastSeen).getTime();
    return aTime - bTime;
  });

  const startingQuestions = sortedPool.slice(0, requiredExercises);

  const possibleReviews: { q: Question; lesson: Lesson; courseName: string }[] = [];
  const possibleFragile: { q: Question; lesson: Lesson; courseName: string }[] = [];
  const otherSims: { q: Question; lesson: Lesson; courseName: string }[] = [];

  const currentCourse = courses.find((c) =>
    c.units.some((u) => u.lessons.some((l) => l.id === startingLesson.id))
  );

  if (currentCourse) {
    currentCourse.units.forEach((unit) => {
      unit.lessons.forEach((lesson) => {
        if (lesson.id === startingLesson.id) return;
  
        const state = userProgress.nodeStates?.[lesson.id];
        lesson.questions.forEach((q) => {
          const item = { q, lesson, courseName: currentCourse.courseName };
          if (state) {
            const recall = calculateRecallProbability(state, now);
            if (recall <= 0.70) {
              possibleReviews.push(item);
            } else if (state.mastery < 65 || state.failureCount > state.successCount) {
              possibleFragile.push(item);
            } else {
              otherSims.push(item);
            }
          } else {
            otherSims.push(item);
          }
        });
      });
    });
  }

  let finalQuestions: Question[] = [];

  const currentLevel = userProgress.lessonLevels?.[startingLesson.id] ?? (userProgress.completedLessons.includes(startingLesson.id) ? 1 : 0);
  const adaptedStarting = startingQuestions.map((q) => {
    let aq = { ...q };
    if (aq.options && aq.options.length > 2) {
      if (currentCompetence < 0.75) {
        aq.options = [aq.answer, ...aq.options.filter(o => o !== aq.answer).slice(0, 2)].sort(() => Math.random() - 0.5);
      } else if (currentCompetence > 1.3 && aq.options.length === 3) {
        aq.options = [...aq.options].sort(() => Math.random() - 0.5);
      }
    }
    return aq;
  });

  finalQuestions.push(...adaptedStarting);

  const shuffledReviews = [...possibleReviews].sort(() => Math.random() - 0.5);
  const shuffledFragile = [...possibleFragile].sort(() => Math.random() - 0.5);
  const shuffledSims = [...otherSims].sort(() => Math.random() - 0.5);

  let reviewIdx = 0;
  let fragileIdx = 0;
  let simIdx = 0;

  while (finalQuestions.length < actualTargetLength) {
    let addedAny = false;

    if (reviewIdx < shuffledReviews.length && finalQuestions.length < actualTargetLength) {
      const item = shuffledReviews[reviewIdx++];
      finalQuestions.unshift({
        ...item.q,
        isInjectedReview: true,
        originalLessonId: item.lesson.id,
        originalLessonTitle: item.lesson.title,
        originalCourseName: item.courseName,
        question: `🧠 [RÉVISION PLANIFIÉE] ${item.q.question}`
      });
      addedAny = true;
    }

    if (fragileIdx < shuffledFragile.length && finalQuestions.length < actualTargetLength) {
      const item = shuffledFragile[fragileIdx++];
      finalQuestions.push({
        ...item.q,
        isInjectedReview: true,
        originalLessonId: item.lesson.id,
        originalLessonTitle: item.lesson.title,
        originalCourseName: item.courseName,
        question: item.q.question
      });
      addedAny = true;
    }

    if (simIdx < shuffledSims.length && finalQuestions.length < actualTargetLength) {
      const item = shuffledSims[simIdx++];
      finalQuestions.push({
        ...item.q,
        isInjectedReview: true,
        originalLessonId: item.lesson.id,
        originalLessonTitle: item.lesson.title,
        originalCourseName: item.courseName,
        question: item.q.question
      });
      addedAny = true;
    }

    if (!addedAny) break;
  }

  // Remove duplicates
  const seenQ = new Set<string>();
  finalQuestions = finalQuestions.filter((q) => {
    if (seenQ.has(q.question)) return false;
    seenQ.add(q.question);
    return true;
  });

  // Stagger questions so that similar concepts and formats are separated
  finalQuestions = staggerQuestions(finalQuestions);

  return finalQuestions;
}
