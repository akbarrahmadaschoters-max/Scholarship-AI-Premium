// Utility for Fisher-Yates shuffle
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function selectQuestions(config, clusters) {
  if (!clusters || clusters.length === 0) {
    return []; // Return empty if invalid or missing
  }
  const TOTAL_QUESTIONS = 17;
  
  // Calculate question distribution based on weights
  let allocations = clusters.map(cluster => ({
    ...cluster,
    count: Math.round((cluster.weight / 100) * TOTAL_QUESTIONS)
  }));

  let currentTotal = allocations.reduce((sum, c) => sum + c.count, 0);

  // Adjust if total is not exactly 17 by modifying the cluster with the highest weight
  if (currentTotal !== TOTAL_QUESTIONS) {
    allocations.sort((a, b) => b.weight - a.weight);
    const diff = TOTAL_QUESTIONS - currentTotal;
    allocations[0].count += diff;
  }

  // Restore original order of clusters (optional, but good for logical flow)
  // Re-sort back to original id/index to maintain logical flow of questions
  allocations.sort((a, b) => {
    return clusters.findIndex(c => c.id === a.id) - clusters.findIndex(c => c.id === b.id);
  });

  const finalQuestions = [];

  allocations.forEach(cluster => {
    // Shuffle the questions in the cluster
    const shuffled = shuffleArray(cluster.questions);
    // Pick the allocated number of questions (or all if we don't have enough)
    const picked = shuffled.slice(0, cluster.count);

    picked.forEach(q => {
      // Deep clone to avoid mutating the original imported JSON
      const question = { ...q };
      
      // Apply field variant if it exists
      if (question.fieldVariant && question.fieldVariant[config.field]) {
        question.text = question.fieldVariant[config.field];
      }
      
      finalQuestions.push(question);
    });
  });

  return finalQuestions;
}

export function buildSystemPrompt(config, panelist, questions) {
  const questionsListStr = questions.map((q, index) => `${index + 1}. ${q.text}`).join('\n');
  const scholarshipName = config.scholarship ? config.scholarship : '';

  return `You are ${panelist.name}, ${panelist.title} at ${panelist.institution}.
Your interviewing personality: ${panelist.personality}.

You are conducting a formal scholarship/admission interview for:
- Program: ${config.type} ${scholarshipName}
- Level: ${config.level}
- Field of Study: ${config.field}

You have exactly ${questions.length} questions to ask, in this EXACT order:
${questionsListStr}

STRICT RULES — follow these without exception:
- Conduct the ENTIRE interview in English only. Never switch to any other language.
- Ask ONE question per turn, strictly following the numbered order above.
- Do NOT skip, reorder, or add questions outside the list.

CHALLENGE BEHAVIOR — this is critical:
- If the candidate gives a vague, generic, or shallow answer, 
  DO NOT move to the next question immediately.
- Instead, challenge them with follow-up like:
  'That's quite broad. Can you give me a specific example?'
  'I'd push back on that — what evidence do you have for this?'
  'Many candidates say that. What makes your situation truly different?'
  'That sounds good on paper. What would you do if it fails?'
- Maximum 2 challenges per question before moving on.
- After challenging, if the answer is still weak, 
  acknowledge it briefly and move to the next question.
- If the answer is strong and specific, you may affirm briefly 
  ('Good, that's a concrete example.') then move on.
- Track internally how many follow-ups you've done per question.
- Only move to the next numbered question when satisfied OR 
  after 2 follow-ups, whichever comes first.

- After asking the final question and receiving the answer, 
  close the interview with a warm, professional closing statement only.
  Do NOT give any scores, hints, or feedback during the interview.
- Stay fully in character as ${panelist.name} throughout the session.
- Begin with a brief professional greeting (2 sentences max), 
  then immediately ask Question 1.`;
}
