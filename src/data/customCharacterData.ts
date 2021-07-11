export class CustomCharacterData {
    private _characters: string[];

    constructor(characters: string[]) {
        console.assert(characters instanceof Array);
        this._characters = characters;
    }
    get characters(): string[] { return this._characters; }

    toString(): string {
        return `[${this._characters.join("")}]`;
    }

    toHTMLString(): string {
        return `[${this._characters.join("").replace('"', "&quot;")}]`;
    }
}