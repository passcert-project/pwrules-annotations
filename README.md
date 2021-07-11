# pwrules-annotations

This package allows the parsing of [Apple's](https://developer.apple.com/documentation/security/password_autofill/customizing_password_autofill_rules) password rules.

You can use this [tool](https://developer.apple.com/password-rules/) to test out these rules for generating passwords.


# Usage

1. Run the command `npm install pwrules-annotations`

2. In your `package.json`, check what is the value of the property `type`

    2.1. If you don't have this property, then its default value is `commonjs`. In your `tsconfig.json`, inside `compilerOptions`, you need to have `module:commonjs`

    2.2. If you have this property with value `module`, then in your `tsconfig.json`, inside `compilerOptions`, you need to have `module:ES2020`.

# Acknowledgements

Most of the code was copied from Apple's [original repo](https://github.com/apple/password-manager-resources).

I adapted their code to typescript, added some notes for clarity and eventually intend on contributing to it, by extending the original grammar.
