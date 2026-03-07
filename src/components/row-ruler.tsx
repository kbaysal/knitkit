"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface RowRulerProps {
  initialPosition: number;
  initialHeight?: number;
  scale?: number;
  onPositionChange: (position: number, height: number) => void;
}

export function RowRuler({ initialPosition, initialHeight = 32, scale = 1, onPositionChange }: RowRulerProps) {
  const [position, setPosition] = useState(initialPosition);
  const [height, setHeight] = useState(initialHeight);
  const [dragging, setDragging] = useState(false);
  const positionRef = useRef(position);
  const heightRef = useRef(height);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    heightRef.current = height;
  }, [height]);

  // Drag to reposition
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      const startY = e.clientY;
      const startPos = positionRef.current;

      const handleMouseMove = (e: MouseEvent) => {
        const delta = (e.clientY - startY) / scale;
        const newPos = Math.max(0, startPos + delta);
        setPosition(newPos);
        positionRef.current = newPos;
      };

      const handleMouseUp = () => {
        setDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        onPositionChange(positionRef.current, heightRef.current);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onPositionChange, scale]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      setDragging(true);
      const startY = touch.clientY;
      const startPos = positionRef.current;

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        const delta = (touch.clientY - startY) / scale;
        const newPos = Math.max(0, startPos + delta);
        setPosition(newPos);
        positionRef.current = newPos;
      };

      const handleTouchEnd = () => {
        setDragging(false);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        onPositionChange(positionRef.current, heightRef.current);
      };

      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
    },
    [onPositionChange, scale]
  );

  // Resize handle on bottom edge
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startY = e.clientY;
      const startHeight = heightRef.current;

      const handleMouseMove = (e: MouseEvent) => {
        const delta = (e.clientY - startY) / scale;
        const newHeight = Math.max(16, startHeight + delta);
        setHeight(newHeight);
        heightRef.current = newHeight;
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        onPositionChange(positionRef.current, heightRef.current);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onPositionChange, scale]
  );

  return (
    <div
      className="absolute left-0 right-0 z-10 cursor-ns-resize touch-none"
      style={{ top: `${position * scale}px` }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Translucent bar */}
      <div
        className="w-full bg-yellow-300/40 border-y border-yellow-500/60"
        style={{ height: `${height * scale}px` }}
      />
      {/* Handle indicator */}
      <div className="absolute -right-1 top-1/2 -translate-y-1/2 rounded bg-yellow-500 px-1 py-0.5 text-[10px] font-bold text-white shadow">
        ☰
      </div>
      {/* Bottom resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-yellow-500/30"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
}
