import React, { useEffect, useState } from 'react';
import Meyda from 'meyda';

function FeatureExtractor({ audioRef }) {
  const [features, setFeatures] = useState(null);

  useEffect(() => {
    if (!audioRef) return;

    const context = new (window.AudioContext || window.webkitAudioContext)();
    const source = context.createMediaElementSource(audioRef);
    const analyzer = context.createAnalyser();

    source.connect(analyzer);
    analyzer.connect(context.destination);

    let meydaAnalyzer;

    audioRef.onplay = () => {
      try {
        meydaAnalyzer = Meyda.createMeydaAnalyzer({
          audioContext: context,
          source: source,
          bufferSize: 512,
          featureExtractors: ['mfcc', 'zcr', 'spectralCentroid'],
          callback: features => {
            console.log('🎯 Extracted Features:', features);
            setFeatures(features);
          },
        });

        meydaAnalyzer.start();
      } catch (e) {
        console.error('Meyda error:', e);
      }
    };

    audioRef.onpause = () => {
      if (meydaAnalyzer) {
        meydaAnalyzer.stop();
      }
    };

    return () => {
      if (meydaAnalyzer) {
        meydaAnalyzer.stop();
      }
      context.close();
    };
  }, [audioRef]);

  if (!features) return null;

  return (
    <div style={{ marginTop: '1em' }}>
      <h4>Audio Features:</h4>
      <pre style={{ background: '#f4f4f4', padding: '0.5em' }}>
        {JSON.stringify(features, null, 2)}
      </pre>
    </div>
  );
}

export default FeatureExtractor;
