import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

function Waveform({ audioUrl }) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#ddd',
      progressColor: '#3b82f6',
      height: 80,
      responsive: true,
    });

    wavesurferRef.current = ws;

    ws.load(audioUrl);

    ws.on('error', (e) => {
      console.error('WaveSurfer error:', e);
      setError('Failed to load waveform.');
    });

    ws.on('ready', () => {
      setError(null);
    });

    return () => ws.destroy();
  }, [audioUrl]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div>
      <div ref={containerRef} />
      <button onClick={togglePlay} style={{ marginTop: '10px' }}>▶ Play / Pause</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default Waveform;
