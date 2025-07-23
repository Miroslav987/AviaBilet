"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import React, { useEffect, useState } from "react";

const Header = () => {
  const links = [
    { path: "/", label: "Amadeus" },
    { path: "/duffel", label: "Duffel" },
    { path: "/travelpayouts", label: "Travelpayouts" },
  ];
  const path = usePathname();

  const [title, setTitle] = useState("");

  useEffect(() => {
    const current = links.find((link) => link.path === path);
    setTitle(current ? current.label : "");
  }, [path]);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
        {links.map((e) => (
          <Link key={e.path} onClick={() => setTitle(e.label)} href={e.path}>
            {e.label}
          </Link>
        ))}
      </div>
      <h2 style={{ textAlign: "center" }}>{title}</h2>
    </>
  );
};

export default Header;
