import React, { useEffect, useState } from 'react';
import Waveform from '../components/Waveform';
import Recorder from '../components/Recorder';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // 发请求
  useEffect(() => {
    fetch('/api/files')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch files');
        }
        return res.json();
      })
      .then(data => {
        setFiles(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []); // 空依赖数组 => 只在组件挂载时执行一次

  return (
    <div>
      <h2>Uploaded Files</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {files.map(file => (
            <li key={file.id}>{file.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

