import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail, createUser, createPreferences } from './database';

export const authRouter = express.Router();

const JWT_SECRET = 'your-secret-key-change-in-production';

authRouter.post('/register', async (req, res) => {
  const { email, password, nickname, gender, age } = req.body;
  
  if (!email || !password || !nickname || !gender || !age) {
    return res.status(400).json({ success: false, message: '请填写所有必填字段' });
  }

  const existingUser = await getUserByEmail(email);
  
  if (existingUser) {
    return res.status(400).json({ success: false, message: '该邮箱已被注册' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const userId = `user_${Date.now()}`;
  const user = {
    id: userId,
    email,
    password: hashedPassword,
    nickname,
    gender,
    age,
    avatar: '',
    bio: '',
    location: '',
    interests: JSON.stringify([]),
  };

  await createUser(user);
  await createPreferences({
    id: `pref_${userId}`,
    user_id: userId,
    min_age: 18,
    max_age: 50,
    gender_preference: 'both',
    location: '',
    interests: JSON.stringify([]),
    updated_at: new Date().toISOString(),
  });

  const token = jwt.sign({ userId }, JWT_SECRET);
  res.json({
    success: true,
    message: '注册成功',
    user: { ...user, password: undefined },
    token,
  });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: '请填写邮箱和密码' });
  }

  const user = await getUserByEmail(email);

  if (!user) {
    return res.status(400).json({ success: false, message: '邮箱或密码错误' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    return res.status(400).json({ success: false, message: '邮箱或密码错误' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  res.json({
    success: true,
    message: '登录成功',
    user: { ...user, password: undefined, interests: JSON.parse(user.interests) },
    token,
  });
});

export function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: '无效的令牌' });
    }
    (req as any).userId = (decoded as { userId: string }).userId;
    next();
  });
}