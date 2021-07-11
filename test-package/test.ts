import { CustomCharacterData, NamedCharacterData, PasswordRulesParserService, RuleData } from "pwrules-annotations";

let x = new PasswordRulesParserService();

let y = x.parsePasswordRules("minlength: 21; required: lower, upper, digit; required: [!], [%];", false);

y.forEach((i: RuleData) => {
    console.log("RULE DATA => ", i);
    if (i.value instanceof Array) {
        console.log(`Rule Name: ${i.name}`)
        i.value.forEach((v: NamedCharacterData | CustomCharacterData) => {
            if (v instanceof CustomCharacterData) {
                console.log(`Characters: ${v.characters}; `);
            }
            console.log(`Value: ${v}; `);
        });
    } else {
        console.log(`${i}`)
    }
})