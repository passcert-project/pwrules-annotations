// Copyright (c) 2019 - 2021 Apple Inc. Licensed under MIT License.
// Adapted to typescript and Bitwarden by João Miguel P. Campos (github @mikibakaiki) for PassCert project.
// npm package by João Miguel P. Campos (github @mikibakaiki) for PassCert project.

import { PasswordBlocklist } from './data/passwordBlocklist';
import { CustomCharacterData } from './data/customCharacterData';
import { BlockListIdentifier, CHARACTER_CLASS_END_SENTINEL, CHARACTER_CLASS_START_SENTINEL, CHARACTER_RANGE_END_SENTINEL, CHARACTER_RANGE_START_SENTINEL, Identifier, PROPERTY_SEPARATOR, PROPERTY_VALUE_SEPARATOR, PROPERTY_VALUE_START_SENTINEL, RuleName, SHOULD_NOT_BE_REACHED, SPACE_CODE_POINT } from './data/data.enum';
import { NamedCharacterData } from './data/namedCharacterData';
import { RuleData } from './data/ruleData';


export class PasswordRulesParser {

    /**
     * Get all the rules in the provided input string.
     * @param input The string that contains the rules to be parsed.
     * @param formatRulesForMinifiedVersion True if the "allowed" rule should not contain the classes of the "required" rule as well. False if it should.
     * @returns An array of rules ready to be used by the programmer.
     */
    public parsePasswordRules(input: string, formatRulesForMinifiedVersion?: boolean): any[] {
        const passwordRules = this._parsePasswordRulesInternal(input) || [];

        // When formatting rules for minified version, we should keep the formatted rules
        // as similar to the input as possible. Avoid copying required rules to allowed rules.
        let suppressCopyingRequiredToAllowed = formatRulesForMinifiedVersion;

        let newPasswordRules: RuleData[] = [];
        let newAllowedValues: any[] = [];
        let minimumMaximumConsecutiveCharacters = null;
        let maximumMinLength = 0;
        let minimumMaxLength = null;
        let actualMinClasses = null;

        // create the final array with concatenated rules
        // if "suppressCopyingRequiredToAllowed" is set to false, copy the required classes to the allowed rule as well.
        for (let rule of passwordRules) {
            switch (rule.name) {
                case RuleName.MAX_CONSECUTIVE:
                    minimumMaximumConsecutiveCharacters = minimumMaximumConsecutiveCharacters ? Math.min(rule.value, minimumMaximumConsecutiveCharacters) : rule.value;
                    break;

                case RuleName.MIN_LENGTH:
                    maximumMinLength = Math.max(rule.value, maximumMinLength);
                    break;

                case RuleName.MAX_LENGTH:
                    minimumMaxLength = minimumMaxLength ? Math.min(rule.value, minimumMaxLength) : rule.value;
                    break;

                case RuleName.REQUIRED:
                    rule.value = this._canonicalizedPropertyValues(rule.value, formatRulesForMinifiedVersion);
                    rule.value.forEach(element => {
                        if (Number(element.minChars) < 1) {
                            element.minChars = '1';
                        }
                        // if it has a range, don't copy it to the allowed rule.
                        // FIXME: With or without range, the required MUST be copied to the allowed.
                        // Just remove the range and should be fine
                        if (element.minChars && element.maxChars) {
                            suppressCopyingRequiredToAllowed = true;
                        }
                    });
                    newPasswordRules.push(rule);
                    if (!suppressCopyingRequiredToAllowed) {
                        newAllowedValues = newAllowedValues.concat(rule.value);
                    }
                    suppressCopyingRequiredToAllowed = formatRulesForMinifiedVersion;
                    break;

                case RuleName.ALLOWED:
                    rule.value.forEach(element => {
                        if (Number(element.minChars) >= 1) {
                            element.minChars = '0';
                        }
                    });
                    newAllowedValues = newAllowedValues.concat(rule.value);
                    break;

                case RuleName.MIN_CLASSES:
                    actualMinClasses = rule.value;
                    break;
                case RuleName.BLOCK_LIST:
                    newPasswordRules.push(new RuleData(RuleName.BLOCK_LIST, rule.value));

            }
        }
        newAllowedValues = this._canonicalizedPropertyValues(newAllowedValues, suppressCopyingRequiredToAllowed);
        // TODO: problem here, got to find out how to fix. Pushing the ascii-printable thing into allowed
        if (!suppressCopyingRequiredToAllowed && !newAllowedValues.length) {
            newAllowedValues = [new NamedCharacterData(Identifier.ASCII_PRINTABLE)];
        }
        if (newAllowedValues.length) {
            newPasswordRules.push(new RuleData(RuleName.ALLOWED, newAllowedValues));
        }

        if (minimumMaximumConsecutiveCharacters !== null) {
            newPasswordRules.push(new RuleData(RuleName.MAX_CONSECUTIVE, minimumMaximumConsecutiveCharacters));
        }

        if (maximumMinLength > 0) {
            newPasswordRules.push(new RuleData(RuleName.MIN_LENGTH, maximumMinLength));
        }

        if (minimumMaxLength !== null) {
            newPasswordRules.push(new RuleData(RuleName.MAX_LENGTH, minimumMaxLength));
        }

        if (actualMinClasses >= 1 && actualMinClasses <= 4) {
            newPasswordRules.push(new RuleData(RuleName.MIN_CLASSES, actualMinClasses));
        } else if (actualMinClasses < 1) {
            newPasswordRules.push(new RuleData(RuleName.MIN_CLASSES, 1));
        } else {
            newPasswordRules.push(new RuleData(RuleName.MIN_CLASSES, 4));
        }

        // adapt all the maxChars values to the existence of maxlength and max-consecutive
        // there are some edge case scenarios that need to be taken into account here. For example:

        // required: lower(0,10); minlength: 12; -- HANDLED
        // required: lower(10,10); minlength: 12; - Kinda ok, needs revisiting
        // required: lower(0,10), digit; minlength: 12; -- HANDLED
        // required: lower(0,5), digit(1,5); minlength: 12; -- HANDLED
        // required: lower(10,10); maxlength: 9; -- HANDLED
        // required: lower(5, 10); maxlength: 4; -- HANDLED
        // required: lower() -- HANDLED
        // required: lower(0,0); -- HANDLED
        // required: lower(0, 1), upper (1,1), digit(1,1), special(1,1); minlength: 10; -- HANDLED -> but there may be variations worth exploring

        // if the the sum of the maxchars of every required class is < minlength => remove all ranges and add each class to the allowed rules too. -- HANDLED
        // if the sum of the minchars of every required class is > maxlength => remove all ranges and add each class to the allowed rules too. -- HANDLED
        // if the min and maxchars are the same and > 0 and they are < minlength => remove ranges and add to the allowed rules too -- HANDLED
        // if the min and maxchars are the same and > 0 and they are > maxlength => remove ranges and add to the allowed rules too -- HANDLED

        //FIXME: adjust the rules on the next if to this one!
        if (minimumMaxLength !== null) {
            let maxCharsTotal = 0;
            newPasswordRules.filter(rule => rule.name === RuleName.REQUIRED)
                .forEach(rr => {
                    rr.value.forEach(rt => {
                        maxCharsTotal += Number(rt.minChars);
                    });
                });

            if (maxCharsTotal > minimumMaxLength) {
                let classNamesToAddToAllowed: string[] = [];
                newPasswordRules.filter(rule => rule.name === RuleName.REQUIRED)
                    .forEach(rr => {
                        rr.value.forEach(rt => {
                            rt.minChars = undefined;
                            rt.maxChars = undefined;
                            classNamesToAddToAllowed.push(rt.name);
                        });
                    });

                // add the classes that we removed the range to the Allowed rule
                // -1 means there is no allowed rule yet
                let allowedIndex = newPasswordRules.findIndex(r => r.name === RuleName.ALLOWED);
                if (allowedIndex !== -1) {
                    classNamesToAddToAllowed.forEach(nac => {
                        newPasswordRules[allowedIndex].value.push(new NamedCharacterData(nac));

                    })
                } else {
                    let newAllowedClasses = [];

                    classNamesToAddToAllowed.forEach(nac => {
                        newAllowedClasses.push(new NamedCharacterData(nac));
                    })
                    // TODO: maybe call that function that canonicalizes stuff ?? for the custom classes maybe
                    newPasswordRules.push(new RuleData(RuleName.ALLOWED, newAllowedClasses));
                }
            }
        }

        // minLength checks
        if (maximumMinLength !== null) {
            let minCharsTotal = 0;
            let classesSeen: string[] = [];
            let classNamesToAddToAllowed: string[] = [];

            // check for the sum of maxChars in all required rules
            newPasswordRules.filter(rule => rule.name === RuleName.REQUIRED)
                .forEach(rr => {
                    rr.value.forEach(rt => {
                        minCharsTotal += Number(rt.maxChars);
                        classesSeen.push(rt.name);
                    });
                });
            // TODO: need to check for rules of this type: required: lower; required: lower, upper;

            // TODO: check required: ascii-printable(0, 15); and its minlength / maxlength variations -> THIS SHOULD NOT BE POSSIBLE!

            // check that the sum of maxChars is, at least, equal to the minlength rule. 
            // if it is not, then delete all ranges -- they were not used correctly.
            // if all 4 classes are present in required, then substitute them for ascii-printable
            if (minCharsTotal < maximumMinLength) {
                // Not all 4 character classes have been seen.
                // This means that the sum of maximum characters range is less than the minlength rule, but there are still character classes available to fill the leftover required characters, to comply with the minlength rule.
                // Thus, we add the classes that are not used to the allowed rule.
                // FIXME: add only the ones not required or all? if all, then it's ascii-printable
                if (classesSeen.length < 4) {
                    if (!classesSeen.includes(Identifier.LOWER)) {
                        classNamesToAddToAllowed.push(Identifier.LOWER)
                    }
                    if (!classesSeen.includes(Identifier.UPPER)) {
                        classNamesToAddToAllowed.push(Identifier.UPPER)
                    }
                    if (!classesSeen.includes(Identifier.DIGIT)) {
                        classNamesToAddToAllowed.push(Identifier.DIGIT)
                    }
                    if (!classesSeen.includes(Identifier.SPECIAL)) {
                        classNamesToAddToAllowed.push(Identifier.SPECIAL)
                    }
                    // updating the minclasses to the number of actually required classes
                    newPasswordRules.find(rule => rule.name === RuleName.MIN_CLASSES).value = classesSeen.length;
                }
                // All 4 character classes have been seen.
                // This means that the sum of maximum characters range is less than the minlength rule.
                // Thus, we need to make ascii-printable required and allowed.
                else {
                    let numRequiredRules = newPasswordRules.filter(rule => rule.name === RuleName.REQUIRED).length;

                    // there are multiple required rules, i.e., required: a; required: b; etc.
                    if (numRequiredRules > 1) {
                        let iter = newPasswordRules.findIndex(rule => rule.name === RuleName.REQUIRED);
                        while (iter !== -1) {
                            newPasswordRules.splice(iter, 1);
                            iter = newPasswordRules.findIndex(rule => rule.name === RuleName.REQUIRED);
                        }
                        newPasswordRules.push(new RuleData(RuleName.REQUIRED, [new NamedCharacterData(Identifier.ASCII_PRINTABLE)]));
                    } else if (numRequiredRules == 1) {
                        // Only one required rule. 
                        // Seen all 4 character classes 
                        // Therefore, we substitute all character classes by ascii-printable
                        let ruleIndex = newPasswordRules.findIndex(rule => rule.name === RuleName.REQUIRED);
                        newPasswordRules[ruleIndex].value = [new NamedCharacterData(Identifier.ASCII_PRINTABLE)];
                    }
                    // updating the minclasses to the number of actually required classes
                    newPasswordRules.find(rule => rule.name === RuleName.MIN_CLASSES).value = classesSeen.length;

                }
            };

            // add the classes that we removed the range to the Allowed rule
            // -1 means there is no allowed rule yet
            let allowedIndex = newPasswordRules.findIndex(r => r.name === RuleName.ALLOWED);
            if (allowedIndex !== -1) {
                // TODO: check if the value is ascii-printable, or if the value we're going to push is already there!
                newPasswordRules[allowedIndex].value.forEach(element => {
                    if (element.name === Identifier.ASCII_PRINTABLE) {
                        return newPasswordRules;
                    }

                    let ind = classNamesToAddToAllowed.findIndex(el => el === element.name);
                    if (ind !== -1) {
                        // didn't find any - this rule is not allowed, we'll add it now
                        element.push(new NamedCharacterData(classNamesToAddToAllowed[ind]));
                    }
                });
            } else {
                let newAllowedClasses = [];

                classNamesToAddToAllowed.forEach(nac => {
                    newAllowedClasses.push(new NamedCharacterData(nac));
                })
                // TODO: maybe call that function that canonicalizes stuff ?? for the custom classes maybe
                newPasswordRules.push(new RuleData(RuleName.ALLOWED, newAllowedClasses));
            }
        }

        return newPasswordRules;
    }

