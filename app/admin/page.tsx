"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

interface Photo {
  id: string;
  imageUrl: string;
  approved: boolean;
  createdAt?: any;
}

export default function AdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "photos"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPhotos = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Photo, "id">),
      }));

      setPhotos(fetchedPhotos);
    });

    return () => unsubscribe();
  }, []);

  const approvePhoto = async (id: string) => {
    try {
      await updateDoc(doc(db, "photos", id), {
        approved: true,
      });
    } catch (error) {
      console.error("Error approving photo:", error);
    }
  };

  const deletePhoto = async (id: string) => {
    try {
      await deleteDoc(doc(db, "photos", id));
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  };

  const togglePhotoSelection = (id: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(id)
        ? prev.filter((photoId) => photoId !== id)
        : [...prev, id]
    );
  };

  const approveSelectedPhotos = async () => {
    try {
      await Promise.all(
        selectedPhotos.map((id) =>
          updateDoc(doc(db, "photos", id), {
            approved: true,
          })
        )
      );

      setSelectedPhotos([]);
    } catch (error) {
      console.error("Error approving photos:", error);
    }
  };

  const selectAllPending = () => {
    const pendingIds = photos
      .filter((photo) => !photo.approved)
      .map((photo) => photo.id);

    setSelectedPhotos(pendingIds);
  };

  return (
    <main className="min-h-screen bg-[#081226] text-white p-8">

      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-10 flex-wrap gap-6">

          <div>
            <h1 className="text-5xl font-bold mb-2">
              Admin Dashboard
            </h1>

            <p className="text-white/70 text-lg">
              Moderate uploaded event photos
            </p>
          </div>

          <div className="flex gap-4 flex-wrap">

            <button
              onClick={selectAllPending}
              className="bg-white text-black px-5 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Select All Pending
            </button>

            <button
              onClick={approveSelectedPhotos}
              disabled={selectedPhotos.length === 0}
              className="bg-green-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-green-500 transition disabled:opacity-40"
            >
              Approve Selected ({selectedPhotos.length})
            </button>

          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">

          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative bg-white rounded-2xl overflow-hidden shadow-2xl"
            >

              <div className="absolute top-3 left-3 z-20">

                <input
                  type="checkbox"
                  checked={selectedPhotos.includes(photo.id)}
                  onChange={() => togglePhotoSelection(photo.id)}
                  className="w-6 h-6 accent-green-500 cursor-pointer"
                />

              </div>

              {!photo.approved && (
                <div className="absolute top-3 right-3 z-20 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                  Pending
                </div>
              )}

              <img
                src={photo.imageUrl}
                alt="Uploaded"
                className="w-full h-72 object-cover"
              />

              <div className="p-5 flex gap-3">

                {!photo.approved && (
                  <button
                    onClick={() => approvePhoto(photo.id)}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition"
                  >
                    Approve
                  </button>
                )}

                <button
                  onClick={() => deletePhoto(photo.id)}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl transition"
                >
                  Delete
                </button>

              </div>

            </div>
          ))}

        </div>

      </div>

    </main>
  );
}
