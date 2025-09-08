# Bot Chat Manager

[![npm version](https://img.shields.io/npm/v/bot-chat-manager.svg)](https://www.npmjs.com/package/bot-chat-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README_en.md) 

前端 AI 机器人聊天状态管理器，用于管理 AI 对话界面的数据状态并驱动对话组件渲染，提供以下两种使用方式：
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

## 基本使用：React Hooks

```tsx
import React, { useState } from 'react';
import useBotChat, { Command } from 'bot-chat-manager';

// 自定义命令：发送用户消息并接收机器人回复
const commandSendQuery = (userInput: string): Command => 
  async chatCtx => {
      // 标记新一轮对话开始，此后所有消息都将被视为一轮对话，直到执行下一个 toggleChatRound (手动给消息列表划分轮次，便于实现某些功能，比如撤销最后一轮对话)
      chatCtx.toggleChatRound();
      // 添加用户气泡消息
      chatCtx.addUserBubble(userInput);
      // 添加机器人加载气泡消息，并获得其气泡 id
      const loadingId = chatCtx.addBotLoadingBubble();
      let loadingContent = '';

      // 发送请求并处理 SSE 响应
      const onSSEChunk = chunk => {
        loadingContent += chunk.content;
        chatCtx.updateBubble(loadingId, {
          content: loadingContent, // 追加 SSE 响应内容
          sugs: chunk.suggestions || [], // SSE 响应建议（bot-chat-manager 会自动判断是否应该展示该 sugs）
          status: 'incomplete', // SSE 未结束，机器人气泡状态为未完成
        });
      };
      const onCloseSSE = () => {
        chatCtx.updateBubble(loadingId, { // SSE 结束，将机器人气泡状态设置为完成
          status: 'complete',
        });
      };
      const onSSEError = () => {
        chatCtx.updateBubble(loadingId, { // SSE 错误，将机器人气泡状态设置为错误
          status: 'error',
        });
      };
      const request = genRequest(userInput);
      await fetchBotResponseBySSE(request, onSSEChunk, onCloseSSE, onSSEError);
  };

const ChatComponent = () => {
  
  // 聊天管理器
  const { 
    bubbles,           // 当前所有消息气泡状态，包含消息内容、建议回复、状态等
    sugs,              // 当前需要显示的 sugs
    execute,           // 执行自定义命令，驱动 bubbles 更新
    COMMAND_CLEAR_ALL, // 内置命令：清空所有消息
    COMMAND_WITHDRAW_LAST_ROUND // 内置命令：撤回最后一轮对话
  } = useBotChat('bot', 'user'); // 指定机器人与用户的角色标识
  
  // 发送消息示例
  const handleSend = async (userInput: string) => {
    await execute(commandSendQuery(userInput)); // 执行命令：发起对话
  };

  // 撤回最后一轮对话
  const handleWithdraw = () => {
    execute(COMMAND_WITHDRAW_LAST_ROUND);
  };

  const messages = convert2UIMessages(bubbles);
  
  return (
    <div className="chat-container">
      <div className="chat-box">
        <BotChat messages={messages} sugs={sugs} onWithdraw={handleWithdraw} />
      </div>
      <div className="input-area">
        <UserInput
          onSend={handleSend}
          placeholder="输入消息..."
        />
      </div>
    </div>
  );
};

export default ChatComponent;
```

## 基本使用：状态管理 store

如果您的项目不适合使用 React Hooks，可以直接使用`BotChatState` class 来生成 store 实例，然后在组件中使用该实例来管理聊天状态

```tsx
import { BotChatState } from 'bot-chat-manager';

const chatState = new BotChatState('bot', 'user', []);  // 指定机器人与用户的角色标识, 并（可选）初始化消息列表（空）

const ChatComponent = () => {
  const [messages, setMessages] = useState<MessageInfo[]>([]);
  const [sugs, setSugs] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = chatState.subscribe(({ bubbles, sugs }) => {
      const messages = convert2UIMessages(bubbles);
      setMessages(messages);
      setSugs(sugs);
    });
    return () => {
      unsubscribe();
    };
  }, []);
  
  // 发送消息示例
  const handleSend = async (userInput: string) => {
    await chatState.execute(commandSendQuery(userInput)); // 执行命令：发起对话
  };

  // 撤回最后一轮对话
  const handleWithdraw = () => {
    chatState.execute(COMMAND_WITHDRAW_LAST_ROUND);
  };

  
  return (
    <div className="chat-container">
      <div className="chat-box">
        <BotChat messages={messages} sugs={sugs} onWithdraw={handleWithdraw} />
      </div>
      <div className="input-area">
        <UserInput
          onSend={handleSend}
          placeholder="输入消息..."
        />
      </div>
    </div>
  );
};
```

## 进阶用法: 自定义消息气泡类型

您可以扩展默认的消息气泡类型 `BubbleInfo`，添加自定义字段，并将新的类型用作泛型参数：

```tsx
import useBotChat, { BubbleInfo } from 'bot-chat-manager';

// 扩展气泡类型
interface CustomBubble extends BubbleInfo {
  isHighlighted?: boolean;
  attachments?: string[];
}

const ChatComponent = () => {

  // 使用自定义类型
  const { bubbles, sugs, execute } = useBotChat<CustomBubble>('bot', 'user');

  // 自定义命令：添加一条用户附件消息
  const commandAddUserAttachmentMessage = (userInput: string, files: string[]): Command => 
    chatCtx => {
      chatCtx.addUserBubble(userInput, {
        isHighlighted: true,
        attachments: files, // ['file1.pdf', 'image.jpg']
      });
    };

  // 发送消息示例
  const handleSendMulti = async (userInput: string, files: string[]) => {
    await execute(commandAddUserAttachmentMessage(userInput, files));
  };

  const messages = convert2UIMessages(bubbles);

  return (
    <div className="chat-container">
      <div className="chat-box">
        <BotChat messages={messages} sugs={sugs} />
      </div>
      <div className="input-area">
        <UserInput
          onSendMulti={handleSendMulti}
          placeholder="输入消息..."
        />
      </div>
    </div>
  );
}

```

## 类型定义

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

### BubbleInfo

```tsx
interface BubbleInfo {
  id?: string;           // 消息气泡的唯一标识
  role: string;          // 发送当前消息气泡的角色
  content: string;       // 消息气泡的内容
  ts?: number;     // 时间戳(毫秒)
  status?: BubbleStatus; // 消息气泡的状态
  roundId?: string;      // 用于标识一轮对话
  sugs?: string[];       // 消息气泡的建议回复列表
  [x: string]: any;      // 其他自定义字段
}

type BubbleStatus = 'loading' | 'incomplete' | 'complete' | 'error';
```

### Command

```tsx
type Command<M extends BubbleInfo = BubbleInfo> = (chatCtx: ChatCtx<M>) => void | Promise<void>;
```

### ChatCtx

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
  updateBubble: (id: string, props: Partial<M>) => void;
  toggleChatRound: () => string;
  
  // 添加方法
  addUserBubble: (content: string, props?: Partial<M>) => string;
  addBotBubble: (content: string, props?: Partial<M>) => string;
  addBotLoadingBubble: (props?: Partial<M>) => string;
}
```

## 许可证

[MIT](LICENSE)