    //#region Lexer functions

    /**
     * Check if the character received is a letter.
     * @param c The character to analyze.
     * @returns True if the c is an identifier character and False if not.
     */
    private _isIdentifierCharacter(c: string): boolean {
        console.assert(c.length === 1);
        return c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c === "-";
    }

    /**
     * Check if the character received is a digit.
     * @param c The character to analyze.
     * @returns True if the c is a digit and False if not.
     */
    private _isASCIIDigit(c: string): boolean {
        console.assert(c.length === 1);
        return c >= "0" && c <= "9";
    }

    /**
     * Check if the character received is an ASCII printable character - special character.
     * @param c The character to analyze.
     * @returns True if the c is an ASCII printable character and False if not.
     */
    private _isASCIIPrintableCharacter(c: string): boolean {
        console.assert(c.length === 1);
        return c >= " " && c <= "~";
    }

    /**
     * Check if the character received is a white space character.
     * @param c The character to analyze.
     * @returns True if the c is a white space character and False if not.
     */
    private _isASCIIWhitespace(c: string): boolean {
        console.assert(c.length === 1);
        return c === " " || c === "\f" || c === "\n" || c === "\r" || c === "\t";
    }

    //#endregion

    //#region ASCII printable character bit set and canonicalization functions

    /**
     * Get the adapted ASCII code for a given character. 
     * @param c The character to analyze.
     * @returns The adapted ASCII code for the character.
     */
    private _bitSetIndexForCharacter(c: string): number {
        console.assert(c.length == 1);
        return c.codePointAt(0) - SPACE_CODE_POINT;
    }

