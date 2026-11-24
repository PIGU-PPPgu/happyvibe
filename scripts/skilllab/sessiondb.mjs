// 从 ZCode 的会话库里读出一个会话的事实：做过的工具调用、最后的回答、起止时间。
// 只读打开，只按会话号取行，不查别的会话。纯函数，node 可直跑（scripts/test_skilllab.mjs）。
import { DatabaseSync } from 'node:sqlite';

/**
 * @param {string} dbPath 会话库文件
 * @param {string} sessionId 要读的会话号
 * @returns {{ lines: object[], toolCountLogged: number | null, found: boolean }}
 */
export function readSession(dbPath, sessionId) {
  const db = new DatabaseSync(`file:${dbPath}?mode=ro`, { readOnly: true });
  try {
    const turn = db
      .prepare('SELECT status, started_at, completed_at, tool_call_count FROM turn_usage WHERE session_id = ? ORDER BY started_at DESC LIMIT 1')
      .get(sessionId);
    const rows = db
      .prepare('SELECT p.message_id, p.data AS pdata, m.data AS mdata FROM part p JOIN message m ON m.id = p.message_id WHERE p.session_id = ? ORDER BY p.time_created, p.sequence')
      .all(sessionId);
    if (!turn && rows.length === 0) return { lines: [], toolCountLogged: null, found: false };
    const parts = rows.map((r) => ({ messageId: r.message_id, role: JSON.parse(r.mdata).role, ...JSON.parse(r.pdata) }));
    const calls = parts.filter((p) => p.type === 'tool').map((p) => ({ name: p.tool, input: p.state?.input ?? {}, status: p.state?.status }));
    // 最后一条助手消息里的文字片段拼起来就是回答；系统的隐藏提示不算
    const lastAssistantMessage = parts.filter((p) => p.role === 'assistant').at(-1)?.messageId;
    const text = parts
      .filter((p) => p.messageId === lastAssistantMessage && p.type === 'text' && !p.synthetic)
      .map((p) => p.text ?? '')
      .join('\n');
    const iso = (ms) => (ms ? new Date(ms).toISOString() : '');
    // 一行就是一次完整的对话轮：起止时间、这轮里全部工具调用、最后的回答
    // 收尾照实报：跑完是 stop，还在跑是 running，出错或被取消就是库里记的那个状态
    const finishReason = turn?.status === 'completed' ? 'stop' : (turn?.status ?? 'running');
    return {
      lines: [
        {
          startedAt: iso(turn?.started_at),
          completedAt: iso(turn?.completed_at),
          response: { finishReason, text, toolCalls: calls },
        },
      ],
      toolCountLogged: turn?.tool_call_count ?? null,
      found: true,
    };
  } finally {
    db.close();
  }
}
