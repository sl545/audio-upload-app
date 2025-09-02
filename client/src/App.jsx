import React, { useEffect, useState } from 'react';
import Recorder from './components/Recorder';
import Waveform from './components/Waveform';

function App() {
  const [files, setFiles] = useState([]);
  const [selectedFileUrl, setSelectedFileUrl] = useState(null);

  const fetchFiles = () => {
    fetch('/api/files')
      .then(res => res.json())
      .then(data => setFiles(data));
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