    /**
    * Get the character correspondent to the adapted ASCII code provided in index. 
    * @param index The adapted ASCII code to analyze.
    * @returns The character correspondent to the given adapted ASCII code.
    */
    private _characterAtBitSetIndex(index: number): string {
        return String.fromCodePoint(index + SPACE_CODE_POINT);
    }

    /**
     * Sets the value of an interval of the bitSet to true, depending on which namedCharacterClass it's analyzing.
     * Example: For the "upper" character class, it will set to True the indexes that correspond to the ASCII value of the upper case letters. 
     * @param bitSet An array with the size of the printable characters. 
     * @param namedCharacterClass The character class to analyze - "upper", "lower", "digit", "special".
     */
    private _markBitsForNamedCharacterClass(bitSet: any[], namedCharacterClass: NamedCharacterData): void {
        console.assert(bitSet instanceof Array);
        console.assert(namedCharacterClass.name !== Identifier.UNICODE);
        console.assert(namedCharacterClass.name !== Identifier.ASCII_PRINTABLE);
        if (namedCharacterClass.name === Identifier.UPPER) {
            bitSet.fill(true, this._bitSetIndexForCharacter("A"), this._bitSetIndexForCharacter("Z") + 1);
        }
        else if (namedCharacterClass.name === Identifier.LOWER) {
            bitSet.fill(true, this._bitSetIndexForCharacter("a"), this._bitSetIndexForCharacter("z") + 1);
        }
        else if (namedCharacterClass.name === Identifier.DIGIT) {
            bitSet.fill(true, this._bitSetIndexForCharacter("0"), this._bitSetIndexForCharacter("9") + 1);
        }
        else if (namedCharacterClass.name === Identifier.SPECIAL) {
            bitSet.fill(true, this._bitSetIndexForCharacter(" "), this._bitSetIndexForCharacter("/") + 1);
            bitSet.fill(true, this._bitSetIndexForCharacter(":"), this._bitSetIndexForCharacter("@") + 1);
            bitSet.fill(true, this._bitSetIndexForCharacter("["), this._bitSetIndexForCharacter("`") + 1);
            bitSet.fill(true, this._bitSetIndexForCharacter("{"), this._bitSetIndexForCharacter("~") + 1);
        }
        else {
            console.assert(false, SHOULD_NOT_BE_REACHED, namedCharacterClass);
        }
    }

