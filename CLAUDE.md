# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

東京科学大学 瀬尾研究室の公式サイト．ビルドツール・パッケージマネージャ・テストランナーは一切なく，純粋な静的HTML + CSS のみで構成される．日本語版（ルート直下）と英語版（`en/`）の二言語構成．

公開URL： https://toruseo.jp/lab/

### Claude が自分で動作確認しない

Claude Code はブラウザ表示を見ることができないため，`python -m http.server` + `curl` でステータスコードを確認する程度しかできない．**この煙テストは「ファイルが置けてHTTP 200で配信できる」しか確認できず**，表示崩れ・CSS適用ミス・リンク切れ・誤字などはどれも検出できない．**ユーザの作業を止めて権限承認を取らせる割に得られる情報が少ない**ので，**Claude は自分でローカルサーバを立てた検証はしない**こと．動作確認は人間がブラウザで目視で行う前提とする．

---

## 設計原則（重要）

このサイトの CSS / HTML は **「手作業で HTML を書き足しやすいこと」** を最上位に置いて設計されている．以下を守って編集すること．

### 1. class は 5 つのゾーンにだけ集中させる

同じ要素（`<h2>` や `<p>` など）が場所によって違う見た目になると執筆時に混乱するため，**基本ルールは「同じ要素 = 同じ見た目」**．class を残しているのは下記 **5 ゾーン** のみ：

| ゾーン      | 代表 class                                                                                                | 用途                              |
| -------- | ------------------------------------------------------------------------------------------------------- | ------------------------------- |
| ナビバー     | `.nav / .nav-inner / .nav-links / .brand / .brand-mark / .brand-jp / .lang-btn / .nav-burger / .active` | スティッキーなヘッダーナビ                   |
| ホーム hero | `.hero / .hero-meta`                                                                                    | トップページ最上部の大見出しブロック              |
| カード      | `.card-grid / .card`                                                                                    | タイル状のリンクカード（カード内の h3/p は要素セレクタ） |
| 書誌情報     | `.pub-list / .pub / .pub-year / .pub-main`                                                              | 論文リスト（年頭出しのグリッド）                |
| ニュース     | `.news-list / .news-item / .news-date / .news-body / .news-details / .news-social`                      | 日付頭出しのタイムライン                    |

**上記以外で新規に class を導入しない．** `main h2 { ... }` / `main p { ... }` / `main nav a { ... }` のような **要素セレクタ** でスタイルが当たるように `assets/styles.css` が組まれている．新しく本文を書くときは裸の `<h2>` `<p>` `<figure>` 等を置くだけでよい．

### 2. ラッパー `<div>` / `<section>` / `<header>` は使わない

幅制約は `<main>` 自体の padding-inline で与えている：

```css
nav.nav, main {
  padding-inline: max(28px, calc((100% - 1200px) / 2));
}
```

`<div class="container">` / `<section>` / `<header>` / `<article>` / `<aside>` などでコンテンツを包まず，**`<main>` の直下に h1/h2/h3/p/ul/figure などをフラットに並べる**．

罫線区切りは `<section>` や `<article>` の border ではなく，**見出し要素自身**（h1, h2, h3）の `border-top` / `border-bottom` で描く．CSS で自動的に：

- `h1` は下線（ページタイトル用）
- `main > h2` は上線（トップレベルのブロック区切り用）
- `main > h2[id]` は上線＋やや狭めの間隔（記事のジャンプターゲット用．`#tse` などの anchor スクロール対応）
- `h3` は下線（サブ見出し用）

`<hr>` にも同じスタイルの 1px 罫線が割り当たる（本文中の区切りに使用可）．

### 3. ページ構造は共通パターン

```html
<body data-page="xxx">
<nav class="nav"> ... 共通ナビ ... </nav>
<main>
  <h1>ページタイトル</h1>
  <h3>サブ見出し</h3>
  <p>本文．</p>
  <figure><img><figcaption>図説明</figcaption></figure>
  <nav><a>外部リンクボタン</a></nav>
</main>
```

