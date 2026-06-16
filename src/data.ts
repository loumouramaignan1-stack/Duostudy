import { Course, LeaderboardUser, ShopItem, SpacedRepetitionData, Question } from "./types";

// Spaced Repetition SM-2 logic
export function calculateSM2(
  quality: number, // 0 to 5 or boolean (simplified to: correct = 5, incorrect = 1)
  prevInterval: number,
  prevReps: number,
  prevEaseFactor: number
): { interval: number; reps: number; easeFactor: number } {
  let interval: number;
  let reps: number;
  let easeFactor: number;

  if (quality >= 3) {
    // Correct answer
    if (prevReps === 0) {
      interval = 1;
    } else if (prevReps === 1) {
      interval = 3; // review in 3 days
    } else {
      interval = Math.ceil(prevInterval * prevEaseFactor);
    }
    reps = prevReps + 1;
  } else {
    // Incorrect answer
    reps = 0;
    interval = 1; // review tomorrow
  }

  // Adjust EF based on quality
  easeFactor = prevEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  return { interval, reps, easeFactor };
}

// Initial default courses
export const DEFAULT_COURSES: Course[] = [
  {
    id: "comp-course-cardio-1",
    courseName: "Cardiologie & Système Circulatoire",
    themeColor: "indigo",
    createdAt: new Date().toISOString(),
    sourceNotes: "L'anatomie et le fonctionnement du coeur humain, les foyers cliniques et les bases de l'ECG.",
    units: [
      {
        unitNumber: 1,
        title: "Unité 1 : Anatomie fondamentale du coeur",
        description: "Identifier les cavités, valves et cycles de pressions sanguines.",
        lessons: [
          {
            id: "cardio-u1-l1",
            title: "Les 4 Cavités Cardiaques",
            type: "vocab",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Combien le coeur humain possède-t-il de cavités séparées ?",
                options: ["2 cavités", "3 cavités", "4 cavités (2 oreillettes et 2 ventricules)", "1 seule cavité de pompage"],
                answer: "4 cavités (2 oreillettes et 2 ventricules)",
                explanation: "Le coeur humain possède exactement 4 cavités : deux oreillettes en haut qui reçoivent le sang, et deux ventricules en bas qui l'éjectent."
              },
              {
                type: "true_false",
                question: "L'oreillette droite reçoit du sang pauvre en oxygène arrivant du corps via les veines caves.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Félicitations ! L'oreillette droite collecte le sang désoxygéné pour l'envoyer vers le ventricule droit, puis vers les poumons."
              },
              {
                type: "fill",
                question: "Les cavités inférieures qui propulsent le sang hors du coeur s'appellent les _______.",
                options: [],
                answer: "ventricules",
                explanation: "Exact ! Les ventricules sont les deux pompes musculaires principales situées dans la partie inférieure du coeur."
              }
            ]
          },
          {
            id: "cardio-u1-l2",
            title: "Systole & Diastole",
            type: "quiz",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Quelle phase correspond à la contraction et à l'éjection du sang par les ventricules ?",
                options: ["La diastole", "La systole", "La phase d'écoulement passif", "L'anémie"],
                answer: "La systole",
                explanation: "La systole est la phase active de contraction du coeur où le sang est vigoureusement propulsé dans les artères."
              },
              {
                type: "true_false",
                question: "Pendant la diastole, le muscle cardiaque se dilate et se remplit à nouveau de sang.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Tout à fait ! La diastole est la phase de repos et de remplissage des cavités cardiaques."
              },
              {
                type: "match",
                question: "Diastole",
                options: [],
                answer: "Phase de relaxation et de remplissage du muscle cardiaque.",
                explanation: "Validé ! C'est le moment d'alimentation du myocarde lui-même."
              }
            ]
          },
          {
            id: "cardio-u1-l3",
            title: "Valves et Échappement",
            type: "flashcard",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Quelle valve empêche le reflux de sang du ventricule gauche vers l'oreillette gauche ?",
                options: ["La valve tricuspide", "La valve mitrale", "La valve pulmonaire", "La valve aortique"],
                answer: "La valve mitrale",
                explanation: "La valve mitrale (ou bicuspide) est la valve gauche centrale régulant le reflux vers l'oreillette gauche."
              },
              {
                type: "true_false",
                question: "Les bruits d'auscultation cardiaque sont causés par la fermeture brusque des valves.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Exact ! Le classique 'poum-ta' correspond d'abord à la fermeture des valves auriculo-ventriculaires, puis des valves sigmoïdes."
              },
              {
                type: "fill",
                question: "La valve située à la sortie du ventricule droit vers les poumons est la valve _______.",
                options: [],
                answer: "pulmonaire",
                explanation: "Exact, la valve pulmonaire permet d'expulser le sang vers l'artère pulmonaire sans reflux possible."
              }
            ]
          }
        ]
      },
      {
        unitNumber: 2,
        title: "Unité 2 : Cycles de pression et régulation",
        description: "Comprendre les foyers auscultatoires et le contrôle de l'hémodynamique.",
        lessons: [
          {
            id: "cardio-u2-l1",
            title: "Pression Artérielle",
            type: "vocab",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Comment se définit la pression artérielle systolique habituelle ?",
                options: ["La pression minimale lors de la relaxation", "La pression maximale mesurée lors de la contraction ventriculaire", "Le rythme moyen des pulsations", "La vitesse de fuite capillaire"],
                answer: "La pression maximale mesurée lors de la contraction ventriculaire",
                explanation: "La pression systolique est le pic de pression exercé sur de grosses artères lors de la contraction du ventricule gauche."
              },
              {
                type: "true_false",
                question: "Une pression artérielle normale pour un adulte au repos avoisine environ 120/80 mmHg.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Exact ! 120 correspond à la systole et 80 à la diastole."
              },
              {
                type: "fill",
                question: "Le tensiomètre mesure le niveau de pression sanguine en millimètres de _______.",
                options: [],
                answer: "mercure",
                explanation: "Oui, l'unité de mesure médicale classique de la pression reste le mmHg (millimètre de mercure)."
              }
            ]
          },
          {
            id: "cardio-u2-l2",
            title: "Régulation Nerveuse",
            type: "quiz",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Quel système nerveux autonome ralentit la fréquence cardiaque ?",
                options: ["Le système sympathique", "Le système parasympathique", "Le système sensoriel somatique", "Le cortex visuel"],
                answer: "Le système parasympathique",
                explanation: "Le système parasympathique (via le nerf vague/X) ralentit le pouls, agissant comme le frein de l'organisme."
              },
              {
                type: "true_false",
                question: "L'adrénaline sécrétée en cas de stress accélère la force contractile du coeur.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Vrai, l'adrénaline active les récepteurs bêta-1 cardiaques, augmentant rythme et force de contraction."
              },
              {
                type: "match",
                question: "Nerf vague",
                options: [],
                answer: "Nerf crânien responsable de la régulation parasympathique cardio-modératrice.",
                explanation: "Correct ! Son activation diminue la fréquence de décharge du noeud sinusal."
              }
            ]
          },
          {
            id: "cardio-u2-l3",
            title: "Examen du cycle",
            type: "flashcard",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Qu'est-ce que le débit cardiaque moyen d'un adulte au repos ?",
                options: ["Environ 1 litre par minute", "Environ 5 litres par minute", "Environ 15 litres par minute", "Environ 50 millilitres par minute"],
                answer: "Environ 5 litres par minute",
                explanation: "Le débit cardiaque de repos est égal à la fréquence de pulsations (~70) par le volume d'éjection (~70ml), soit environ 5 L/min."
              },
              {
                type: "true_false",
                question: "Les barorécepteurs situés dans le sinus carotidien détectent les variations de pression sanguine.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Félicitations ! Ces récepteurs s'étirent lors des hausses de pression pour inhiber le système sympathique."
              },
              {
                type: "fill",
                question: "L'augmentation de la force de contraction avec le degré d'étirement myocardique est la loi de Frank-_______.",
                options: [],
                answer: "Starling",
                explanation: "Excellent ! La loi de Frank-Starling stipule que plus le ventricule est étiré par le retour veineux, plus il se contracte fortement."
              }
            ]
          }
        ]
      },
      {
        unitNumber: 3,
        title: "Unité 3 : Pathologies et ECG",
        description: "Identifier les troubles de conduction et analyser un tracé électrocardiographique.",
        lessons: [
          {
            id: "cardio-u3-l1",
            title: "Insuffisance Cardiaque",
            type: "vocab",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Qu'est-ce qui caractérise principalement l'insuffisance cardiaque gauche ?",
                options: ["Une congestion sanguine dans les poumons (dyspnée)", "Un gonflement abdominal", "Une jaunisse hépatique", "Une paralysie vestibulaire"],
                answer: "Une congestion sanguine dans les poumons (dyspnée)",
                explanation: "Lorsque le ventricule gauche faiblit, le sang s'accumule en amont dans les veines pulmonaires, provoquant de l'eau dans les poumons et un essoufflement."
              },
              {
                type: "true_false",
                question: "L'angine de poitrine survient suite à une diminution de l'apport en oxygène au myocarde via les artères coronaires.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Tout à fait ! C'est l'ischémie myocardique transitoire, souvent liée à de l'athérosclérose coronaire."
              },
              {
                type: "fill",
                question: "Une obstruction totale et persistante d'une artère coronaire conduit à un _______ du myocarde.",
                options: [],
                answer: "infarctus",
                explanation: "Correct ! C'est la mort cellulaire (nécrose) du muscle cardiaque par manque d'apport en sang (ischémie prolongée)."
              }
            ]
          },
          {
            id: "cardio-u3-l2",
            title: "Interprétation d'un ECG",
            type: "quiz",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Que représente l'onde P sur un tracé ECG classique ?",
                options: ["La repolarisation des ventricules", "La contraction des ventricules", "La dépolarisation (activation) des oreillettes", "La mise au repos du sinus"],
                answer: "La dépolarisation (activation) des oreillettes",
                explanation: "L'onde P est la première petite bosse de l'ECG. Elle traduit la dépolarisation auriculaire qui précède la contraction des oreillettes."
              },
              {
                type: "true_false",
                question: "Le complexe QRS correspond à la dépolarisation et contraction des ventricules.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Correct ! Le complexe QRS est de forte amplitude car la masse musculaire des ventricules est prépondérante."
              },
              {
                type: "match",
                question: "Onde T",
                options: [],
                answer: "Phase électrique de repolarisation ventriculaire.",
                explanation: "Exact ! L'onde T traduit le retour au repos électrique des cellules myocardiques ventriculaires."
              }
            ]
          },
          {
            id: "cardio-u3-l3",
            title: "Diagnostic clinique final",
            type: "flashcard",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Qu'indique un rythme cardiaque irrégulier dénué d'ondes P, remplacées par une ligne tremblante ?",
                options: ["Une bradycardie sinusale", "Une fibrillation auriculaire (FA)", "Un bloc auriculo-ventriculaire complet", "Un infarctus aigu"],
                answer: "Une fibrillation auriculaire (FA)",
                explanation: "La fibrillation auriculaire se traduit par une anarchie électrique dans les oreillettes, d'où la disparition des ondes P remplacées par des trémulations rapides."
              },
              {
                type: "true_false",
                question: "Le pacemaker naturel du coeur qui initie chaque battement normal est le noeud sinusal.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Exact ! Appelé aussi PaceMaker sinusal, il impose le rythme normal dit rythme sinusal."
              },
              {
                type: "fill",
                question: "La baisse de la fréquence cardiaque en dessous de 60 battements par minute s'appelle la _______.",
                options: [],
                answer: "bradycardie",
                explanation: "Bien vu ! Une fréquence lente (< 60 bpm) est une bradycardie, tandis que rapide (> 100 bpm) est une tachycardie."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "comp-course-eco-1",
    courseName: "Économie Globale & Marchés",
    themeColor: "emerald",
    createdAt: new Date().toISOString(),
    sourceNotes: "Lois fondamentales de l'économie globale, offre, demande, inflation et calculs du PIB.",
    units: [
      {
        unitNumber: 1,
        title: "Unité 1 : Lois fondamentales du marché",
        description: "Comprendre l'offre, la demande et les ajustements de prix à l'équilibre.",
        lessons: [
          {
            id: "eco-u1-l1",
            title: "Loi de l'offre et de la demande",
            type: "vocab",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Généralement, lorsque le prix de marché d'un bien augmente, l'offre des producteurs tend à :",
                options: ["Diminuer", "Augmenter", "Rester strictement statique", "Disparaître entièrement"],
                answer: "Augmenter",
                explanation: "Un prix plus élevé incite les offreurs à produire davantage pour maximiser leurs profits."
              },
              {
                type: "true_false",
                question: "L'élasticité-prix mesure la sensibilité de la demande face à une variation des prix.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Exact ! Si l'élasticité est forte, une petite hausse de prix entraîne une chute importante de la demande."
              },
              {
                type: "fill",
                question: "La baisse de la demande consécutive à la hausse du prix d'un produit s'explique par l'effet de _______.",
                options: [],
                answer: "substitution",
                explanation: "Oui, l'effet de substitution pousse les consommateurs à acquérir des produits concurrents moins chers."
              }
            ]
          },
          {
            id: "eco-u1-l2",
            title: "Fixation du Prix d'Équilibre",
            type: "quiz",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "À quel croisement s'établit le prix d'équilibre théorique d'un marché ?",
                options: ["Là où l'offre surpasse la demande de 50%", "À l'intersection exacte de la courbe d'offre et de la courbe de demande", "Au niveau fixé arbitrairement par les banques", "Au coût marginal minimal"],
                answer: "À l'intersection exacte de la courbe d'offre et de la courbe de demande",
                explanation: "Le prix d'équilibre est le prix pour lequel la quantité offerte est rigoureusement égale à la quantité demandée."
              },
              {
                type: "true_false",
                question: "Une pénurie de produits survient si le prix imposé par l'État est très inférieur au prix d'équilibre.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Tout à fait ! Si le prix est artificiellement bas, la demande explose tandis que l'offre se rétracte."
              },
              {
                type: "match",
                question: "Prix plafond",
                options: [],
                answer: "Régulation étatique interdisant de vendre au-dessus d'une limite fixe, créant de la pénurie.",
                explanation: "Validé ! Cette limite protège les consommateurs sur le papier mais perturbe l'équilibre."
              }
            ]
          },
          {
            id: "eco-u1-l3",
            title: "Interventionnisme étatique",
            type: "flashcard",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Quel rôle joue le prix plancher (comme le salaire minimum) imposé sur un marché libre ?",
                options: ["Garantir un flux continu exempt d'invendus", "Créer un excédent structurel (offre supérieure à la demande)", "Diminuer l'attrait des travailleurs", "Forcer un équilibre parfait"],
                answer: "Créer un excédent structurel (offre supérieure à la demande)",
                explanation: "Un prix plancher, fixé au-dessus du prix d'équilibre, augmente l'offre et décourage la demande, créant un excédent d'offre."
              },
              {
                type: "true_false",
                question: "Les taxes carbone et les subventions écologiques sont des correcteurs d'externalités de marché.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Vrai! L'État intervient pour internaliser les coûts sociétaux et environnementaux non pris en compte par le modèle libre."
              },
              {
                type: "fill",
                question: "L'effet indésirable d'une pollution générée par une usine s'appelle une externalité _______.",
                options: [],
                answer: "négative",
                explanation: "Bien vu ! Uneexternalité négative nuit à autrui sans qu'il y ait compensation monétaire directe sur le marché."
              }
            ]
          }
        ]
      },
      {
        unitNumber: 2,
        title: "Unité 2 : Mécanismes d'Inflation et Monnaie",
        description: "Comprendre les fluctuations monétaires et l'action des institutions centrales.",
        lessons: [
          {
            id: "eco-u2-l1",
            title: "Les causes de l'inflation",
            type: "vocab",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Quelle théorie attribue l'inflation principalement à une hausse trop rapide de la liquidité en circulation ?",
                options: ["La théorie Keynésienne", "La théorie Monétariste", "La courbe de Philips", "La loi des rendements décroissants"],
                answer: "La théorie Monétariste",
                explanation: "Pour les monétaristes (comme Milton Friedman), 'l'inflation est toujours et partout un phénomène monétaire'."
              },
              {
                type: "true_false",
                question: "L'inflation par les coûts se produit lorsque le prix des matières premières ou des salaires augmente brusquement.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Parfait ! Les entreprises répercutent la hausse de leurs charges d'exploitation sur leurs prix de vente."
              },
              {
                type: "fill",
                question: "La situation d'hyper-inflation consiste en une hausse incontrôlée et _______ des prix.",
                options: [],
                answer: "rapide",
                explanation: "Exact ! Lors d'une hyper-inflation, l'argent perd sa valeur d'heure en heure."
              }
            ]
          },
          {
            id: "eco-u2-l2",
            title: "Le rôle des banques centrales",
            type: "quiz",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Pour calmer une économie en surchauffe et réduire l'inflation, une banque centrale va :",
                options: ["Baisser ses taux directeurs", "Augmenter ses taux directeurs", "Imprimer massivement de nouveaux billets", "Acheter toutes les obligations d'entreprises"],
                answer: "Augmenter ses taux directeurs",
                explanation: "Augmenter les taux directeurs renchérit le coût du crédit, ce qui ralentit l'investissement et freine l'inflation."
              },
              {
                type: "true_false",
                question: "Le Quantitative Easing est une politique monétaire non conventionnelle d'achats d'actifs massifs par la banque centrale.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Exact ! Cela injecte des liquidités directement dans le système financier pour stimuler l'économie."
              },
              {
                type: "match",
                question: "BCE",
                options: [],
                answer: "Banque Centrale Européenne, veillant à la stabilité des prix dans la zone Euro (~2% d'inflation).",
                explanation: "Correct ! Elle fixe les taux de refinancement clés des banques commerciales."
              }
            ]
          },
          {
            id: "eco-u2-l3",
            title: "Indices de Prix (IPC)",
            type: "flashcard",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Quel instrument statistique standard évalue le glissement du coût moyen de la vie des ménages ?",
                options: ["Le PIB Nominal", "L'Indice des Prix à la Consommation (IPC)", "Le taux de chômage brut", "La balance commerciale globale"],
                answer: "L'Indice des Prix à la Consommation (IPC)",
                explanation: "L'IPC suit un 'panier de biens' représentatif de la consommation des ménages au fil des mois."
              },
              {
                type: "true_false",
                question: "La déflation est une baisse continue et généralisée du niveau des prix.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Vrai ! La déflation est redoutée car elle pousse les acheteurs à reporter leurs dépenses et engendre la récession."
              },
              {
                type: "fill",
                question: "L'inflation corrigée de l'effet saisonnier ou volatil de l'énergie s'appelle l'inflation sous-_______.",
                options: [],
                answer: "jacente",
                explanation: "L'inflation sous-jacente exclut l'énergie et l'alimentation car leurs prix fluctuent trop vite selon la météo."
              }
            ]
          }
        ]
      },
      {
        unitNumber: 3,
        title: "Unité 3 : Commerce International & PIB",
        description: "Analyser la richesse d'une nation et l'impact des échanges extérieurs.",
        lessons: [
          {
            id: "eco-u3-l1",
            title: "Calcul du Produit Intérieur Brut",
            type: "vocab",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Quel élément distingue le PIB Nominal du PIB Réel ?",
                options: ["Le PIB Nominal n'inclut pas les services publics", "Le PIB Réel est déflaté (corrigé de l'effet de l'inflation)", "Le PIB Réel ignore les importations", "La prise en compte de l'économie informelle"],
                answer: "Le PIB Réel est déflaté (corrigé de l'effet de l'inflation)",
                explanation: "Le PIB Réel permet de mesurer une croissance de volume physique réel des biens, sans fausser le chiffre par de simples hausses tarifaires."
              },
              {
                type: "true_false",
                question: "La contribution négative des importations au PIB s'explique parce qu'on dépense pour de la richesse produite à l'étranger.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Tout à fait ! On soustrait les importations (M) de l'équation standard PIB = C + I + G + (X - M)."
              },
              {
                type: "fill",
                question: "Toute la valeur ajoutée créée par les entreprises résidant en France définit le _______.",
                options: [],
                answer: "PIB",
                explanation: "Oui ! Le Produit Intérieur Brut mesure l'ensemble de la valeur ajoutée sur le territoire concerné."
              }
            ]
          },
          {
            id: "eco-u3-l2",
            title: "Avantages comparatifs (Ricardo)",
            type: "quiz",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Selon David Ricardo, pourquoi deux nations ont-elles toujours intérêt à échanger réciproquement ?",
                options: ["Pour s'imposer des barrières de taxes tarifaires", "Dès lors que chacune se spécialise là où son coût de renonciation est le plus faible", "Pour équilibrer la monnaie mondiale", "Uniquement si l'une domine l'autre de manière absolue"],
                answer: "Dès lors que chacune se spécialise là où son coût de renonciation est le plus faible",
                explanation: "La loi des avantages comparatifs démontre que la spécialisation accroît la production mondiale disponible globale via l'échange libre."
              },
              {
                type: "true_false",
                question: "Le libre-échange tend à abaisser le prix général pour le consommateur grâce à l'intensification de la concurrence mondiale.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Vrai, cela élargit la taille du marché et fait baisser les barrières commerciales."
              },
              {
                type: "match",
                question: "Protectionnisme",
                options: [],
                answer: "Politique visant à entraver ou surtaxer les importations étrangères pour privilégier l'industrie autonome.",
                explanation: "Validé ! Le protectionnisme recourt aux quotas ou taxes douanières."
              }
            ]
          },
          {
            id: "eco-u3-l3",
            title: "Politiques protectionnistes",
            type: "flashcard",
            xp: 15,
            questions: [
              {
                type: "choice",
                question: "Qu'est-ce qu'une conséquence classique de barrières douanières excessives ?",
                options: ["Une baisse rapide de tous les impôts des ménages", "Une hausse des tarifs des biens importés et un risque de rétorsions commerciales", "Un excédent commercial mondial instantané", "Une accélération technologique infaillible"],
                answer: "Une hausse des tarifs des biens importés et un risque de rétorsions commerciales",
                explanation: "Les taxes douanières augmentent artificiellement le coût pour le consommateur et découragent les partenaires d'échanger."
              },
              {
                type: "true_false",
                question: "Le protectionnisme éducateur protège temporairement des industries naissantes jusqu'à ce qu'elles atteignent la taille critique.",
                options: ["Vrai", "Faux"],
                answer: "Vrai",
                explanation: "Félicitations ! C'est la thèse historique de Friedrich List visant à armer l'industrie locale embryonnaire."
              },
              {
                type: "fill",
                question: "Le solde des exportations moins les importations définit la balance _______.",
                options: [],
                answer: "commerciale",
                explanation: "Exact ! Si les exportations de produits dépassent les importations, la balance commerciale est excédentaire."
              }
            ]
          }
        ]
      }
    ]
  }
];


