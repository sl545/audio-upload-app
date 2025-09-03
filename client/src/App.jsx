import React, { useEffect, useState } from 'react';
import Recorder from './components/Recorder';
import Waveform from './components/Waveform';

function App() {
  const [files, setFiles] = useState([]);
  const [selectedFileUrl, setSelectedFileUrl] = useState(null);
  const [error, setError] = useState(null); // 👈 新增：错误状态

  const fetchFiles = () => {
    fetch('/api/files', { credentials: 'include' }) // 👈 包含凭据
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setFiles(data);
          setError(null); // 👈 成功时清空错误
        } else {
          throw new Error('Expected an array');
        }
      })
      .catch(err => {
        console.error('Error fetching files:', err);
        setError('You must log in to view files.'); // 👈 设置错误信息
        setFiles([]); // 👈 避免 map 报错
      });
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="container">
      <h1>Hello from React!</h1>

      {/* ✅ 录音器组件 */}
      <Recorder onUploadSuccess={fetchFiles} />

      {/* ✅ 文件列表 */}
      <h2>Uploaded Files</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>} {/* 👈 显示错误信息 */}

      <ul>
        {files.map(file => (
          <li key={file.id}>
            <button onClick={() => setSelectedFileUrl(`/uploads/${file.name}`)}>
              {file.name}
            </button>
          </li>
        ))}
      </ul>

      {/* ✅ 波形图播放器 */}
      {selectedFileUrl && (
        <div>
          <h3>Waveform</h3>
          <Waveform audioUrl={selectedFileUrl} />
        </div>
      )}
    </div>
  );
}

export default App;
