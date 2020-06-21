import { gmail_v1 } from "googleapis";
import { GaxiosPromise } from "googleapis-common";
import OAuthForGoogleApi from "./OAuthForGoogleApi";
import GmailApi from "./GmailApi";
import * as Constants from "./Constants";

/**
 * Gmail APIを利用して、メッセージを取得して表示するサンプルです.
 */
getMessageDetail().then((message) => {
    if (!message) return;

    // メール本文を抽出する
    const body = message.payload ? message.payload.body : null;
    const data = body ? body.data : null;
    // メール本文はBase64エンコーディングされているのでデコードする
    const contents = Buffer.from(String(data).toString(), "base64").toString(
        "utf8"
    );

    // メール本文を表示する
    console.log(contents);
});

async function getMessageDetail(): Promise<
    gmail_v1.Schema$Message | undefined
> {
    // メールの検索条件を生成する
    const param: gmail_v1.Params$Resource$Users$Messages$List = {
        userId: `me`,
        q: `from:info@mail.rakuten-card.co.jp`,
    };

    // OAuthクライアントを生成する
    const aOuthClient = new OAuthForGoogleApi(
        Constants.SCOPES,
        Constants.CREDENTIALS_PATH
    );

    // メッセージ一覧を検索する
    const messageList = (await GmailApi.list(aOuthClient, param)).data;
    if (!messageList.messages) return;

    // メッセージ一覧の内、先頭のメッセージの詳細を取得する
    const schemaMessage = await GmailApi.getMessage(aOuthClient, {
        userId: `me`,
        id: String(messageList.messages[0].id),
    });

    return schemaMessage.data;
}
