import { NextRequest, NextResponse } from 'next/server';
import { TestResult, isEnrichedQuestion, EnrichedQuestion, AIAnalysis } from '../../lib/types';

function generateFallbackAnalysis(result: TestResult): AIAnalysis {
  const pct = Math.round((result.score / result.maxScore) * 100);
  const domains = result.cognitiveBreakdown || [];
  const strongest = domains.length > 0 ? domains.reduce((a, b) => a.percentage > b.percentage ? a : b) : null;
  const weakest = domains.length > 0 ? domains.reduce((a, b) => a.percentage < b.percentage ? a : b) : null;

  return {
    overallSummary: `You scored ${result.score}/${result.maxScore} (${pct}%) on the Math IQ test, achieving an estimated IQ of ${result.iqScore}. ${pct >= 70 ? 'This is a solid performance demonstrating good mathematical ability.' : pct >= 40 ? 'This shows moderate mathematical ability with room for improvement.' : 'This indicates areas where focused practice would be beneficial.'}`,
    strengths: [
      strongest ? `Strong performance in ${strongest.domain} (${strongest.percentage}%)` : 'Willingness to attempt all questions',
      result.answers.filter(a => a.timeSpent < 60 && a.isCorrect).length > 0 ? 'Quick and accurate problem solving on some questions' : 'Careful and methodical approach',
      'Ability to work through word problems',
    ],
    weaknesses: [
      weakest && weakest.percentage < 50 ? `${weakest.domain} needs improvement (${weakest.percentage}%)` : 'Some challenging questions were missed',
      result.answers.filter(a => !a.answer.trim()).length > 0 ? 'Some questions were left unanswered' : 'Time management could be optimized',
      'Complex multi-step problems may need more practice',
    ],
    recommendations: [
      weakest ? `Practice more ${weakest.domain.toLowerCase()} problems to build confidence` : 'Continue practicing across all mathematical domains',
      'Work on timed problem sets to improve speed and accuracy',
      'Review incorrect answers and understand the solution approach',
      'Focus on word problem comprehension and equation setup',
    ],
    domainAnalyses: domains.map(d => ({
      domain: d.domain,
      score: d.percentage,
      analysis: d.percentage >= 80 ? `Excellent ${d.domain.toLowerCase()} skills.` : d.percentage >= 50 ? `Good foundation in ${d.domain.toLowerCase()}, with room for growth.` : `${d.domain} needs focused practice.`,
      percentile: Math.round(d.percentage * 0.9),
    })),
    iqInterpretation: result.iqScore >= 130 ? 'Superior mathematical intelligence. You demonstrate exceptional problem-solving ability.' : result.iqScore >= 115 ? 'Above average mathematical intelligence. You show strong analytical thinking.' : result.iqScore >= 100 ? 'Average mathematical intelligence. You have a solid foundation to build upon.' : result.iqScore >= 85 ? 'Below average. With focused practice, you can significantly improve your mathematical skills.' : 'This score suggests fundamental areas need strengthening. Consistent practice will lead to improvement.',
  };
}

export async function POST(request: NextRequest) {
  try {
    const result: TestResult = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(generateFallbackAnalysis(result));
    }

    const enrichedQs = result.questions.filter(isEnrichedQuestion) as EnrichedQuestion[];
    const questionDetails = result.questions.map((q, i) => {
      const a = result.answers[i];
      const eq = isEnrichedQuestion(q) ? (q as EnrichedQuestion) : null;
      return `Q${i + 1}: "${q.problem}" | Answer: ${a?.answer || 'blank'} | Correct: ${q.correct_answer} | ${a?.isCorrect ? 'CORRECT' : 'WRONG'} | Time: ${a?.timeSpent}s${eq ? ` | Domain: ${eq.cognitive_domain} | Difficulty: ${eq.difficulty} | Topic: ${eq.topic}` : ''}`;
    }).join('\n');

    const cogBreakdown = (result.cognitiveBreakdown || []).map(c => `${c.domain}: ${c.correct}/${c.total} (${c.percentage}%)`).join(', ');

    const prompt = `You are a math education expert analyzing a student's Math IQ test results. Provide a detailed, encouraging yet honest analysis.
CRITICAL INSTRUCTION: Generate the response as a valid JSON object matching the requested schema. DO NOT include any markdown formatting (like json blocks) in your response, just the raw JSON object.
CRITICAL INSTRUCTION 2: DO NOT use any emojis in your response. Keep it completely emoji-free.
CRITICAL INSTRUCTION 3: You MUST explicitly highlight the student's strengths and weaknesses based on the specific TOPICS provided in the Question-by-Question Results (e.g., Geometry, Fractions, Pattern Recognition).

Test Details:
- Grade Level: ${result.grade.replace('grade_', 'Grade ')}
- Score: ${result.score}/${result.maxScore}
- Estimated IQ: ${result.iqScore}
- Percentile: ${result.percentile}%
- Total Time: ${result.totalTime}s

Cognitive Domain Breakdown: ${cogBreakdown}

Question-by-Question Results:
${questionDetails}

Please respond with a JSON object (no markdown, just raw JSON) with these exact fields:
{
  "overallSummary": "2-3 sentence summary of performance",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendations": ["rec1", "rec2", "rec3", "rec4"],
  "domainAnalyses": [{"domain": "name", "score": number, "analysis": "text", "percentile": number}],
  "iqInterpretation": "1-2 sentence interpretation of the IQ score"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.7, 
            maxOutputTokens: 8192 
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(generateFallbackAnalysis(result));
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis: AIAnalysis = JSON.parse(jsonMatch[0]);
      return NextResponse.json(analysis);
    }

    return NextResponse.json(generateFallbackAnalysis(result));
  } catch {
    try {
      const result: TestResult = await request.clone().json();
      return NextResponse.json(generateFallbackAnalysis(result));
    } catch {
      return NextResponse.json({
        overallSummary: 'Analysis could not be generated.',
        strengths: ['Test completed'],
        weaknesses: ['Unable to analyze'],
        recommendations: ['Try again'],
        domainAnalyses: [],
        iqInterpretation: 'Score recorded.',
      });
    }
  }
}
