'use client';

import { useState, useRef } from "react";
import { C } from "../constants/colors";

export const PhotoAvatar = ({ personId, name, bgColor, photo, onUpload, size = 40, square = false }) => {
  const inputRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const radius = square ? 8 : "50%";
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpload(personId, ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0, cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      {photo ? (
        <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: radius, background: bgColor || C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.32, color: "#fff" }}>
          {initials}
        </div>
      )}
      {hovered && (
        <div style={{ position: "absolute", inset: 0, borderRadius: radius, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size * 0.35, color: "#fff" }}>📷</span>
        </div>
      )}
    </div>
  );
};
