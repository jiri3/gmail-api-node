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

    // ref:https://github.com/googleapis/google-api-nodejs-client/blob/master/samples/oauth2.js
    private async authorize(): Promise<OAuth2Client> {
        return new Promise(async (resolve, reject) => {
            try {
                const credentials = <MyCredentials>(
                    await util.readJsonFile(this.credentialsPath)
                );
                const oAuthClient = new google.auth.OAuth2(
                    credentials.web.client_id,
                    credentials.web.client_secret,
                    credentials.web.redirect_uris[0]
                );
                const authorizeUrl = oAuthClient.generateAuthUrl({
                    access_type: "offline",
                    scope: this.scope,
                });
                const server = http
                    .createServer((req, res) => {
                        console.log(req.url);
                        if (req.url && req.url.indexOf("/?code=") > -1) {
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
                                reject(new Error("codeが取得できませんでした"));
                            }
                        } else {
                            //reject(new Error("codeが取得できませんでした"));
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
}
