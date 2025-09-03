const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcrypt');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 创建 uploads 文件夹
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// 设置 Multer 存储策略
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// 中间件
app.use(express.static(path.join(__dirname, 'client/dist')));

// app.use(cors());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,         // 本地测试用 false，线上部署时要用 true (https)
    httpOnly: true,
    sameSite: 'lax'        // 或 'none' + secure: true 用于跨域
  }
}));
app.use('/uploads', express.static(uploadDir));
app.use(express.static(path.join(__dirname, 'client/dist')));

// 数据库初始化
const db = new sqlite3.Database('audio_project.db');
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT,
      role TEXT DEFAULT 'user'
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      path TEXT,
      upload_time TEXT DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER
    )
  `);
});

// 登录校验中间件
function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  next();
}

// ========== API 路由 ==========

// 注册
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

  db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
    if (row) return res.status(409).json({ success: false, message: 'User exists' });

    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], function (err) {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      res.json({ success: true, message: 'Registered' });
    });
  });
});

// 登录
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ success: true, message: 'Login successful', user: req.session.user });
  });
});

// 当前用户信息
app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ loggedIn: false });
  res.json({ loggedIn: true, user: req.session.user });
});

// 登出
app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out' });
});

// 上传音频
app.post('/api/upload', requireLogin, upload.single('audio'), (req, res) => {
  const { id } = req.session.user;
  db.run('INSERT INTO files (name, path, user_id) VALUES (?, ?, ?)',
    [req.file.originalname, req.file.path, id],
    err => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true });
    });
});

// 获取文件列表
app.get('/api/files', requireLogin, (req, res) => {
  const user = req.session.user;
  const query = user.role === 'admin'
    ? `SELECT files.*, users.username FROM files JOIN users ON files.user_id = users.id ORDER BY upload_time DESC`
    : `SELECT files.*, users.username FROM files JOIN users ON files.user_id = users.id WHERE user_id = ? ORDER BY upload_time DESC`;

  const params = user.role === 'admin' ? [] : [user.id];

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false });
    res.json(rows);
  });
});

// 删除文件
app.delete('/api/files/:id', requireLogin, (req, res) => {
  const fileId = req.params.id;
  db.get('SELECT * FROM files WHERE id = ?', [fileId], (err, file) => {
    if (!file) return res.status(404).json({ success: false });

    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      console.warn('Could not delete file:', e.message);
    }

    db.run('DELETE FROM files WHERE id = ?', [fileId], err => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true });
    });
  });
});

// 健康检查
app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

// 让 React 处理所有未匹配的请求
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client/dist/index.html'));
// });
// 更明确地只匹配非 API 路由
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});


// 启动服务
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
