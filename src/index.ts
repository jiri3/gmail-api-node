import { gmail_v1 } from "googleapis";
import CsvCreator from "./CsvCreator";
import OAuthForGoogleApi from "./OAuthForGoogleApi";
import GmailApi from "./GmailApi";
import * as repl from "repl";
import * as vm from "vm";
import * as Constants from "./Constants";

// 当時のAM 9:00に設定する
let timeCondition = new Date();
timeCondition.setUTCHours(0, 0, 0, 0);
timeCondition.setDate(26);

const aOuth = new OAuthForGoogleApi(
    Constants.SCOPES,
    Constants.CREDENTIALS_PATH
);

const replOption: repl.ReplOptions = {
    eval: commandEval,
};
const replServer = repl.start(replOption);

function commandEval(
    evalCmd: string,
    context: vm.Context,
    file: string,
    cb: (err: Error | null, result: any) => void
) {
    const trimCmd = evalCmd.trim();
    switch (trimCmd) {
        case "get":
            let param: gmail_v1.Params$Resource$Users$Messages$List = {
                userId: `me`,
                q: `from:tradesys@rakuten-sec.co.jp after:${
                    timeCondition.getTime() * Constants.MILLI
                }`,
                // q: `from:tradesys@rakuten-sec.co.jp after:2020/05/07 before:2020/05/08`,
                //q:`after:2020/5/4 before:2020/5/7 subject:What`,
            };
            console.log(param);
            const searchTime = Math.floor(Date.now() * Constants.MILLI); //ms以下は切り捨てる
            // TODO await使いたい
            const messages = GmailApi.getMessages(aOuth, param);
            messages.then((value) => {
                console.log(`取得件数:${value.length}`);
                timeCondition.setTime(searchTime);
                // TODO 2回目はヘッダーを除去したい
                CsvCreator.create(value);
                console.log("finish");
            });
            break;
        case "end":
            // aOuth.revoke();
            replServer.close();
            break;
        case "":
            break;
        default:
            console.log(`${trimCmd}:有効なコマンドではありません。get/end`);
    }
    replServer.displayPrompt();
}