    /**
     * Sets the value of an interval of the bitset to true, depending on which customCharacterClass it's analyzing.
     * @param bitSet An array with the size of the printable characters.
     * @param customCharacterClass A custom character class.
     */
    private _markBitsForCustomCharacterClass(bitSet: any[], customCharacterClass: CustomCharacterData): void {
        for (let character of customCharacterClass.characters) {
            bitSet[this._bitSetIndexForCharacter(character)] = true;
        }
    }

    /**
     * Get the values correspondent to each "required" rule, whether it's a whole character class or just some characters.
     * @param propertyValues The value of the rule to analyze, e.g., "upper", "digit", "[abc]"
     * @param keepCustomCharacterClassFormatCompliant Whether to copy the required classes to allowed or not.
     * @returns An array containing the character classes that are required.
     */

    private _canonicalizedPropertyValues(propertyValues: any[], keepCustomCharacterClassFormatCompliant: boolean): (NamedCharacterData | CustomCharacterData)[] {
        let asciiPrintableBitSet = new Array("~".codePointAt(0) - " ".codePointAt(0) + 1);
        let hasCharRange = false;
        for (let propertyValue of propertyValues) {
            if (propertyValue instanceof NamedCharacterData) {
                if (propertyValue.name === Identifier.UNICODE) {
                    return [new NamedCharacterData(Identifier.UNICODE)];
                }

                if (propertyValue.name === Identifier.ASCII_PRINTABLE) {
                    return [new NamedCharacterData(Identifier.ASCII_PRINTABLE)];
                }

                if (propertyValue.minChars !== undefined && propertyValue.maxChars !== undefined) {
                    hasCharRange = true;
                }


                this._markBitsForNamedCharacterClass(asciiPrintableBitSet, propertyValue);
            }
            else if (propertyValue instanceof CustomCharacterData) {
                this._markBitsForCustomCharacterClass(asciiPrintableBitSet, propertyValue);
            }
        }

        let charactersSeen: any[] = [];

        let checkRange = ((start: string, end: string): boolean => {
            let temp = [];
            for (let i = this._bitSetIndexForCharacter(start); i <= this._bitSetIndexForCharacter(end); ++i) {
                if (asciiPrintableBitSet[i]) {
                    temp.push(this._characterAtBitSetIndex(i));
                }
            }

            let result = temp.length === (this._bitSetIndexForCharacter(end) - this._bitSetIndexForCharacter(start) + 1);
            if (!result) {
                charactersSeen = charactersSeen.concat(temp);
            }
            return result;
        });

        let hasAllUpper = checkRange("A", "Z");
        let hasAllLower = checkRange("a", "z");
        let hasAllDigits = checkRange("0", "9");

        // Check for special characters, accounting for characters that are given special treatment (i.e. '-' and ']')
        let hasAllSpecial = false;
        let hasDash = false;
        let hasRightSquareBracket = false;
        let temp = [];
        for (let i = this._bitSetIndexForCharacter(" "); i <= this._bitSetIndexForCharacter("/"); ++i) {
            if (!asciiPrintableBitSet[i]) {
                continue;
            }

            let character = this._characterAtBitSetIndex(i);
            if (keepCustomCharacterClassFormatCompliant && character === "-") {
                hasDash = true;
            }
            else {
                temp.push(character);
            }
        }
        for (let i = this._bitSetIndexForCharacter(":"); i <= this._bitSetIndexForCharacter("@"); ++i) {
            if (asciiPrintableBitSet[i]) {
                temp.push(this._characterAtBitSetIndex(i));
            }
        }
        for (let i = this._bitSetIndexForCharacter("["); i <= this._bitSetIndexForCharacter("`"); ++i) {
            if (!asciiPrintableBitSet[i]) {
                continue;
            }

            let character = this._characterAtBitSetIndex(i);
            if (keepCustomCharacterClassFormatCompliant && character === "]") {
                hasRightSquareBracket = true;
            }
            else {
                temp.push(character);
            }
        }
        for (let i = this._bitSetIndexForCharacter("{"); i <= this._bitSetIndexForCharacter("~"); ++i) {
            if (asciiPrintableBitSet[i]) {
                temp.push(this._characterAtBitSetIndex(i));
            }
        }

        if (hasDash) {
            temp.unshift("-");
        }
        if (hasRightSquareBracket) {
            temp.push("]");
        }

        let numberOfSpecialCharacters = (this._bitSetIndexForCharacter("/") - this._bitSetIndexForCharacter(" ") + 1)
            + (this._bitSetIndexForCharacter("@") - this._bitSetIndexForCharacter(":") + 1)
            + (this._bitSetIndexForCharacter("`") - this._bitSetIndexForCharacter("[") + 1)
            + (this._bitSetIndexForCharacter("~") - this._bitSetIndexForCharacter("{") + 1);
        hasAllSpecial = temp.length === numberOfSpecialCharacters;
        if (!hasAllSpecial) {
            charactersSeen = charactersSeen.concat(temp);
        }

        let result = [];

        // has all 4 classes, but some of them have ranges.
        // this means that ascii-printable will be allowed, but there are some specific ranges that need to be fulfilled, thus, we need to return the original values parsed, for later verification.
        if (hasAllUpper && hasAllLower && hasAllDigits && hasAllSpecial && hasCharRange) {
            propertyValues.forEach(val => {
                result.push(val);
            });
            return result;
        } else if (hasAllUpper && hasAllLower && hasAllDigits && hasAllSpecial) {

            return [new NamedCharacterData(Identifier.ASCII_PRINTABLE)];
        }

        if (hasAllUpper) {
            let newNamedClass = propertyValues.filter(x => x.type === 'NamedCharacterData' && x.name === Identifier.UPPER)[0];

            result.push(newNamedClass);
        }
        if (hasAllLower) {
            let newNamedClass = propertyValues.filter(x => x.type === 'NamedCharacterData' && x.name === Identifier.LOWER)[0];
            result.push(newNamedClass);
            /* result.push(new NamedCharacterData(Identifier.LOWER)); */
        }
        if (hasAllDigits) {
            let newNamedClass = propertyValues.filter(x => x.type === 'NamedCharacterData' && x.name === Identifier.DIGIT)[0];
            result.push(newNamedClass);
            // result.push(new NamedCharacterData(Identifier.DIGIT));
        }
        if (hasAllSpecial) {
            let newNamedClass = propertyValues.filter(x => x.type === 'NamedCharacterData' && x.name === Identifier.SPECIAL)[0];
            result.push(newNamedClass);
            // result.push(new NamedCharacterData(Identifier.SPECIAL));
        }
        if (charactersSeen.length) {
            let newNamedClass: CustomCharacterData;
            charactersSeen.forEach(cs => {
                newNamedClass = propertyValues.filter(x => x.type === 'CustomCharacterData' && x.characters.includes(cs))[0];
                if (!result.includes(newNamedClass)) {
                    result.push(newNamedClass);
                }
            })
            /* result.push(new CustomCharacterData(charactersSeen)); */
        }
        return result;
    }

