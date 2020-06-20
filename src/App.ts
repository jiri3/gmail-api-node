import { google, gmail_v1 } from "googleapis";
import { GaxiosPromise } from "googleapis-common";
import { OAuth2Client } from "google-auth-library";
import * as http from "http";
import * as url from "url";
import * as opn from "open";
import { promisify } from "util";
// fsはブラウザ上では動作しない。Node.jsはサーバサイド開発に利用するものなので、ブラウザで動くことは前提ではない
import * as fs from "fs";

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
export class AOuth {
    readonly SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
    readonly TOKEN_PATH = "./token.json";
    readonly CREDENTIALS_PATH = "./credentials.json";
    private client: OAuth2Client | null = null;

    public async list(param: gmail_v1.Params$Resource$Users$Messages$List) {
        const messages = new gmail_v1.Resource$Users$Messages({
            _options: { auth: await this.getOAuth() },
        });
        const list = await messages.list(param);
        if (list.data.messages) {
            list.data.messages.forEach(async (value) => {
                console.log(value.id);
                const data = await (
                    await this.get({ userId: "me", id: String(value.id) })
                ).data;
                if (data) {
                    // const parts = data.payload? data.payload.parts : null;
                    // const body = parts?parts[0].body:{data:""};
                    const body = data.payload ? data.payload.body : null;
                    const datadata = body ? body.data : undefined;
                    // decode:https://www.upken.jp/kb/nodejs-base64.html
                    // console.log(`raw = ${body? new Buffer(String(body.data).toString(), "base64").toString('utf8'):null}, snipet = ${data.snippet}`);// for medium
                    console.log(
                        `raw = ${
                            body
                                ? new Buffer(
                                      String(datadata).toString(),
                                      "base64"
                                  ).toString("utf8")
                                : null
                        }, snipet = ${data.snippet}`
                    ); //for rakuten
                }
            });
        } else {
            console.log("検索結果は0件です");
        }
    }

    /**
     * param.idに紐づくメール情報を取得する.
     *
     * @param param gmail apiに渡すパラメータ
     */
    public async get(
        param: gmail_v1.Params$Resource$Users$Messages$Get
    ): GaxiosPromise<gmail_v1.Schema$Message> {
        const messages = new gmail_v1.Resource$Users$Messages({
            _options: { auth: await this.getOAuth() },
        });
        return messages.get(param);
    }

    private async getOAuth() {
        if (!this.client) {
            this.client = await this.authorize();
        }
        return this.client;
    }

    // ref:https://github.com/googleapis/google-api-nodejs-client/blob/master/samples/oauth2.js
    public async authorize(): Promise<OAuth2Client> {
        return new Promise(async (resolve, reject) => {
            try {
                const contents = await this.readFile(this.CREDENTIALS_PATH);
                const credentials: MyCredentials = JSON.parse(contents);
                const oAuthClient = new google.auth.OAuth2(
                    credentials.web.client_id,
                    credentials.web.client_secret,
                    credentials.web.redirect_uris[0]
                );
                const authorizeUrl = oAuthClient.generateAuthUrl({
                    access_type: "offline",
                    scope: this.SCOPES,
                });
                const server = http
                    .createServer((req, res) => {
                        console.log(req.url);
                        if (req.url && req.url.indexOf("/?code=") > -1) {
                            console.log("server");
                            // ユーザがトークンの発行を許可した場合
                            const searchParams = new url.URL(
                                req.url,
                                credentials.web.redirect_uris[0]
                            ).searchParams;
                            res.end(
                                "Authentication successful! Please return to the console."
                            );
                            server.close();
                            const code = searchParams.get("code");
                            console.log(`code = ${code}`);
                            if (code) {
                                oAuthClient.getToken(code).then((res) => {
                                    oAuthClient.setCredentials(res.tokens);
                                    resolve(oAuthClient);
                                });
                            } else {
                                reject(new Error("code取得できませんでした"));
                            }
                        } else {
                            //reject(new Error("code取得できませんでした"));
                        }
                    })
                    .listen(3000, () => {
                        // ユーザにトークン発行の許可をお願いする
                        opn(authorizeUrl, { wait: false }).then((cp) =>
                            cp.unref()
                        );
                    });
            } catch (e) {
                reject(e);
            }
        });
    }

    private async readFile(path: string): Promise<string> {
        return promisify(fs.readFile)(path, "utf8");
    }
}
