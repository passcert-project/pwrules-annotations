import { PasswordRulesParser } from "../src/app.js";
import { CustomCharacterData } from "../src/data/customCharacterData.js";
import { NamedCharacterData } from "../src/data/namedCharacterData.js";
import { PasswordBlocklist } from "../src/data/passwordBlocklist.js";
import { RuleData } from "../src/data/ruleData.js";

/* import { CustomCharacterData, NamedCharacterData, PasswordRulesParser, RuleData } from "@passcert/pwrules-annotations"; */


// we can make changes to the blocklist a priori.

/* let blist = PasswordBlocklist.getInstance();
blist.blocklist = ['1', '2', '3']; */


// TODO: use this rule after required: lower(0, 1);required: upper (1,1); required: digit(1,1); required: special(1,1); minlength: 10;
let x = new PasswordRulesParser();
let z = x.parsePasswordRules("required: lower(0, 1);required: upper (1,1); required: digit(1,1); minlength: 10;", false);
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