    //#endregion

    //#region Parser functions

    /**
     * Get the next index in the input which is not a white space.
     * @param input The string that contains the rules to be parsed.
     * @param index The index of the input to check. 
     * @returns The index of the next character that is not a white space character.
     */
    private _indexOfNonWhitespaceCharacter(input: string, index = 0): number {
        console.assert(index >= 0);
        console.assert(index <= input.length);

        let length = input.length;
        while (index < length && this._isASCIIWhitespace(input[index]))
            ++index;

        return index;
    }

    /**
     * Parses the identifier of each rule. 
     * @param input The string that contains the rules to be parsed.
     * @param position The position from where to start parsing the input.
     * @returns The name of the identifier and the last position analyzed.
     */
    private _parseIdentifier(input: string, position: number): [string, number] {
        console.assert(position >= 0);
        console.assert(position < input.length);
        console.assert(this._isIdentifierCharacter(input[position]));

        let length = input.length;
        let seenIdentifiers = [];
        do {
            let c = input[position];
            if (!this._isIdentifierCharacter(c)) {
                break;
            }

            seenIdentifiers.push(c);
            ++position;
        } while (position < length);

        return [seenIdentifiers.join(""), position];
    }

    /**
     * Parses the identifier of each rule. 
     * @param input The string that contains the rules to be parsed.
     * @param position The position from where to start parsing the input.
     * @returns The name of the identifier and the last position analyzed.
     */
    private _parseRange(input: string, position: number): [string, number] {
        console.assert(position >= 0);
        console.assert(position < input.length);
        // console.assert(this._isIdentifierCharacter(input[position]));

        let length = input.length;
        let seenRange = [];
        let result = 0;
        do {

            if (input[position] === CHARACTER_RANGE_START_SENTINEL || this._isASCIIWhitespace(input[position])) {
                ++position;
                continue;
            }

            // if we see a whitespace or a comma, then we can push the result integer to the list. 
            // useful for integer > 9
            if (input[position] === PROPERTY_VALUE_SEPARATOR) {
                seenRange.push(result);
                result = 0;
                ++position;
                continue;
            }

            if (input[position] === CHARACTER_RANGE_END_SENTINEL) {
                seenRange.push(result);
                result = 0;
                break;
            }
            if (this._isASCIIDigit(input[position])) {
                result = 10 * result + parseInt(input[position], 10);
            }

            ++position;
        } while (position < length);

        return [seenRange.join(","), position];
    }


