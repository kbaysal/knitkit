"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface RowRulerProps {
  initialPosition: number;
  onPositionChange: (position: number) => void;
}

export function RowRuler({ initialPosition, onPositionChange }: RowRulerProps) {
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  const positionRef = useRef(position);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      const startY = e.clientY;
      const startPos = positionRef.current;

      const handleMouseMove = (e: MouseEvent) => {
        const delta = e.clientY - startY;
        const newPos = Math.max(0, startPos + delta);
        setPosition(newPos);
        positionRef.current = newPos;
      };

      const handleMouseUp = () => {
        setDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        onPositionChange(positionRef.current);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onPositionChange]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setDragging(true);
      const startY = touch.clientY;
      const startPos = positionRef.current;

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        const delta = touch.clientY - startY;
        const newPos = Math.max(0, startPos + delta);
        setPosition(newPos);
        positionRef.current = newPos;
      };

      const handleTouchEnd = () => {
        setDragging(false);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        onPositionChange(positionRef.current);
      };

      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    },
    [onPositionChange]
  );

  return (
    <div
      className="absolute left-0 right-0 z-10 cursor-ns-resize"
      style={{ top: `${position}px` }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Translucent bar */}
      <div className="h-8 w-full bg-yellow-300/40 border-y border-yellow-500/60" />
      {/* Handle indicator */}
      <div className="absolute -right-1 top-1/2 -translate-y-1/2 rounded bg-yellow-500 px-1 py-0.5 text-[10px] font-bold text-white shadow">
        ☰
      </div>
    </div>
  );
}
