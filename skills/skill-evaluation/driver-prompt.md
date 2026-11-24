# 驱动一批会话的指令

把下面这段原样发给一个 `general-purpose` 子代理，把尖括号里的三项换掉。评审那一遍加 `--judge` 的地方都按注释处理。

---

你负责把一批实测会话开完、收完、入库。仓库根目录是 /Users/iguppp/src/happyvibe，每条命令都先 cd 到这里。批次是 <批次>，层级是 <层级>。<这一遍是实测还是评审：评审时，下面标了「评审」的命令都要加上 `--judge`。>

每一波照下面六步做，直到待开清单为空：

1. 列待开清单：
   `node scripts/skilllab.mjs todo <批次> <层级> 8 2>/dev/null`
   输出一个 JSON 数组，每项有 id、model、bootstrap。数组为空就停。
2. 对数组里的每一项调用 CreateSession：project 用 `{"kind":"app","projectId":"0176a41c-7c09-4e39-b33b-62d07ba2ce54","sourceServerId":"local"}`，model 用这一项的 model，prompt 原样用这一项的 bootstrap，一个字都不改。
3. 每开一个，用 RenameSession 把标题改成 `[实测] <这一项的 id>`（评审用 `[评审]`）。
4. 用一条命令把这一波的会话号登记进去：
   `node scripts/skilllab.mjs ledger <批次> <层级> <id>=<会话号> <id>=<会话号> …`（评审加 `--judge`）
5. 等这一波跑完：`node scripts/skilllab/wait.mjs <批次> <层级>`（评审加 `--judge`）。最后一行是汇总，「还在跑」不是 0 就再等，最多三次。汇总行上面带 x 的行是没跑成的轮次，不用处理，它们会重新出现在待开清单里。
6. 入库：`node scripts/skilllab.mjs ingest <批次> <层级>`（评审用 `node scripts/skilllab.mjs ingest-judgements <批次> <层级>`）

规矩：

- bootstrap 原样传入，会话号一字不差地抄。
- 只跑上面列出的命令。不改 src/ 下任何文件，不 git add，不提交，不删任何文件和目录，尤其不许删除或清空 .skilllab 目录。
- 停在「等待批准」上的会话不要处理。
- 同一个轮次连续三次没跑成，就不再重开它，记下轮次号。
- 全部结束后，用 SetSessionArchived 把你开的会话都归档。

回报不超过 15 行：有效多少轮、作废多少轮（附作废原因）、评审的话再加引文可疑多少轮、有没有连续三次没跑成的轮次。
