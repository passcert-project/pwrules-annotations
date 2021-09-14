/* import { PasswordRulesParser } from "../src/app.js";
import { CustomCharacterData } from "../src/data/customCharacterData.js";
import { NamedCharacterData } from "../src/data/namedCharacterData.js";
import { RuleData } from "../src/data/ruleData.js"; */

import { CustomCharacterData, NamedCharacterData, PasswordRulesParser, RuleData } from "@passcert/pwrules-annotations";


let x = new PasswordRulesParser();

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
        console.log(`${i}`);
    }
});