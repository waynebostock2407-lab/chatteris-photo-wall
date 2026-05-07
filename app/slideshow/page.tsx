"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Photo {
  id: string;
  imageUrl: string;
}

export default function SlideshowPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (photos.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === photos.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [photos]);

  if (photos.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center text-3xl">
        Waiting for photos...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <img
        src={photos[currentIndex].imageUrl}
        alt="Slideshow"
        className="w-full h-screen object-contain"
      />
    </main>
  );
}