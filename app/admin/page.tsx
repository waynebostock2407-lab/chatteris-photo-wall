"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

interface Photo {
  id: string;
  imageUrl: string;
  approved: boolean;
}

export default function AdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const ADMIN_PASSWORD = "chatteris2026";

  useEffect(() => {
    if (!authenticated) return;

    const q = query(
      collection(db, "photos"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPhotos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Photo, "id">),
      }));

      setPhotos(fetchedPhotos);
    });

    return () => unsubscribe();
  }, [authenticated]);

  const approvePhoto = async (id: string) => {
    await updateDoc(doc(db, "photos", id), {
      approved: true,
    });
  };
  const deletePhoto = async (id: string) => {
  await deleteDoc(doc(db, "photos", id));
};

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="bg-zinc-900 p-10 rounded-3xl w-full max-w-md">
          <h1 className="text-4xl font-black mb-6 text-center">
            Admin Login
          </h1>

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-4 rounded-xl bg-zinc-800 text-white mb-4"
          />

          <button
            onClick={() => {
              if (password === ADMIN_PASSWORD) {
                setAuthenticated(true);
              } else {
                alert("Incorrect password");
              }
            }}
            className="w-full bg-blue-500 py-4 rounded-xl font-bold"
          >
            Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-5xl font-black mb-10">
        Photo Moderation
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="bg-zinc-900 rounded-3xl overflow-hidden"
          >
            <img
              src={photo.imageUrl}
              alt=""
              className="w-full h-72 object-cover"
            />

            <div className="p-4">
              <div className="mb-4">
                {photo.approved ? (
                  <span className="text-green-400 font-bold">
                    Approved
                  </span>
                ) : (
                  <span className="text-yellow-400 font-bold">
                    Pending
                  </span>
                )}
              </div>

              <div className="flex gap-3">
  {!photo.approved && (
    <button
      onClick={() => approvePhoto(photo.id)}
      className="bg-green-500 px-4 py-3 rounded-xl font-bold w-full"
    >
      Approve
    </button>
  )}

  <button
    onClick={() => deletePhoto(photo.id)}
    className="bg-red-500 px-4 py-3 rounded-xl font-bold w-full"
  >
    Delete
  </button>
</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}