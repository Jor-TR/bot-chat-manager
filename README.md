# Bot Chat Manager

[![npm version](https://img.shields.io/npm/v/bot-chat-manager.svg)](https://www.npmjs.com/package/bot-chat-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

前端 AI 机器人聊天状态管理器，用于管理 AI 对话界面的数据状态，提供以下两种使用方式：
- React Hooks
- 状态管理 store

## 特性

- 🔄 通用的对话状态管理
- 🪝 便捷的 React Hooks 集成
- 🧩 通过自定义命令驱动，具备高扩展性、低耦合度
- 📝 完备的 Typescript 类型声明
- 🧰 灵活的消息气泡数据结构（支持 ts 泛型）


## 安装

```bash
npm install bot-chat-manager
# 或
yarn add bot-chat-manager
```

## 基本使用

```tsx
import React, { useState } from 'react';
import useBotChat from 'bot-chat-manager';

const ChatComponent = () => {
  const [inputValue, setInputValue] = useState('');
  
  // 初始化聊天管理器，设置机器人角色和用户角色
  const { 
    bubbles,           // 当前所有消息气泡
    sugs,              // 当前建议回复
    execute,           // 执行自定义命令
    COMMAND_CLEAR_ALL, // 内置命令：清空所有消息
    COMMAND_WITHDRAW_LAST_ROUND // 内置命令：撤回最后一轮对话
  } = useBotChat('bot', 'user'); // 指定机器人与用户的角色标识
  
  // 发送消息示例
  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    // 添加用户消息
    execute(async (chatCtx) => {
      // 标记新一轮对话开始
      chatCtx.toggleChatRound();
      // 添加用户消息
      chatCtx.addUserBubble(inputValue);
      // 添加机器人加载状态
      const loadingId = chatCtx.addBotLoadingBubble();
      
      try {
        // 这里可以调用实际的AI接口
        const response = await mockAIResponse(inputValue);
        // 更新机器人消息
        chatCtx.updateBubble(loadingId, {
          content: response.content,
          status: 'complete',
          sugs: response.suggestions || []
        });
      } catch (error) {
        // 处理错误
        chatCtx.updateBubble(loadingId, {
          content: '抱歉，出现了错误',
          status: 'error'
        });
      }
    });
    
    setInputValue('');
  };
  
  // 模拟AI响应
  const mockAIResponse = async (input) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      content: `这是对"${input}"的回复`,
      suggestions: ['你好吗？', '告诉我更多']
    };
  };
  
  return (
    <div className="chat-container">
      <div className="chat-messages">
        {bubbles.map(bubble => (
          <div key={bubble.id} className={`bubble ${bubble.role}`}>
            <div className="bubble-content">
              {bubble.status === 'loading' ? '正在输入...' : bubble.content}
            </div>
          </div>
        ))}
      </div>
      
      {sugs.length > 0 && (
        <div className="suggestions">
          {sugs.map((sug, index) => (
            <button 
              key={index} 
              onClick={() => setInputValue(sug)}
              className="suggestion-btn"
            >
              {sug}
            </button>
          ))}
        </div>
      )}
      
      <div className="input-area">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入消息..."
        />
        <button onClick={handleSend}>发送</button>
        <button onClick={() => execute(COMMAND_WITHDRAW_LAST_ROUND)}>撤回</button>
        <button onClick={() => execute(COMMAND_CLEAR_ALL)}>清空</button>
      </div>
    </div>
  );
};

export default ChatComponent;
```

## 高级用法

### 自定义气泡类型

您可以扩展默认的`BubbleInfo`接口，添加自定义字段：

```tsx
import useBotChat, { BubbleInfo } from 'bot-chat-manager';

// 扩展气泡类型
interface CustomBubble extends BubbleInfo {
  isHighlighted?: boolean;
  attachments?: string[];
}

// 使用自定义类型
const { bubbles, execute } = useBotChat<CustomBubble>('bot', 'user');

// 添加带自定义属性的气泡
execute(async (chatCtx) => {
  chatCtx.addBotBubble('这是一条带附件的消息', {
    isHighlighted: true,
    attachments: ['file1.pdf', 'image.jpg']
  });
});
```

### 自定义命令

您可以创建自定义命令来封装复杂的操作：

```tsx
import { Command } from 'bot-chat-manager';

// 创建自定义命令
const COMMAND_ADD_SYSTEM_MESSAGE: Command = (chatCtx) => {
  chatCtx.addBotBubble('这是一条系统消息', {
    role: 'system',
    // 其他自定义属性
  });
};

// 使用自定义命令
execute(COMMAND_ADD_SYSTEM_MESSAGE);
```

## API参考

### useBotChat

```tsx
useBotChat<M extends BubbleInfo = BubbleInfo>(botRole: string, userRole: string, initialBubbles?: M[])
```

#### 参数

- `botRole`: 机器人角色标识
- `userRole`: 用户角色标识
- `initialBubbles`: 可选的初始气泡数组

#### 返回值

- `bubbles`: 当前所有消息气泡数组
- `sugs`: 当前建议回复数组
- `execute`: 执行命令的函数
- `COMMAND_WITHDRAW_LAST_ROUND`: 内置命令，撤回最后一轮对话
- `COMMAND_CLEAR_ALL`: 内置命令，清空所有消息

### BotChatState

如果您需要在React组件外部管理聊天状态，可以直接使用`BotChatState`类：

```tsx
import { BotChatState } from 'bot-chat-manager';

const chatState = new BotChatState('bot', 'user');

// 添加消息
chatState.addUserBubble('你好');

// 获取当前消息
const bubbles = chatState.getCurrentBubbles();
```

### 类型定义

#### BubbleInfo

```tsx
interface BubbleInfo {
  id?: string;           // 消息气泡的唯一标识
  role: string;          // 发送当前消息气泡的角色
  content: string;       // 消息气泡的内容
  createAt?: number;     // 时间戳
  status?: BubbleStatus; // 消息气泡的状态
  roundId?: string;      // 用于标识一轮对话
  sugs?: string[];       // 消息气泡的建议回复列表
  [x: string]: any;      // 其他自定义字段
}

type BubbleStatus = 'loading' | 'incomplete' | 'complete' | 'error';
```

#### Command

```tsx
type Command<M extends BubbleInfo = BubbleInfo> = (chatCtx: ChatCtx<M>) => void | Promise<void>;
```

#### ChatCtx

```tsx
interface ChatCtx<M extends BubbleInfo = BubbleInfo> {
  // 查询方法
  getCurrentBubbles: () => M[];
  getCurrentSugs: () => string[];
  getBubble: (id: string) => M | undefined;
  
  // 删除方法
  deleteBubble: (id: string) => void;
  clearBubbles: () => void;
  withdrawLastRound: () => void;
  
  // 更新方法
  setBubbles: (bubbles: M[]) => void;
  updateBubble: (id: string, assignedMsg: Partial<M>) => void;
  toggleChatRound: () => string;
  
  // 添加方法
  addUserBubble: (content: string, props?: Partial<M>) => string;
  addBotBubble: (content: string, props?: Partial<M>) => string;
  addBotLoadingBubble: (props?: Partial<M>) => string;
}
```

## 许可证

[MIT](LICENSE)
