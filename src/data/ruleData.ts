export class RuleData {
    private _name: string;
    value: any;

    constructor(name: string, value: any) {
        this._name = name;
        this.value = value;
    }

    get name(): string {
        return this._name;
    }

    toString(): string {
        return JSON.stringify(this);
    }
}