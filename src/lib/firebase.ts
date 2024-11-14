import { getApps, initializeApp } from "firebase/app";

import {
  get,
  getDatabase,
  limitToLast,
  orderByChild,
  query,
  ref,
  set,
} from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export const saveScore = (playerName: string, score: number) => {
  const scoreRef = ref(db, "scores/" + playerName);

  set(scoreRef, {
    name: playerName,
    score: score,
    timestamp: Date.now(),
  })
    .then(() => {
      console.log("Score salvo com sucesso!");
    })
    .catch((error) => {
      console.error("Erro ao salvar o score:", error);
    });
};

export interface PlayerScore {
  name: string;
  score: number;
}
export const fetchLeaderBoard = async () => {
  const db = getDatabase();
  const leaderboardRef = query(
    ref(db, "scores"),
    orderByChild("score"),
    limitToLast(10)
  );
  const snapshot = await get(leaderboardRef);

  if (snapshot.exists()) {
    const scoresArray: PlayerScore[] = [];
    snapshot.forEach((childSnapshot) => {
      scoresArray.push(childSnapshot.val());
    });

    return scoresArray.sort((a, b) => b.score - a.score);
  }
  return [];
};