// Initial simulates participants on the leaderboard
export const INITIAL_LEADERBOARD: LeaderboardUser[] = [
  { id: "lead-1", name: "DuoBird 🦉", avatar: "🟢", xp: 1250, country: "🇺🇸" },
  { id: "lead-2", name: "Amélie Bernard", avatar: "👩‍🎓", xp: 950, country: "🇫🇷" },
  { id: "lead-3", name: "Hiroto Sato", avatar: "🧑‍💻", xp: 820, country: "🇯🇵" },
  { id: "lead-4", name: "Chloé Petit", avatar: "👩‍⚕️", xp: 620, country: "🇨🇦" },
  { id: "lead-5", name: "Alex Student", avatar: "⚡", xp: 0, isMe: true, country: "🇫🇷" },
  { id: "lead-6", name: "Elena Vostova", avatar: "👩‍🚀", xp: 480, country: "🇷🇺" },
  { id: "lead-7", name: "Carlos Santana", avatar: "🧑‍🎤", xp: 390, country: "🇪🇸" },
  { id: "lead-8", name: "Tom Baker", avatar: "👨‍🍳", xp: 210, country: "🇬🇧" }
];

// Shop items
export const INITIAL_SHOP: ShopItem[] = [
  {
    id: "shop-refill",
    title: "Vies complètes (Remplissage)",
    description: "Rechargez immédiatement votre compteur à 5 cœurs pour continuer à réviser sans plus attendre.",
    icon: "❤️",
    cost: 50,
    purchased: false
  },
  {
    id: "shop-multiplier",
    title: "Boost Double XP (30 minutes)",
    description: "Toutes vos prochaines leçons vous octroient deux fois plus de points de révision !",
    icon: "⚡",
    cost: 150,
    purchased: false
  },
  {
    id: "shop-no-ads",
    title: "Pass' DuoStudy sans pubs 🦉",
    description: "Désactivez définitivement toutes les insertions publicitaires et fenêtres interstitielles.",
    icon: "🚀",
    cost: 150,
    purchased: false
  }
];

