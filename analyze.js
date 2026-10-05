exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { pitchText } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured in environment variables' }) };
    }

    const prompt = `Analyze the following investor pitch and provide an assessment based on the VentureIntel PRD.
1. Overall Score (0-100)
2. Key Strengths (3 bullet points)
3. Key Risks (3 bullet points)
4. Questions Investors Will Ask (3 questions)

Respond strictly in valid JSON format like this:
{
  "score": 85,
  "strengths": ["...", "...", "..."],
  "risks": ["...", "...", "..."],
  "questions": ["...", "...", "..."]
}

Pitch:
${pitchText}`;

    // Note: Netlify functions run in Node.js 18+ which has native global fetch
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || 'API Error');
    }
    
    const aiText = data.candidates[0].content.parts[0].text;
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: aiText,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to process pitch' }),
    };
  }
};
