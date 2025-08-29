const session = require('express-session');
const bcrypt = require('bcrypt');


const express = require('express');
const multer = require('multer');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads')); // 让前端可访问上传文件

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}


// Session 设置
app.use(session({
  secret: 'your_secret_key', // 可以改成你自己的随机字符串
  resave: false,
  saveUninitialized: false
}));  // 登录成功 → 存储到 session

app.post('/register', express.json(), async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ success: false, message: 'Username and password are required.' });

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists)
    return res.status(409).json({ success: false, message: 'Username already exists.' });

  const hash = await bcrypt.hash(password, 10);
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);

  res.json({ success: true, message: 'User registered successfully.' });
});

// console.log('Current user:', req.session.user);


app.post('/login', express.json(), async (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user)
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match)
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });

  // 登录成功 → 存储到 session
  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  res.json({ success: true, message: 'Login successful.', user: req.session.user });
});

app.get('/me', (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ loggedIn: false });

  res.json({ loggedIn: true, user: req.session.user });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out.' });
});


// 创建 uploads 文件夹（如果不存在）
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 初始化数据库
const db = new Database('audio_project.db');
db.prepare(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    path TEXT,
    upload_time TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 创建用户表
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'user'
  )
`).run();

// 如果 files 表还没有 user_id 字段，则添加（仅第一次运行时用）
try {
  db.prepare(`ALTER TABLE files ADD COLUMN user_id INTEGER`).run();
} catch (err) {
  // 字段已存在则忽略
}


// 设置上传逻辑
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// 上传接口
app.post('/upload', requireLogin, upload.single('audio'), (req, res) => {
  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const userId = req.session.user.id;

  db.prepare('INSERT INTO files (name, path, user_id) VALUES (?, ?, ?)').run(fileName, filePath, userId);
  res.json({ success: true, filePath: filePath });
});

app.get('/files', requireLogin, (req, res) => {
  const user = req.session.user;

  let files;
  if (user.role === 'admin') {
    files = db.prepare(`
      SELECT files.*, users.username
      FROM files
      JOIN users ON files.user_id = users.id
    `).all();
  } else {
    files = db.prepare(`
      SELECT files.*, users.username
      FROM files
      JOIN users ON files.user_id = users.id
      WHERE user_id = ?
    `).all(user.id);
  }

  res.json(files);
});


// ✅ 删除文件接口
app.delete('/files/:id', requireLogin, (req, res) => {
  const fileId = req.params.id;
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId);
  if (!file) return res.status(404).json({ success: false, message: 'File not found' });

  try {
    fs.unlinkSync(file.path);
  } catch (err) {
    console.warn('File not found or cannot delete:', err.message);
  }

  db.prepare('DELETE FROM files WHERE id = ?').run(fileId);
  res.json({ success: true });
});



// 启动服务
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
