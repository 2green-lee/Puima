import fs from "fs";
import https from "https";

https.get("https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", (res) => {
  console.log("storage.googleapis.com status:", res.statusCode);
});

https.get("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", (res) => {
  console.log("commondatastorage.googleapis.com status:", res.statusCode);
});
