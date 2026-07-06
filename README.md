# 出店プロジェクト管理（B案：GitHub Pages + Firebase）

大崎モデルハウスの出店プロジェクトを、**1つのデータベース**を**2つのビュー**で共有する仕組みです。

- **経営ビュー** (`exec.html`) … 社長室・社長・役員。進捗と社長承認（4点セット）の確認。
- **実務ビュー** (`ops.html`) … 実務者。各タスクの工程を編集・保存。保存すると経営ビューにも即反映。
- データは **Firebase Firestore** に1件（`projects/PJ-OSAKI-001`）。画面は **GitHub Pages** で公開。

```
docs/            ← GitHub Pages が公開するフォルダ
├─ index.html          入口
├─ exec.html           経営ビュー
├─ ops.html            実務ビュー
├─ app.js              共通ロジック（Firebase読み書き・集計）
├─ firebase-config.js  ★あなたが値を貼る唯一のファイル
└─ seed-data.js        初期データ（78タスク・226備品）※初回のみ自動投入
.github/workflows/deploy.yml   push時に自動デプロイ
```

---

## セットアップは3ステップ

### STEP 1｜リポジトリに置いてPagesを有効化
1. この一式をリポジトリ直下に置く（`docs/` と `.github/` がリポジトリ直下に来るように）。
2. GitHub の **Settings → Pages** を開く。
3. 「Build and deployment」の **Source** を **GitHub Actions** にする。
4. `main` ブランチに push すると、`deploy.yml` が動いて自動公開されます。
   公開URLは `https://<ユーザー名>.github.io/<リポジトリ名>/` です。

### STEP 2｜Firebaseを用意して鍵を貼る（1ファイルだけ）
1. https://console.firebase.google.com/ で無料プロジェクトを作成。
2. 左メニュー **Build → Firestore Database → データベースの作成**。
   本番モードでもテストモードでも可（後述のルールで制御）。
3. プロジェクト設定（歯車）→ **全般** → 下の「マイアプリ」で **ウェブアプリ (`</>`)** を追加。
4. 表示される `firebaseConfig` の値を、**`docs/firebase-config.js`** の該当箇所に貼り替える。
   （apiKey / authDomain / projectId / storageBucket / messagingSenderId / appId）
5. 保存して push すれば、初回アクセス時に `seed-data.js` の初期データが自動投入されます。

> `apiKey` はウェブに出ても問題ない公開値です（秘密鍵ではありません）。アクセス制御は次のルールで行います。

### STEP 3｜Firestore セキュリティルール
Firestore の **ルール** タブに以下を貼ります。まずは社内限定運用のための最小例です。

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{id} {
      allow read, write: if true;   // ← 動作確認用。誰でも読み書き可。
    }
  }
}
```

動いたら、本番では下のように**書き込みだけ制限**するのがおすすめです（読み取りは公開、書き込みはログイン必須）。Firebase Authentication を有効にしてから使ってください。

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{id} {
      allow read: if true;                 // 閲覧は誰でも
      allow write: if request.auth != null; // 保存はログイン済のみ
    }
  }
}
```

さらに簡易的に、`firebase-config.js` の `WRITE_PASSPHRASE` に合言葉を入れておくと、実務ビューの保存時にその合言葉を求めます（本格的な認証ではなく、うっかり防止レベル）。

---

## 使い方（日常運用）
- 実務者は **実務ビュー** でセルを直接編集 →「保存する」。全ビューに即反映されます。
- 経営層は **経営ビュー** を見るだけ。承認状態（4点セット）だけはここで更新できます。
- 見た目・項目の修正は `docs/` のファイルを直して push すれば、自動で反映されます（データは消えません）。

## 注意
- GitHub Pages・Firestore（上記の初期ルール）はいずれも **URLを知れば誰でも閲覧できる公開状態** です。社内の進捗・金額・業者名が入るため、本番では STEP3 の書き込み制限＋認証、必要ならリポジトリのプライベート化を検討してください。
- 同時編集は「最後に保存した人が優先（後勝ち）」です。実務ビューは編集中に他者の更新が届くと画面上部で知らせます。
