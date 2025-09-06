# Bot Chat Manager

[![npm version](https://img.shields.io/npm/v/bot-chat-manager.svg)](https://www.npmjs.com/package/bot-chat-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[简体中文](README_zh.md) 

Frontend AI bot chat state manager for managing AI conversation interface data states and driving conversation component rendering, providing the following two usage methods:
- React Hooks
- State management store

## Featuresnpm config get registry

- 🔄 Universal conversation state management
- 🪝 Convenient React Hooks integration
- 🧩 Driven by custom commands, with high extensibility and low coupling
- 📝 Complete TypeScript type declarations
- 🧰 Flexible message bubble data structure (supports TypeScript generics)


## Installation

```bash
npm install bot-chat-manager
# or
yarn add bot-chat-manager
```

## Basic Usage: React Hooks

```tsx
import React, { useState } from 'react';
import useBotChat, { Command } from 'bot-chat-manager';

// Custom command: Send user message and receive bot reply
const commandSendQuery = (userInput: string): Command => 
  async chatCtx => {
      // Mark the beginning of a new round of conversation, after which all messages will be considered as one round of conversation until the next toggleChatRound is executed (manually dividing the message list into rounds, making it easy to implement certain features, such as withdrawing the last round of conversation)
      chatCtx.toggleChatRound();
      // Add user bubble message
      chatCtx.addUserBubble(userInput);
      // Add bot loading bubble message and get its bubble id
      const loadingId = chatCtx.addBotLoadingBubble();
      let loadingContent = '';

      // Send request and handle SSE response
      const onSSEChunk = chunk => {
        loadingContent += chunk.content;
        chatCtx.updateBubble(loadingId, {
          content: loadingContent, // Append SSE response content
          sugs: chunk.suggestions || [], // SSE response suggestions (bot-chat-manager will automatically determine whether to display these suggestions)
          status: 'incomplete', // SSE not finished, bot bubble status is incomplete
        });
      };
      const onCloseSSE = () => {
        chatCtx.updateBubble(loadingId, { // SSE finished, set bot bubble status to complete
          status: 'complete',
        });
      };
      const onSSEError = () => {
        chatCtx.updateBubble(loadingId, { // SSE error, set bot bubble status to error
          status: 'error',
        });
      };
      const request = genRequest(userInput);
      await fetchBotResponseBySSE(request, onSSEChunk, onCloseSSE, onSSEError);
  };

const ChatComponent = () => {
  
  // Chat manager
  const { 
    bubbles,           // Current message bubble states, including message content, suggested replies, status, etc.
    sugs,              // Current suggestions to display
    execute,           // Execute custom commands, driving bubbles updates
    COMMAND_CLEAR_ALL, // Built-in command: Clear all messages
    COMMAND_WITHDRAW_LAST_ROUND // Built-in command: Withdraw the last round of conversation
  } = useBotChat('bot', 'user'); // Specify bot and user role identifiers
  
  // Send message example
  const handleSend = async (userInput: string) => {
    await execute(commandSendQuery(userInput)); // Execute command: Initiate conversation
  };

  // Withdraw the last round of conversation
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
          placeholder="Enter message..."
        />
      </div>
    </div>
  );
};

export default ChatComponent;
```

## Basic Usage: State Management Store

If your project is not suitable for using React Hooks, you can directly use the `BotChatState` class to generate a store instance, and then use this instance in your component to manage chat state

```tsx
import { BotChatState } from 'bot-chat-manager';

const chatState = new BotChatState('bot', 'user', []);  // Specify bot and user role identifiers, and (optionally) initialize the message list (empty)

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
  
  // Send message example
  const handleSend = async (userInput: string) => {
    await chatState.execute(commandSendQuery(userInput)); // Execute command: Initiate conversation
  };

  // Withdraw the last round of conversation
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
          placeholder="Enter message..."
        />
      </div>
    </div>
  );
};
```

## Advanced Usage: Custom Message Bubble Types

You can extend the default message bubble type `BubbleInfo`, add custom fields, and use the new type as a generic parameter:

```tsx
import useBotChat, { BubbleInfo } from 'bot-chat-manager';

// Extend bubble type
interface CustomBubble extends BubbleInfo {
  isHighlighted?: boolean;
  attachments?: string[];
}

const ChatComponent = () => {

  // Use custom type
  const { bubbles, sugs, execute } = useBotChat<CustomBubble>('bot', 'user');

  // Custom command: Add a user attachment message
  const commandAddUserAttachmentMessage = (userInput: string, files: string[]): Command => 
    chatCtx => {
      chatCtx.addUserBubble(userInput, {
        isHighlighted: true,
        attachments: files, // ['file1.pdf', 'image.jpg']
      });
    };

  // Send message example
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
          placeholder="Enter message..."
        />
      </div>
    </div>
  );
}

```

## Type Definitions

### useBotChat

```tsx
useBotChat<M extends BubbleInfo = BubbleInfo>(botRole: string, userRole: string, initialBubbles?: M[])
```

#### Parameters

- `botRole`: Bot role identifier
- `userRole`: User role identifier
- `initialBubbles`: Optional initial bubble array

#### Return Values

- `bubbles`: Current message bubble array
- `sugs`: Current suggested reply array
- `execute`: Function to execute commands
- `COMMAND_WITHDRAW_LAST_ROUND`: Built-in command, withdraw the last round of conversation
- `COMMAND_CLEAR_ALL`: Built-in command, clear all messages

### BubbleInfo

```tsx
interface BubbleInfo {
  id?: string;           // Unique identifier for the message bubble
  role: string;          // Role of the sender of the current message bubble
  content: string;       // Content of the message bubble
  ts?: number;     // Timestamp(ms)
  status?: BubbleStatus; // Status of the message bubble
  roundId?: string;      // Used to identify a round of conversation
  sugs?: string[];       // List of suggested replies for the message bubble
  [x: string]: any;      // Other custom fields
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
  // Query methods
  getCurrentBubbles: () => M[];
  getCurrentSugs: () => string[];
  getBubble: (id: string) => M | undefined;
  
  // Delete methods
  deleteBubble: (id: string) => void;
  clearBubbles: () => void;
  withdrawLastRound: () => void;
  
  // Update methods
  setBubbles: (bubbles: M[]) => void;
  updateBubble: (id: string, props: Partial<M>) => void;
  toggleChatRound: () => string;
  
  // Add methods
  addUserBubble: (content: string, props?: Partial<M>) => string;
  addBotBubble: (content: string, props?: Partial<M>) => string;
  addBotLoadingBubble: (props?: Partial<M>) => string;
}
```

## License

[MIT](LICENSE)