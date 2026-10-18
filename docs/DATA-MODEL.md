# 資料結構

所有資料都是 JSON 文件，用「路徑」當 key（Supabase 模式存在 `public.docs` 表，本機模式存在 localStorage）。
權限由 `supabase/schema.sql` 的 Row Level Security 決定。

| 路徑 | 內容 | 誰能讀 | 誰能寫 |
|---|---|---|---|
| `config/main` | 診所設定：診次、科別、各診次最低人數、班別與假別選項、人員、營業日、畫休上限、已公布月份、診所名稱與 logo、自訂規則 | 名單內的人 | 管理者 |
| `roster/<YYYY-MM>` | `{ cells: { "<人員id>_<日期>": "<選項id>" } }`。助理的時段用 `T:s1+s3`（診次組合）或 `C:09:00-13:00`（自訂時間） | 名單內的人 | 管理者 |
| `requests/<uid>` | `{ empId, dates: { "<日期>": "<選項id>" } }`：員工認領的人員與畫休 | 名單內的人 | 管理者、本人 |
| `approvals/main` | `{ byUid: { <uid>: true } }`：管理者確認過的綁定 | 名單內的人 | 管理者 |
| `swaps/<uid>` | 員工提出的換班申請 `{ items: { <id>: {...} } }` | 名單內的人 | 管理者、本人 |
| `swapAcks/<uid>` | 員工對別人換班申請的同意／不同意 | 名單內的人 | 管理者、本人 |
| `swapDecisions/main` | 管理者的核准／拒絕 | 名單內的人 | 管理者 |
| `notes/main` | 管理者專用：個人要求與備註 | 管理者 | 管理者 |
| `data/users/<uid>/profile` | 員工個人資料：手機、緊急聯絡人、地址、email、LINE ID | 管理者、本人 | 管理者、本人 |

## 設定裡的選項（`config.options`）

`kind` 有五種：`work`（上班班別）、`fixed`（例假）、`rest`（休息日）、`holiday`（國定假日）、`leave`（其他假別）。

- `work`：`dept`（科別 id；空字串＝徒手日，不計入科別人力）、`segs`（診次 id 陣列）
- `leave`：`quota`（天數上限）、`period`（`year` 每年累計／`event` 每次事件）、`pay`、`perMonth`、`countsAs`（併入另一個假別計算）、`credit`（折算工時）、`annual`（true＝特休，依到職週年計算）
- 所有非 `holiday` 選項都有 `selfPick`：員工能不能自己畫

## 為什麼用文件而不是正規化資料表

排班資料量小（一個診所一個月幾百格），整份文件一起讀寫最簡單，也讓「本機模式」和「Supabase 模式」可以共用同一套程式。
代價是同一份文件同時被兩個人改時，後寫的會蓋掉先寫的（last write wins）。實務上只有管理者改班表，員工各寫各自的文件，衝突很少。
