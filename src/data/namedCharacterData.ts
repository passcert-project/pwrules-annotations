export class NamedCharacterData {
    private _name: string

    constructor(name: string) {
        this._name = name;
    }
    get name(): string {
        return this._name.toLowerCase();
    }

    toString(): string {
        return this._name;
    }

    toHTMLString(): string {
        return this._name;
    }
}