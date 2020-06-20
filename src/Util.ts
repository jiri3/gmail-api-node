import { promisify } from "util";
// fsはブラウザ上では動作しない。Node.jsはサーバサイド開発に利用するものなので、ブラウザで動くことは前提ではない
import * as fs from "fs";

export const readFile = (path: string): Promise<string> => {
    return promisify(fs.readFile)(path, "utf8");
};

export const readJsonFile = async (path: string): Promise<any> => {
    const contents = await readFile(path);
    return JSON.parse(contents);
};

export const writeFile = (path: string, data: string): void => {
    fs.writeFile(path, data, (err) => {
        if (err) console.log(err.stack);
    });
};

export const appendFile = (path: string, data: string): void => {
    fs.appendFile(path, data, (err) => {
        if (err) console.log(err.stack);
    });
};

export const isExitFile = (path: string): Promise<boolean> => {
    return promisify(fs.exists)(path);
};
