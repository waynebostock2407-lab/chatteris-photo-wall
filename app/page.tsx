"use client";

import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { storage, db } from "@/lib/firebase";

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

const handleUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const files = e.target.files;

  if (!files || files.length === 0) return;

  setUploading(true);

  try {
    for (const file of Array.from(files)) {
      const storageRef = ref(
        storage,
        `photos/${Date.now()}-${file.name}`
      );

      await uploadBytes(storageRef, file);

      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, "photos"), {
        imageUrl: downloadURL,
        createdAt: serverTimestamp(),
        approved: false,
      });
    }

    setSuccess(true);
  } catch (error) {
    console.error(error);
    alert("Upload failed");
  }

  setUploading(false);
};

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-sky-800 to-cyan-700 text-white flex items-center justify-center p-8">
      <div className="max-w-4xl text-center">
        <h1 className="text-6xl font-black mb-6">
          Chatteris Town Presentation Day
        </h1>

        <p className="text-2xl text-blue-100 mb-10">
          Upload your photos and see them appear live on the big screen.
        </p>

        <label className="block">
          <div className="bg-white text-blue-900 font-bold px-8 py-4 rounded-2xl text-xl hover:scale-105 transition-transform shadow-xl cursor-pointer inline-block">
            {uploading ? "Uploading..." : "Upload Photo"}
          </div>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </label>

        {success && (
          <div className="mt-6 text-green-300 text-xl font-semibold">
            Photo uploaded successfully!
          </div>
        )}
      </div>
    </main>
  );
}