import * as defaultBlocklist from "./blocklistWordsData.json";

export class PasswordBlocklist {
    private _blocklist: string[] = [];
    private static instance: PasswordBlocklist;

    get blocklist(): string[] {
        return this._blocklist;
    }

    set blocklist(newBlocklist: string[]) {
        this._blocklist = newBlocklist;
    }

    private constructor() {
        // add the 100k more used passwords to the blocklist
        this._blocklist = defaultBlocklist.blocklist;
    }

    public static getInstance(): PasswordBlocklist {
        if (!PasswordBlocklist.instance) {
            PasswordBlocklist.instance = new PasswordBlocklist();
        }
        return PasswordBlocklist.instance;
    }

    /**
     * Add a list of passwords to the default list, which contains the top 100 000 more used passwords, according to recent breaches. 
     * @param newPasswords A list of passwords to add to the default one
     */
    appendToTheBlocklist(newPasswords: string[]) {
        newPasswords.forEach(np => {
            this._blocklist.push(np);
        });
    }

}