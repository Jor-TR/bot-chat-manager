export type BubbleStatus = 'loading' | 'incomplete' | 'complete' | 'error'; // 等待中、打字中、完成、错误

export interface BubbleInfo {
  id?: string; // 消息气泡的唯一标识
  role: string; // 发送当前消息气泡的角色
  content: string; // 消息气泡的内容
  ts?: number; // 时间戳
  status?: BubbleStatus; // 消息气泡的状态
  roundId?: string; // 用于标识一轮对话（query + 若干 response），一轮对话中的每一条消息都会有相同的 roundId
  sugs?: string[]; // 消息气泡的建议回复列表（只有当最后一条气泡是机器人发出时，才会显示其 sugs）
  [x: string]: any; // 其他自定义字段
}

export interface ChatCtx<M extends BubbleInfo = BubbleInfo> {
  // 查
  getCurrentBubbles: () => M[]; // 获取当前所有消息气泡列表
  getCurrentSugs: () => string[]; // 获取当前可见的 sugs
  getBubble: (id: string) => M | undefined; // 获取某个消息气泡
  // 删
  deleteBubble: (id: string) => void; // 删除某个消息气泡
  clearBubbles: () => void; // 清空所有消息气泡
  withdrawLastRound: () => void; // 撤回最后一轮对话（需要搭配 toggleChatRound 使用）
  // 改
  setBubbles: (bubbles: M[]) => void; // 设置消息气泡列表
  updateBubble: (id: string, assignedMsg: Partial<M>) => void; // 更新某个消息气泡
  toggleChatRound: () => string; // 标记新一轮对话的开始，返回 roundId，此后的所有消息都将属于这一轮（都会挂上当前的 roundId），直到遇到下一个 toggleChatRound 调用
  // 增
  addUserBubble: (content: string, props?: Partial<M>) => string; // 添加用户消息气泡
  addBotBubble: (content: string, props?: Partial<M>) => string; // 添加机器人消息气泡
  addBotLoadingBubble: (props?: Partial<M>) => string; // 添加机器人消息气泡，且状态为 ”加载中“
}

export type Command<M extends BubbleInfo = BubbleInfo> = (chatCtx: ChatCtx<M>) => void | Promise<void>;
