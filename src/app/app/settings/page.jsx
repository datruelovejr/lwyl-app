'use client';

import { useLWYL } from "../../contexts/LWYLContext";
import { Settings } from "../../components/Settings";

export default function SettingsPage() {
  const ctx = useLWYL();
  return <Settings {...ctx} />;
}
