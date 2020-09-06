function addInputField() {
    let inputNumber = document.getElementById("userInputs").querySelectorAll(".inputs").length || 0;
    let usernameTemplate =
        `<div class="inputs">
            <input class="input inputText" type="text" placeholder="Username">
            <input class="input positions" type="text" placeholder="Position">
            <label for="usernameOrientation">Direction:</label>
            <select class="input direction" id="usernameOrientation">
                <option value="1">Horizontal</option>
                <option value="3">Vertical</option>
            </select>
        </div>`;

    let passwordTemplate =
        `<div class="inputs">
            <input class="input inputText" type="text" placeholder="Password ${inputNumber}">
            <input class="input positions" type="text" placeholder="Position">
            <label for="i${inputNumber}Orientation">Direction:</label>
            <select class="input direction" id="i${inputNumber}Orientation">
                <option value="1">Horizontal</option>
                <option value="3">Vertical</option>
            </select>
         </div>`;

    if (inputNumber === 0) {
        document.getElementById("userInputs").insertAdjacentHTML("beforeend", usernameTemplate);
    } else {
        document.getElementById("userInputs").insertAdjacentHTML("beforeend", passwordTemplate);
    }
}

function removeInputField() {
    let fieldCount = document.getElementById('userInputs').childElementCount;

    if (fieldCount > 2) { // keeps at least username and one password input
        document.getElementsByClassName("inputs")[fieldCount - 1].remove();
    }
}

function clearInput() {
    let textInputs = document.getElementsByTagName("input");
    let selectInputs = document.getElementById("userInputs").getElementsByTagName("select");

    for (let i = 0; i < textInputs.length; i++) {
        textInputs[i].value = "";
    }
    for (let i = 0; i < selectInputs.length; i++) {
        selectInputs[i].value = 1;
    }
}

function sanitizeInputPosition(positions) {
    // only returns two values, down and then over as a tuple(array)
    if (positions.length !== 0) {
        positions = positions.replaceAll("[", "").replaceAll("]", "").replaceAll(" ", "").split(",");
    } else {
        positions = [0, 0];
    }
    return [parseInt(positions[0]), parseInt(positions[1])];
}

function getAndInsertInput(inputOrResult) {
    let initMatrix = makePwIdentityMatrix(64);
    let fieldCount = document.getElementById('userInputs').childElementCount;

    for (let i = 0; i < fieldCount; i++) {  // this part adds inputs on different lines unless a position is used
        let inputs = document.getElementById("userInputs").getElementsByClassName("inputs")[i].getElementsByClassName("input");
        let positions = sanitizeInputPosition(inputs[1].value);
        if (isArrayEqual(positions, [0, 0])) {
            insertIntoMatrix(initMatrix, inputs[0].value.trim(), [positions[0] + i, positions[1]], inputs[2].value, inputOrResult);
        } else {
            insertIntoMatrix(initMatrix, inputs[0].value.trim(), [positions[0], positions[1]], inputs[2].value, inputOrResult);
        }
    }
    return initMatrix;
}

// calculates the hash of the domain to use as the HMAC key; plug in any 512-bit hash algorithm here
function calcHmacHash(hashAlgorithm, hmacKey) {
    let hmacHash = "";
    switch (hashAlgorithm) {
        case "blake2b":
            hmacHash = blake2bHex(hmacKey);
            break;
        case "sha512":
            hmacHash = hex_sha512(hmacKey);
            break;
    }
    return hmacHash;
}

function showInputMatrix() {
    let filledMatrix = getAndInsertInput("input");
    let hmacKey = document.getElementById("domain").value.trim(); // key for the HMAC

    // insert results
    document.getElementById("hmacKey").innerHTML = `HMAC Key (Domain) = "${hmacKey || 'None'}"`;
    document.getElementById("timeTaken").innerHTML = "";
    document.getElementById("result").innerHTML = makeHTMLtable(filledMatrix, 1); // show input
}

function calcOutputMatrix() {
    let filledMatrix = getAndInsertInput("result");
    let hashAlgorithm = document.getElementById("selectAlgorithm").value;
    let hmacKey = document.getElementById("domain").value.trim();
    let hmacHash = calcHmacHash(hashAlgorithm, hmacKey);

    // calculate the password matrix and time how long it takes
    let startTime = performance.now()
    calculatePassMatrix(filledMatrix, hashAlgorithm, hmacHash);
    let endTime = performance.now() - startTime;
    let timeToComplete = String(endTime).split(".").shift();

    // insert results
    document.getElementById("hmacKey").innerHTML = `HMAC Key (Domain) = hash("${hmacKey}")`;
    document.getElementById("timeTaken").innerHTML = `Time to calculate matrix = ${timeToComplete} milliseconds`;
    document.getElementById("result").innerHTML = makeHTMLtable(filledMatrix, 0); // hex output
}

function storeResultMatrix() {
    let filledMatrix = getAndInsertInput("result");
    let hashAlgorithm = document.getElementById("selectAlgorithm").value;
    let hmacKey = document.getElementById("domain").value.trim()
    let hmacHash = calcHmacHash(hashAlgorithm, hmacKey);

    calculatePassMatrix(filledMatrix, hashAlgorithm, hmacHash);

    localStorage.setItem("storedHexMatrix", flattenToHex(filledMatrix));
    document.getElementById("hmacKey").innerHTML = "";
    document.getElementById("timeTaken").innerHTML = "";
    document.getElementById("result").innerHTML = '<h2 id="storedResult">Stored the resulting password matrix for comparison<h2>';
}

// compare matrix converted into hash values, 8192 characters long
function compareResult() {
    let filledMatrix = getAndInsertInput("result");
    let hashAlgorithm = document.getElementById("selectAlgorithm").value;
    let hmacKey = document.getElementById("domain").value.trim()
    let hmacHash = calcHmacHash(hashAlgorithm, hmacKey);
    let storedHexMatrix = localStorage.getItem("storedHexMatrix") || "";

    calculatePassMatrix(filledMatrix, hashAlgorithm, hmacHash);

    document.getElementById("hmacKey").innerHTML = "";
    document.getElementById("timeTaken").innerHTML = "";
    // uses hex string to compare
    if (flattenToHex(filledMatrix) === storedHexMatrix) {
        document.getElementById("result").innerHTML = '<h2 id="storedResultMatched">The stored and result password matrix match!</h2>';
    } else {
        document.getElementById("result").innerHTML = '<h2 id="storedResultError">The stored and result password matrix DO NOT match!<h2>';
    }
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('addInput').onclick = addInputField;
    document.getElementById('removeInput').onclick = removeInputField;
    document.getElementById('clearInput').onclick = clearInput;
    document.getElementById('showInputMatrix').onclick = showInputMatrix;
    document.getElementById('calculateResult').onclick = calcOutputMatrix;
    document.getElementById('storeResult').onclick = storeResultMatrix;
    document.getElementById('compareResult').onclick = compareResult;

    addInputField(); // adds username field
    addInputField(); // adds the first password field
});
