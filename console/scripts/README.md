# Scripts

## scrape.ts

ローカル環境でWebサイトをscrapeし、ページ情報をデータベースにインポートするスクリプトです。

### 使い方

```bash
# 基本的な使い方
bun run scrape <URL> [最大ページ数]

# または npm script経由で
bun run scripts/scrape.ts <URL> [最大ページ数]
```

### 例

```bash
# デフォルト100ページまでscrape
bun run scrape https://example.com

# 最大50ページまでscrape
bun run scrape https://example.com 50
```

### 前提条件

1. `.env.local`ファイルに`FIRECRAWL_API_KEY`が設定されていること
2. データベースがセットアップされていること（`bun run db:push`を実行）

### 動作

1. 指定されたURLに対してFirecrawlの`crawl()`メソッドを実行
2. クロールが完了するまで同期的に待機（内部で2秒ごとにポーリング）
3. 完了後、ページ情報（URL、タイトル、要約）をデータベースに保存
4. 既存のページは更新される（upsert動作）

### 注意事項

- クローリングには時間がかかる場合があります（サイトの規模による）
- `crawl()`メソッドは完了まで同期的に待機します
- Firecrawl APIの利用制限に注意してください
