export class NamedCharacterData {
    private _name: string;
    private _minChars: string;
    private _maxChars: string;
    private _type: string
    constructor(name: string) {
        this._name = name;
        this._type = 'NamedCharacterData';
    }

    get name(): string {
        return this._name.toLowerCase();
    }

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
        return this._name;
    }

    toHTMLString(): string {
        return this._name;
    }
}