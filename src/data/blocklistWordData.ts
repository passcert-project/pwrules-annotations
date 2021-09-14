export class BlocklistWordData {
    private _words: string[];

    constructor(words: string[]) {
        console.assert(words instanceof Array);
        this._words = words;
    }
    get words(): string[] { return this._words; }

    toString(): string {
        return `[${this._words.join(", ")}]`;
    }
}