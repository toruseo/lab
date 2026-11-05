---
name: member-update
description: 瀬尾研HPのメンバー異動（新入生配属・卒業・修了）に伴う定型更新．member.html / member-past.html / paper.html / index.html の日英8ファイルを過去コミットのパターン通りに編集する．Triggers：新入生が加入，配属，卒業，修了，メンバー更新，member update
---

# メンバー異動によるHP更新

対象ファイルは日本語版（ルート直下）と英語版（`en/`）の対．片方だけ編集して終わらない．

| 日本語 | 英語 | 役割 |
| --- | --- | --- |
| `member.html` | `en/member.html` | 現メンバー一覧 |
| `member-past.html` | `en/member-past.html` | 過去メンバー・進路 |
| `paper.html` | `en/paper.html` | 学位論文リスト |
| `index.html` | `en/index.html` | ニュース |

編集は Read / Edit ツールで行う．コミットはユーザーが指示した場合のみ．

## 共通：ニュース項目の書式

`index.html` の `<div class="news-list">` 直下の先頭（最新順）に挿入する．日付は `YYYY-MM-DD`．

```html
    <div class="news-item">
      <div class="news-date">2026-09-28</div>
      <div class="news-body">新入生が配属（修士1名）</div>
    </div>
```

英語版 `en/index.html` も同位置に同じ構造で挿入する．

ニュース文言（過去の実例に揃える）：

| 事象 | 日本語 | 英語 |
| --- | --- | --- |
| 配属（単数） | 新入生が配属（修士1名） | New student (1 master) has joined our lab |
| 配属（複数） | 新入生が配属（修士3名） | New students (3 masters) have joined our lab |
| 配属（複数課程） | 新入生が配属（修士3名，博士1名） | New students (1 doctor, 3 masters) have joined our lab |
| 修了（単数） | 学生が修了（修士1名） | Our student (1 master) has graduated |
| 修了（複数） | 学生が修了（修士3名） | Our students (3 masters) have graduated |
| 卒業・修了 | 学生が卒業・修了（学士1名，修士3名） | Our students (1 bachelor, 3 masters) have graduated |
| 受賞を併記 | …．大川佳乃さんが木村賞を受賞 | …. Yoshino Ohkawa has received Kimura Award |

課程の呼称：学士 / 修士 / 博士 ⇄ bachelor(s) / master(s) / doctor(s)．英語版は複数課程を doctor, master, bachelor の順に並べる．

## パターンA：新入生配属

1. `member.html` の該当課程（`<h3>博士課程</h3>` / `<h3>修士課程</h3>` / `<h3>学士課程</h3>`）の `<ul>` 末尾に `<li>氏名</li>` を追加する．
   - 日本人は「姓 名」を全角スペース区切り（例：`鴻池 朝日`）．
   - 留学生はローマ字で「姓 名」の順（例：`Gong Xinrui`）．日本語版・英語版とも同じ表記．
2. `en/member.html` の対応する `<h3>Doctor course</h3>` / `<h3>Master course</h3>` / `<h3>Bachelor course</h3>` の `<ul>` 末尾に追加する．
   - 日本人は「Given Family」（例：`Asahi Konoike`）．
3. 日英 `index.html` にニュースを追加する．

学士課程から修士課程へ内部進学した場合は，学士課程リストから修士課程リスト末尾へ `<li>` を移動する（削除＋追加）．ニュースは「卒業」として扱う（パターンB）．

## パターンB：卒業・修了

1. 日英 `member.html` から該当者の `<li>` を削除する（内部進学者は修士課程リストへ移動）．
2. 日英 `member-past.html` の `<h3>学生</h3>` 配下，該当課程の `<h4>` の `<ul>` **先頭**（新しい順）に追加する．
   - 日本語版：`<li>氏名 (M, 2026-09)</li>` のようにコード→年月の順．
   - 英語版：`<li>Name (2026-09, M)</li>` のように年月→コードの順．
   - コードは本研究室に在籍した課程の連結．学士から修士に進んだ者は `BM`，修士のみは `M`，博士のみは `D`．
   - 内部進学者は卒業時点では過去メンバーに載せない．修士修了時に `BM` として載せる．
3. 日英 `paper.html` の学位論文リストに論文を追加する．
   - 日本語版：`<h3>博士論文</h3>` / `<h3>修士論文</h3>` / `<h3>学部卒業論文</h3>`
   - 英語版：`<h3>Doctor's theses</h3>` / `<h3>Master's theses</h3>` / `<h3>Bachelor's theses</h3>`
   - `<div class="pub-list">` の先頭に追加（年の新しい順）．年は修了年度（年度末3月修了なら前年の西暦，9月修了なら当年）．

   ```html
   <!-- 日本語版 -->
   <div class="pub"><div class="pub-year">2026</div><div class="pub-main">Fang, Haolin：Traffic state reconstruction for ...，2026年度</div></div>
   <div class="pub"><div class="pub-year">2025</div><div class="pub-main">石井優輝：利用者の交通行動を考慮した台風接近時の鉄道計画運休の数理解析，2025年度</div></div>
   <!-- 英語版 -->
   <div class="pub"><div class="pub-year">2026</div><div class="pub-main">Fang, Haolin: Traffic state reconstruction for ..., AY2026</div></div>
   <div class="pub"><div class="pub-year">2025</div><div class="pub-main">Ishii, Yuki: Mathematical analysis of ..., AY2025</div></div>
   ```

   - 日本語版の氏名：日本人は姓名をスペースなしで連結し全角コロン「：」．留学生は `Family, Given：`．区切りは全角読点「，」，末尾は `YYYY年度`．
   - 英語版の氏名：`Family, Given: `．区切りは半角カンマ，末尾は `AYYYYY`．英語タイトルは先頭語以外小文字（sentence case）．
   - 論文題目が未提供なら，ユーザーに題目（日英）を確認する．判明するまで paper.html は後回しにしてよい（過去にも別コミットで追加した例がある）．
4. 日英 `index.html` にニュースを追加する．
5. 進路が判明していれば `member-past.html` の `<h3>進路</h3>` / `en/member-past.html` の `<h3>Career after this lab</h3>` の `<p>` に組織名を追記する（既出の組織は追加しない，末尾の「他」は保持）．未提供なら触らない．

## 年度替わり時の付随作業（4月）

3月卒業・修了の更新時には，`index.html` のニュースのうち直近365日より古い項目を `<div class="news-list">` から `<details class="news-details">` 内の `news-list` 先頭へ移動する．日英両方で行う（CLAUDE.md「ニュース項目」参照）．

## 作業前チェック

- 氏名の表記（漢字，ローマ字の姓名順）をユーザー入力通りに使う．推測で変えない．
- 課程（学士 / 修士 / 博士）と日付は必ずユーザーの入力から取る．
- 編集後，日英4ファイル対で追加・削除の行数が一致することを確認する．
