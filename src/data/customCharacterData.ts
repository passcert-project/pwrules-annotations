export class CustomCharacterData {
    private _characters: string[];
    private _minChars: string;
    private _maxChars: string;
    private _type: string;
    constructor(characters: string[]) {
        console.assert(characters instanceof Array);
        this._characters = characters;
        this._type = 'CustomCharacterData';

    }
    get characters(): string[] { return this._characters; }

    public get minChars(): string {
        return this._minChars;
    }

    public set minChars(value: string) {
        this._minChars = value;
    }

    public get maxChars(): string {
        return this._maxChars;
    }

    public set maxChars(value: string) {
        this._maxChars = value;
    }

    get type(): string {
        return this._type;
    }

    toString(): string {
        return `[${this._characters.join("")}]`;
    }

    toHTMLString(): string {
        return `[${this._characters.join("").replace('"', "&quot;")}]`;
    }
}