    /**
     * Check if the identifier is a valid one for the "required" and "allowed" rules.
     * @param identifier The identifier to verify.
     * @returns True if it is a valid identifier. False if it is not a valid identifier.
     */
    private _isValidRequiredOrAllowedPropertyValueIdentifier(identifier: string): boolean {
        return identifier && Object.values(Identifier).includes(identifier.toLowerCase());
    }

    /**
     * Check if the identifier is a valid one for the "blocklist" rule.
     * @param identifier The identifier to verify.
     * @returns True if it is a valid identifier. False if it is not a valid identifier.
     */
    private _isValidBlockListPropertyValueIdentifier(identifier: string): boolean {
        return identifier && Object.values(BlockListIdentifier).includes(identifier.toLowerCase());
    }

    /**
     * Parse a custom character class. These classes are defined by the user and are surrounded by squared brackets ([]).
     * @param input The string that contains the rules to be parsed.
     * @param position The position from where to start parsing the input.
     * @returns Returns an array with the custom class information and the last position analyzed
     */
    private _parseCustomCharacterClass(input: string, position: number): [string[], number] {
        console.assert(position >= 0);
        console.assert(position < input.length);
        console.assert(input[position] === CHARACTER_CLASS_START_SENTINEL);

        let length = input.length;
        ++position;
        if (position >= length) {
            console.error("Found end-of-line instead of character class character");
            return [null, position];
        }

        let initialPosition = position;
        let result = [];
        do {
            let c = input[position];
            if (!this._isASCIIPrintableCharacter(c)) {
                ++position;
                continue;
            }

            if (c === "-" && (position - initialPosition) > 0) {
                // FIXME: Should this be an error?
                console.warn("Ignoring '-'; a '-' may only appear as the first character in a character class");
                ++position;
                continue;
            }

            result.push(c);
            ++position;
            if (c === CHARACTER_CLASS_END_SENTINEL) {
                break;
            }
        } while (position < length);

        if (position < length && input[position] !== CHARACTER_CLASS_END_SENTINEL || position == length && input[position - 1] == CHARACTER_CLASS_END_SENTINEL) {
            // Fix up result; we over consumed.
            result.pop();
            return [result, position];
        }

        if (position < length && input[position] == CHARACTER_CLASS_END_SENTINEL) {
            return [result, position + 1];
        }

        console.error("Found end-of-line instead of end of character class");
        return [null, position];
    }

