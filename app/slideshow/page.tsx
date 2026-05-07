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
  approved: boolean;
}

export default function SlideshowPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "photos"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPhotos = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Photo, "id">),
        }))
        .filter((photo: any) => photo.approved);

      setPhotos(fetchedPhotos);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (photos.length === 0) return;

    const interval = setInterval(() => {
      setFade(false);

      setTimeout(() => {
        setCurrentIndex((prev) =>
          prev === photos.length - 1 ? 0 : prev + 1
        );

        setFade(true);
      }, 800);
    }, 7000);

    return () => clearInterval(interval);
  }, [photos]);

  if (photos.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-300 via-blue-400 to-cyan-300 text-white flex flex-col items-center justify-center">
        <img
          src="/logo.png"
          alt="Club Logo"
          className="w-44 h-44 object-contain mb-8"
        />

        <h1 className="text-6xl font-black mb-6 text-center px-6">
          Chatteris Town Presentation Day
        </h1>

        <p className="text-3xl text-blue-100 animate-pulse">
          Waiting for approved photos...
        </p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-300 via-blue-400 to-cyan-300 text-white">
      {/* Soft Overlay */}
      <div className="absolute inset-0 bg-white/5"></div>

      {/* Header */}
<div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-6 px-10 py-4 bg-white/10 backdrop-blur-2xl border-b border-white/20 shadow-[0_8px_32px_rgba(255,255,255,0.08)]">

  <img
    src="/logo.png"
    alt="Club Logo"
    className="w-24 h-24 object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.35)]"
  />

  <div>
    <div className="uppercase tracking-[0.5em] text-cyan-100 text-sm mb-2 font-semibold">
      ONE CLUB | ONE FAMILY | THE LILIES
    </div>

    <h1 className="relative text-5xl xl:text-6xl font-black tracking-wide whitespace-nowrap overflow-hidden">
  <span className="bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent drop-shadow-[0_4px_25px_rgba(255,255,255,0.25)]">
    Chatteris Town Presentation Day
  </span>

  {/* Shimmer */}
  <span className="absolute inset-0 shimmer"></span>
</h1>

    <div className="mt-4 h-1 w-48 rounded-full bg-gradient-to-r from-cyan-200 via-white to-blue-200 shadow-[0_0_20px_rgba(255,255,255,0.4)]"></div>
  </div>
</div>

      {/* Main Image */}
{/* Main Image */}
<div className="absolute inset-0 flex items-center justify-center px-12 pt-36 pb-16">

  <div
    key={photos[currentIndex].id}
    className={`relative flex items-center justify-center w-full h-full transition-all duration-1000 ${
      fade ? "opacity-100" : "opacity-0"
    }`}
  >
    <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.35)] max-w-full max-h-full">

      <img
        src={photos[currentIndex].imageUrl}
        alt="Slideshow"
        className="max-w-[88vw] max-h-[68vh] object-contain animate-kenburns"
      />

    </div>
  </div>

</div>

      {/* Floating QR */}
      <div className="absolute bottom-8 right-8 z-20 bg-white/90 p-4 rounded-3xl shadow-2xl backdrop-blur-md">
        <div className="text-center text-black font-bold text-sm mb-3">
          Share Your Memories
        </div>

        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://chatteris-photo-wall.vercel.app"
          alt="QR Code"
          className="rounded-2xl"
        />
      </div>
    </main>
  );
}