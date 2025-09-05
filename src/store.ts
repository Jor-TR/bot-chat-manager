import { v4 as uuidv4 } from 'uuid';
import { BubbleInfo, Command, ChatCtx } from './typing';

// 机器人对话状态管理器
class BotChatState<M extends BubbleInfo = BubbleInfo> implements ChatCtx<M> {

  // 核心数据
  private bubbles: M[];
  private userRole: string;
  private botRole: string;

  // 其他辅助数据/状态
  private subscribers = new Set<(bubbles: M[], sugs: string[]) => void>();
  private currentRoundId = uuidv4(); // 当前对话轮次的唯一标识
  private timer?: NodeJS.Timeout;

  constructor(botRole: string, userRole: string, initialBubbles: M[] = []) {
    this.bubbles = initialBubbles;
    this.userRole = userRole;
    this.botRole = botRole;
  }

  // 新增订阅
  subscribe(callback: (bubbles: M[], sugs: string[]) => void): () => void {
    this.subscribers.add(callback);
    // 返回返回取消订阅的函数
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // 通知订阅者
  private notify() {
    this.subscribers.forEach(subscriber => subscriber(this.getCurrentBubbles(), this.getCurrentSugs()));
  }

  private debouncedNotify() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.notify();
    }, 0);
  }

  private genLoadingBubble(id?: string): M {
    return {
      id: id ?? uuidv4(),
      role: this.botRole,
      content: '',
      createAt: Date.now(),
      status: 'loading',
      roundId: this.currentRoundId,
    } as M;
  }

  private addBubble(msg: M) {
    this.setBubbles([...this.bubbles, msg]);
  }

  /**
   * 查询方法
   */

  getCurrentSugs() {
    const lastBubble = this.bubbles.at(-1);
    return lastBubble?.role === this.botRole ? (lastBubble.sugs ?? []) : [];
  }

  getCurrentBubbles(): M[] {
    return this.bubbles;
  }

  getBubble(id: string): M | undefined {
    return this.bubbles.find(msg => msg.id === id);
  }

  /**
   * 更新方法
   */

  // 但凡需要变更 bubbles，都得使用 setBubbles 方法
  setBubbles(bubbles: M[]) {
    this.bubbles = bubbles;
    this.debouncedNotify();
  }

  updateBubble(id: string, assignedMsg: Partial<M>) {
    this.setBubbles(this.bubbles.map(msg => msg.id === id ? { ...msg, ...assignedMsg } : msg));
  }

  toggleChatRound() {
    const newRoundId = uuidv4();
    this.currentRoundId = newRoundId;
    return newRoundId;
  }

  /**
   * 新增方法
   */
  addUserBubble(content: string, props: Partial<M> = {}): string {
    const id = uuidv4();
    this.addBubble({
      id,
      role: this.userRole,
      content,
      createAt: Date.now(),
      status: 'complete',
      roundId: this.currentRoundId,
      ...props,
    } as M);
    return id;
  }

  addBotBubble(content: string, props: Partial<M> = {}): string {
    const id = uuidv4();
    this.addBubble({
      id,
      role: this.botRole,
      content,
      createAt: Date.now(),
      status: 'complete',
      roundId: this.currentRoundId,
      ...props,
    } as M);
    return id;
  }

  addBotLoadingBubble(props: Partial<M> = {}): string {
    const id = uuidv4();
    this.addBubble({
      ...this.genLoadingBubble(id),
      ...props,
    });
    return id;
  }

  /**
   * 删除方法
   */
  deleteBubble(id: string) {
    this.setBubbles(this.bubbles.filter(msg => msg.id !== id));
  }

  withdrawLastRound() {
    const lastBubble = this.bubbles.at(-1);
    if (!lastBubble) {
      return;
    }
    this.setBubbles(this.bubbles.filter(msg => msg.roundId !== lastBubble?.roundId));
  }

  clearBubbles() {
    this.setBubbles([]);
  }

  /**
   * 执行命令
  */
  async execute(command: Command<M>) {
    await command(this);
  }
}

export default BotChatState;
