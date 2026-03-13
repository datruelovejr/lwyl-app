import { C } from "../constants/colors";

export const Sec = ({ title, sub, color }) => (<div style={{ marginBottom: 16 }}><h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{title}</h2>{sub && <div style={{ fontSize: 14, color: C.muted }}>{sub}</div>}</div>);
