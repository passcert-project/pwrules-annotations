import { CustomCharacterData, NamedCharacterData, PasswordRulesParser, RuleData } from "@passcert/pwrules-annotations";
import { exec } from 'child_process';

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

console.log("i will try to exec");
const child = exec('echo "The \\$HOME variable is $HOME"');
child.stdout.on('data', (data) => {
    console.log(data);
})