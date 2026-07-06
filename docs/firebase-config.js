// ============================================================
//  ★★★ ここだけ、あなたのFirebaseの値に書き換えてください ★★★
// ============================================================
//  取得手順は README.md の「STEP 2」を参照。
//  Firebaseコンソール → プロジェクトの設定 → マイアプリ(ウェブ) →
//  「firebaseConfig」に表示される値をそのまま下にコピーします。
// ------------------------------------------------------------

window.FIREBASE_CONFIG = {
  apiKey:            "ここにapiKeyを貼る",
  authDomain:        "ここにauthDomainを貼る",
  projectId:         "ここにprojectIdを貼る",
  storageBucket:     "ここにstorageBucketを貼る",
  messagingSenderId: "ここにmessagingSenderIdを貼る",
  appId:             "ここにappIdを貼る"
};

// 実務ビューで保存するときの簡易合言葉（任意）。
// 空文字 "" にすると誰でも保存できます。社内で共有する合言葉を入れると、
// 実務ビューでの保存時にこの合言葉の入力を求めます（簡易的な書き込み制限）。
window.WRITE_PASSPHRASE = "";
