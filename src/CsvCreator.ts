import { gmail_v1 } from "googleapis";
import * as util from "./Util";

interface CsvSetting {
    [key: string]: {
        regexp: string;
    };
}

export default class CsvCreator {
    // csv設定ファイルのパス
    private static readonly CSV_SETTING_PATH = "./src/csv-setting.json";
    // matchによる正規表現一致時にcsv生成に利用するindex
    private static readonly REGEXP_EXTRACT_INDEX = 1;
    // メール本文中で先頭から利用したい行数
    private static readonly MAIL_ROW_NUMBER_RANGE = 12;

    public static async create(
        source: gmail_v1.Schema$Message[],
        addHeader: boolean = true
    ) {
        if (!source.length) {
            console.log("メッセージがないためcsvを生成できませんでした。");
            return;
        }

        const csvSetting = <CsvSetting>(
            await util.readJsonFile(this.CSV_SETTING_PATH)
        );

        let csvArray: string[][] = []; //後からこのデータをcsvに変換する
        if (addHeader) csvArray.push(this.createHeaderArray(csvSetting));
        source.forEach((message) => {
            const body = message.payload ? message.payload.body : null;
            const data = body ? body.data : null;
            if (!data) return;

            // メール本文からcsv生成に利用する箇所を抽出する
            const contents = Buffer.from(
                String(data).toString(),
                "base64"
            ).toString("utf8");
            const extractedContents = contents.split(
                "\r\n",
                this.MAIL_ROW_NUMBER_RANGE
            );

            // csv設定ファイルに基づいて1行分のcsvデータを生成する
            let rowData: string[] = [];
            Object.keys(csvSetting).forEach((col) => {
                const reg = RegExp(csvSetting[col].regexp);
                let cell = `""`; //csvの1セルに対応するデータ
                extractedContents.forEach((value) => {
                    const match = value.match(reg);
                    // csvセッティングの正規表現に一致する文字列があればセルにする
                    if (match && match.length > 1) {
                        cell = `"${match[this.REGEXP_EXTRACT_INDEX]}"`;
                        return;
                    }
                });
                rowData.push(cell);
            });
            csvArray.push(rowData);
        });

        // csvファイルの出力
        util.appendFile(this.getPath(), this.formatCsv(csvArray));
    }

    private static formatCsv(source: string[][]): string {
        return source.map((value) => value.join(",")).join("\r\n");
    }

    private static createHeaderArray(csvSetting: CsvSetting): string[] {
        return Object.keys(csvSetting);
    }

    // TODO csv設定ファイルからパスを設定できるようにしたい
    private static getPath() {
        return "./test.csv";
    }
}
