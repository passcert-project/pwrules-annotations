# Test the package

1. Make sure that the package is installed.
   1.1. Open the `package.json` file and check if the dependencies have the package `"pw-rules-annotations":`.
2. If the package _is not_ installed, run the command `npm i ../`. It will install the package, which is in the parent directory.

3. Run the command `npm run tsc` and a new folder named `test` should be created.

4. Run the command `node test/test.js` and you should see an output in the console.


# To use the Bitwarden Generator script

1. Run the command `npm install -g @bitwarden/cli`

2. Install python if you don't have. I recommend [pyenv](https://github.com/pyenv/pyenv).

3. Run the command `./python generate_bw_passwords.py <number_of_passwords_you_want> <the_file_you_want_to_output_to>`
