import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Restoring Yuzu Cheesecake...");
  const postsRef = collection(db, "posts");
  await addDoc(postsRef, {
    title: "[마스터 클래스] 유자 치즈케이크",
    category: "Masterclass",
    visuals: "Zesty & Creamy",
    imageUrl: "https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&q=80&w=800", // using cake image fallback
    naverUrl: "https://smartstore.naver.com/putitinyourmouth",
    price: "₩49,900",
    order: 14,
    createdAt: serverTimestamp()
  });
  console.log("Done.");
  process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
