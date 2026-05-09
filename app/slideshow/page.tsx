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

interface GuestbookMessage {
  id: string;
  name: string;
  message: string;
  approved: boolean;
}

export default function SlideshowPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const [fade, setFade] = useState(true);
  const [flash, setFlash] = useState(false);

  const [showMessages, setShowMessages] = useState(false);

  /* Photos */
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

  /* Messages */
  useEffect(() => {
    const q = query(
      collection(db, "guestbook"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<GuestbookMessage, "id">),
        }))
        .filter((message: any) => message.approved);

      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, []);

  /* Photo Loop */
  useEffect(() => {
    if (photos.length === 0) return;

    let interval: NodeJS.Timeout;

    if (!showMessages) {

      interval = setInterval(() => {

        /* Camera Flash */
        setFlash(true);

        setTimeout(() => {
          setFlash(false);
        }, 180);

        setFade(false);

        setTimeout(() => {

          setCurrentIndex((prev) =>
            prev === photos.length - 1 ? 0 : prev + 1
          );

          setFade(true);

        }, 450);

      }, 6500);

    }

    return () => clearInterval(interval);

  }, [photos, showMessages]);

  /* Trigger Message Mode Every 5 Minutes */
  useEffect(() => {

    if (messages.length === 0) return;

    const cycle = setInterval(() => {

      setShowMessages(true);
      setMessageIndex(0);

    }, 300000);

    return () => clearInterval(cycle);

  }, [messages]);

  /* Message Loop */
  useEffect(() => {

    if (!showMessages) return;

    const interval = setInterval(() => {

      setFade(false);

      setTimeout(() => {

        if (messageIndex >= messages.length - 1) {

          setShowMessages(false);
          setMessageIndex(0);

        } else {

          setMessageIndex((prev) => prev + 1);

        }

        setFade(true);

      }, 350);

    }, 9000);

    return () => clearInterval(interval);

  }, [showMessages, messageIndex, messages]);

  /* Preload Next Image */
  useEffect(() => {
    if (photos.length === 0) return;

    const nextIndex =
      currentIndex === photos.length - 1
        ? 0
        : currentIndex + 1;

    const nextImage = new Image();

    nextImage.src = photos[nextIndex]?.imageUrl;

  }, [currentIndex, photos]);

  return (
    <main className="relative w-screen h-screen overflow-hidden text-white">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">

        <div
          className="fabric-layer"
          style={{
            backgroundImage: "url('/stripe-bg.jpg')",
          }}
        >

          <div className="absolute inset-0 flex items-center justify-center">

            <img
              src="/logo.png"
              alt="Background Logo"
              className="w-[780px] opacity-[0.16]"
            />

          </div>

        </div>

      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-[#06142B]/45"></div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.45)_100%)]"></div>

      {/* Spotlights */}
      <div className="spotlight spotlight-left"></div>
      <div className="spotlight spotlight-right"></div>

      {/* Camera Flash */}
      <div
        className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-200 ${
          flash ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 35%, rgba(255,255,255,0) 100%)",
        }}
      ></div>

      {/* Main Content */}
      <div className="absolute inset-0 flex items-center justify-center px-16 pb-52">

        {/* Guestbook Slides */}
        {showMessages && messages[messageIndex] ? (

          <div
            className={`w-full flex justify-center items-center z-20 px-20 transition-all duration-700 ${
              fade
                ? "opacity-100 scale-100"
                : "opacity-0 scale-[0.98]"
            }`}
          >

            <div className="w-full max-w-5xl text-center">

              {/* Heading */}
              <div className="mb-10">

                <div className="text-7xl font-extrabold text-white tracking-wide drop-shadow-[0_4px_20px_rgba(0,0,0,0.75)]">
                  Messages for Vicky
                </div>

              </div>

              {/* Message Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1936]/88 to-[#10254D]/88 border border-white/10 backdrop-blur-xl rounded-[3rem] px-20 py-16 shadow-[0_0_80px_rgba(0,0,0,0.45)]">

                {/* Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_45%)] pointer-events-none"></div>

                {/* Quote */}
                <div className="absolute top-6 left-10 text-white/10 text-[9rem] leading-none font-serif">
                  “
                </div>

                {/* Message */}
                <div
                  style={{
                    fontFamily: "'Caveat', cursive",
                  }}
                  className="relative z-10 text-[2.6rem] leading-[1.45] text-[#F8FBFF] font-semibold tracking-[0.01em] text-left whitespace-pre-wrap break-words overflow-y-auto max-h-[52vh] pr-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
                >
                  {messages[messageIndex].message}
                </div>

                {/* Signature */}
                <div className="relative z-10 mt-12 flex items-center justify-end">

                  <div className="text-right">

                    <div className="text-white/50 text-sm uppercase tracking-[0.35em] mb-2">
                      Shared by
                    </div>

                    <div
                      style={{
                        fontFamily: "'Caveat', cursive",
                      }}
                      className="text-[#D9F3FF] text-[2.7rem] font-bold"
                    >
                      {messages[messageIndex].name}
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        ) : photos.length === 0 ? (

          /* Empty State */
          <div className="text-center z-20">

            <div className="text-6xl font-bold text-white mb-6">
              Awaiting Photos
            </div>

            <div className="text-2xl text-white/70">
              Upload photos or messages using the QR code
            </div>

          </div>

        ) : (

          /* Photo Slides */
          <div
            key={photos[currentIndex]?.id}
            className={`transition-all duration-700 ease-out will-change-transform will-change-opacity ${
              fade
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-[0.97] translate-y-2"
            }`}
          >

            {/* Polaroid */}
            <div className="inline-flex flex-col items-center bg-white p-5 pb-16 rounded-[0.6rem] shadow-[0_18px_50px_rgba(0,0,0,0.38)] rotate-[-1.5deg] max-w-[82vw]">

              <img
                src={photos[currentIndex].imageUrl}
                alt="Slideshow"
                className="max-w-[74vw] max-h-[58vh] object-contain"
                style={{
                  imageRendering: "auto",
                }}
              />

              {/* Caption */}
              <div className="mt-6 flex items-center justify-center gap-6">

                <img
                  src="/logo 2.png"
                  alt="Logo Left"
                  className="w-14 h-14 object-contain"
                />

                <div className="text-center leading-tight">

                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                    }}
                    className="text-[#1A1A1A] text-[2rem] font-bold tracking-wide"
                  >
                    Chatteris Town Football Club
                  </div>

                  <div
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                    }}
                    className="text-[#444] text-[2.1rem] italic mt-1"
                  >
                    Memories
                  </div>

                </div>

                <img
                  src="/logo 3.png"
                  alt="Logo Right"
                  className="w-14 h-14 object-contain"
                />

              </div>

            </div>

          </div>

        )}

      </div>

      {/* Branding */}
      <div className="absolute bottom-6 left-8 z-20 flex items-end gap-8">

        <img
          src="/logo.png"
          alt="Club Logo"
          className="w-40 h-40 object-contain drop-shadow-2xl"
        />

        <div className="flex flex-col justify-end">

          <h1 className="leading-none">

            <span className="text-white text-5xl font-extrabold tracking-wide">
              Chatteris Town Football Club
            </span>

            <br />

            <span
              style={{
                fontFamily: "'Playfair Display', serif",
              }}
              className="text-[#EAF8FF] text-[4rem] italic font-semibold tracking-[0.04em]"
            >
              Presentation Day
            </span>

            <span className="block mt-3 uppercase tracking-[0.22em] text-[#EAF8FF] text-[1.55rem] font-semibold">
              ONE CLUB | ONE FAMILY | THE LILIES
            </span>

          </h1>

        </div>

      </div>

      {/* QR */}
      <div className="absolute bottom-8 right-8 z-20 bg-white/95 rounded-3xl p-5 shadow-2xl">

        <div className="text-center text-[#0A1E3D] font-bold text-lg leading-tight mb-3">
          UPLOAD PHOTOS
          <br />
          & MESSAGES
        </div>

        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://chatteris-photo-wall.vercel.app"
          alt="QR"
          className="rounded-xl"
        />

      </div>

      <style jsx>{`
        .fabric-layer {
          position: absolute;
          inset: -4%;
          background-size: cover;
          background-position: center;
          filter: saturate(1.05);
        }

        .spotlight {
          position: absolute;
          width: 500px;
          height: 120vh;
          top: -20vh;
          filter: blur(30px);
          opacity: 0.15;
          pointer-events: none;
        }

        .spotlight-left {
          left: -120px;
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0.9),
            transparent
          );
          transform: rotate(-18deg);
        }

        .spotlight-right {
          right: -120px;
          background: linear-gradient(
            to bottom,
            rgba(147,197,253,0.8),
            transparent
          );
          transform: rotate(18deg);
        }
      `}</style>

    </main>
  );
}