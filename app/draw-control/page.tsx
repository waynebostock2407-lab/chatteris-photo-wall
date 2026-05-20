"use client";

import { useEffect, useState } from "react";

import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function DrawControlPage() {

  const [chairTeam, setChairTeam] =
    useState<string[]>([]);

  const [viceChairTeam, setViceChairTeam] =
    useState<string[]>([]);

  const [remainingCoaches, setRemainingCoaches] =
    useState<string[]>([]);

  const [selectedCoach, setSelectedCoach] =
    useState("");

  const [newCoach, setNewCoach] =
    useState("");

  useEffect(() => {

    const drawRef =
      doc(db, "eventControl", "cupDraw");

    const unsubscribe =
      onSnapshot(drawRef, (snapshot) => {

        if (snapshot.exists()) {

          const data = snapshot.data();

          setChairTeam(
            data.chairTeam || []
          );

          setViceChairTeam(
            data.viceChairTeam || []
          );

          setRemainingCoaches(
            data.remainingCoaches || []
          );

        } else {

          setDoc(drawRef, {
            chairTeam: [],
            viceChairTeam: [],
            remainingCoaches: [],
            currentReveal: "",
          });

        }

      });

    return () => unsubscribe();

  }, []);

  const addCoach = async () => {

    if (!newCoach.trim()) return;

    const updatedRemaining = [
      ...remainingCoaches,
      newCoach.trim(),
    ];

    await updateDoc(
      doc(db, "eventControl", "cupDraw"),
      {
        remainingCoaches:
          updatedRemaining,
      }
    );

    setNewCoach("");

  };

  const editRemainingCoach = async (
    oldName: string
  ) => {

    const newName = prompt(
      "Edit coach name:",
      oldName
    );

    if (
      !newName ||
      !newName.trim()
    ) return;

    const updatedRemaining =
      remainingCoaches.map((coach) =>
        coach === oldName
          ? newName.trim()
          : coach
      );

    await updateDoc(
      doc(db, "eventControl", "cupDraw"),
      {
        remainingCoaches:
          updatedRemaining,
      }
    );

  };

  const removeRemainingCoach =
    async (coachName: string) => {

      const updatedRemaining =
        remainingCoaches.filter(
          (coach) =>
            coach !== coachName
        );

      await updateDoc(
        doc(db, "eventControl", "cupDraw"),
        {
          remainingCoaches:
            updatedRemaining,
        }
      );

    };

  const addToChair = async () => {

    if (!selectedCoach) return;

    const updatedRemaining =
      remainingCoaches.filter(
        (coach) =>
          coach !== selectedCoach
      );

    const updatedChair = [
      ...chairTeam,
      selectedCoach,
    ];

    await updateDoc(
      doc(db, "eventControl", "cupDraw"),
      {
        chairTeam: updatedChair,
        remainingCoaches:
          updatedRemaining,
        currentReveal:
          selectedCoach,
      }
    );

    setSelectedCoach("");

  };

  const addToViceChair = async () => {

    if (!selectedCoach) return;

    const updatedRemaining =
      remainingCoaches.filter(
        (coach) =>
          coach !== selectedCoach
      );

    const updatedVice = [
      ...viceChairTeam,
      selectedCoach,
    ];

    await updateDoc(
      doc(db, "eventControl", "cupDraw"),
      {
        viceChairTeam:
          updatedVice,
        remainingCoaches:
          updatedRemaining,
        currentReveal:
          selectedCoach,
      }
    );

    setSelectedCoach("");

  };

  const movePlayer = async (
    player: string,
    targetTeam: "chair" | "vice"
  ) => {

    let updatedChair = [...chairTeam];
    let updatedVice = [...viceChairTeam];

    updatedChair =
      updatedChair.filter(
        (p) => p !== player
      );

    updatedVice =
      updatedVice.filter(
        (p) => p !== player
      );

    if (targetTeam === "chair") {

      updatedChair.push(player);

    } else {

      updatedVice.push(player);

    }

    await updateDoc(
      doc(db, "eventControl", "cupDraw"),
      {
        chairTeam: updatedChair,
        viceChairTeam: updatedVice,
      }
    );

  };

  const removePlayer = async (
    player: string
  ) => {

    const updatedChair =
      chairTeam.filter(
        (p) => p !== player
      );

    const updatedVice =
      viceChairTeam.filter(
        (p) => p !== player
      );

    const updatedRemaining = [
      ...remainingCoaches,
      player,
    ];

    await updateDoc(
      doc(db, "eventControl", "cupDraw"),
      {
        chairTeam: updatedChair,
        viceChairTeam: updatedVice,
        remainingCoaches:
          updatedRemaining,
      }
    );

  };

  const resetDraw = async () => {

    await updateDoc(
      doc(db, "eventControl", "cupDraw"),
      {
        chairTeam: [],
        viceChairTeam: [],
        remainingCoaches: [],
        currentReveal: "",
      }
    );

  };

  return (

    <main className="min-h-screen bg-[#020817] text-white p-6">

      <div className="max-w-6xl mx-auto">

        <div className="text-center">

          <div className="text-5xl font-black">
            LIVE DRAW CONTROL
          </div>

          <div className="mt-3 text-white/60 tracking-[0.35em]">
            CHAIR vs VICE CHAIR
          </div>

        </div>

        <div className="flex justify-center gap-4 mb-10 mt-10">

          <input
            value={newCoach}
            onChange={(e) =>
              setNewCoach(e.target.value)
            }
            placeholder="Add coach name..."
            className="
              h-14
              w-80
              rounded-full
              bg-white/5
              border border-white/10
              px-6
              outline-none
            "
          />

          <button
            onClick={addCoach}
            className="
              h-14
              px-6
              rounded-full
              bg-blue-500
              font-black
            "
          >
            ADD COACH
          </button>

        </div>

        <div className="mt-12">

          <div className="text-center text-white/60 tracking-[0.3em] mb-6">

            REMAINING COACHES

          </div>

          <div className="flex flex-wrap justify-center gap-3">

            {remainingCoaches.map((coach, index) => (

              <div
                key={coach}
                className="
                  flex
                  items-center
                  gap-2
                  bg-white/5
                  border border-white/10
                  rounded-full
                  px-2
                  py-2
                "
              >

                <div
  className="
    w-10
    h-10
    rounded-full
    bg-white
    text-[#163b7a]
    flex
    items-center
    justify-center
    font-black
    text-sm
    shadow-lg
    flex-shrink-0
  "
>
  {index + 1}
</div>

                <button
                  onClick={() =>
                    setSelectedCoach(coach)
                  }
                  className={`
                    px-5 py-3 rounded-full transition-all duration-300 text-lg font-bold
                    ${
                      selectedCoach === coach
                        ? "bg-blue-500 scale-105"
                        : "bg-transparent"
                    }
                  `}
                >
                  {coach}
                </button>

                <button
                  onClick={() =>
                    editRemainingCoach(coach)
                  }
                  className="
                    h-10
                    px-4
                    rounded-full
                    bg-yellow-500
                    text-sm
                    font-black
                    text-black
                  "
                >
                  EDIT
                </button>

                <button
                  onClick={() =>
                    removeRemainingCoach(
                      coach
                    )
                  }
                  className="
                    h-10
                    px-4
                    rounded-full
                    bg-red-500
                    text-sm
                    font-black
                  "
                >
                  REMOVE
                </button>

              </div>

            ))}

          </div>

        </div>

        <div className="flex justify-center gap-6 mt-12">

          <button
            disabled={!selectedCoach}
            onClick={addToChair}
            className="h-16 px-8 rounded-full bg-blue-500 disabled:opacity-40 font-black text-lg"
          >
            ADD TO CHAIR SQUAD
          </button>

          <button
            disabled={!selectedCoach}
            onClick={addToViceChair}
            className="h-16 px-8 rounded-full bg-red-500 disabled:opacity-40 font-black text-lg"
          >
            ADD TO VICE CHAIR
          </button>

          <button
            onClick={resetDraw}
            className="h-16 px-8 rounded-full bg-white/10 border border-white/10 font-black text-lg"
          >
            RESET
          </button>

        </div>

        <div className="grid grid-cols-2 gap-6 mt-16">

          <div className="rounded-[2rem] bg-white/5 border border-white/10 p-6">

            <div className="text-3xl font-black text-center mb-6">
              CHAIR SQUAD
            </div>

            <div className="space-y-3">

              {chairTeam.map((coach) => (

                <div
                  key={coach}
                  className="
                    bg-white/5
                    rounded-2xl
                    p-4
                    mb-3
                  "
                >

                  <div className="font-bold mb-3">
                    {coach}
                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        movePlayer(
                          coach,
                          "vice"
                        )
                      }
                      className="
                        px-3
                        py-2
                        rounded-xl
                        bg-blue-500
                        text-sm
                        font-bold
                      "
                    >
                      MOVE
                    </button>

                    <button
                      onClick={() =>
                        removePlayer(coach)
                      }
                      className="
                        px-3
                        py-2
                        rounded-xl
                        bg-red-500
                        text-sm
                        font-bold
                      "
                    >
                      REMOVE
                    </button>

                  </div>

                </div>

              ))}

            </div>

          </div>

          <div className="rounded-[2rem] bg-white/5 border border-white/10 p-6">

            <div className="text-3xl font-black text-center mb-6">
              VICE CHAIR SQUAD
            </div>

            <div className="space-y-3">

              {viceChairTeam.map((coach) => (

                <div
                  key={coach}
                  className="
                    bg-white/5
                    rounded-2xl
                    p-4
                    mb-3
                  "
                >

                  <div className="font-bold mb-3">
                    {coach}
                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        movePlayer(
                          coach,
                          "chair"
                        )
                      }
                      className="
                        px-3
                        py-2
                        rounded-xl
                        bg-blue-500
                        text-sm
                        font-bold
                      "
                    >
                      MOVE
                    </button>

                    <button
                      onClick={() =>
                        removePlayer(coach)
                      }
                      className="
                        px-3
                        py-2
                        rounded-xl
                        bg-red-500
                        text-sm
                        font-bold
                      "
                    >
                      REMOVE
                    </button>

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </main>

  );

}