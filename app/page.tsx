"use client";

import { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { db, storage } from "@/lib/firebase";

export default function UploadPage() {
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    if (images.length === 0) return;

    try {
      setUploading(true);

      await Promise.all(
        images.map(async (image) => {

          const storageRef = ref(
            storage,
            `photos/${Date.now()}-${image.name}`
          );

          await uploadBytes(storageRef, image);

          const downloadURL = await getDownloadURL(storageRef);

          await addDoc(collection(db, "photos"), {
            imageUrl: downloadURL,
            approved: false,
            createdAt: serverTimestamp(),
          });

        })
      );

      setSuccess(true);
      setImages([]);

    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-6 py-12 text-white">

      {/* Animated Fabric Background */}
      <div className="absolute inset-0 overflow-hidden">

        <div
          className="fabric-layer"
          style={{
            backgroundImage: "url('/stripe-bg.jpg')",
          }}
        ></div>

      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[#06142B]/55"></div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.45)_100%)]"></div>

      {/* Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

        <img
          src="/logo.png"
          alt="Background Logo"
          className="w-[520px] opacity-[0.12] blur-[1px]"
        />

      </div>

      {/* Content */}
      <div className="relative z-20 w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10">

          <img
            src="/logo.png"
            alt="Club Logo"
            className="w-32 h-32 mx-auto mb-5 drop-shadow-2xl"
          />

          <h1 className="text-5xl font-extrabold text-white mb-3">
            Chatteris Town Football Club
          </h1>

          <p
            style={{
              fontFamily: "'Playfair Display', serif",
            }}
            className="text-[#EAF8FF] text-3xl italic font-semibold mb-6"
          >
            Presentation Day
          </p>

          <p className="text-white/80 text-lg text-center max-w-xl mx-auto leading-relaxed">
            Upload your favourite moments from the season and
            watch them appear live on the big screen throughout the event.
          </p>

        </div>

        {/* Upload Card */}
        <div className="relative z-20 bg-white/12 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-[0_0_60px_rgba(255,255,255,0.12)]">

          <div className="flex flex-col gap-6">

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/30 rounded-2xl p-10 cursor-pointer hover:border-white/60 transition">

              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setImages(Array.from(e.target.files));
                    setSuccess(false);
                  }
                }}
              />

              <div className="text-center">

                <p className="text-2xl font-semibold mb-2">
                  Choose Photos
                </p>

                <p className="text-white/70">
                  Tap here to upload from your phone
                </p>

              </div>

            </label>

            {images.length > 0 && (

              <div className="bg-black/20 rounded-2xl p-5">

                <p className="text-white/90 text-lg font-medium mb-2">
                  {images.length} photo(s) selected
                </p>

                <div className="max-h-40 overflow-y-auto space-y-1 text-white/70 text-sm">

                  {images.map((img, index) => (
                    <p key={index} className="truncate">
                      {img.name}
                    </p>
                  ))}

                </div>

              </div>

            )}

            <button
              onClick={handleUpload}
              disabled={images.length === 0 || uploading}
              className="bg-[#B9E6FF] text-[#06142B] font-bold text-xl py-4 rounded-2xl hover:bg-white transition disabled:opacity-40"
            >

              {uploading
                ? "Uploading..."
                : "Upload Photos"}

            </button>

            {success && (

              <div className="bg-green-500/20 border border-green-400/40 rounded-2xl p-5 text-center">

                <p className="text-2xl font-bold text-[#D9FFE8] mb-2">
                  Photos Uploaded!
                </p>

                <p className="text-white/80">
                  Your photos may appear on the big screen shortly.
                </p>

              </div>

            )}

          </div>

        </div>

      </div>

      <style jsx>{`
        .fabric-layer {
          position: absolute;
          inset: -4%;
          background-size: cover;
          background-position: center;
          animation: fabricFlutter 9s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes fabricFlutter {
          0% {
            transform:
              perspective(1200px)
              rotateY(0deg)
              rotateX(0deg)
              scale(1.06)
              translateX(0px)
              translateY(0px);
          }

          20% {
            transform:
              perspective(1200px)
              rotateY(2deg)
              rotateX(1deg)
              scale(1.08)
              translateX(-10px)
              translateY(-3px);
          }

          40% {
            transform:
              perspective(1200px)
              rotateY(-2deg)
              rotateX(-1deg)
              scale(1.07)
              translateX(8px)
              translateY(2px);
          }

          60% {
            transform:
              perspective(1200px)
              rotateY(1.5deg)
              rotateX(0.5deg)
              scale(1.09)
              translateX(-6px)
              translateY(-2px);
          }

          80% {
            transform:
              perspective(1200px)
              rotateY(-1.5deg)
              rotateX(-0.5deg)
              scale(1.07)
              translateX(6px)
              translateY(1px);
          }

          100% {
            transform:
              perspective(1200px)
              rotateY(0deg)
              rotateX(0deg)
              scale(1.06)
              translateX(0px)
              translateY(0px);
          }
        }
      `}</style>

    </main>
  );
}