import { C } from "../constants/colors";
import { Bias } from "./Bias";

export const CircleProgress = ({ value, max = 10, color, label, name, bias }) => {
  const radius = 32; const circ = 2 * Math.PI * radius;
  const offset = circ - (value / max) * circ;
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={radius} fill="none" stroke={C.hi} strokeWidth="8" />
        <circle cx="42" cy="42" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 42 42)" />
        <text x="42" y="47" textAnchor="middle" fontSize="18" fontWeight="700" fill={C.text}>{value}</text>
      </svg>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: C.muted }}>{name}</div>
      {bias && <div style={{ marginTop: 4 }}><Bias bias={bias} /></div>}
    </div>
  );
};
