"use client";

import { useState } from "react";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function UploadPage() {

  const [selectedFiles, setSelectedFiles] =
    useState<File[]>([]);

  const [name, setName] = useState("");

  const [message, setMessage] = useState("");

  const submitMessage = async () => {

    if (!message) return;

    try {

      await addDoc(
        collection(db, "guestbook"),
        {
          name: name || "Anonymous",
          message: message,
          approved: false,
          createdAt: serverTimestamp(),
        }
      );

      setName("");
      setMessage("");

      alert("Message submitted!");

    } catch (error) {

      console.error(error);

    }
  };

  return (

    <main
      className="
        min-h-screen
        w-full
        bg-cover
        bg-center
        text-white
        px-6
        py-10
        flex
        justify-center
      "
      style={{
        backgroundImage:
          "url('/blank-presentation-stage.jpg')",
      }}
    >

      <div className="w-full max-w-md">

        {/* LOGO */}
        <div className="flex justify-center mb-8">

          <img
            src="/logo.png"
            alt="Club Logo"
            className="w-40 h-40 object-contain"
          />

        </div>

        {/* STRAPLINE */}
        <div className="flex justify-center mb-10">

          <div
            className="
              bg-white/10
              border
              border-white/10
              backdrop-blur-xl
              rounded-full
              px-8
              py-3
              tracking-[0.35em]
              text-sm
              font-semibold
              text-center
            "
          >
            ONE CLUB • ONE FAMILY • THE LILIES
          </div>

        </div>

        {/* TITLE */}
        <div className="text-center mb-10">

          <h1
            className="
              text-[4.4rem]
              font-black
              uppercase
              leading-[0.9]
              tracking-tight
            "
          >
            SHARE YOUR
          </h1>

          <div
            className="
              text-[4.3rem]
              font-black
              italic
              text-[#80AFFF]
              leading-none
              -mt-2
            "
          >
            MEMORIES!
          </div>

        </div>

        {/* DESCRIPTION */}
        <div className="text-center mb-12">

          <p
            className="
              text-[1.2rem]
              leading-relaxed
              text-white/90
              font-medium
            "
          >
            Upload your favourite photos and
            messages for Presentation Day
            and see them featured LIVE on the
            big screen during the event.
          </p>

        </div>

        {/* PHOTO CARD */}
        <div
          className="
            bg-white
            rounded-[2.5rem]
            px-8
            py-10
            shadow-[0_15px_60px_rgba(0,0,0,0.35)]
            mb-8
          "
        >

          {/* HEADER */}
          <div className="flex items-center gap-5 mb-8">

            <div
              className="
                w-20
                h-20
                rounded-full
                bg-[#245DFF]
                flex
                items-center
                justify-center
                text-white
                text-4xl
              "
            >
              📷
            </div>

            <div>

              <div
                className="
                  text-[#041B4D]
                  text-[2.3rem]
                  font-black
                  uppercase
                  leading-none
                "
              >
                Upload Photos
              </div>

              <div
                className="
                  text-[#4B5563]
                  text-lg
                  mt-2
                  font-medium
                "
              >
                Share your favourite moments
              </div>

            </div>

          </div>

          {/* FILE INPUT */}
          <label
            className="
              block
              cursor-pointer
            "
          >

            <input
              type="file"
              className="hidden"
              onChange={(e) => {

                if (e.target.files){

                  setSelectedFiles(
                    Array.from(e.target.files)
                  );

                }

              }}
            />

            <div
              className="
                rounded-[2rem]
                bg-[#EDF3FF]
                py-16
                px-6
                text-center
                border
                border-[#D7E4FF]
                transition
                hover:scale-[1.01]
              "
            >

              <div className="text-5xl mb-5">
                ☁️
              </div>

              <div
                className="
                  text-[#245DFF]
                  text-[2rem]
                  font-black
                  uppercase
                "
              >
                Choose Files
              </div>

              <div
                className="
                  text-[#041B4D]
                  mt-3
                  text-lg
                  font-semibold
                "
              >
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} files selected`
                  : "No files chosen"}
              </div>

            </div>

          </label>

        </div>

        {/* MESSAGE CARD */}
        <div
          className="
            bg-white
            rounded-[2.5rem]
            px-8
            py-10
            shadow-[0_15px_60px_rgba(0,0,0,0.35)]
          "
        >

          {/* HEADER */}
          <div className="flex items-center gap-5 mb-8">

            <div
              className="
                w-20
                h-20
                rounded-full
                bg-[#245DFF]
                flex
                items-center
                justify-center
                text-white
                text-4xl
              "
            >
              💬
            </div>

            <div>

              <div
                className="
                  text-[#041B4D]
                  text-[2.3rem]
                  font-black
                  uppercase
                  leading-none
                "
              >
                Send A Message
              </div>

              <div
                className="
                  text-[#4B5563]
                  text-lg
                  mt-2
                  font-medium
                "
              >
                Share your memories and best wishes.
              </div>

            </div>

          </div>

          {/* NAME */}
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="
              w-full
              rounded-2xl
              bg-[#EDF3FF]
              border
              border-[#D7E4FF]
              p-5
              text-[#041B4D]
              text-xl
              font-semibold
              outline-none
              mb-5
            "
          />

          {/* MESSAGE */}
          <textarea
            placeholder="Write your message here..."
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            rows={6}
            className="
              w-full
              rounded-2xl
              bg-[#EDF3FF]
              border
              border-[#D7E4FF]
              p-5
              text-[#041B4D]
              text-lg
              outline-none
              resize-none
              mb-6
            "
          />

          {/* SUBMIT */}
          <button
            onClick={submitMessage}
            className="
              w-full
              rounded-2xl
              bg-[#245DFF]
              hover:bg-[#184FEA]
              transition
              text-white
              font-black
              uppercase
              text-xl
              py-5
              shadow-lg
            "
          >
            Send Message
          </button>

        </div>

      </div>

    </main>

  );
}