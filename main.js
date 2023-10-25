function addInputField() {
    let inputNumber = document.getElementById("userInputs").childNodes.length || 0;
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
            <label for="${inputNumber}Orientation">Direction:</label>
            <select class="input direction" id="${inputNumber}Orientation">
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
    let parent = document.getElementById("userInputs");

    if (parent.childNodes.length > 2) { // keeps at least username and one password input
        parent.removeChild(parent.lastChild);
    }
}

function clearInput() {
    let textInputs = document.getElementsByTagName("input");
    let selectInputs = document.getElementsByClassName("direction");

    for (let i = 0; i < textInputs.length; i++) {
        textInputs[i].value = "";
    }
    for (let i = 0; i < selectInputs.length; i++) {
        selectInputs[i].value = 1;
    }
}

function sanitizeInputPosition(positions) {
    // only returns two values, down and then over as a tuple(array)
    if (positions.length === 0) {
        positions = [0, 0];
    } else {
        positions = positions.split(",");
        positions[0] = parseInt(positions[0].replace(/\D/gi, ""), 10);
        positions[1] = parseInt(positions[1].replace(/\D/gi, ""), 10);
    }
    return [positions[0], positions[1]];
}

function getAndInsertInput(inputOrResult) {
    let initMatrix = makePwIdentityMatrix(64);
    let inputs = document.getElementsByClassName("inputs");

    for (let i = 0; i < inputs.length; i++) { // this part adds inputs on different lines unless a position is used
        let positions = sanitizeInputPosition(inputs[i].children[1].value.trim());
        if (safeCompare(positions, [0, 0])) {
            insertIntoMatrix(
                initMatrix, // matrix
                inputs[i].children[0].value.trim(), // input
                [positions[0] + i, positions[1]], // positions
                inputs[i].children[3].value, // direction
                inputOrResult // inputOrResult switch
            );
        } else {
            insertIntoMatrix(
                initMatrix, // matrix
                inputs[i].children[0].value.trim(), // input
                [positions[0], positions[1]], // positions
                inputs[i].children[3].value, // direction
                inputOrResult // inputOrResult switch
            );
        }
    }
    return initMatrix;
}

// calculates the hash of the domain to use as the HMAC key; plug in any 512-bit hash algorithm here
function calcHmacHash(hashAlgorithm, hmacKey) {
    let hmacHash = "";
    switch (hashAlgorithm) {
        case "blake2b":
            hmacHash = blake2bHex(String(hmacKey));
            break;
        case "sha_512":
            hmacHash = new jsSHA("SHA-512", "TEXT", { encoding: "UTF8" }).update(String(hmacKey)).getHash("HEX");
            break;
        case "sha3_512":
            hmacHash = new jsSHA("SHA3-512", "TEXT", { encoding: "UTF8" }).update(String(hmacKey)).getHash("HEX");
            break;
    }
    return hmacHash;
}

function getHostName(urlString) {
    var hostName = "";
    try {
        hostName = new URL(urlString).hostname.replace(/^www\./, "");
    } catch (err) {
        hostName = urlString;
    }
    return hostName;
}

function showInputMatrix() {
    let filledMatrix = getAndInsertInput("input");
    let hmacKey = getHostName(document.getElementById("domain").value.trim()); // key for the HMAC

    // insert results
    document.getElementById("hmacKey").innerHTML = `HMAC Key (Domain) = "${hmacKey || "None"}"`;
    document.getElementById("timeTaken").innerHTML = "";
    document.getElementById("result").innerHTML = makeHTMLtable(filledMatrix, "showInput"); // show input
}

function calcOutputMatrix() {
    let filledMatrix = getAndInsertInput("result");
    let hashAlgorithm = document.getElementById("selectAlgorithm").value;
    let hmacKey = getHostName(document.getElementById("domain").value.trim());
    let hmacHash = calcHmacHash(hashAlgorithm, hmacKey);

    // calculate the password matrix and time how long it takes
    let startTime = performance.now();
    calculatePassMatrix(filledMatrix, hashAlgorithm, hmacHash);
    let completionTime = parseInt(performance.now() - startTime, 10);

    // insert results
    document.getElementById("hmacKey").innerHTML = `HMAC Key (Domain) = hash("${hmacKey}")`;
    document.getElementById("timeTaken").innerHTML = `Time to calculate matrix = ${completionTime} milliseconds`;
    document.getElementById("result").innerHTML = makeHTMLtable(filledMatrix, "showHex"); // hex output
}

function storeResultMatrix() {
    let filledMatrix = getAndInsertInput("result");
    let hashAlgorithm = document.getElementById("selectAlgorithm").value;
    let hmacKey = getHostName(document.getElementById("domain").value.trim());
    let hmacHash = calcHmacHash(hashAlgorithm, hmacKey);

    calculatePassMatrix(filledMatrix, hashAlgorithm, hmacHash);

    localStorage.setItem("storedHexMatrix", flattenToHex(filledMatrix));
    document.getElementById("hmacKey").innerHTML = "";
    document.getElementById("timeTaken").innerHTML = "";
    document.getElementById("result").innerHTML = `<h2 id="storedResult">Stored the resulting password matrix for comparison<h2>`;
}

// compare matrix converted into hash values, 8192 characters long
function compareResult() {
    let filledMatrix = getAndInsertInput("result");
    let hashAlgorithm = document.getElementById("selectAlgorithm").value;
    let hmacKey = getHostName(document.getElementById("domain").value.trim());
    let hmacHash = calcHmacHash(hashAlgorithm, hmacKey);
    let storedHexMatrix = localStorage.getItem("storedHexMatrix") || "";

    let startTime = performance.now();
    calculatePassMatrix(filledMatrix, hashAlgorithm, hmacHash);
    let completionTime = parseInt(performance.now() - startTime, 10);

    document.getElementById("hmacKey").innerHTML = "";
    document.getElementById("timeTaken").innerHTML = `Time to calculate matrix = ${completionTime} milliseconds`;
    // uses hex string to compare
    let resultEl = document.getElementById("result");
    if (safeCompare(flattenToHex(filledMatrix), storedHexMatrix)) {
        resultEl.innerHTML = `<h2 id="storedResultMatched">The stored and result password matrix match!</h2>`;
    } else {
        resultEl.innerHTML = `<h2 id="storedResultError">The stored and result password matrix DO NOT match!<h2>`;
    }
    resultEl.innerHTML += `<div>The full length calculated password is:</div>`;
    resultEl.innerHTML += `<input class="shownPassword" value="${ flattenToHex(filledMatrix) }" /><br/><br/>`;
    resultEl.innerHTML += `<div>The full length stored password is:</div>`;
    resultEl.innerHTML += `<input class="shownPassword" value="${ localStorage.getItem("storedHexMatrix") || "" }" />`;
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addInput").addEventListener("click", addInputField);
    document.getElementById("removeInput").addEventListener("click", removeInputField);
    document.getElementById("clearInput").addEventListener("click", clearInput);
    document.getElementById("showInputMatrix").addEventListener("click", showInputMatrix);
    document.getElementById("calculateResult").addEventListener("click", calcOutputMatrix);
    document.getElementById("storeResult").addEventListener("click", storeResultMatrix);
    document.getElementById("compareResult").addEventListener("click", compareResult);
    document.body.addEventListener("keydown", (event) => {
        if (event.key === "Enter") { // calculate matrix when pressing Enter
            calcOutputMatrix();
        }
    });

    addInputField(); // adds username field
    addInputField(); // adds the first password field
});
