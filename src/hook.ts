import { useState, useEffect, useRef } from 'react';
import { BubbleInfo } from './typing';
import BotChatState from './store';
import generateInnerCommands from './commands';

const useBotChat = <M extends BubbleInfo = BubbleInfo>(...args: ConstructorParameters<typeof BotChatState<M>>) => {

  // 状态管理器
  const stateRef = useRef(new BotChatState<M>(...args));
  const state = stateRef.current;

  // 用于触发组件重新渲染的本地状态
  const [, forceUpdate] = useState({});

  // 订阅状态变化，当状态改变时强制组件更新
  useEffect(() => {
    const unsubscribe = state.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, [state]);

  const innerCommands = generateInnerCommands<M>();

  return {
    bubbles: state.getCurrentBubbles(),
    sugs: state.getCurrentSugs(),
    execute: state.execute.bind(state),
    ...innerCommands, // 内置命令
  } as const;
}

export default useBotChat;
