import { PasswordRulesParser } from "../src/app.js";
import { CustomCharacterData } from "../src/data/customCharacterData.js";
import { NamedCharacterData } from "../src/data/namedCharacterData.js";
import { PasswordBlocklist } from "../src/data/passwordBlocklist.js";
import { RuleData } from "../src/data/ruleData.js";

/* import { CustomCharacterData, NamedCharacterData, PasswordRulesParser, RuleData } from "@passcert/pwrules-annotations"; */


// we can make changes to the blocklist a priori.

/* let blist = PasswordBlocklist.getInstance();
blist.blocklist = ['1', '2', '3']; */


let x = new PasswordRulesParser();
let z = x.parsePasswordRules("required: [!?.](0, 5), [%](-1, 10); allowed: lower(-1,10); minlength: 16; maxlength: 20; blocklist: default;", false);
console.log(z);
console.log(z[0].value);
console.log(z[1].value);
/* let y = x.parsePasswordRules("minlength: 21; blocklist: default; required: [%&3L];", false);

y.forEach((i: RuleData) => {
    console.log("RULE DATA => ", i);
    if (i.value instanceof Array) {
        // console.log(`Rule Name: ${i.name}`)
        i.value.forEach((v: NamedCharacterData | CustomCharacterData) => {
            if (v instanceof CustomCharacterData) {
                console.log(`Characters: ${v.characters}; `);
            }
            // console.log(`Value: ${v}; `);
        });
    } else {
        console.log(`${i}`);
    }
}); */