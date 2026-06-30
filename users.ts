import express from 'express';
import { getUserById, updateUser, getPreferencesByUserId, updatePreferences, createPreferences } from './database';
import { authenticateToken } from './auth';

interface Preferences {
  id: string;
  user_id: string;
  min_age: number;
  max_age: number;
  gender_preference: 'male' | 'female' | 'both';
  location: string;
  interests: string;
  updated_at: string;
}

export const usersRouter = express.Router();

usersRouter.get('/profile', authenticateToken, async (req, res) => {
  const userId = (req as any).userId;

  const user = await getUserById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  const preferences = await getPreferencesByUserId(userId);

  res.json({
    success: true,
    user: { ...user, password: undefined, interests: JSON.parse(user.interests) },
    preferences: preferences ? { ...preferences, interests: JSON.parse(preferences.interests) } : null,
  });
});

usersRouter.put('/profile', authenticateToken, async (req, res) => {
  const userId = (req as any).userId;
  const { nickname, avatar, bio, location, interests } = req.body;

  const updateFields: Partial<{ nickname: string; avatar: string; bio: string; location: string; interests: string }> = {};

  if (nickname) updateFields.nickname = nickname;
  if (avatar) updateFields.avatar = avatar;
  if (bio) updateFields.bio = bio;
  if (location) updateFields.location = location;
  if (interests) updateFields.interests = JSON.stringify(interests);

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ success: false, message: '没有要更新的字段' });
  }

  await updateUser(userId, updateFields);

  const user = await getUserById(userId);
  res.json({
    success: true,
    message: '更新成功',
    user: { ...user, password: undefined, interests: JSON.parse(user!.interests) },
  });
});

usersRouter.put('/preferences', authenticateToken, async (req, res) => {
  const userId = (req as any).userId;
  const { minAge, maxAge, genderPreference, location, interests } = req.body;

  const existingPref = await getPreferencesByUserId(userId);

  if (existingPref) {
    const updateFields: Partial<Preferences> = {};

    if (minAge !== undefined) updateFields.min_age = minAge;
    if (maxAge !== undefined) updateFields.max_age = maxAge;
    if (genderPreference) updateFields.gender_preference = genderPreference as 'male' | 'female' | 'both';
    if (location) updateFields.location = location;
    if (interests) updateFields.interests = JSON.stringify(interests);

    await updatePreferences(userId, updateFields);
    res.json({ success: true, message: '偏好设置更新成功' });
  } else {
    await createPreferences({
      id: `pref_${userId}`,
      user_id: userId,
      min_age: minAge || 18,
      max_age: maxAge || 50,
      gender_preference: genderPreference || 'both',
      location: location || '',
      interests: JSON.stringify(interests || []),
      updated_at: new Date().toISOString(),
    });
    res.json({ success: true, message: '偏好设置保存成功' });
  }
});