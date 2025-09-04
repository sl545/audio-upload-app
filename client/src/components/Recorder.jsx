import React, { useState, useRef } from 'react';

export default function Recorder({ onUploadSuccess }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const options = { mimeType: 'audio/webm;codecs=opus' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      audioChunks.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });

        // ✅ 使用时间戳作为文件名
        const filename = `recording-${Date.now()}.webm`;
        const formData = new FormData();
        formData.append('audio', audioBlob, filename);

        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });

          if (res.ok) {
            console.log('✅ 上传成功');
            onUploadSuccess(); // 通知父组件刷新文件列表
          } else {
            console.error('❌ 上传失败');
          }
        } catch (err) {
          console.error('❌ 上传出错', err);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('🎤 无法访问麦克风', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div>
      {!recording ? (
        <button onClick={startRecording}>🎤 Start Recording</button>
      ) : (
        <button onClick={stopRecording}>⏹️ Stop Recording</button>
      )}
    </div>
  );
}
