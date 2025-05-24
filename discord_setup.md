# Discord連携手順

## 概要
この文書では、大阪万博パビリオン待ち時間投稿サイトとDiscordを連携するための手順を説明します。セキュリティ上の理由から、2つの方法を紹介します：

1. **フロントエンドからの直接連携（簡易版・開発用）**
2. **バックエンドAPIを経由した連携（推奨・本番用）**

## 1. Discordでの準備

### Webhookの作成

1. **サーバーの設定を開く**
   - Discordサーバーにログインし、投稿先のサーバーを選択
   - サーバー名の横にある下向き矢印をクリックし、「サーバー設定」を選択

2. **連携サービス設定に移動**
   - 左側のメニューから「連携サービス」を選択

3. **Webhookを作成**
   - 「Webhookを作成」ボタンをクリック
   - Webhookの名前を入力（例：「万博待ち時間Bot」）
   - アイコン画像を設定（任意）
   - 投稿先のチャンネルを選択
   - 「Webhookを作成」ボタンをクリック

4. **WebhookのURLをコピー**
   - 「Webhookのリンクをコピー」をクリック
   - このURLは秘密に保管（APIキーと同等の機密情報）

## 2. フロントエンドからの直接連携（簡易版・開発用）

**注意**: この方法はセキュリティ上のリスクがあり、開発環境やプライベートな使用のみに適しています。

### 実装手順

1. **script.jsファイルを編集**

   ```javascript
   // Discordウェブフックの設定
   const DISCORD_WEBHOOK_URL = "あなたのDiscord WebhookのURL";
   ```

2. **動作確認**
   - サイトにアクセスし、情報を入力して投稿
   - Discordのチャンネルに投稿が表示されることを確認

### セキュリティ上の注意点

- この方法ではWebhookのURLがクライアント側（ブラウザ）に露出
- 悪意のある人物がURLを取得し、不正な投稿ができる可能性がある
- 開発中のテストや個人利用にのみ適した方法

## 3. バックエンドAPIを経由した連携（推奨・本番用）

### 必要なもの

- ウェブサーバー（Node.js, PHP, Python, Ruby, Goなど）
- バックエンドAPIをホストするサービス（Heroku, Vercel, AWS, Azure, GCPなど）

### 実装手順

#### 3.1. バックエンドAPIの作成（Node.js例）

1. **プロジェクトセットアップ**

   ```bash
   mkdir discord-api
   cd discord-api
   npm init -y
   npm install express cors dotenv axios
   ```

2. **環境変数の設定**

   `.env`ファイルを作成:
   ```
   DISCORD_WEBHOOK_URL=あなたのDiscord WebhookのURL
   PORT=3000
   ```

3. **サーバーコード作成**

   `server.js`ファイルを作成:
   ```javascript
   const express = require('express');
   const cors = require('cors');
   const axios = require('axios');
   require('dotenv').config();

   const app = express();
   const PORT = process.env.PORT || 3000;

   // CORS設定 - 本番環境では適切に制限すること
   app.use(cors({
     origin: 'あなたのフロントエンドのURL',
     methods: ['POST']
   }));

   app.use(express.json());

   // Discord投稿用エンドポイント
   app.post('/api/post-to-discord', async (req, res) => {
     try {
       const { message } = req.body;
       
       if (!message) {
         return res.status(400).json({ error: 'メッセージが必要です' });
       }

       // Discordへの投稿
       await axios.post(process.env.DISCORD_WEBHOOK_URL, {
         content: message
       });

       res.status(200).json({ success: true, message: '投稿に成功しました' });
     } catch (error) {
       console.error('Discord投稿エラー:', error);
       res.status(500).json({ error: '投稿に失敗しました' });
     }
   });

   app.listen(PORT, () => {
     console.log(`サーバーが起動しました: http://localhost:${PORT}`);
   });
   ```

4. **サーバー起動**

   ```bash
   node server.js
   ```

#### 3.2. フロントエンド側の修正

1. **script.jsファイルを編集**

   ```javascript
   // バックエンドAPIのURL
   const API_URL = "https://あなたのAPIのURL/api/post-to-discord";

   // Discordにメッセージを送信する関数
   async function sendToDiscord(message) {
     try {
       const response = await fetch(API_URL, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ message })
       });

       if (!response.ok) {
         const data = await response.json();
         throw new Error(data.error || `API error: ${response.status}`);
       }

       return await response.json();
     } catch (error) {
       console.error("Discord投稿エラー:", error);
       throw error;
     }
   }
   ```

### 3.3. デプロイ

1. **バックエンドAPIをデプロイ**
   - Heroku, Vercel, Netlify, AWS等にデプロイ
   - 環境変数`DISCORD_WEBHOOK_URL`を設定

2. **フロントエンドを更新**
   - デプロイしたAPIのURLを`API_URL`に設定
   - フロントエンドをデプロイ

### セキュリティ対策

1. **CORSの制限**
   - フロントエンドのURLのみからのリクエストを許可

2. **レート制限の実装**
   - 短時間に多くのリクエストを送ることを防ぐ

3. **入力検証**
   - バックエンドでメッセージ内容を検証

4. **認証の追加（オプション）**
   - APIキーやトークンによる認証を追加
   - JWTなどを使用したユーザー認証

## 4. 補足：WebhookのURLの保護

Discord WebhookのURLは秘密のキーと同様に扱ってください：

- GitHubなどの公開リポジトリにURLをハードコードしない
- 環境変数として安全に保管
- Webhookが漏洩した場合はすぐに再生成
- 定期的にWebhookを更新することを検討

## 5. バックエンド構築に関するよくある質問

### なぜバックエンドプロジェクトが必要なのか？

1. **セキュリティの確保**
   - フロントエンドコードはユーザーのブラウザで実行されるため、コードに含まれる機密情報（Webhook URL）はすべて露出するリスクがあります
   - バックエンドコードはサーバー上でのみ実行され、機密情報を安全に保管できます

2. **制御の向上**
   - 投稿前にメッセージの検証やフィルタリングを行える
   - リクエスト回数の制限や不正アクセス対策を実装できる

3. **拡張性**
   - 将来的に機能追加が必要になった場合に対応しやすい

### プロジェクト構成の説明

バックエンド用プロジェクトとフロントエンドプロジェクトの関係は以下のようになります：

```
[ユーザー] → [フロントエンド] → [バックエンドAPI] → [Discord Webhook]
```

**現在のプロジェクト構成:**
```
expo_post_waiting_time/
├── index.html      // フロントエンドのUIとユーザー操作
├── css/
│   └── style.css   // フロントエンドのスタイル
└── js/
    └── script.js   // フロントエンドのロジック
