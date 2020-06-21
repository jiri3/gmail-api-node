import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as http from "http";
import * as url from "url";
import * as opn from "open";
import * as util from "./Util";

interface MyCredentials {
    web: {
        client_id: string;
        project_id: string;
        auth_uri: string;
        token_uri: string;
        auth_provider_x509_cert_url: string;
        client_secret: string;
        redirect_uris: string[];
        javascript_origins: string[];
    };
}
export default class OAuthForGoogleApi {
    private client: OAuth2Client | null = null;

    constructor(private scope: string[], private credentialsPath: string) {}

    public async getOAuthClient() {
        if (!this.client) {
            this.client = await this.authorize();
        }
        return this.client;
    }

    /**
     * ユーザーからの認可を得る.
     *
     * NOTE:コメント中のアルファベットは、
     * {@link https://tools.ietf.org/html/rfc6749#section-4.1}のフローと対応しています.
     * 参考:https://github.com/googleapis/google-api-nodejs-client/blob/master/samples/oauth2.js
     */
    private async authorize(): Promise<OAuth2Client> {
        return new Promise(async (resolve, reject) => {
            try {
                // 認可サーバーの資格情報ファイルを読み込む
                const credentials = <MyCredentials>(
                    await util.readJsonFile(this.credentialsPath)
                );
                // Google APIのOAuthフローを取り扱うインスタンスを生成する
                const oAuthClient = new google.auth.OAuth2(
                    credentials.web.client_id,
                    credentials.web.client_secret,
                    credentials.web.redirect_uris[0]
                );

                // ユーザーが認可した場合の応答を受け取るためにサーバーを起動する
                const server = http
                    .createServer((req, res) => {
                        if (req.url && req.url.indexOf("/?code=") > -1) {
                            /** (C) 認可コードを取得する */
                            const searchParams = new url.URL(
                                req.url,
                                credentials.web.redirect_uris[0]
                            ).searchParams;
                            res.end(
                                "Authentication successful! Please return to the console."
                            );
                            server.close();
                            // ユーザーが認可した場合、URLパラメータのcodeに認可コードがセットされている
                            const code = searchParams.get("code");
                            if (code) {
                                /** (D)アクセストークンを認可サーバーに要求する */
                                oAuthClient.getToken(code).then((res) => {
                                    /** (E)認可サーバーからアクセストークンを受け取る */
                                    oAuthClient.setCredentials(res.tokens);
                                    resolve(oAuthClient);
                                });
                            } else {
                                reject(new Error("codeが取得できませんでした"));
                            }
                        }
                    })
                    .listen(3000, () => {
                        /**
                         * (A) ユーザーエージェント(Webブラウザ)を認可サーバーに導き、OAuthフローを開始する.
                         * (B) ユーザー認証とユーザーからの認可を得る.
                         */
                        const authorizeUrl = oAuthClient.generateAuthUrl({
                            access_type: "offline",
                            scope: this.scope,
                        });

                        // authorizeUrl(URL)でWebブラウザを開く.
                        // あとは、Webブラウザー上にて
                        // 認可サーバーとユーザーとのやりとりで、ユーザー認証と認可が実施される.
                        opn(authorizeUrl, { wait: false }).then((cp) =>
                            cp.unref()
                        );
                    });
            } catch (e) {
                reject(e);
            }
        });
    }
}
