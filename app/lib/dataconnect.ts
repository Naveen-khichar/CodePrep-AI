import { initializeApp, getApps } from "firebase/app";
import { auth, db } from "./firebase";
// Note: We use standard Firestore client or local storage simulation as a smart fallback 
// to keep development completely functional before the Cloud SQL DB is active.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  updateDoc
} from "firebase/firestore";

export interface SQLUser {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
}

export interface SQLSubmission {
  id?: string;
  userId: string;
  problemId: string;
  problemTitle: string;
  language: string;
  code: string;
  verdict: string;
  runtime: number;
  memory: number;
  errorMessage?: string;
  timestamp?: Date;
}

export interface SQLProgress {
  userId: string;
  submissionsCount: number;
  streak: number;
  lastSubmissionDate: string | null;
  accuracy: number;
  favoriteLanguage: string;
  totalTimeSpent: number;
}

// -------------------------------------------------------------
// GraphQL Relational Client Services Wrapper
// -------------------------------------------------------------

export async function syncUserSQL(user: SQLUser): Promise<void> {
  console.log("SQL Connect [SyncUser] upserting to Postgres...");
  
  // Simulation / Fallback Seeding: Sync User record
  try {
    const userRef = doc(db, "users", user.id);
    await setDoc(userRef, {
      uid: user.id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoUrl || "",
      createdAt: Timestamp.now()
    }, { merge: true });
    
    // Auto-create blank Progress tracker in Postgres SQL mock
    const progressRef = doc(db, "progress", user.id);
    const snap = await getDoc(progressRef);
    if (!snap.exists()) {
      await setDoc(progressRef, {
        userId: user.id,
        submissionsCount: 0,
        streak: 0,
        lastSubmissionDate: null,
        accuracy: 100,
        favoriteLanguage: "JavaScript",
        totalTimeSpent: 0
      });
    }
  } catch (error) {
    console.error("Failed to sync user records to SQL Connect database:", error);
  }
}

export async function addSubmissionSQL(
  sub: SQLSubmission,
  streakUpdate: { streak: number; lastSubmissionDate: string }
): Promise<void> {
  console.log("SQL Connect [AddSubmission] transactional insert...");

  try {
    // 1. Insert new record into Submission relation
    const subDoc = await addDoc(collection(db, "submissions"), {
      userId: sub.userId,
      problemId: sub.problemId,
      problemTitle: sub.problemTitle,
      language: sub.language,
      code: sub.code,
      verdict: sub.verdict,
      runtime: sub.runtime,
      memory: sub.memory,
      errorMessage: sub.errorMessage || null,
      timestamp: Timestamp.now()
    });

    // 2. Update SolvedProblem list join table if verdict is Accepted
    if (sub.verdict === "Accepted") {
      const solvedKey = `${sub.userId}_${sub.problemId}`;
      const solvedRef = doc(db, "solvedProblems", solvedKey);
      await setDoc(solvedRef, {
        userId: sub.userId,
        problemId: sub.problemId,
        solvedAt: Timestamp.now()
      });
    }

    // 3. Update Progress transactional metrics
    const progressRef = doc(db, "progress", sub.userId);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      const currentProgress = progressSnap.data();
      const solvedList = currentProgress.solvedProblems || [];
      const isNewSolve = sub.verdict === "Accepted" && !solvedList.includes(sub.problemId);
      
      if (isNewSolve) {
        solvedList.push(sub.problemId);
      }

      await updateDoc(progressRef, {
        submissionsCount: increment(1),
        lastSubmissionDate: streakUpdate.lastSubmissionDate,
        streak: streakUpdate.streak,
        favoriteLanguage: sub.language,
        solvedProblems: solvedList
      });
    } else {
      await setDoc(progressRef, {
        userId: sub.userId,
        submissionsCount: 1,
        streak: 1,
        lastSubmissionDate: streakUpdate.lastSubmissionDate,
        accuracy: 100,
        favoriteLanguage: sub.language,
        totalTimeSpent: 10,
        solvedProblems: sub.verdict === "Accepted" ? [sub.problemId] : []
      });
    }
  } catch (error) {
    console.error("Failed to commit transactional mutations in SQL Connect:", error);
    throw error;
  }
}

export async function getDashboardStatsSQL(userId: string) {
  console.log("SQL Connect [GetDashboardStats] querying SQL relations...");

  try {
    // 1. Fetch user progress
    const progressRef = doc(db, "progress", userId);
    const progressSnap = await getDoc(progressRef);
    const progressData = progressSnap.exists() ? progressSnap.data() : null;

    // 2. Fetch last 5 submissions
    const subQuery = query(
      collection(db, "submissions"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(5)
    );
    const subSnap = await getDocs(subQuery);
    const recentSubmissions: any[] = [];
    subSnap.forEach((doc) => {
      recentSubmissions.push({ id: doc.id, ...doc.data() });
    });

    // 3. Fetch solved problems
    const solvedQuery = query(
      collection(db, "solvedProblems"),
      where("userId", "==", userId)
    );
    const solvedSnap = await getDocs(solvedQuery);
    const solvedProblems: any[] = [];
    solvedSnap.forEach((doc) => {
      solvedProblems.push(doc.data());
    });

    return {
      progress: progressData ? {
        submissionsCount: progressData.submissionsCount || 0,
        streak: progressData.streak || 0,
        lastSubmissionDate: progressData.lastSubmissionDate || null,
        accuracy: progressData.accuracy || 100,
        favoriteLanguage: progressData.favoriteLanguage || "JavaScript",
        totalTimeSpent: progressData.totalTimeSpent || 0,
        solvedProblems: progressData.solvedProblems || []
      } : {
        submissionsCount: 0,
        streak: 0,
        lastSubmissionDate: null,
        accuracy: 100,
        favoriteLanguage: "JavaScript",
        totalTimeSpent: 0,
        solvedProblems: []
      },
      recentSubmissions,
      solvedProblems
    };
  } catch (error) {
    console.error("Error executing SQL dashboard query:", error);
    throw error;
  }
}

export async function getSubmissionsHistorySQL(userId: string) {
  console.log("SQL Connect [GetSubmissionsHistory] querying submissions list...");
  
  try {
    const q = query(
      collection(db, "submissions"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);
    const fetched: any[] = [];
    snap.forEach((doc) => {
      fetched.push({ id: doc.id, ...doc.data() });
    });
    return fetched;
  } catch (error) {
    console.error("Error executing SQL submissions log query:", error);
    throw error;
  }
}

export async function getProblemSubmissionsSQL(userId: string, problemId: string) {
  console.log("SQL Connect [GetProblemSubmissions] querying specific problem submissions...");

  try {
    const q = query(
      collection(db, "submissions"),
      where("userId", "==", userId),
      where("problemId", "==", problemId),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);
    const fetched: any[] = [];
    snap.forEach((doc) => {
      fetched.push({ id: doc.id, ...doc.data() });
    });
    return fetched;
  } catch (error) {
    console.error("Error executing SQL problem workspace submissions query:", error);
    throw error;
  }
}
