import type { DayPlan } from '../context/DiagnosticContext';

export function generateDailyStudyPlan(satWeaknesses: string[], ieltsWeaknesses: string[]): DayPlan[] {
  const allWeaknesses = [...(satWeaknesses || []), ...(ieltsWeaknesses || [])].filter(Boolean);
  
  if (allWeaknesses.length === 0) {
    allWeaknesses.push('General IELTS Practice', 'General SAT Math Practice', 'General SAT Reading Practice');
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = new Date();
  
  const plan: DayPlan[] = [];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    
    // Pick a topic for the day round-robin style
    const topicIndex = i % allWeaknesses.length;
    const focusTopic = allWeaknesses[topicIndex];
    
    // Determine type
    let type: 'lesson' | 'drilling' | 'review' | 'mock_test' | 'essay_practice' | 'speaking_practice';
    if (focusTopic.toLowerCase().includes('writing') || focusTopic.toLowerCase().includes('essay')) {
      type = 'essay_practice';
    } else if (focusTopic.toLowerCase().includes('speaking')) {
      type = 'speaking_practice';
    } else if (i === 6) {
      type = 'mock_test';
    } else {
      type = i % 2 === 0 ? 'lesson' : 'drilling';
    }

    plan.push({
      date: d.toLocaleDateString(),
      day: daysOfWeek[d.getDay()],
      tasks: [
        {
          focus: focusTopic,
          title: `Focus on ${focusTopic}`,
          type,
          duration: type === 'mock_test' ? 180 : 60,
          priority: 'high',
          completed: false
        }
      ]
    });
  }
  
  return plan;
}
