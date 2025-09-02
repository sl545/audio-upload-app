import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

export default function Waveform({ audioUrl }) {
  const containerRef = useRef(null);
  const waveSurferRef = useRef(null);

  useEffect(() => {
    if (!audioUrl) return;

    // 清除之前的实例
    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
    }

    // 创建新实例
    waveSurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#aaa',
      progressColor: '#555',
      height: 80,
    });

    waveSurferRef.current.load(audioUrl);

    return () => {
      waveSurferRef.current.destroy();
    };
  }, [audioUrl]);

  return <div ref={containerRef} />;
}