    /**
     * Parse the values given to the rules "required" and "allowed".
     * @param input The string that contains the rules to be parsed.
     * @param position The position from where to start parsing the input.
     * @returns Returns an array with the information about the required and allowed classes and the last position analyzed
     */
    private _parsePasswordRequiredOrAllowedPropertyValue(input: string, position: number): [(NamedCharacterData | CustomCharacterData)[], number] {
        console.assert(position >= 0);
        console.assert(position < input.length);

        let length = input.length;
        let propertyValues = [];
        while (true) {
            if (this._isIdentifierCharacter(input[position])) {
                let identifierStartPosition = position;
                let [propertyValue, index] = this._parseIdentifier(input, position);
                position = index;
                if (!this._isValidRequiredOrAllowedPropertyValueIdentifier(propertyValue)) {
                    console.error("Unrecognized property value identifier: " + propertyValue);
                    return [null, identifierStartPosition];
                }
                propertyValues.push(new NamedCharacterData(propertyValue));
                position = this._indexOfNonWhitespaceCharacter(input, position);
                if (input[position] === CHARACTER_RANGE_START_SENTINEL) {
                    let [range, index] = this._parseRange(input, position);
                    // because the index returns the position of ), we add 1 position, so the parsing can continue
                    position = index + 1;
                    let rangeChars = range.split(',');
                    if (rangeChars.length !== 2 || (rangeChars[0] === '0' && rangeChars[1] === '0')) {
                        console.error("Range parameters are wrong. Usage is (minChar, maxChar.\nminChar and maxChar cannot be both 0.\nUsing range is optional.");
                    } else {
                        let lastPushedNamedClass = propertyValues[propertyValues.length - 1] as NamedCharacterData;
                        lastPushedNamedClass.minChars = rangeChars[0];
                        lastPushedNamedClass.maxChars = rangeChars[1];
                    }
                }
            }
            else if (input[position] === CHARACTER_CLASS_START_SENTINEL) {
                let [propertyValueArray, index] = this._parseCustomCharacterClass(input, position);
                position = index;
                if (propertyValueArray && propertyValueArray.length) {
                    propertyValues.push(new CustomCharacterData(propertyValueArray));
                }
                if (input[position] === CHARACTER_RANGE_START_SENTINEL) {
                    position = this._indexOfNonWhitespaceCharacter(input, position);
                    let [range, index] = this._parseRange(input, position);
                    // because the index returns the position of ), we add 1 position, so the parsing can continue
                    position = index + 1;
                    let rangeChars = range.split(',');
                    if (rangeChars.length !== 2 || (rangeChars[0] === '0' && rangeChars[1] === '0')) {
                        console.error("Range parameters are wrong. Usage is (minChar, maxChar.\nminChar and maxChar cannot be both 0.\nUsing range is optional.");
                    } else {
                        let lastPushedNamedClass = propertyValues[propertyValues.length - 1] as CustomCharacterData;
                        lastPushedNamedClass.minChars = rangeChars[0];
                        lastPushedNamedClass.maxChars = rangeChars[1];
                    }
                }
            }
            else {
                console.error("Failed to find start of property value: " + input.substr(position));
                return [null, position];
            }

            position = this._indexOfNonWhitespaceCharacter(input, position);
            if (position >= length || input[position] === PROPERTY_SEPARATOR) {
                break;
            }

            if (input[position] === PROPERTY_VALUE_SEPARATOR) {
                position = this._indexOfNonWhitespaceCharacter(input, position + 1);
                if (position >= length) {
                    console.error("Found end-of-line instead of start of next property value");
                    return [null, position];
                }
                continue;
            }

            console.error("Failed to find start of next property or property value: " + input.substr(position));
            return [null, position];
        }
        return [propertyValues, position];
    }

    /**
     * Parse the values given to the rule "blocklist". If it's 'default', there is a list with the 100 000 most commonly used passwords. 
     * @param input The string that contains the rules to be parsed.
     * @param position The position from where to start parsing the input.
     * @returns Returns an array with the information about the blocklist and the last position analyzed
     */
    private _parseBlockListPropertyValue(input: string, position: number): [string[], number] {
        let propertyValues = [];
        if (this._isIdentifierCharacter(input[position])) {
            let identifierStartPosition = position;
            let [propertyValue, index] = this._parseIdentifier(input, position);
            position = index;
            if (!this._isValidBlockListPropertyValueIdentifier(propertyValue)) {
                console.error("Unrecognized property value identifier: " + propertyValue);
                return [null, identifierStartPosition];
            }
            // TODO: maybe here we can fetch the default word list and make this the value of the rule: an array of all the words
            if (propertyValue === 'default') {
                const passwordBlocklist = PasswordBlocklist.getInstance();
                passwordBlocklist.blocklist.forEach(pw => {
                    propertyValues.push(pw);
                })
            } else {
                propertyValues.push(propertyValue);
            }
        }
        return [propertyValues, position];
    }

