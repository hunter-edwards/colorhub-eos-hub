'use client';

import { useEffect, useRef, useState } from 'react';

export function Timer({ seconds }: { seconds: number }) {
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const remaining = Math.max(0, seconds - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const urgent = remaining <= 30;
  const overtime = elapsed > seconds;

  return (
    <div
      className={`text-2xl font-mono tabular-nums ${
        overtime ? 'text-red-600 animate-pulse' : urgent ? 'text-red-600' : ''
      }`}
    >
      {mins}:{secs.toString().padStart(2, '0')}
    </div>
  );
}
