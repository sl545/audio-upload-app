import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import FeatureExtractor from './FeatureExtractor';

function Waveform({ audioUrl }) {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null); // 提供给 FeatureExtractor
  const isWebm = audioUrl.endsWith('.webm'); // 👈 判断格式

  useEffect(() => {
    // if (wavesurferRef.current) {
    //   wavesurferRef.current.destroy();
    // }
    if (isWebm) {
      const audio = new Audio(audioUrl);
      setAudioElement(audio);
      return;
    }

    // 创建一个隐藏的原生 audio 元素
    const audio = new Audio(audioUrl);
    setAudioElement(audio); // 给特征提取器使用

    // 初始化 WaveSurfer
    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#ccc',
      progressColor: '#333',
      backend: 'MediaElement',
      media: audio,
    });

    // 加载音频
    wavesurferRef.current.load(audio);

    return () => {
      // wavesurferRef.current.destroy();
      if (isWebm) {
      const audio = new Audio(audioUrl);
      setAudioElement(audio);
      return;
    }
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlayback = () => {
    if (isWebm) {
      if (audioElement.paused) {
        audioElement.play();
        setIsPlaying(true);
      } else {
        audioElement.pause();
        setIsPlaying(false);
      }
    } else {
      wavesurferRef.current.playPause();
      setIsPlaying(wavesurferRef.current.isPlaying());
    }
  };
   return (
    <div>
      {isWebm ? (
        <>
          <audio controls src={audioUrl} style={{ width: '100%' }} />
          <p style={{ color: 'gray' }}>No waveform or analysis for .webm</p>
        </>
      ) : (
        <>
          <div ref={waveformRef} />
          <button onClick={togglePlayback}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          {audioElement && <FeatureExtractor audioRef={audioElement} />}
        </>
      )}
    </div>
  );
} 

export default Waveform;