// Spirale / Dynamic Question Rephraser for Levels
export function getAdaptationForLevel(q: Question, level: number): Question {
  const adapted = { ...q };
  
  // Safeguard options and ensure copy
  if (adapted.options) {
    adapted.options = [...adapted.options];
  }

  if (level === 1) {
    // Basic level - shuffle options to verify they actually read
    if (adapted.options) {
      adapted.options = [...adapted.options].sort(() => 0.5 - Math.random());
    }
  } else if (level === 2) {
    // Intermediate level - shuffle and slightly alternate phrasing
    if (adapted.options) {
      adapted.options = [...adapted.options].sort(() => 0.5 - Math.random());
    }
    
    // Dynamic rephrasings for known questions
    if (adapted.question.includes("détermine le prix d'équilibre")) {
      adapted.question = "D'après les lois du marché libre, comment se définit précisément le prix d'équilibre ?";
    } else if (adapted.question.includes("Loi générale de l'offre")) {
      adapted.question = "Selon la loi générale de l'offre, si le niveau des prix grimpe, comment réagissent les producteurs ?";
    } else if (adapted.question.includes("Combien de cavités")) {
      adapted.question = "Le muscle cardiaque humain possède un agencement interne spécifique. Combien compte-t-on de cavités ?";
    } else {
      adapted.question = `[Rappel standard] ${adapted.question}`;
    }
  } else if (level === 3) {
    // Advanced level - more challenging phrasing, or convert simple choice to true_false / swap options completely
    if (adapted.options) {
      adapted.options = [...adapted.options].reverse();
    }
    
    if (adapted.question.includes("inélasticité-revenu")) {
      adapted.question = "Pour quelle variété de biens l'élasticité-revenu s'avère-t-elle strictement inférieure à zéro (négative) ?";
    } else if (adapted.question.includes("prix plafond fixé")) {
      adapted.question = "Si une limite légale de prix (prix plafond) est imposée en dessous du prix de marché, quelle en est la conséquence directe ?";
    } else {
      adapted.question = `[Consolidation] ${adapted.question}`;
    }
  } else if (level >= 4) {
    // Crown Master level! Very challenging wording (Duolingo Golden Badge Challenge)
    if (adapted.options) {
      adapted.options = [...adapted.options].sort(() => 0.5 - Math.random());
    }
    adapted.question = `👑 [Niveau Maître] ${adapted.question.replace("[Consolidation] ", "").replace("[Rappel standard] ", "")}`;
    if (adapted.explanation) {
      adapted.explanation = `Maîtrisé au Niveau 4/4 ! ${adapted.explanation}`;
    }
  }

  return adapted;
}
