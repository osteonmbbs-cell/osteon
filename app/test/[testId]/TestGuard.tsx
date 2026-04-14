"use client";

import { useEffect, ReactNode } from "react";

export default function TestGuard({ 
  children, 
  studentEmail 
}: { 
  children: ReactNode; 
  studentEmail: string; 
}) {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Disable ctrl+U, ctrl+S, F12, ctrl+shift+I
      if (
        (e.ctrlKey && key === 'u') ||
        (e.ctrlKey && key === 's') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && key === 'i') ||
        (e.ctrlKey && e.shiftKey && key === 'c') ||
        (e.ctrlKey && e.shiftKey && key === 'j')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Generate invisible grid of repeated student emails for watermark overlay
  const watermarks = Array.from({ length: 80 }).map((_, i) => (
    <div key={i} className="flex items-center justify-center text-center -rotate-45 p-6 break-words pointer-events-none">
      {studentEmail}
    </div>
  ));

  return (
    <div className="relative w-full h-full">
      {children}
      {/* Absolute overlay layered on top capturing no pointer events */}
      <div 
        className="pointer-events-none absolute inset-0 z-50 overflow-hidden grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-8 opacity-[0.08] text-slate-900 font-extrabold text-sm sm:text-base select-none leading-tight"
        aria-hidden="true"
      >
        {watermarks}
      </div>
    </div>
  );
}
