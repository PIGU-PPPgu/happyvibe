// 从一个 ZCode 会话的记录里取出一轮实测要核查的事实。纯函数，node 可直跑（scripts/test_skilllab.mjs）。
// 会话记录由 scripts/skilllab/sessiondb.mjs 从会话库里读出来。
import { createHash } from 'node:crypto';

/**
 * 开会话时传的那一句话。让会话自己读提示文件，开会话的人不必把几万字的提示重抄一遍。
 * 新会话里只读工具不用用户批准，读命令和写操作都要，所以会话能做的只有这一次读取。
 * @param {string} promptAbs 提示文件的绝对路径
 */
export const bootstrapText = (promptAbs) =>
  `请用 Read 工具读取下面这个文件的全文，把它当作你收到的完整指令，严格照做：\n${promptAbs}\n除了这一次读取，不要使用任何工具；读完后就只输出文件要求你输出的内容。`;

/**
 * @param {object[]} lines 这个会话的记录行，一行是一次模型调用：startedAt、completedAt、response.toolCalls、response.text、response.finishReason
 * @param {{ promptAbs: string, promptHash: string, promptText: string }} prompt 这一轮的计划：提示文件的绝对路径、指纹、内容
 */
export function summarizeRollout(lines, prompt) {
  const calls = lines.flatMap((o) => o.response?.toolCalls ?? []);
  // 只允许一次工具调用，就是读指定的提示文件
  const designated = calls.filter((c) => c.name === 'Read' && c.input?.file_path === prompt.promptAbs).length;
  const readOk = calls.length === 1 && designated === 1;
  const hashOk = !prompt.promptHash || createHash('sha256').update(prompt.promptText).digest('hex') === prompt.promptHash;
  const last = lines.at(-1);
  const finished = last?.response?.finishReason === 'stop';
  return {
    promptMatches: readOk && hashOk,
    toolUses: calls.length,
    extraToolUses: calls.length - (designated ? 1 : 0),
    startedAt: lines[0]?.startedAt ?? '',
    endedAt: last?.completedAt ?? '',
    // 没有正常收尾的会话（停在工具调用上，比如等着批准命令）不算有产出
    finalText: finished ? last.response.text ?? '' : '',
    finishReason: last?.response?.finishReason ?? '',
  };
}
