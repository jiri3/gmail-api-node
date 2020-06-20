import { gmail_v1 } from "googleapis";
import { GaxiosPromise } from "googleapis-common";
import OAuthForGoogleApi from "./OAuthForGoogleApi";

export default class GmailApi {
    public static async list(
        aOuth: OAuthForGoogleApi,
        param: gmail_v1.Params$Resource$Users$Messages$List
    ): GaxiosPromise<gmail_v1.Schema$ListMessagesResponse> {
        const messages = new gmail_v1.Resource$Users$Messages({
            _options: { auth: await aOuth.getOAuthClient() },
        });
        return messages.list(param);
    }

    /**
     * param.idに紐づくメール情報を取得する.
     *
     * @param param gmail apiに渡すパラメータ
     */
    public static async getMessage(
        aOuth: OAuthForGoogleApi,
        param: gmail_v1.Params$Resource$Users$Messages$Get
    ): GaxiosPromise<gmail_v1.Schema$Message> {
        const messages = new gmail_v1.Resource$Users$Messages({
            _options: { auth: await aOuth.getOAuthClient() },
        });
        return messages.get(param);
    }

    /**
     * paramに基づいてGmailのメール検索を実行する.
     *
     * @param param gmail apiに渡すパラメータ
     * @return メール検索にヒットしたメールの詳細情報.
     *         メールが存在しない場合は空の配列を返却する.
     */
    public static async getMessages(
        aOuth: OAuthForGoogleApi,
        param: gmail_v1.Params$Resource$Users$Messages$List
    ): Promise<gmail_v1.Schema$Message[]> {
        const listData = (await this.list(aOuth, param)).data;
        if (!listData.messages) return [];
        const schemaMessages: gmail_v1.Schema$Message[] = [];
        for (let message of listData.messages) {
            const schemaMessage = await this.getMessage(aOuth, {
                userId: "me",
                id: String(message.id),
            });
            schemaMessages.push(schemaMessage.data);
        }
        return schemaMessages;
    }
}
