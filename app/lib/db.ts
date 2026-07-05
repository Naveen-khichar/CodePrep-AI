import { auth, db } from "./firebase";
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

export interface UserSession {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
}

export interface SubmissionLog {
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

// -------------------------------------------------------------
// Database Operations Controller (Firestore backend)
// -------------------------------------------------------------

export async function syncUser(user: UserSession): Promise<void> {
  console.log("Firestore DB [SyncUser] upserting profile...");
  try {
    const userRef = doc(db, "users", user.id);
    await setDoc(userRef, {
      uid: user.id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoUrl || "",
      createdAt: Timestamp.now()
    }, { merge: true });
    
    // Auto-create default progress document if missing
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
        totalTimeSpent: 0,
        solvedProblems: []
      });
    }
  } catch (error) {
    console.error("Firestore sync user failure:", error);
  }
}

export async function addSubmission(
  sub: SubmissionLog,
  streakUpdate: { streak: number; lastSubmissionDate: string }
): Promise<void> {
  console.log("Firestore DB [AddSubmission] adding solution record...");

  try {
    // 1. Add submission log
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

    // 2. Add solvedProblem entry if Accepted
    if (sub.verdict === "Accepted") {
      const solvedKey = `${sub.userId}_${sub.problemId}`;
      await setDoc(doc(db, "solvedProblems", solvedKey), {
        userId: sub.userId,
        problemId: sub.problemId,
        solvedAt: Timestamp.now()
      });
    }

    // 3. Update Progress metrics
    const progressRef = doc(db, "progress", sub.userId);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      const currentProgress = progressSnap.data();
      const solvedList = currentProgress.solvedProblems || [];
      const isNewSolve = sub.verdict === "Accepted" && !solvedList.includes(sub.problemId);
      
      if (isNewSolve) {
        solvedList.push(sub.problemId);
      }

      const newCount = (currentProgress.submissionsCount || 0) + 1;
      const accuracy = Math.round((solvedList.length / newCount) * 100);

      await updateDoc(progressRef, {
        submissionsCount: increment(1),
        lastSubmissionDate: streakUpdate.lastSubmissionDate,
        streak: streakUpdate.streak,
        favoriteLanguage: sub.language,
        solvedProblems: solvedList,
        accuracy: accuracy,
        totalTimeSpent: increment(10)
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
    console.error("Firestore submission update failure:", error);
    throw error;
  }
}

export async function getDashboardStats(userId: string) {
  console.log("Firestore DB [GetDashboardStats] fetching statistics...");
  try {
    const progressRef = doc(db, "progress", userId);
    const progressSnap = await getDoc(progressRef);
    const progressData = progressSnap.exists() ? progressSnap.data() : null;

    const subSnap = await getDocs(query(
      collection(db, "submissions"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(5)
    ));
    const recentSubmissions: any[] = [];
    subSnap.forEach((doc) => {
      recentSubmissions.push({ id: doc.id, ...doc.data() });
    });

    const solvedSnap = await getDocs(query(
      collection(db, "solvedProblems"),
      where("userId", "==", userId)
    ));
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
    console.error("Firestore dashboard loading failure:", error);
    throw error;
  }
}

export async function getSubmissionsHistory(userId: string) {
  console.log("Firestore DB [GetSubmissionsHistory] fetching log index...");
  try {
    const snap = await getDocs(query(
      collection(db, "submissions"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    ));
    const fetched: any[] = [];
    snap.forEach((doc) => {
      fetched.push({ id: doc.id, ...doc.data() });
    });
    return fetched;
  } catch (error) {
    console.error("Firestore submission history loading failure:", error);
    throw error;
  }
}

export async function getProblemSubmissions(userId: string, problemId: string) {
  console.log("Firestore DB [GetProblemSubmissions] fetching problem logs...");
  try {
    const snap = await getDocs(query(
      collection(db, "submissions"),
      where("userId", "==", userId),
      where("problemId", "==", problemId),
      orderBy("timestamp", "desc")
    ));
    const fetched: any[] = [];
    snap.forEach((doc) => {
      fetched.push({ id: doc.id, ...doc.data() });
    });
    return fetched;
  } catch (error) {
    console.error("Firestore problem submissions loading failure:", error);
    throw error;
  }
}
