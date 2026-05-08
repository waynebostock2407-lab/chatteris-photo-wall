"use client";

import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {

    const password = prompt(
      "Enter admin password"
    );

    if (
      password ===
      process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    ) {
      setAuthorized(true);
    } else {

      alert("Incorrect password");

      window.location.href = "/";
    }

  }, []);

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}