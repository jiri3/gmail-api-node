### サンプルプログラムを動作させる手順

サンプルプログラムは、検索条件に一致したメールの内、  
最初の 1 件のメール本文をコンソールに表示する処理を実装しています。

1. クライアント登録と資格情報を取得する  
   [Google API Console](https://console.developers.google.com/?hl=ja)にて、クライアントの登録を行います。  
   その際、リダイレクト URI を設定するのですが、`"http://127.0.0.1:3000"`を設定してください。  
   クライアント登録後、資格情報ファイル(json 形式)をダウンロードしてください。  
   そして、資格情報ファイルの名前を**credentials.json**に修正してください。
2. git clone する

```shell
$ git clone https://github.com/jiri3/gmail-api-node.git
```

3. メールの検索条件を設定する  
   [sample.ts で設定している検索条件](https://github.com/jiri3/gmail-api-node/blob/master/src/sample.ts#L35)を任意のメールアドレスに修正してください。
4. サンプルプログラムを実行する

```shell
$ cd gmail-api-node

# 資格情報ファイルをカレントディレクトリに格納してください
$ mv path/credentials.json .

$ npm install
$ npm run build

# サンプルプログラムを実行する
$ npm run sample
```