- ホームページだけ先頭に `<div class="hero">...</div>` を置く（h1/h2 や hero-meta などの大型ブロック）
- 詳細ページ（research / software）は h1 の下にフラットに `<h2 id="xxx">` ＋本文 ＋ `<figure>` を並べる．記事間の罫線は `main > h2[id]` の `border-top` で自動描画．ジャンプリンク（`href="#xxx"`）は h2 に直接当たる
- カード目次は `<div class="card-grid"><a class="card">...</a>...</div>`

### 4. インラインスタイル・ユーティリティ class は禁止

`style="..."` 属性や `.text-small` のようなユーティリティ class を使わない．例外が必要な場面は CSS 側で要素セレクタとして追記する．

### 5. メディアアセットはルート直下の `img/`, `pdf/`, `traffic-flow-demo/`

画像・動画・PDF はルート直下の `img/*`, `pdf/*`, `traffic-flow-demo/*` に置かれていて，HTML から相対パスで直接参照している（例： `<img src="img/trafficdata.png">`）．英語版（`en/` 配下）からは `../img/...` / `../pdf/...` / `../assets/...` のように 1 階層上を参照する．新規メディアもこれらのディレクトリに直接追加する．

### 6. スクロールバー安定化

`html { overflow-y: scroll; }` を設定済．縦スクロールバーを常に表示させることでページ遷移時の横ズレを防ぐ．

---

## 構成と編集時の注意

### ページ構成（日本語 8 / 英語 9）

ルート直下に日本語版：
`index.html` / `research.html` / `member.html` / `member-past.html` / `paper.html` / `software.html` / `contact.html` / `link.html`

`en/` 配下に英語版：
上記 8 ページに加え，`en/instruction_international.html`（留学生向け案内）の計 9 ページ．

**個別ファイルに `<nav>` と `<footer>` がベタ書きでコピーされている**（テンプレートエンジンなし）．ナビリンク・フッタ・言語切替ボタン等を変更する場合は **日本語 8 ページ全部，かつ英語版にも同じ編集を適用する必要がある**．日本語と英語でラベルが対応している（例：「研究内容」⇄「Research」）ので訳語を揃える．

各ページの `<body data-page="...">` と nav 内の `<a ... class="active">` がページ識別用．

### `assets/`

`assets/styles.css` がサイト全体の唯一の本番スタイルシート．`assets/cpa-scene.js` は `index.html` のヒーロー横に置かれる canvas アニメ．`assets/seolab_icon.png` がファビコン兼ブランドマーク．

### 英語版の参照パス

`en/*.html` から見ると `assets/`, `img/`, `pdf/`, `traffic-flow-demo/`, `index.html`（言語切替ボタンの戻り先）はすべて `../` プレフィックス付き．新しいページや図を `en/` 配下に追加する際は相対パスのプレフィックス漏れに注意．

### ニュース項目

`index.html` のニュースは時系列逆順（新しい順）で手動管理．**直近 1 年（= 今日から 365 日以内）の項目**を `<div class="news-list">` に通常表示し，それ以前は `<details class="news-details">` 内に格納する．日付は `YYYY-MM-DD` フォーマット．件数表示はしない（summary は単に「過去ログ」）．英語版 `en/index.html` のニュースも同じ構造で並列管理する．

### フォント読み込み

Google Fonts (`Inter`, `Noto Sans JP`, `JetBrains Mono`) を使う前提で CSS 変数 (`--ff-ja`, `--ff-en`, `--ff-mono`) が定義されているが，`<link>` タグで Google Fonts を実際に読み込んでいるページは現状ない（システムフォールバックで描画）．統一するなら全ページに `<link>` を入れる．

### 触らないでよいレガシー資産

以下は旧サイトの遺物で，現行のリニューアル後ページからは参照されていない．放置でよく，編集対象にもしない：

- `asakuralab-archive/` … 旧 WordPress サイトの静的吐き出し（数百ファイル）．アーカイブとして保持
- `css/hp.css` … リニューアル前の旧スタイルシート
- `misc/` … 旧コンテンツの zip
- `_hp.code-workspace` … VSCode のワークスペース設定

新規開発・編集ではこれらのディレクトリは無視してよい．
