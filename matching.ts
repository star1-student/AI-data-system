import express from 'express';
import { getAllUsers, getUserById, getPreferencesByUserId, createFriendRequest, getFriendRequestBySenderAndReceiver, getFriendRequestsByReceiver, getFriendRequestById, updateFriendRequest, getAcceptedFriends } from './database';
import { authenticateToken } from './auth';

export const matchingRouter = express.Router();

function calculateMatchPercentage(userInterests: string[], targetInterests: string[], userPref: any, targetUser: any): number {
  let score = 0;
  
  const commonInterests = userInterests.filter(interest => targetInterests.includes(interest));
  score += commonInterests.length * 15;
  
  if (userPref.gender_preference === 'both' || userPref.gender_preference === targetUser.gender) {
    score += 20;
  }
  
  if (targetUser.age >= userPref.min_age && targetUser.age <= userPref.max_age) {
    score += 25;
  }
  
  if (userPref.location && targetUser.location === userPref.location) {
    score += 20;
  }
  
  score += Math.floor(Math.random() * 20);
  
  return Math.min(100, Math.max(0, score));
}

matchingRouter.get('/', authenticateToken, async (req, res) => {
  const userId = (req as any).userId;

  const preferences = await getPreferencesByUserId(userId);
  if (!preferences) {
    return res.status(500).json({ success: false, message: '获取偏好失败' });
  }

  const currentUser = await getUserById(userId);
  if (!currentUser) {
    return res.status(500).json({ success: false, message: '获取用户信息失败' });
  }

  const userPref = {
    ...preferences,
    interests: JSON.parse(preferences.interests),
  };
  const userInterests = JSON.parse(currentUser.interests);

  const allUsers = await getAllUsers();
  let filteredUsers = allUsers.filter(user => user.id !== userId);

  if (userPref.gender_preference !== 'both') {
    filteredUsers = filteredUsers.filter(user => user.gender === userPref.gender_preference);
  }

  if (userPref.min_age && userPref.max_age) {
    filteredUsers = filteredUsers.filter(user => user.age >= userPref.min_age && user.age <= userPref.max_age);
  }

  const matches = filteredUsers.map(user => {
    const targetInterests = JSON.parse(user.interests);
    const commonInterests = userInterests.filter((interest: string) => targetInterests.includes(interest));
    const matchPercentage = calculateMatchPercentage(userInterests, targetInterests, userPref, user);

    return {
      user: { ...user, password: undefined, interests: targetInterests },
      match_percentage: matchPercentage,
      common_interests: commonInterests,
    };
  }).sort((a: { match_percentage: number }, b: { match_percentage: number }) => b.match_percentage - a.match_percentage);

  res.json({ success: true, matches });
});

matchingRouter.post('/:userId/request', authenticateToken, async (req, res) => {
  const senderId = (req as any).userId;
  const receiverId = req.params.userId;

  if (senderId === receiverId) {
    return res.status(400).json({ success: false, message: '不能向自己发送好友请求' });
  }

  const existingRequest = await getFriendRequestBySenderAndReceiver(senderId, receiverId);
  
  if (existingRequest) {
    return res.status(400).json({ success: false, message: '您已经发送过好友请求' });
  }

  const requestId = `req_${Date.now()}`;
  await createFriendRequest({
    id: requestId,
    sender_id: senderId,
    receiver_id: receiverId,
    status: 'pending',
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, message: '好友请求已发送' });
});

matchingRouter.get('/requests', authenticateToken, async (req, res) => {
  const userId = (req as any).userId;

  const requests = await getFriendRequestsByReceiver(userId);

  const result = [];
  for (const request of requests) {
    const sender = await getUserById(request.sender_id);
    if (sender) {
      result.push({
        ...request,
        sender: { ...sender, password: undefined, interests: JSON.parse(sender.interests) },
      });
    }
  }

  res.json({ success: true, requests: result });
});

matchingRouter.post('/requests/:requestId/accept', authenticateToken, async (req, res) => {
  const userId = (req as any).userId;
  const requestId = req.params.requestId;

  const request = await getFriendRequestById(requestId);

  if (!request) {
    return res.status(404).json({ success: false, message: '请求不存在' });
  }

  if (request.receiver_id !== userId) {
    return res.status(403).json({ success: false, message: '无权处理此请求' });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({ success: false, message: '请求状态已变更' });
  }

  await updateFriendRequest(requestId, 'accepted');
  res.json({ success: true, message: '已添加好友' });
});

matchingRouter.get('/friends', authenticateToken, async (req, res) => {
  const userId = (req as any).userId;

  const friends = await getAcceptedFriends(userId);

  const result = friends.map(friend => ({
    ...friend,
    password: undefined,
    interests: JSON.parse(friend.interests),
  }));

  res.json({ success: true, friends: result });
});