    /**
     * Parse a password rule.
     * @param input The string that contains the rules to be parsed.
     * @param position The position from where to start parsing the input.
     * @returns The parsed rule and the last position analyzed.
     */
    private _parsePasswordRule(input: string, position: number): [RuleData, number] {
        console.assert(position >= 0);
        console.assert(position < input.length);
        console.assert(this._isIdentifierCharacter(input[position]));

        let length = input.length;

        let mayBeIdentifierStartPosition = position;
        let [identifier, index] = this._parseIdentifier(input, position);
        position = index;
        // identifier is a word. if it doesn't exist, throw error.
        if (!Object.values(RuleName).includes(identifier)) {
            console.error("Unrecognized property name: " + identifier);
            return [null, mayBeIdentifierStartPosition];
        }

        if (position >= length) {
            console.error("Found end-of-line instead of start of property value");
            return [null, position];
        }

        if (input[position] !== PROPERTY_VALUE_START_SENTINEL) {
            console.error("Failed to find start of property value: " + input.substr(position));
            return [null, position];
        }
        let property = { name: identifier, propValue: null };

        position = this._indexOfNonWhitespaceCharacter(input, position + 1);
        // Empty value
        if (position >= length || input[position] === PROPERTY_SEPARATOR) {
            return [new RuleData(property.name, property.propValue), position];
        }

        switch (identifier) {
            case RuleName.ALLOWED:
            case RuleName.REQUIRED: {
                let [propertyValue, index] = this._parsePasswordRequiredOrAllowedPropertyValue(input, position);
                position = index;
                if (propertyValue) {
                    property.propValue = propertyValue;
                }
                return [new RuleData(property.name, property.propValue), position];
            }
            case RuleName.MAX_CONSECUTIVE: {
                let [maxConsec, index] = this._parseMaxConsecutivePropertyValue(input, position);
                position = index;
                if (maxConsec) {
                    property.propValue = maxConsec;
                }
                return [new RuleData(property.name, property.propValue), position];
            }
            case RuleName.MIN_LENGTH:
            case RuleName.MAX_LENGTH: {
                let [minMaxLength, index] = this._parseMinLengthMaxLengthPropertyValue(input, position);
                position = index;
                if (minMaxLength) {
                    property.propValue = minMaxLength;
                }
                return [new RuleData(property.name, property.propValue), position];
            }
            case RuleName.MIN_CLASSES: {
                let [minClasses, index] = this._parseMinClassesPropertyValue(input, position);
                position = index;
                if (minClasses) {
                    property.propValue = minClasses;
                }
                return [new RuleData(property.name, property.propValue), position];
            }
            case RuleName.BLOCK_LIST: {
                let [blocklist, index] = this._parseBlockListPropertyValue(input, position);
                position = index;
                if (blocklist) {
                    property.propValue = blocklist;
                }
                return [new RuleData(property.name, property.propValue), position];
            }
        }
        console.assert(false, SHOULD_NOT_BE_REACHED);
    }

    /**
     * Parse the values given to the rules "minlength" and "maxlength".
     * @param input The string that contains the rules to be parsed. 
     * @param position The position from where to start parsing the input.
     * @returns The value for the rule and the last position analyzed.
     */
    private _parseMinLengthMaxLengthPropertyValue(input: string, position: number): [number, number] {
        return this._parseInteger(input, position);
    }

    /**
     * Parse the values given to the rule "max-consecutive".
     * @param input The string that contains the rules to be parsed. 
     * @param position The position from where to start parsing the input.
     * @returns The value for the rule and the last position analyzed.
     */
    private _parseMaxConsecutivePropertyValue(input: string, position: number): [number, number] {
        return this._parseInteger(input, position);
    }

    /**
     * Parse the values given to the rules "minclasses".
     * @param input The string that contains the rules to be parsed. 
     * @param position The position from where to start parsing the input.
     * @returns The value for the rule and the last position analyzed.
     */
    private _parseMinClassesPropertyValue(input: string, position: number): [number, number] {
        return this._parseInteger(input, position);
    }

    /**
     * Parse the values that are only numbers. Used in the "max-consecutive", "minlength" and "maxlength" identifiers.
     * @param input The string that contains the rules to be parsed. 
     * @param position The position from where to start parsing the input.
     * @returns The value for the rule and the last position analyzed.
     */
    private _parseInteger(input: string, position: number): [number, number] {
        console.assert(position >= 0);
        console.assert(position < input.length);

        if (!this._isASCIIDigit(input[position])) {
            console.error("Failed to parse value of type integer; not a number: " + input.substr(position));
            return [null, position];
        }

        let length = input.length;
        let initialPosition = position;
        let result = 0;
        do {
            result = 10 * result + parseInt(input[position], 10);
            ++position;
        } while (position < length && input[position] !== PROPERTY_SEPARATOR && this._isASCIIDigit(input[position]));

        if (position >= length || input[position] === PROPERTY_SEPARATOR) {
            return [result, position];
        }

        console.error("Failed to parse value of type integer; not a number: " + input.substr(initialPosition));
        return [null, position];
    }

    /**
     * Get all the rules found in the description.
     * @param input The string that contains the rules to be parsed. 
     * @returns All the rules found in the input.
     */
    private _parsePasswordRulesInternal(input: string): RuleData[] {
        let parsedProperties: RuleData[] = [];
        let length = input.length;

        let position = this._indexOfNonWhitespaceCharacter(input);
        while (position < length) {
            if (!this._isIdentifierCharacter(input[position])) {
                console.warn("Failed to find start of property: " + input.substr(position));
                return parsedProperties;
            }

            let [parsedProperty, index] = this._parsePasswordRule(input, position);
            position = index;
            if (parsedProperty && parsedProperty.value) {
                parsedProperties.push(parsedProperty);
            }

            position = this._indexOfNonWhitespaceCharacter(input, position);
            if (position >= length) {
                break;
            }

            /* // check if the next character is either a "(". 
            if (input[position] === CHARACTER_RANGE_START_SENTINEL) {
                position = this._indexOfNonWhitespaceCharacter(input, position);
    
            } */
            // check if the next character is a ",". 
            if (input[position] === PROPERTY_SEPARATOR) {
                position = this._indexOfNonWhitespaceCharacter(input, position + 1);
                if (position >= length) {
                    return parsedProperties;
                }

                continue;
            }

            console.error("Failed to find start of next property: " + input.substr(position));
            return null;
        }

        return parsedProperties;
    }

    //#endregion
}
