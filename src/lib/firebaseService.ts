import { doc, setDoc, getDoc, collection, query, getDocs, orderBy, serverTimestamp, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/firebaseConfig";
import type { DetectionRecord } from "../data/mock";

// 1. Update User Profile
// Uses setDoc with merge:true so it works even when the document doesn't exist yet
export async function updateUserProfile(
  userId: string, 
  data: Partial<{ 
    fullName: string; 
    preferredLanguage: string; 
    avatarUrl?: string;
    notifications?: { detection: boolean; rec: boolean; saved: boolean };
  }>
) {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// 2. Upload Image to Firebase Storage
export async function uploadWeedImage(userId: string, recordId: string, fileOrDataUrl: File | Blob | string): Promise<string> {
  const storageRef = ref(storage, `weed-images/${userId}/${recordId}/image.jpg`);
  
  let blob: Blob;
  if (typeof fileOrDataUrl === 'string') {
    const response = await fetch(fileOrDataUrl);
    blob = await response.blob();
  } else {
    blob = fileOrDataUrl;
  }

  const snapshot = await uploadBytes(storageRef, blob);
  return await getDownloadURL(snapshot.ref);
}

// 3. Save Detection Record
export async function saveDetectionRecord(userId: string, record: Omit<DetectionRecord, "id"> & { id?: string }): Promise<string> {
  const recordId = record.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  const recordRef = doc(db, "users", userId, "detectionHistory", recordId);
  await setDoc(recordRef, {
    ...record,
    id: recordId,
    createdAt: serverTimestamp(),
  });
  
  return recordId;
}

// 4. Get User History
export async function getUserHistory(userId: string): Promise<DetectionRecord[]> {
  const historyRef = collection(db, "users", userId, "detectionHistory");
  const q = query(historyRef, orderBy("createdAt", "desc"));
  
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as DetectionRecord);
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
}

// 5. Get Single Detection Record
export async function getDetectionRecord(userId: string, recordId: string): Promise<DetectionRecord | null> {
  const docRef = doc(db, "users", userId, "detectionHistory", recordId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as DetectionRecord;
  }
  return null;
}

// 6. Delete Single Detection Record
export async function deleteDetectionRecord(userId: string, recordId: string): Promise<void> {
  const docRef = doc(db, "users", userId, "detectionHistory", recordId);
  await deleteDoc(docRef);
}