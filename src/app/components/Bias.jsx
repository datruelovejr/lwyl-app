import { biasInfo } from "../constants/data";

export const Bias = ({ bias }) => { const b = biasInfo[bias] || biasInfo["="]; return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: b.bg, color: b.fg, borderLeft: `3px solid ${b.bd}` }}>({bias}) {b.word}</span>; };
