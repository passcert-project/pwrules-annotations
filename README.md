# pwrules-annotations

This package allows the parsing of [Apple's](https://developer.apple.com/documentation/security/password_autofill/customizing_password_autofill_rules) password rules.

With version 2.0, this package now extends [Apple's](https://developer.apple.com/documentation/security/password_autofill/customizing_password_autofill_rules) password rules, with two new rules and a new functionality.

## New Rules
**blocklist:** Blocklist allows the webadmin to use a list of strings that may be prohibited in passwords. This is a good idea to avoid common passwords and their variations, like password123 or p@s$w0rd. 

This rule has two values for now: 
- `hibp`- This lets the password manager know that the password should be checked against [Have I Been Pwned's](https://haveibeenpwned.com/Passwords) Pwned Passwords' list. 

- `default` - This will return a list of the 100 000 most used passwords, according to [SecLists](https://github.com/danielmiessler/SecLists/blob/master/Passwords/Common-Credentials/10-million-password-list-top-100000.txt).

**minclasses:** Minclasses allows the webadmin to specify the minimum number of character classes that should be present in each password, but not specifically which classes. The default value is `minclasses: 1;` and the maximum value is `minclasses: 4;`.

## New option

With this extension there is also the possibility of specifying a minimum and maximum number for each character class, i.e., a range. This range takes the form of `(minimum, maximum)` and comes after any character class, custom or default, i.e., `<characterClass>(minimum, maximum)`. This allows for the possibility of defining a range of occurrences for a given character or character class.

Here are some examples: 
- `required: lower(1, 10); minlength: 9;` - the password must have at least one lowercase letter, and no more than 10 lowercase letters. Since `minlength: 9`, the password will have at least 9 lowercase letters.

- `required: lower(3,10); required: upper; minlength: 9;` - the password must have, at least, 3 lowercase letters, and up to 10 lowercase letters. It must also contain at least one uppercase letter.

- `required: lower(3,3); required: upper; minlength: 9;` - the password must have exactly 3 lowercase letters. It must also fulfill the `minlength` rule with uppercase letters.

This range should be used with, at least, the `minlength` rule. Otherwise, the ranges will all be discarded, but the required/ allowed character classes will be kept.

There are some obvious restrictions to the range option: 

- The `minimum` and `maximum` values should be greater than or equal to 0. 

- The `minimum` value will be converted to 1 if the value is 0 and is specified in a `required` rule.

- The `minimum` value should be less than or equal to `maximum`.

    - The `minimum` and `maximum` values can be the same --- this means that the character class **should have exactly** that number of occurrences.

- The range will be discarded when:
  
  - There is no `minlength` rule.
  - The sum of all `required` rules' `maximum` values is less than the `minlength` value.
  - The sum of all `required` rules' `minimum` values is greater than the `maxlength` value - if `maxlength` is specified. 
  - The `minimum` and `maximum` values are both 0. 


# Motivation

These new additions, combined with other existing rules, were found to be a great way to combine password security and usability in a [recent study](https://www.andrew.cmu.edu/user/nicolasc/publications/Tan-CCS20.pdf).


# Usage

1. Run the command `npm i @passcert/pwrules-annotations`

2. In your `package.json`, check what is the value of the property `type`

    2.1. If you don't have this property, then its default value is `commonjs`. In your `tsconfig.json`, inside `compilerOptions`, you need to have `module:commonjs`

    2.2. If you have this property with value `module`, then in your `tsconfig.json`, inside `compilerOptions`, you need to have `module:ES2020`.


You can use this [tool](https://developer.apple.com/password-rules/) to test out these rules for generating passwords, but the tool will not take into account these new rules.


# Acknowledgements

Most of the code was copied from Apple's [original repo](https://github.com/apple/password-manager-resources).

I adapted their code to typescript, added some notes for clarity and eventually intend on contributing to it, by extending the original grammar.
