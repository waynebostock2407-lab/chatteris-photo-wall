"use client";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import imageCompression from "browser-image-compression";

import { db, storage } from "@/lib/firebase";

export default function HomePage() {
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  /* Approved Messages */
  useEffect(() => {
    const q = query(
      collection(db, "guestbook"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const approved = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }))
        .filter((message: any) => message.approved)
        .slice(0, 4);

      setRecentMessages(approved);
    });

    return () => unsubscribe();
  }, []);

  const handlePhotoUpload = async () => {
    if (!photos || photos.length === 0) return;

    try {
      setUploading(true);

      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];

        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });

        const storageRef = ref(
          storage,
          `photos/${Date.now()}-${file.name}`
        );

        await uploadBytes(storageRef, compressedFile);

        const downloadURL = await getDownloadURL(storageRef);

        await addDoc(collection(db, "photos"), {
          imageUrl: downloadURL,
          approved: false,
          createdAt: serverTimestamp(),
        });
      }

      setSubmitted(true);
      setPhotos(null);

    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleMessageSubmit = async () => {
    if (!message.trim()) return;

    try {
      setUploading(true);

      await addDoc(collection(db, "guestbook"), {
        name: name || "Anonymous",
        message,
        approved: false,
        createdAt: serverTimestamp(),
      });

      setName("");
      setMessage("");
      setSubmitted(true);

    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden bg-[#071C3A]">

        {/* Stadium Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(76,145,255,0.35),transparent_45%)]"></div>

        {/* Blue Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#081B3A] via-[#0E3266] to-[#184E95]"></div>

        {/* Fabric Texture */}
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage: "url('/stripe-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Large Logo Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

          <img
            src="/logo.png"
            alt="Background Logo"
            className="w-[95vw] max-w-[900px] opacity-[0.06]"
          />

        </div>

        {/* Top Light */}
        <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[#7AB8FF]/20 blur-[180px]"></div>

        {/* Bottom Glow */}
        <div className="absolute bottom-[-300px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-[#0A56C5]/20 blur-[180px]"></div>

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_55%,rgba(0,0,0,0.28)_100%)]"></div>

      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-5 py-10 md:px-6 md:py-16">

        {/* Logo */}
        <img
          src="/logo.png"
          alt="CTFC"
          className="w-32 md:w-36 mb-6 drop-shadow-2xl"
        />

        {/* Club Strip */}
        <div className="mb-6 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full text-sm uppercase tracking-[0.2em] text-white/80 font-semibold">
          ONE CLUB • ONE FAMILY • THE LILIES
        </div>

        {/* Heading */}
        <div className="text-center max-w-4xl mb-12 md:mb-14">

          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight uppercase leading-[0.9]">
            SHARE YOUR
            <br />
            <span className="text-[#9BCBFF] italic">
              MEMORIES!
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-white/85 leading-relaxed max-w-2xl mx-auto">
            Upload your Presentation Day photos and messages now ready for the big day — and see them featured LIVE on the big screen during the event.
          </p>

        </div>

        {/* Forms */}
        <div className="w-full max-w-md md:max-w-5xl grid gap-6 md:grid-cols-2">

          {/* Upload Photos */}
          <div className="bg-white text-[#0A1E3D] border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">

            <div className="text-3xl font-bold mb-3">
              Upload Photos
            </div>

            <p className="text-[#4B5C7A] mb-6 leading-relaxed">
              Share your favourite moments from the season.
            </p>

            {/* Upload Area */}
            <label className="block cursor-pointer mb-6">

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setPhotos(e.target.files)}
                className="hidden"
              />

              <div className="w-full border-2 border-dashed border-[#BCD3F2] bg-[#F4F7FB] hover:bg-[#EDF4FF] transition rounded-3xl p-8 text-center">

                <div className="text-5xl mb-4">
                  📸
                </div>

                <div className="text-2xl font-bold text-[#123C7B] mb-2">
                  Tap Here To Choose Photos
                </div>

                <div className="text-[#5D7091] text-lg leading-relaxed">
                  Select photos from your phone camera roll
                  <br />
                  and upload them to the Presentation Day wall
                </div>

                {photos && photos.length > 0 && (
                  <div className="mt-5 text-[#123C7B] font-semibold text-lg">
                    {photos.length} photo(s) selected ✓
                  </div>
                )}

              </div>

            </label>

            <button
              onClick={handlePhotoUpload}
              disabled={uploading || !photos || photos.length === 0}
              className="w-full bg-[#123C7B] text-white font-bold py-4 rounded-2xl hover:bg-[#174A97] transition text-lg shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading
                ? "Uploading..."
                : "Upload Photos"}
            </button>

          </div>

          {/* Guestbook */}
          <div className="bg-white text-[#0A1E3D] border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">

            <div className="text-3xl font-bold mb-3">
              Messages for Vicky
            </div>

            <p className="text-[#4B5C7A] mb-6 leading-relaxed">
              Leave a special message or share your favourite memory.
            </p>

            <input
              type="text"
              placeholder="Your Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#F4F7FB] border border-[#DCE6F3] rounded-2xl p-4 text-[#0A1E3D] placeholder:text-[#7C8AA5] mb-4"
            />

            <textarea
              placeholder="Write your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full bg-[#F4F7FB] border border-[#DCE6F3] rounded-2xl p-4 text-[#0A1E3D] placeholder:text-[#7C8AA5] resize-none mb-6"
            />

            <button
              onClick={handleMessageSubmit}
              disabled={uploading}
              className="w-full bg-[#123C7B] text-white font-bold py-4 rounded-2xl hover:bg-[#174A97] transition text-lg shadow-xl"
            >
              {uploading
                ? "Submitting..."
                : "Submit Message"}
            </button>

          </div>

        </div>

        {/* Success */}
        {submitted && (
          <div className="mt-10 bg-green-500/20 border border-green-400/30 text-white px-8 py-5 rounded-2xl backdrop-blur-md text-lg font-medium text-center">
            Thank you — your upload has been submitted for approval 💙
          </div>
        )}

        {/* Recent Messages */}
        <div className="mt-24 w-full max-w-6xl">

          <div className="text-center mb-12">

            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 uppercase tracking-tight">
              Recent Messages
            </h2>

            <p className="text-white/70 text-xl">
              Approved messages from the CTFC family
            </p>

          </div>

          {/* Messages */}
          <div className="grid gap-5 md:grid-cols-2">

            {recentMessages.map((message: any) => (

              <div
                key={message.id}
                className="bg-white rounded-[2rem] p-6 shadow-2xl"
              >

                <div className="text-[#123C7B] font-bold text-2xl mb-3">
                  {message.name}
                </div>

                <div className="text-[#1B2B48] whitespace-pre-wrap leading-relaxed text-lg">
                  {message.message}
                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </main>
  );
}