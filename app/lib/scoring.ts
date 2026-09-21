import { Question, EnrichedQuestion, isEnrichedQuestion, UserAnswer, TestResult, CognitiveBreakdown } from './types';

// Extract numeric value from answer string
function extractNumeric(answer: string): number | null {
  const cleaned = answer.replace(/[,\s]/g, '');
  const match = cleaned.match(/-?\d+\.?\d*/);
  return match ? parseFloat(match[0]) : null;
}

// Normalize answer for comparison
function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\$/g, '')
    .replace(/,/g, '');
}

// Check if user answer matches correct answer
export function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  if (!userAnswer.trim()) return false;

  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  // Direct match
  if (normalizedUser === normalizedCorrect) return true;

  // Extract and compare numeric values
  const userNum = extractNumeric(normalizedUser);
  const correctNum = extractNumeric(normalizedCorrect);

  if (userNum !== null && correctNum !== null) {
    // Allow small floating point tolerance
    if (Math.abs(userNum - correctNum) < 0.01) return true;
  }

  // Check if user answer contains the correct numeric value
  if (correctNum !== null && userNum === correctNum) return true;

  // Handle ratio format (e.g., "5:1" or "5 to 1" or "5/1")
  const ratioPattern = /(\d+)\s*[:/]\s*(\d+)/;
  const userRatio = normalizedUser.match(ratioPattern);
  const correctRatio = normalizedCorrect.match(ratioPattern);
  if (userRatio && correctRatio) {
    const userRatioVal = parseInt(userRatio[1]) / parseInt(userRatio[2]);
    const correctRatioVal = parseInt(correctRatio[1]) / parseInt(correctRatio[2]);
    if (Math.abs(userRatioVal - correctRatioVal) < 0.01) return true;
  }

  // Check for fraction match
  const fractionPattern = /(\d+)\s*\/\s*(\d+)/;
  const userFrac = normalizedUser.match(fractionPattern);
  const correctFrac = normalizedCorrect.match(fractionPattern);
  if (userFrac && correctFrac) {
    const userVal = parseInt(userFrac[1]) / parseInt(userFrac[2]);
    const correctVal = parseInt(correctFrac[1]) / parseInt(correctFrac[2]);
    if (Math.abs(userVal - correctVal) < 0.01) return true;
  }

  // Handle text answers (e.g., "yes", "no", "purple", class names)
  if (normalizedCorrect.includes(normalizedUser) || normalizedUser.includes(normalizedCorrect)) {
    return true;
  }

  // Handle multiple value answers (e.g., "36; 12")
  if (correctAnswer.includes(';')) {
    const correctParts = correctAnswer.split(';').map(p => extractNumeric(p.trim()));
    const userParts = userAnswer.split(/[;,]/).map(p => extractNumeric(p.trim()));
    
    if (correctParts.every(cp => cp !== null) && userParts.every(up => up !== null)) {
      const correctNums = correctParts.filter((n): n is number => n !== null).sort();
      const userNums = userParts.filter((n): n is number => n !== null).sort();
      if (correctNums.length === userNums.length &&
          correctNums.every((v, i) => Math.abs(v - userNums[i]) < 0.01)) {
        return true;
      }
    }
  }

  return false;
}

// Get difficulty weight for scoring
function getDifficultyWeight(difficulty: string): number {
  switch (difficulty) {
    case 'Easy': return 1;
    case 'Medium': return 2;
    case 'Hard': return 3;
    default: return 1.5;
  }
}

// Calculate IQ score from test results
export function calculateIQScore(
  questions: Question[],
  answers: UserAnswer[]
): { iqScore: number; percentile: number; cognitiveBreakdown: CognitiveBreakdown[] } {
  const totalQuestions = questions.length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  
  // Check if enriched
  const isEnriched = questions.length > 0 && isEnrichedQuestion(questions[0]);

  let weightedScore = 0;
  let maxWeightedScore = 0;
  const cognitiveMap: Record<string, { correct: number; total: number }> = {};

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const a = answers[i];
    
    if (isEnriched && isEnrichedQuestion(q)) {
      const weight = getDifficultyWeight(q.difficulty);
      maxWeightedScore += weight;
      
      if (a?.isCorrect) {
        // Time bonus: faster answers get slight bonus (max 20%)
        const timeBonus = Math.max(0, 1 - (a.timeSpent / 120)) * 0.2;
        weightedScore += weight * (1 + timeBonus);
      }

      // Track cognitive domain
      if (!cognitiveMap[q.cognitive_domain]) {
        cognitiveMap[q.cognitive_domain] = { correct: 0, total: 0 };
      }
      cognitiveMap[q.cognitive_domain].total++;
      if (a?.isCorrect) {
        cognitiveMap[q.cognitive_domain].correct++;
      }
    } else {
      maxWeightedScore += 1.5; // default weight for non-enriched
      if (a?.isCorrect) {
        const timeBonus = Math.max(0, 1 - (a.timeSpent / 120)) * 0.2;
        weightedScore += 1.5 * (1 + timeBonus);
      }
    }
  }

  // Map weighted score to IQ scale
  // Score ratio from 0 to 1
  const scoreRatio = maxWeightedScore > 0 ? weightedScore / maxWeightedScore : 0;
  
  // Map to IQ: 0% -> ~70, 50% -> ~100, 100% -> ~145
  // Using a sigmoid-like mapping for more realistic distribution
  const iqScore = Math.round(70 + (scoreRatio * 75));

  // Calculate percentile from IQ score using normal distribution approximation
  const z = (iqScore - 100) / 15;
  const percentile = Math.round(normalCDF(z) * 100);

  // Build cognitive breakdown
  const cognitiveBreakdown: CognitiveBreakdown[] = Object.entries(cognitiveMap).map(
    ([domain, stats]) => ({
      domain,
      correct: stats.correct,
      total: stats.total,
      percentage: Math.round((stats.correct / stats.total) * 100),
    })
  );

  return { iqScore, percentile, cognitiveBreakdown };
}

