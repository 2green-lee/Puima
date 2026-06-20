import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, doc, deleteDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const q = query(collection(db, "posts"));
  const snapshot = await getDocs(q);
  console.log(`Found ${snapshot.docs.length} total posts. Searching for 유자...`);
  
  for (const postDoc of snapshot.docs) {
    const data = postDoc.data();
    if (data.title && (data.title.includes("유자") || data.title.includes("치즈케이크"))) {
      console.log(`Deleting post ${postDoc.id} - ${data.title}`);
      
      // Delete chapters
      const chaptersSnap = await getDocs(collection(db, `posts/${postDoc.id}/chapters`));
      for (const ch of chaptersSnap.docs) {
        console.log(` - Deleting chapter ${ch.id}`);
        await deleteDoc(ch.ref);
      }
      
      // Delete post itself
      await deleteDoc(postDoc.ref);
    }
  }
  
  console.log("Done.");
  process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
