import express from 'express';
import { getUserById, getMessagesBetweenUsers, createMessage } from './database';
import { authenticateToken } from './auth';

export const chatRouter = express.Router();

chatRouter.get('/:userId/messages', authenticateToken, async (req, res) => {
  const currentUserId = (req as any).userId;
  const targetUserId = req.params.userId;

  const messages = await getMessagesBetweenUsers(currentUserId, targetUserId);
  res.json({ success: true, messages });
});

chatRouter.post('/:userId/message', authenticateToken, async (req, res) => {
  const senderId = (req as any).userId;
  const receiverId = req.params.userId;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ success: false, message: '消息内容不能为空' });
  }

  const messageId = `msg_${Date.now()}`;
  const message = {
    id: messageId,
    sender_id: senderId,
    receiver_id: receiverId,
    content,
    created_at: new Date().toISOString(),
  };

  await createMessage(message);
  res.json({ success: true, message });
});

chatRouter.get('/suggestions', authenticateToken, async (req, res) => {
  const { userId, context } = req.query as { userId?: string; context?: string };

  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  const user = await getUserById(userId);
  
  if (!user) {
    return res.status(500).json({ success: false, message: '获取用户信息失败' });
  }

  const interests = JSON.parse(user.interests);
  const suggestions = generateSuggestions(interests, user.bio || '', context || '');
  res.json({ success: true, suggestions });
});

function generateSuggestions(interests: string[], _bio: string, _context: string): string[] {
  const interestSuggestions: Record<string, string[]> = {
    '旅行': ['你最喜欢的旅行目的地是哪里？', '最近有什么旅行计划吗？', '旅行中最难忘的经历是什么？'],
    '音乐': ['你喜欢什么类型的音乐？', '最近在听什么歌？', '最喜欢的歌手是谁？'],
    '阅读': ['最近在读什么书？', '最喜欢的作家是谁？', '推荐一本你喜欢的书吧'],
    '运动': ['你最喜欢的运动是什么？', '平时多久运动一次？', '有没有特别想尝试的运动？'],
    '美食': ['你最喜欢吃什么菜？', '会做饭吗？拿手菜是什么？', '有没有特别推荐的餐厅？'],
    '电影': ['最近看了什么好看的电影？', '最喜欢的电影类型是什么？', '有没有反复看的电影？'],
    '宠物': ['有养宠物吗？', '喜欢什么小动物？', '宠物有没有什么有趣的故事？'],
    '烹饪': ['最喜欢做什么菜？', '有没有特别的烹饪技巧？', '推荐一道拿手菜吧'],
    '瑜伽': ['练瑜伽多久了？', '最喜欢的瑜伽体式是什么？', '瑜伽给你带来了什么改变？'],
    '户外': ['喜欢什么样的户外活动？', '最近有什么户外计划吗？', '户外装备里最喜欢什么？'],
    '摄影': ['喜欢拍什么题材？', '用什么相机？', '有没有特别满意的作品？'],
    '绘画': ['喜欢画什么？', '学画画多久了？', '有没有特别喜欢的画家？'],
    '设计': ['从事设计相关工作吗？', '最喜欢的设计风格是什么？', '有没有特别欣赏的设计师？'],
    '编程': ['最喜欢的编程语言是什么？', '平时会做一些有趣的项目吗？', '编程中遇到过什么有趣的bug？'],
  };

  const suggestions: string[] = [];
  
  interests.slice(0, 3).forEach(interest => {
    if (interestSuggestions[interest]) {
      suggestions.push(...interestSuggestions[interest]);
    }
  });

  if (suggestions.length === 0) {
    suggestions.push(
      '很高兴认识你！',
      '你平时喜欢做什么？',
      '周末一般怎么度过？',
      '最近有什么开心的事吗？',
      '你觉得什么样的关系最理想？',
      '如果有机会去旅行，你想去哪里？',
    );
  }

  return suggestions.slice(0, 6);
}

chatRouter.post('/analyze', authenticateToken, async (req, res) => {
  const { messages } = req.body as { messages: string[] };

  if (!messages || messages.length === 0) {
    return res.status(400).json({ success: false, message: '缺少消息内容' });
  }

  const analysis = analyzeSentiment(messages);
  res.json({ success: true, analysis });
});

function analyzeSentiment(messages: string[]): {
  sentiment: 'positive' | 'neutral' | 'negative';
  suggestions: string[];
  emotion: string;
} {
  const positiveWords = ['开心', '快乐', '喜欢', '爱', '好', '棒', '不错', '谢谢', '高兴', '幸福', '期待', '愿意', '想', '一起', '见面'];
  const negativeWords = ['难过', '伤心', '失望', '生气', '讨厌', '烦', '累', '无聊', '不想', '拒绝', '不行', '算了'];
  
  let positiveCount = 0;
  let negativeCount = 0;

  messages.forEach(msg => {
    positiveWords.forEach(word => {
      if (msg.includes(word)) positiveCount++;
    });
    negativeWords.forEach(word => {
      if (msg.includes(word)) negativeCount++;
    });
  });

  const sentimentScore = positiveCount - negativeCount;
  
  let sentiment: 'positive' | 'neutral' | 'negative';
  let emotion = '平和';

  if (sentimentScore > 2) {
    sentiment = 'positive';
    emotion = '积极';
  } else if (sentimentScore < -1) {
    sentiment = 'negative';
    emotion = '消极';
  } else {
    sentiment = 'neutral';
    emotion = '平和';
  }

  const suggestionMap: Record<string, string[]> = {
    positive: [
      '对方情绪很好，继续保持积极的话题',
      '可以适当分享一些开心的事情',
      '邀请对方做一些共同喜欢的活动',
      '表达对对方的好感',
    ],
    neutral: [
      '对方态度比较平和，可以尝试引入新话题',
      '多问一些开放性问题',
      '分享一些有趣的事情来活跃气氛',
      '了解对方更多的兴趣爱好',
    ],
    negative: [
      '对方情绪有些低落，多给予关心和理解',
      '倾听对方的感受，不要急于给建议',
      '用温暖的话语安慰对方',
      '建议换个轻松的话题',
      '如果对方愿意，可以问问发生了什么',
    ],
  };

  return {
    sentiment,
    suggestions: suggestionMap[sentiment],
    emotion,
  };
}