# Test the package

1. Make sure that the package is installed.
   1.1. Open the `package.json` file and check if the dependencies have the package `"pw-rules-annotations":`.
2. If the package _is not_ installed, run the command `npm i ../`. It will install the package, which is in the parent directory.

3. Run the command `npm run tsc` and a new folder named `test` should be created.

4. Run the command `node test/test.js` and you should see an output in the console.
