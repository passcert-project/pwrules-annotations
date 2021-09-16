export const Identifier = {
    ASCII_PRINTABLE: "ascii-printable",
    DIGIT: "digit",
    LOWER: "lower",
    SPECIAL: "special",
    UNICODE: "unicode",
    UPPER: "upper",
};

export const BlockListIdentifier = {
    HIBP: "hibp",
    DEFAULT: "default",
}

export const RuleName = {
    ALLOWED: "allowed",
    MAX_CONSECUTIVE: "max-consecutive",
    REQUIRED: "required",
    MIN_LENGTH: "minlength",
    MAX_LENGTH: "maxlength",
    MIN_CLASSES: "minclasses",
    BLOCK_LIST: "blocklist",
};

export const CHARACTER_CLASS_START_SENTINEL = "[";
export const CHARACTER_CLASS_END_SENTINEL = "]";
export const PROPERTY_VALUE_SEPARATOR = ",";
export const PROPERTY_SEPARATOR = ";";
export const PROPERTY_VALUE_START_SENTINEL = ":";

export const SPACE_CODE_POINT = " ".codePointAt(0);

export const SHOULD_NOT_BE_REACHED = "Should not be reached";

export const PwDefaultOptions = {
    length: 14,
    ambiguous: false,
    number: true,
    minNumber: 1,
    uppercase: true,
    minUppercase: 0,
    lowercase: true,
    minLowercase: 0,
    special: false,
    minSpecial: 1,
    type: 'password',
    numWords: 3,
    wordSeparator: '-',
    capitalize: false,
    includeNumber: false,
};