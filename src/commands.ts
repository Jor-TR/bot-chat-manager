import { BubbleInfo, Command } from "./typing";

// 生成内置命令
const generateInnerCommands = <M extends BubbleInfo = BubbleInfo>() => {

  const COMMAND_WITHDRAW_LAST_ROUND: Command<M> = chatCtx => {
    chatCtx.withdrawLastRound();
  };

  const COMMAND_CLEAR_ALL: Command<M> = chatCtx => {
    chatCtx.clearBubbles();
  };

  return {
    COMMAND_WITHDRAW_LAST_ROUND,
    COMMAND_CLEAR_ALL,
  };
}

export default generateInnerCommands;
