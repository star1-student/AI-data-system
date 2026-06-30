import bcrypt from 'bcryptjs';

interface User {
  id: string;
  email: string;
  password: string;
  nickname: string;
  gender: 'male' | 'female';
  age: number;
  avatar: string;
  bio: string;
  location: string;
  interests: string;
  created_at: string;
  updated_at: string;
}

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

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

let users: User[] = [];
let preferences: Preferences[] = [];
let friendRequests: FriendRequest[] = [];
let messages: Message[] = [];

export async function initDatabase(): Promise<void> {
  if (users.length > 0) return;

  const hashedPassword = await bcrypt.hash('password', 10);

  users = [
    { id: 'user1', email: 'user1@example.com', password: hashedPassword, nickname: '阳光男孩', gender: 'male', age: 28, bio: '热爱运动，喜欢旅行，寻找志同道合的另一半', location: '北京', interests: JSON.stringify(['运动', '旅行', '音乐']), avatar: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'user2', email: 'user2@example.com', password: hashedPassword, nickname: '文艺女孩', gender: 'female', age: 25, bio: '喜欢阅读和艺术，期待浪漫的相遇', location: '上海', interests: JSON.stringify(['阅读', '绘画', '音乐']), avatar: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'user3', email: 'user3@example.com', password: hashedPassword, nickname: '科技达人', gender: 'male', age: 30, bio: '程序员一枚，热爱生活，希望找到懂我的人', location: '深圳', interests: JSON.stringify(['编程', '电影', '美食']), avatar: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'user4', email: 'user4@example.com', password: hashedPassword, nickname: '温柔姐姐', gender: 'female', age: 27, bio: '性格温和，喜欢小动物，期待真诚的感情', location: '杭州', interests: JSON.stringify(['宠物', '烹饪', '瑜伽']), avatar: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'user5', email: 'user5@example.com', password: hashedPassword, nickname: '健身教练', gender: 'male', age: 26, bio: '健康生活倡导者，寻找积极向上的伴侣', location: '广州', interests: JSON.stringify(['健身', '户外', '摄影']), avatar: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'user6', email: 'user6@example.com', password: hashedPassword, nickname: '设计师小美', gender: 'female', age: 24, bio: '热爱设计，追求美好事物，期待灵魂伴侣', location: '成都', interests: JSON.stringify(['设计', '旅行', '美食']), avatar: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  preferences = [
    { id: 'pref1', user_id: 'user1', min_age: 22, max_age: 30, gender_preference: 'female', location: '北京', interests: JSON.stringify(['旅行', '音乐']), updated_at: new Date().toISOString() },
    { id: 'pref2', user_id: 'user2', min_age: 25, max_age: 32, gender_preference: 'male', location: '上海', interests: JSON.stringify(['阅读', '音乐']), updated_at: new Date().toISOString() },
    { id: 'pref3', user_id: 'user3', min_age: 23, max_age: 29, gender_preference: 'female', location: '深圳', interests: JSON.stringify(['电影', '美食']), updated_at: new Date().toISOString() },
    { id: 'pref4', user_id: 'user4', min_age: 25, max_age: 33, gender_preference: 'male', location: '杭州', interests: JSON.stringify(['宠物', '烹饪']), updated_at: new Date().toISOString() },
    { id: 'pref5', user_id: 'user5', min_age: 22, max_age: 28, gender_preference: 'female', location: '广州', interests: JSON.stringify(['健身', '户外']), updated_at: new Date().toISOString() },
    { id: 'pref6', user_id: 'user6', min_age: 25, max_age: 32, gender_preference: 'male', location: '成都', interests: JSON.stringify(['旅行', '美食']), updated_at: new Date().toISOString() },
  ];
}

export function getUserByEmail(email: string): Promise<User | undefined> {
  return Promise.resolve(users.find(u => u.email === email));
}

export function getUserById(id: string): Promise<User | undefined> {
  return Promise.resolve(users.find(u => u.id === id));
}

export function createUser(user: Omit<User, 'created_at' | 'updated_at'>): Promise<void> {
  users.push({
    ...user,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  return Promise.resolve();
}

export function updateUser(id: string, updates: Partial<User>): Promise<void> {
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates, updated_at: new Date().toISOString() };
  }
  return Promise.resolve();
}

export function getPreferencesByUserId(userId: string): Promise<Preferences | undefined> {
  return Promise.resolve(preferences.find(p => p.user_id === userId));
}

export function createPreferences(pref: Preferences): Promise<void> {
  preferences.push(pref);
  return Promise.resolve();
}

export function updatePreferences(userId: string, updates: Partial<Preferences>): Promise<void> {
  const index = preferences.findIndex(p => p.user_id === userId);
  if (index !== -1) {
    preferences[index] = { ...preferences[index], ...updates, updated_at: new Date().toISOString() };
  }
  return Promise.resolve();
}

export function getAllUsers(): Promise<User[]> {
  return Promise.resolve(users);
}

export function createFriendRequest(request: FriendRequest): Promise<void> {
  friendRequests.push(request);
  return Promise.resolve();
}

export function getFriendRequestBySenderAndReceiver(senderId: string, receiverId: string): Promise<FriendRequest | undefined> {
  return Promise.resolve(friendRequests.find(r => r.sender_id === senderId && r.receiver_id === receiverId));
}

export function getFriendRequestsByReceiver(receiverId: string): Promise<FriendRequest[]> {
  return Promise.resolve(friendRequests.filter(r => r.receiver_id === receiverId && r.status === 'pending'));
}

export function getFriendRequestById(id: string): Promise<FriendRequest | undefined> {
  return Promise.resolve(friendRequests.find(r => r.id === id));
}

export function updateFriendRequest(id: string, status: 'pending' | 'accepted' | 'rejected'): Promise<void> {
  const index = friendRequests.findIndex(r => r.id === id);
  if (index !== -1) {
    friendRequests[index] = { ...friendRequests[index], status };
  }
  return Promise.resolve();
}

export function getAcceptedFriends(userId: string): Promise<User[]> {
  const friendIds = friendRequests
    .filter(r => (r.sender_id === userId || r.receiver_id === userId) && r.status === 'accepted')
    .map(r => r.sender_id === userId ? r.receiver_id : r.sender_id);
  return Promise.resolve(users.filter(u => friendIds.includes(u.id)));
}

export function getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
  return Promise.resolve(messages.filter(m => 
    (m.sender_id === userId1 && m.receiver_id === userId2) ||
    (m.sender_id === userId2 && m.receiver_id === userId1)
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
}

export function createMessage(message: Message): Promise<void> {
  messages.push(message);
  return Promise.resolve();
}