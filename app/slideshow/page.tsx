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
  const [showMessages, setShowMessages] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

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

  useEffect(() => {
    const introTimer = setTimeout(() => {
      setShowIntro(false);
    }, 25000);

    return () => clearTimeout(introTimer);
  }, []);

  useEffect(() => {
    if (photos.length === 0 || showMessages || showIntro) return;

    const interval = setInterval(() => {
      setFade(false);

      setTimeout(() => {
        setCurrentIndex((prev) =>
          prev === photos.length - 1 ? 0 : prev + 1
        );

        setFade(true);
      }, 500);
    }, 6500);

    return () => clearInterval(interval);
  }, [photos, showMessages, showIntro]);

  useEffect(() => {
    if (messages.length === 0) return;

    const cycle = setInterval(() => {
      setShowMessages(true);
      setMessageIndex(0);
    }, 240000);

    return () => clearInterval(cycle);
  }, [messages]);

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
      }, 400);
    }, 12000);

    return () => clearInterval(interval);
  }, [showMessages, messageIndex, messages]);

  const polaroidStyles = [
    "rotate-[-2deg]",
    "rotate-[1deg]",
    "rotate-[-1deg]",
    "rotate-[2deg]",
  ];

  return (
    <main className="relative w-screen h-screen overflow-hidden text-white bg-black">

      <div
        className="absolute inset-0 bg-cover bg-center scale-[1.02]"
        style={{
          backgroundImage: "url('/presentation-stage.jpg')",
        }}
      />

      <div className="absolute inset-0 bg-[#020817]/45" />

      <div className="ambient-orbs">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="absolute inset-0 z-20 flex items-center justify-center px-10 pb-28">

        {showIntro ? (

          <div className="intro-wrapper">

            <div className="intro-atmosphere" />

            <div className="intro-logos">

              <img
                src="/logo 4.png"
                alt="Young Lilies"
                className="hero-logo"
              />

              <img
                src="/logo.png"
                alt="The Lilies"
                className="hero-logo"
              />

            </div>

            <h1 className="hero-title">
              CHATTERIS TOWN FC
            </h1>

            <div className="hero-script">
              Presentation Day
            </div>

            <div className="hero-divider">
              <div className="hero-line" />
              <div className="hero-star">✧</div>
              <div className="hero-line" />
            </div>

          </div>

        ) : showMessages && messages[messageIndex] ? (

          <div
            className={`message-card transition-all duration-700 ${
              fade
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            }`}
          >

            <div className="message-heading">
              Messages for Vicky
            </div>

            <div className="message-body">
              {messages[messageIndex].message}
            </div>

            <div className="message-name">
              — {messages[messageIndex].name}
            </div>

          </div>

        ) : photos.length > 0 ? (

          <div
            className={`transition-all duration-[1200ms] ease-out ${
              fade
                ? "opacity-100 scale-100"
                : "opacity-0 scale-[1.03]"
            }`}
          >

            <div
              className={`photo-card ${
                polaroidStyles[
                  currentIndex % polaroidStyles.length
                ]
              }`}
            >

              <img
                src={photos[currentIndex].imageUrl}
                alt="Slideshow"
                className="photo-image"
              />

              <div className="photo-footer">

                <img
                  src="/logo 4.png"
                  alt="Young Lilies"
                  className="footer-logo"
                />

                <div className="memories-text">
                  Memories
                </div>

                <img
                  src="/logo.png"
                  alt="The Lilies"
                  className="footer-logo"
                />

              </div>

            </div>

          </div>

        ) : (

          <div className="text-5xl font-bold">
            Awaiting Photos
          </div>

        )}

      </div>

      {!showIntro && (
        <div className="absolute bottom-6 left-8 z-30 flex items-end gap-6">

          <img
            src="/logo.png"
            alt="Club Logo"
            className="w-28 h-28 object-contain"
          />

          <div>
            <div className="text-4xl font-extrabold tracking-wide">
              Chatteris Town FC
            </div>

            <div className="bottom-script">
              Presentation Day
            </div>
          </div>

        </div>
      )}

      {!showIntro && (
        <div className="absolute bottom-8 right-8 z-30 bg-white rounded-[2rem] p-4 shadow-2xl">

          <div className="text-[#0A1E3D] text-center font-bold text-sm mb-3">
            UPLOAD PHOTOS
            <br />
            & MESSAGES
          </div>

          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://chatteris-photo-wall.vercel.app"
            alt="QR"
            className="rounded-xl w-[150px]"
          />

        </div>
      )}

      <style jsx>{`
        .intro-wrapper {
          position: relative;
          text-align: center;
        }

        .intro-atmosphere {
          position: absolute;
          inset: -120px;

          background:
            radial-gradient(
              circle,
              rgba(190,220,255,0.24) 0%,
              rgba(190,220,255,0.08) 38%,
              rgba(0,0,0,0) 72%
            );

          filter: blur(40px);

          animation: atmospherePulse 7s ease-in-out infinite;
        }

        .intro-logos {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5rem;

          margin-bottom: 3rem;
        }

        .hero-logo {
          width: 220px;
          height: 220px;
          object-fit: contain;

          filter:
            brightness(1.45)
            grayscale(1)
            contrast(1.2)
            drop-shadow(0 0 25px rgba(220,235,255,0.55));

          animation: logoFloat 6s ease-in-out infinite;
        }

        .hero-title {
          font-size: 7rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          line-height: 1;

          background:
            linear-gradient(
              to bottom,
              #ffffff 0%,
              #eef4ff 16%,
              #bfcfff 32%,
              #ffffff 48%,
              #94aee8 66%,
              #ffffff 100%
            );

          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          text-shadow:
            0 0 14px rgba(255,255,255,0.55),
            0 0 34px rgba(200,220,255,0.4),
            0 0 70px rgba(120,160,255,0.22);
        }

        .hero-script {
          margin-top: 2rem;

          font-family: var(--font-great-vibes);
          font-size: 5rem;

          background:
            linear-gradient(
              to bottom,
              #ffffff,
              #dce7ff,
              #ffffff
            );

          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          text-shadow:
            0 0 18px rgba(255,255,255,0.5);
        }

        .hero-divider {
          display: flex;
          align-items: center;
          justify-content: center;

          margin-top: 2rem;
        }

        .hero-line {
          width: 180px;
          height: 1px;

          background:
            linear-gradient(
              to right,
              rgba(255,255,255,0),
              rgba(255,255,255,0.8),
              rgba(255,255,255,0)
            );
        }

        .hero-star {
          margin: 0 1.5rem;
          font-size: 2rem;
          color: #eef4ff;
        }

        .ambient-orbs {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .ambient-orbs span {
          position: absolute;
          border-radius: 999px;

          background:
            radial-gradient(
              circle,
              rgba(255,255,255,0.32) 0%,
              rgba(255,255,255,0.06) 48%,
              rgba(255,255,255,0) 72%
            );

          filter:
            blur(24px)
            drop-shadow(0 0 40px rgba(255,255,255,0.35));

          animation: floatOrb linear infinite;
        }

        .ambient-orbs span:nth-child(1) {
          width: 420px;
          height: 420px;
          left: -8%;
          top: 8%;
          animation-duration: 28s;
        }

        .ambient-orbs span:nth-child(2) {
          width: 260px;
          height: 260px;
          left: 16%;
          top: 72%;
          animation-duration: 34s;
        }

        .ambient-orbs span:nth-child(3) {
          width: 520px;
          height: 520px;
          right: 4%;
          top: 10%;
          animation-duration: 40s;
        }

        .ambient-orbs span:nth-child(4) {
          width: 320px;
          height: 320px;
          right: -6%;
          top: 60%;
          animation-duration: 30s;
        }

        .ambient-orbs span:nth-child(5) {
          width: 220px;
          height: 220px;
          left: 42%;
          top: 2%;
          animation-duration: 24s;
        }

        .ambient-orbs span:nth-child(6) {
          width: 420px;
          height: 420px;
          left: 46%;
          bottom: -10%;
          animation-duration: 38s;
        }

        .photo-card {
          background: white;
          padding: 1.3rem;
          padding-bottom: 3.5rem;
          border-radius: 10px;

          box-shadow:
            0 25px 70px rgba(0,0,0,0.5);
        }

        .photo-image {
          max-width: 74vw;
          max-height: 58vh;
          object-fit: contain;
        }

        .photo-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;

          margin-top: 1.5rem;
        }

        .footer-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }

        .memories-text {
          font-family: var(--font-great-vibes);
          font-size: 3rem;
          color: #222;
        }

        .message-card {
          width: 100%;
          max-width: 1100px;

          background: rgba(255,255,255,0.08);

          border: 1px solid rgba(255,255,255,0.1);

          backdrop-filter: blur(20px);

          border-radius: 48px;

          padding: 4rem;
        }

        .message-heading {
          font-size: 4rem;
          font-weight: 800;
          margin-bottom: 2rem;
        }

        .message-body {
          font-size: 2.1rem;
          line-height: 1.4;
          white-space: pre-wrap;
        }

        .message-name {
          margin-top: 2rem;
          font-size: 2rem;
          opacity: 0.8;
        }

        .bottom-script {
          font-family: var(--font-great-vibes);
          font-size: 3rem;
          color: #dce7ff;
        }

        @keyframes logoFloat {
          0% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-8px);
          }

          100% {
            transform: translateY(0px);
          }
        }

        @keyframes atmospherePulse {
          0% {
            opacity: 0.5;
          }

          50% {
            opacity: 1;
          }

          100% {
            opacity: 0.5;
          }
        }

        @keyframes floatOrb {
          0% {
            transform:
              translate3d(0px,0px,0)
              scale(1);
          }

          25% {
            transform:
              translate3d(40px,-30px,0)
              scale(1.08);
          }

          50% {
            transform:
              translate3d(-20px,-70px,0)
              scale(0.96);
          }

          75% {
            transform:
              translate3d(30px,-20px,0)
              scale(1.04);
          }

          100% {
            transform:
              translate3d(0px,0px,0)
              scale(1);
          }
        }
      `}</style>

    </main>
  );
}