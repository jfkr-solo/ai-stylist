"use client";

import { useCallback, useState } from "react";

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 2600);
  }, []);
  const node = msg ? (
    <div className="animate-pop fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-lg md:bottom-8">
      {msg}
    </div>
  ) : null;
  return { show, node };
}
