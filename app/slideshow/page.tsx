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
    if (photos.length === 0) return;

    const interval = setInterval(() => {
      setFade(false);

      setTimeout(() => {
        setCurrentIndex((prev) =>
          prev === photos.length - 1 ? 0 : prev + 1
        );

        setFade(true);
      }, 700);
    }, 7000);

    return () => clearInterval(interval);
  }, [photos]);

  const showGuestbookSlide =
    messages.length > 0 &&
    Date.now() % 240000 < 12000;

  const randomMessage =
    messages[
      Math.floor(Math.random() * messages.length)
    ];

  return (
    <main className="relative w-screen h-screen overflow-hidden text-white">

      {/* Animated Fabric Layer */}
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
              className="w-[780px] opacity-[0.16] blur-[1px] drop-shadow-[0_0_40px_rgba(255,255,255,0.18)]"
            />

          </div>

        </div>

      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[#06142B]/45"></div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.45)_100%)]"></div>

      {/* Spotlights */}
      <div className="spotlight spotlight-left"></div>
      <div className="spotlight spotlight-right"></div>
      <div className="spotlight spotlight-top"></div>

      {/* Main Content */}
      <div className="absolute inset-0 flex items-center justify-center px-16 pb-52">

        {showGuestbookSlide && randomMessage ? (

          <div className="w-full flex justify-center items-center z-20 px-20">

            <div className="w-full max-w-5xl text-center animate-fade">

              {/* Heading */}
              <div className="mb-10">

                <div className="text-7xl font-extrabold text-white tracking-wide drop-shadow-[0_4px_20px_rgba(0,0,0,0.75)]">
                  Messages for Vicky
                </div>

              </div>

              {/* Elegant Message Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1936]/88 to-[#10254D]/88 border border-white/10 backdrop-blur-xl rounded-[3rem] px-20 py-16 shadow-[0_0_80px_rgba(0,0,0,0.45)]">

                {/* Soft Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_45%)] pointer-events-none"></div>

                {/* Quote Mark */}
                <div className="absolute top-6 left-10 text-white/10 text-[9rem] leading-none font-serif">
                  “
                </div>

                {/* Message */}
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    whiteSpace: "pre-wrap",
                  }}
                  className="relative z-10 text-[2.05rem] leading-[1.7] text-[#F8FBFF] font-medium tracking-[0.01em] text-left max-h-[42vh] overflow-hidden drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
                >
                  {randomMessage.message}
                </div>

                {/* Signature */}
                <div className="relative z-10 mt-12 flex items-center justify-end">

                  <div className="text-right">

                    <div className="text-white/50 text-sm uppercase tracking-[0.35em] mb-2">
                      Shared by
                    </div>

                    <div className="text-[#D9F3FF] text-[2rem] font-semibold tracking-wide">
                      {randomMessage.name}
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        ) : photos.length === 0 ? (

          <div className="text-center z-20">

            <div className="text-6xl font-bold text-white mb-6">
              Awaiting Photos
            </div>

            <div className="text-2xl text-white/70">
              Upload photos or messages using the QR code
            </div>

          </div>

        ) : (

          <div
            key={photos[currentIndex]?.id}
            className={`transition-all duration-1000 ${
              fade ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >

            {/* Polaroid */}
            <div
              className="
                bg-white
                p-5
                pb-20
                rounded-[0.6rem]
                shadow-[0_25px_80px_rgba(0,0,0,0.45)]
                rotate-[-1.5deg]
                transition-all
                duration-1000
              "
            >

              <img
                src={photos[currentIndex].imageUrl}
                alt="Slideshow"
                className="
                  max-w-[74vw]
                  max-h-[58vh]
                  object-contain
                  bg-[#f3f3f3]
                "
              />

              {/* Caption */}
              <div className="mt-6 text-center">

                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                  className="text-[#1A1A1A] text-3xl italic"
                >
                  Presentation Day Memories
                </div>

              </div>

            </div>

          </div>

        )}

      </div>

      {/* Bottom Branding */}
      <div className="absolute bottom-6 left-8 z-20 flex items-end gap-8">

        <img
          src="/logo.png"
          alt="Club Logo"
          className="w-40 h-40 object-contain drop-shadow-2xl"
        />

        <div className="flex flex-col justify-end">

          <h1 className="leading-none">

            <span className="text-white text-5xl font-extrabold tracking-wide drop-shadow-[0_3px_18px_rgba(255,255,255,0.2)]">
              Chatteris Town Football Club
            </span>

            <br />

            <span
              style={{
                fontFamily: "'Playfair Display', serif",
              }}
              className="text-[#EAF8FF] text-[4rem] italic font-semibold tracking-[0.04em] drop-shadow-[0_2px_12px_rgba(255,255,255,0.18)]"
            >
              Presentation Day
            </span>

            <span className="block mt-3 uppercase tracking-[0.22em] text-[#EAF8FF] text-[1.55rem] font-semibold drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]">
              ONE CLUB | ONE FAMILY | THE LILIES
            </span>

          </h1>

        </div>

      </div>

      {/* QR Panel */}
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
          animation: fabricFlutter 9s ease-in-out infinite;
          transform-origin: center;
          filter: saturate(1.05);
        }

        .spotlight {
          position: absolute;
          width: 500px;
          height: 120vh;
          top: -20vh;
          filter: blur(30px);
          opacity: 0.18;
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
            rgba(147,197,253,0.9),
            transparent
          );
          transform: rotate(18deg);
        }

        .spotlight-top {
          left: 40%;
          top: -40vh;
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0.7),
            transparent
          );
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

        @keyframes fade {
          from {
            opacity: 0;
            transform: scale(0.96);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade {
          animation: fade 1.5s ease;
        }
      `}</style>

    </main>
  );
}