// Normal CDF approximation
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1.0 + sign * y);
}

// Select random questions with balanced difficulty (5 Easy, 5 Medium, 5 Hard),
// balanced across topics and cognitive domains
export function selectRandomQuestions(questions: Question[], count: number): Question[] {
  if (questions.length <= count) return [...questions];
  
  const isEnriched = questions.length > 0 && isEnrichedQuestion(questions[0]);
  
  if (isEnriched) {
    const enrichedQuestions = questions as EnrichedQuestion[];
    const perDifficulty = Math.floor(count / 3); // 5 per difficulty for count=15
    const remainder = count - perDifficulty * 3;
    
    const easy = shuffleArray(enrichedQuestions.filter(q => q.difficulty === 'Easy'));
    const medium = shuffleArray(enrichedQuestions.filter(q => q.difficulty === 'Medium'));
    const hard = shuffleArray(enrichedQuestions.filter(q => q.difficulty === 'Hard'));
    
    const selected: EnrichedQuestion[] = [];
    
    // Pick balanced questions from each difficulty tier
    selected.push(...pickBalanced(easy, perDifficulty));
    selected.push(...pickBalanced(medium, perDifficulty + (remainder > 0 ? 1 : 0)));
    selected.push(...pickBalanced(hard, perDifficulty + (remainder > 1 ? 1 : 0)));
    
    // Fill remaining if any tier was short
    if (selected.length < count) {
      const selectedIds = new Set(selected.map(q => q.id));
      const remaining = shuffleArray(enrichedQuestions.filter(q => !selectedIds.has(q.id)));
      selected.push(...remaining.slice(0, count - selected.length));
    }
    
    // Shuffle final selection so difficulties are interleaved
    return shuffleArray(selected).slice(0, count);
  } else {
    // Simple random selection for non-enriched
    return shuffleArray([...questions]).slice(0, count);
  }
}

// Pick N questions balanced across topics and cognitive domains
function pickBalanced(pool: EnrichedQuestion[], n: number): EnrichedQuestion[] {
  if (pool.length <= n) return [...pool];
  
  // Group by topic
  const byTopic: Record<string, EnrichedQuestion[]> = {};
  for (const q of pool) {
    const key = q.topic || 'Other';
    if (!byTopic[key]) byTopic[key] = [];
    byTopic[key].push(q);
  }
  
  // Shuffle within each topic group
  for (const key of Object.keys(byTopic)) {
    byTopic[key] = shuffleArray(byTopic[key]);
  }
  
  // Round-robin across topics, picking from least-used cognitive domain first
  const selected: EnrichedQuestion[] = [];
  const cogCounts: Record<string, number> = {};
  const topicKeys = shuffleArray(Object.keys(byTopic));
  
  while (selected.length < n) {
    let pickedAny = false;
    for (const topic of topicKeys) {
      if (selected.length >= n) break;
      const available = byTopic[topic];
      if (!available || available.length === 0) continue;
      
      // Sort remaining by least-used cognitive domain
      available.sort((a, b) => {
        const countA = cogCounts[a.cognitive_domain] || 0;
        const countB = cogCounts[b.cognitive_domain] || 0;
        return countA - countB;
      });
      
      const pick = available.shift()!;
      selected.push(pick);
      cogCounts[pick.cognitive_domain] = (cogCounts[pick.cognitive_domain] || 0) + 1;
      pickedAny = true;
    }
    if (!pickedAny) break; // all pools exhausted
  }
  
  return selected;
}

// Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


// Format time in MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Build test result object
export function buildTestResult(
  gradeKey: string,
  questions: Question[],
  answers: UserAnswer[]
): TestResult {
  const { iqScore, percentile, cognitiveBreakdown } = calculateIQScore(questions, answers);
  const correctCount = answers.filter(a => a.isCorrect).length;
  const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0);

  return {
    grade: gradeKey,
    questions,
    answers,
    totalTime,
    score: correctCount,
    maxScore: questions.length,
    iqScore,
    percentile,
    cognitiveBreakdown,
    timestamp: new Date().toISOString(),
  };
}
