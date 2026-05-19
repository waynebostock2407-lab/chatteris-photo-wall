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

import imageCompression from "browser-image-compression";

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

        const compressedFile =
  await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });

await uploadBytes(
  storageRef,
  compressedFile
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
            src="/logo 8.png"
            className="w-72 mb-2"
          />

          <div className="upload-title">
            CHATTERIS TOWN FC
          </div>

          <div className="upload-heading">

  <div className="upload-heading-top">
    SHARE YOUR
  </div>

  <div className="upload-heading-main">
    MEMORIES
  </div>

</div>

          <div className="upload-subtitle">
            Share your favourite photos or leave a special message for Vicky 💙
          </div>

        </div>

        <div className="section-label">
          SHARE PHOTOS
        </div>

        <label className="upload-box mt-10">

          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFiles}
          />

          <img
  src="/upload-cloud.png"
  alt="Upload"
  className="upload-cloud-image"
/>

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

    <button
      onClick={() => {

        const updatedImages =
          [...previewImages];

        const updatedFiles =
          [...selectedFiles];

        updatedImages.splice(index, 1);
        updatedFiles.splice(index, 1);

        setPreviewImages(updatedImages);
        setSelectedFiles(updatedFiles);

      }}
      className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/70 text-white text-lg font-bold backdrop-blur-xl"
    >
      ×
    </button>

  </div>

))}

            </div>

          </div>

        )}

        <div className="section-label">
          MESSAGES FOR VICKY
        </div>

        <div className="message-helper">
          Leave a thank you message, memory or good luck message 💙
        </div>

        <div className="mt-16">

          <div className="text-2xl font-black mb-4">
            YOUR NAME
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Your name (OPTIONAL)"
            className="upload-input"
          />

        </div>

        <div className="mt-8">

          <div className="text-2xl font-black mb-4">
            LEAVE A MESSAGE FOR VICKY
          </div>

          <textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Write your message here..."
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

        .message-helper {
          
          margin-top: -0.5rem;
          margin-bottom: 2rem;
          
          text-align: center;
          
          color: 
            rgba(255,255,255,0.68);
            
          font-size: 1rem;
          
          line-height: 1.5;
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

        .upload-cloud-image {
  width: 120px;

  object-fit: contain;

  margin-bottom: 1.8rem;

  filter:
    drop-shadow(
      0 0 24px rgba(0,120,255,0.35)
    );

  opacity: 0.96;
}

        .upload-title {
  font-size:
    clamp(1.4rem, 4vw, 2.2rem);

  font-weight: 900;

  letter-spacing: 0.28em;

  text-transform: uppercase;

  margin-top: 0.5rem;

  background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #f5f5f5 14%,
      #bcbcbc 34%,
      #7f7f7f 52%,
      #ffffff 74%,
      #6d6d6d 100%
    );

  background-size: 100% 240%;

  background-clip: text;
  -webkit-background-clip: text;

  color: transparent;
  -webkit-text-fill-color: transparent;

  filter:
    drop-shadow(
      0 0 10px rgba(255,255,255,0.08)
    )
    drop-shadow(
      0 0 28px rgba(70,140,220,0.18)
    );

  animation:
    metallicShift 8s linear infinite;
}

        .upload-heading {
  margin-top: 2rem;

  text-align: center;
}

.section-label {
  
  margin-bottom: 1.4rem;
  
  font-size:
    clamp(1.4rem, 3vw, 2rem);
  
  font-weight: 900;
  
  letter spacing: 0.12rem;
  
  color: white;

  text-align: center;

  text-shadow:
    0 0 18px rgba(0,120,255,0.35);

  background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #9ed6ff 100%)
    
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.upload-heading-top {

  font-size:
    clamp(2.1rem, 7vw, 3.4rem);

  font-weight: 300;

  letter-spacing: 0.08em;

  color:
    rgba(255,255,255,0.92);

  text-shadow:
    0 0 18px rgba(255,255,255,0.08);
}

.upload-heading-main {

  font-size:
    clamp(4rem, 14vw, 7rem);

  font-weight: 900;

  line-height: 0.9;

  margin-top: 0.5rem;

  background:
    linear-gradient(
      180deg,
      #89c7ff 0%,
      #4ea5ff 22%,
      #006dff 48%,
      #8fd0ff 74%,
      #2f8fff 100%
    );

  background-size: 100% 220%;

  background-clip: text;
  -webkit-background-clip: text;

  color: transparent;
  -webkit-text-fill-color: transparent;

  filter:
    drop-shadow(
      0 0 12px rgba(0,120,255,0.32)
    )
    drop-shadow(
      0 0 38px rgba(0,120,255,0.24)
    );

  animation:
    metallicShift 8s linear infinite;
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

  min-height: 300px;

  border-radius: 2.5rem;

  border:
    2px dashed rgba(60,140,255,0.65);

  background:
    linear-gradient(
      180deg,
      rgba(0,40,90,0.22),
      rgba(0,0,0,0.45)
    );

  backdrop-filter: blur(24px);

  box-shadow:
    inset 0 0 40px rgba(0,120,255,0.08),
    0 0 50px rgba(0,80,180,0.16);

  cursor: pointer;

  transition: 0.35s ease;

  padding: 2rem;
}

.upload-box:hover {

  transform:
    translateY(-2px);

  border-color:
    rgba(100,180,255,0.9);

  box-shadow:
    inset 0 0 60px rgba(0,120,255,0.12),
    0 0 70px rgba(0,120,255,0.22);
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