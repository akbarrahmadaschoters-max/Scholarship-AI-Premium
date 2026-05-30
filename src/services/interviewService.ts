import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase"; 

// Helper to shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function fetchQuestionsFromFirestore(type: string, scholarship: string, level: string) {
  try {
    let targetBeasiswa = "";
    
    // Pemetaan kategori ke tag "Beasiswa" di Firestore
    if (type === "LPDP") {
      targetBeasiswa = `LPDP ${level}`;
    } else if (type === "INTERNATIONAL") {
      targetBeasiswa = scholarship;
    } else if (type === "UNIVERSITY") {
      targetBeasiswa = "University";
    }

    const colRef = collection(db, "Scholarnova interview questions");
    const q = query(colRef, where("Beasiswa", "==", targetBeasiswa));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      console.warn(`No questions found for Beasiswa: ${targetBeasiswa}. Attempting generic fetch...`);
      // Fallback: If strict matching fails, return all just in case (or empty)
      return [];
    }

    const allQuestions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Group questions by Cluster
    const clusterMap: Record<string, { questions: any[], weight: number }> = {};
    
    allQuestions.forEach((q: any) => {
      const cluster = q.Cluster || "General";
      if (!clusterMap[cluster]) {
        clusterMap[cluster] = {
          questions: [],
          weight: q.ClusterWeight || 20 // Default fallback weight if missing
        };
      }
      clusterMap[cluster].questions.push(q);
    });

    // Format into the structure expected by the app
    const clusters = Object.keys(clusterMap).map(clusterName => ({
      id: clusterName,
      name: clusterName,
      weight: clusterMap[clusterName].weight,
      questions: clusterMap[clusterName].questions.map(q => ({
        id: q.id,
        text: q.Pertanyaan,
        probing: [q.Probing].filter(Boolean),
        difficulty: q.Difficulty
      }))
    }));

    return clusters;
  } catch (error) {
    console.error("Error fetching questions from Firestore:", error);
    throw error;
  }
}