```

**バックエンド追加後の構成:**
```
expo_post_waiting_time/         // フロントエンドプロジェクト
├── index.html
├── css/
│   └── style.css
└── js/
    └── script.js      // APIを呼び出すコードに変更

discord-api/                    // バックエンドプロジェクト（別プロジェクト）
├── server.js                   // APIサーバーのメインコード
├── package.json                // 依存関係の管理
└── .env                        // 環境変数（Webhook URLなど）
```

### バックエンド構築の簡易オプション

バックエンド開発の経験がない場合でも、以下のサービスを利用すると比較的簡単に実装できます：

1. **Netlify Functions / Vercel Serverless Functions**
   - フロントエンドと同じプラットフォームでAPIを作成可能
   - 無料プランでも十分な機能を提供

2. **Firebase Cloud Functions**
   - Googleのサーバーレスプラットフォーム
   - 少量のリクエストなら無料で利用可能

3. **Cloudflare Workers**
   - エッジコンピューティングプラットフォーム
   - 単純なAPIなら無料枠で十分

4. **Glitch / Repl.it**
   - オンラインでコードを編集・実行できるプラットフォーム
   - 学習目的やプロトタイプ作成に最適

## 6. トラブルシューティング

### 投稿が失敗する場合

1. **WebhookのURLが正しいか確認**
   - URLが最新か、タイプミスがないか

2. **ネットワークエラーの確認**
   - ブラウザのコンソールでエラーメッセージをチェック

3. **メッセージフォーマットの確認**
   - 空のメッセージや特殊文字の使用によるエラー

4. **レート制限の確認**
   - Discordの制限（短時間に多数のメッセージ）に達していないか

5. **CORSエラーの確認**
   - バックエンドでCORS設定が正しいか

---

## 7. まとめ：実装の選択肢

### 個人利用やプロトタイプの場合

個人的な使用やプロトタイプの場合は、フロントエンドから直接Discordに投稿する方法でも問題ないでしょう。

```javascript
// script.jsに直接WebhookのURLを記述
const DISCORD_WEBHOOK_URL = "あなたのDiscord WebhookのURL";
```

### 公開サイトや本番環境の場合

公開サイトや本番環境では、セキュリティのためにバックエンドAPIを経由する必要があります。

1. **バックエンドプロジェクトを作成**
   - Node.js + Expressなどでシンプルなサーバーを構築
   - サーバーレスサービス（Netlify Functions, Vercel Functionsなど）の利用も検討

2. **フロントエンドを修正**
   - バックエンドAPIを呼び出すように変更

3. **両方をデプロイ**
   - それぞれ適切なサービスにデプロイ

## 8. 次のステップ

このプロジェクトのDiscord連携を実装するためのステップは以下の通りです：

1. **開発段階:** まずフロントエンドからの直接連携で動作確認
2. **テスト段階:** バックエンドAPIを作成して連携をテスト
3. **本番段階:** セキュリティ対策を施し、両方をデプロイ

これらの手順に沿って実装することで、安全にDiscordとの連携が実現できます。本番環境では必ずバックエンドAPIを経由する方法を採用し、Webhookの保護を徹底してください。
