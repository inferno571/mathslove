import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ reply: "API key missing. I'm unable to chat right now." });

  try {
    const { message, testResult, history } = await request.json();

    const systemInstructionText = `You are a helpful educational AI advisor for 'MathsLove'. 
The user has just completed a Math IQ test for their child. Discuss their results with them, be encouraging, and analyze their strengths and weaknesses.
CRITICAL INSTRUCTION: Your ultimate goal is to gently pitch and sell the user the "MathsLove Premium Course" which is designed to improve their specific weak areas. Weave this pitch naturally into the conversation, but dont force it if it doesn't fit.
CRITICAL INSTRUCTION 2: DO NOT use any emojis in your responses. Keep the tone professional but warm. Keep your responses concise and readable.

Here are the details of the test results for your reference:
- Grade: ${testResult.grade.replace('grade_', 'Grade ')}
- Score: ${testResult.score}/${testResult.maxScore}
- Estimated MQ: ${testResult.iqScore}
- Percentile: ${testResult.percentile}%
- Total Time: ${testResult.totalTime} seconds
- Topics/Questions detail:
${testResult.questions.map((q: any, i: number) => {
      const ans = testResult.answers[i];
      return `- Question ${i + 1}: "${q.problem}" | Topic: ${q.topic || q.solution_type} | User Answer: "${ans?.answer || ''}" | Correct: "${q.correct_answer}" | Result: ${ans?.isCorrect ? 'Correct' : 'Incorrect'}`;
    }).join('\n')}
`;

    // Map history to Gemini's role model structure
    const contents = [
      ...history.map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemInstructionText }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      return NextResponse.json({ reply: "Sorry, I'm having trouble connecting to the AI server. Please try again." }, { status: 500 });
    }

    // Return the response stream directly to the client as SSE
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ reply: "An error occurred while processing your request." });
  }
}
