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
  const [showIntro, setShowIntro] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  /* Initial Intro */
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  /* Intro Every 10 Minutes */
  useEffect(() => {
    const introCycle = setInterval(() => {

      setShowIntro(true);

      setTimeout(() => {
        setShowIntro(false);
      }, 20000);

    }, 600000);

    return () => clearInterval(introCycle);
  }, []);

  const polaroidStyles = [
    "rotate-[-2deg] translate-y-1",
    "rotate-[1.8deg] -translate-y-1",
    "rotate-[-1deg] translate-y-2",
    "rotate-[2.4deg]",
    "rotate-[-2.5deg]",
    "rotate-[1deg] translate-y-1",
  ];

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

    if (!showMessages && !showIntro) {

      interval = setInterval(() => {

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

  }, [photos, showMessages, showIntro]);

  /* Messages Every 5 Minutes */
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

    }, Math.min(
      Math.max(
        9000,
        messages[messageIndex]?.message.length * 60
      ),
      30000
    ));

    return () => clearInterval(interval);

  }, [showMessages, messageIndex, messages]);

  return (
    <main className="relative w-screen h-screen overflow-hidden text-white">

      {/* Background */}
      {showIntro ? (

        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/presentation-stage.jpg')",
          }}
        />

      ) : (

        <div className="absolute inset-0 overflow-hidden">

          <div
            className="fabric-layer opacity-[0.45]"
            style={{
              backgroundImage: "url('/stripe-bg.jpg')",
            }}
          >

            <div className="absolute inset-0 bg-[#06142B]/45"></div>

            <div className="absolute inset-0 flex items-center justify-center">

              <img
                src="/logo.png"
                alt="Background Logo"
                className="w-[780px] opacity-[0.16]"
              />

            </div>

          </div>

        </div>

      )}

      {/* Flash */}
      <div
        className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-200 ${
          flash ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 35%, rgba(255,255,255,0) 100%)",
        }}
      />

      {/* Fullscreen */}
      {!isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-6 right-6 z-40 bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/10 text-white px-5 py-3 rounded-2xl text-lg font-semibold transition shadow-2xl"
        >
          ⛶ Full Screen
        </button>
      )}

      {/* Main */}
      <div className="absolute inset-0 flex items-center justify-center px-16 pb-44 z-20">

        {/* Intro */}
        {showIntro ? (

          <div className="text-center">

            {/* Logos */}
            <div className="flex items-center justify-center gap-20 mb-14">

              <img
                src="/logo 4.png"
                alt="Young Lilies"
                className="silver-logo w-56 h-56 object-contain"
              />

              <img
                src="/logo.png"
                alt="The Lilies"
                className="silver-logo w-56 h-56 object-contain"
              />

            </div>

            {/* Title */}
            <h1 className="silver-title">
              CHATTERIS TOWN FC
            </h1>

            <div
              style={{
                fontFamily: "var(--font-great-vibes)",
              }}
              className="silver-script"
            >
              Presentation Day
            </div>

            <div className="flex items-center justify-center mt-8">

              <div className="w-44 h-[1px] bg-white/50"></div>

              <div className="mx-4 text-white text-3xl">
                ✧
              </div>

              <div className="w-44 h-[1px] bg-white/50"></div>

            </div>

          </div>

        ) : showMessages && messages[messageIndex] ? (

          /* Messages */
          <div className="w-full flex justify-center items-center px-12">

            <div className="w-full max-w-5xl text-center flex flex-col items-center">

              {/* Title */}
              <div className="mb-6 flex-shrink-0">

                <div className="text-6xl font-extrabold text-white tracking-wide">
                  Messages for Vicky
                </div>

              </div>

              {/* Card */}
              <div
                className="
                  relative
                  overflow-hidden
                  bg-white/10
                  border
                  border-white/10
                  backdrop-blur-xl
                  rounded-[3rem]
                  px-16
                  py-12
                  shadow-[0_0_80px_rgba(0,0,0,0.35)]

                  w-full
                  max-w-5xl

                  min-h-[42vh]
                  max-h-[70vh]

                  flex
                  flex-col
                  justify-between
                "
              >

                {/* Message */}
                <div
                  style={{
                    fontFamily: "'Caveat', cursive",
                  }}
                  className={`
                    relative
                    z-10
                    text-white
                    font-semibold
                    tracking-[0.01em]
                    text-left
                    whitespace-pre-wrap
                    break-words
                    leading-[1.25]

                    flex-1
                    flex
                    items-center

                    ${
                      messages[messageIndex].message.length < 120
                        ? "text-[3.3rem]"
                        : messages[messageIndex].message.length < 220
                        ? "text-[2.7rem]"
                        : messages[messageIndex].message.length < 350
                        ? "text-[2.15rem]"
                        : messages[messageIndex].message.length < 500
                        ? "text-[1.75rem]"
                        : messages[messageIndex].message.length < 700
                        ? "text-[1.45rem]"
                        : messages[messageIndex].message.length < 900
                        ? "text-[1.2rem]"
                        : "text-[1rem]"
                    }
                  `}
                >
                  {messages[messageIndex].message}
                </div>

                {/* Signature */}
                <div className="relative z-10 mt-8 flex justify-end">

                  <div className="text-right">

                    <div className="text-white/60 text-sm uppercase tracking-[0.35em] mb-1">
                      Shared by
                    </div>

                    <div
                      style={{
                        fontFamily: "'Caveat', cursive",
                      }}
                      className="
                        text-white
                        font-bold
                        leading-none
                        text-[2.2rem]
                      "
                    >
                      {messages[messageIndex].name}
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        ) : photos.length === 0 ? (

          <div className="text-center">

            <div className="text-6xl font-bold text-white mb-6">
              Awaiting Photos
            </div>

          </div>

        ) : (

          /* Photos */
          <div
            key={photos[currentIndex]?.id}
            className={`transition-all duration-700 ease-out ${
              fade
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-[0.97] translate-y-2"
            }`}
          >

            <div
              className={`
                inline-flex
                flex-col
                items-center
                bg-white
                p-5
                pb-16
                rounded-[0.6rem]
                shadow-[0_18px_50px_rgba(0,0,0,0.38)]
                max-w-[82vw]
                transition-transform
                duration-700
                ${
                  polaroidStyles[
                    currentIndex % polaroidStyles.length
                  ]
                }
              `}
            >

              <img
                src={photos[currentIndex].imageUrl}
                alt="Slideshow"
                className="max-w-[74vw] max-h-[58vh] object-contain"
              />

              {/* Footer */}
              <div className="mt-7 flex items-center justify-center gap-5">

                <img
                  src="/logo 4.png"
                  alt="Young Lilies"
                  className="w-14 h-14 object-contain opacity-90"
                />

                <div
                  style={{
                    fontFamily: "var(--font-great-vibes)",
                  }}
                  className="text-[#222] text-[3.2rem] leading-none"
                >
                  Memories
                </div>

                <img
                  src="/logo.png"
                  alt="The Lilies"
                  className="w-14 h-14 object-contain opacity-90"
                />

              </div>

            </div>

          </div>

        )}

      </div>

      {/* Branding */}
      {!showIntro && (
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
                  fontFamily: "var(--font-great-vibes)",
                }}
                className="text-sky-100 text-[4rem]"
              >
                Presentation Day
              </span>

            </h1>

          </div>

        </div>
      )}

      {/* QR */}
      {!showIntro && (
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
      )}

      <style jsx>{`
        .fabric-layer {
          position: absolute;
          inset: -4%;
          background-size: cover;
          background-position: center;
        }

        .silver-title {
          font-size: 7rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          line-height: 1;
          text-transform: uppercase;

          background:
            linear-gradient(
              to bottom,
              #ffffff 0%,
              #f1f5f9 18%,
              #d1d5db 38%,
              #ffffff 52%,
              #9ca3af 72%,
              #f8fafc 100%
            );

          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          text-shadow:
            0 0 14px rgba(255,255,255,0.5),
            0 0 40px rgba(255,255,255,0.35);

          animation:
            silverShimmer 5s linear infinite;
        }

        .silver-script {
          margin-top: 2rem;
          font-size: 5.2rem;
          color: white;

          text-shadow:
            0 0 15px rgba(255,255,255,0.6),
            0 0 35px rgba(255,255,255,0.3);
        }

        .silver-logo {
          filter:
            brightness(1.35)
            grayscale(1)
            contrast(1.15)
            drop-shadow(0 0 25px rgba(255,255,255,0.45));

          animation:
            logoPulse 5s ease-in-out infinite;
        }

        @keyframes silverShimmer {
          0% {
            filter: brightness(1);
          }

          50% {
            filter: brightness(1.45);
          }

          100% {
            filter: brightness(1);
          }
        }

        @keyframes logoPulse {
          0% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.04);
          }

          100% {
            transform: scale(1);
          }
        }
      `}</style>

    </main>
  );
}