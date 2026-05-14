"use client";

import { useState } from "react";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { db } from "@/lib/firebase";

const storage = getStorage();

export default function UploadPage() {

  const [previewImages, setPreviewImages] =
    useState<string[]>([]);

  const [selectedFiles, setSelectedFiles] =
    useState<File[]>([]);

  const [message, setMessage] =
    useState("");

  const [name, setName] =
    useState("");

  const handleFiles = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const files = Array.from(
      e.target.files || []
    );

    setSelectedFiles(files);

    const previews = files.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviewImages(previews);
  };

  const handleSubmit = async () => {

    if (
      selectedFiles.length === 0 &&
      !message
    ) {
      return;
    }

    try {

      for (const file of selectedFiles) {

        const storageRef = ref(
          storage,
          `photos/${Date.now()}-${file.name}`
        );

        await uploadBytes(
          storageRef,
          file
        );

        const downloadURL =
          await getDownloadURL(storageRef);

        await addDoc(
          collection(db, "photos"),
          {
            imageUrl: downloadURL,
            approved: false,
            createdAt: serverTimestamp(),
          }
        );
      }

      if (message) {

        await addDoc(
          collection(db, "guestbook"),
          {
            name: name || "Anonymous",
            message: message,
            approved: false,
            createdAt: serverTimestamp(),
          }
        );

      }

      alert("Submitted successfully!");

      setSelectedFiles([]);
      setPreviewImages([]);
      setMessage("");
      setName("");

    } catch (error) {

      console.error(error);

      alert("Upload failed");

    }
  };

  return (

    <main className="min-h-screen bg-black text-white overflow-hidden relative">

      <div className="upload-background" />

      <div className="upload-overlay" />

      <div className="relative z-10 px-6 py-10 max-w-xl mx-auto">

        <div className="flex flex-col items-center text-center">

          <img
            src="/logo7.png"
            alt="Chatteris Town FC"
            className="w-44 mb-6"
          />

          <div className="upload-title">
            CHATTERIS TOWN FC
          </div>

          <div className="upload-title-big">
            SHARE YOUR
            <br />
            MEMORIES
          </div>

          <div className="upload-subtitle">
            Upload your photos and leave a message
            for Presentation Day
          </div>

        </div>

        <label className="upload-box mt-10">

          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFiles}
          />

          <div className="text-6xl mb-4">
            ⬆
          </div>

          <div className="text-2xl font-black text-center">
            TAP TO UPLOAD PHOTOS
          </div>

          <div className="text-white/60 mt-3 text-center">
            You can select multiple images
          </div>

          <div className="text-white/40 mt-2 text-sm text-center">
            JPG, PNG, HEIC
          </div>

        </label>

        {previewImages.length > 0 && (

          <div className="mt-10">

            <div className="text-2xl font-black mb-5">
              SELECTED PHOTOS
            </div>

            <div className="grid grid-cols-3 gap-3">

              {previewImages.map((src, index) => (

                <div
                  key={index}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-white/10"
                >

                  <img
                    src={src}
                    className="w-full h-full object-cover"
                  />

                </div>

              ))}

            </div>

          </div>

        )}

        <div className="mt-10">

          <div className="text-2xl font-black mb-4">
            YOUR NAME
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Your name"
            className="upload-input"
          />

        </div>

        <div className="mt-8">

          <div className="text-2xl font-black mb-4">
            YOUR MESSAGE
          </div>

          <textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Write a message..."
            className="upload-textarea"
          />

        </div>

        <button
          onClick={handleSubmit}
          className="upload-button mt-10"
        >
          SEND MEMORIES
        </button>

      </div>

      <style jsx>{`

        .upload-background {
          position: absolute;
          inset: 0;

          background:
            url('/background.png');

          background-size: cover;
          background-position: center;

          filter:
            brightness(0.22)
            saturate(1.2);

          transform: scale(1.05);
        }

        .upload-overlay {
          position: absolute;
          inset: 0;

          background:

            radial-gradient(
              circle at top,
              rgba(0,120,255,0.22),
              transparent 45%
            ),

            linear-gradient(
              to bottom,
              rgba(0,0,0,0.15),
              rgba(0,0,0,0.82)
            );
        }

        .upload-title {
          font-size: 1rem;

          letter-spacing: 0.4em;

          color: rgba(255,255,255,0.92);
        }

        .upload-title-big {
          font-size: clamp(3rem, 12vw, 5rem);

          font-weight: 900;

          line-height: 0.9;

          margin-top: 1rem;

          background:
            linear-gradient(
              180deg,
              #ffffff 0%,
              #d9d9d9 18%,
              #8d8d8d 52%,
              #ffffff 78%,
              #6f6f6f 100%
            );

          background-clip: text;
          -webkit-background-clip: text;

          color: transparent;
          -webkit-text-fill-color: transparent;
        }

        .upload-subtitle {
          margin-top: 1.5rem;

          color: rgba(255,255,255,0.72);

          font-size: 1.05rem;

          line-height: 1.6;
        }

        .upload-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          min-height: 240px;

          border-radius: 2rem;

          border:
            2px dashed rgba(70,140,220,0.5);

          background:
            rgba(255,255,255,0.04);

          backdrop-filter: blur(20px);

          cursor: pointer;

          transition: 0.3s ease;

          padding: 2rem;
        }

        .upload-box:hover {
          background:
            rgba(255,255,255,0.08);
        }

        .upload-input {
          width: 100%;

          height: 70px;

          border-radius: 1.5rem;

          padding: 0 1.5rem;

          background:
            rgba(255,255,255,0.05);

          border:
            1px solid rgba(255,255,255,0.08);

          color: white;

          font-size: 1rem;

          outline: none;

          backdrop-filter: blur(18px);
        }

        .upload-textarea {
          width: 100%;

          min-height: 180px;

          border-radius: 2rem;

          padding: 1.5rem;

          background:
            rgba(255,255,255,0.05);

          border:
            1px solid rgba(255,255,255,0.08);

          color: white;

          font-size: 1rem;

          outline: none;

          resize: none;

          backdrop-filter: blur(18px);
        }

        .upload-button {
          width: 100%;

          height: 74px;

          border-radius: 999px;

          background:
            linear-gradient(
              180deg,
              #3b9cff,
              #0066ff
            );

          font-size: 1.2rem;

          font-weight: 900;

          letter-spacing: 0.08em;

          box-shadow:
            0 0 30px rgba(0,120,255,0.45);

          transition: 0.3s ease;
        }

        .upload-button:hover {
          transform: scale(1.02);
        }

      `}</style>

    </main>
  );
}