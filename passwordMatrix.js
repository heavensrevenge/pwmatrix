function matrixMultiply(first, second) {
    let newMatrix = [];
    for (let row = 0; row < first.length; row++) {
        newMatrix[row] = [];
        for (let column = 0; column < second[0].length; column++) {
            let sum = 0;
            for (let index = 0; index < first[0].length; index++) {
                sum += first[row][index] * second[index][column];
            }
            newMatrix[row][column] = sum;
        }
    }
    return newMatrix;
}

function makeMatrix(width, height) {
    let matrix = [];
    for (let x = 0; x < height; x++) {
        matrix[x] = [];
        for (let y = 0; y < width; y++) {
            matrix[x][y] = 0;
        }
    }
    return matrix;
}

function makeHTMLtable(myMatrix, showInput) {
    let result = "<table border=1>";
    for (let i = 0; i < myMatrix.length; i++) {
        result += "<tr>";
        for (let j = 0; j < myMatrix[i].length; j++) {
            // type of resulting output
            if (showInput === 1) { // shows input text
                if (myMatrix[i][j] === 0) {
                    result += "<td>" + myMatrix[i][j].toString().padStart(2, "0") + "</td>";
                } else {
                    result += "<td>" + myMatrix[i][j].toString() + "</td>";
                }
            } else { // shows hex output
                result += "<td>" + myMatrix[i][j].toString(16).padStart(2, "0").toUpperCase() + "</td>";
            }
        }
        result += "</tr>";
    }
    result += "</table>";
    return result;
}

function chunkString(inputString, chunkSize) {
    let size = Math.ceil(inputString.length / chunkSize);
    let arr = Array(size);
    let offset = 0;

    for (let i = 0; i < size; i++) {
        arr[i] = inputString.substr(offset, chunkSize);
        offset += chunkSize;
    }
    return arr;
}

function isArrayEqual(a, b) {
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

function makePwIdentityMatrix(size) {
    let zeroMatrix = makeMatrix(size, size);

    // initially used an identity matrix (1's on the diagonal) but this allows better bit diffusion
    for (let i = 0; i < zeroMatrix.length; i++) {
        zeroMatrix[i][i] = i;
    }
    return zeroMatrix;
}

function insertHashHorizontal(hash, matrix, position) {
    let chunks = chunkString(hash, 2);

    // the chunks length must be the same length of the row
    for (let i = 0; i < chunks.length; i++) {
        matrix[position][i] = parseInt(chunks[i], 16); // insert decimal
    }
}

function insertHashVertical(hash, matrix, position) {
    let chunks = chunkString(hash, 2);

    // the chunks length must be the same length of the column
    for (let i = 0; i < chunks.length; i++) {
        matrix[i][position] = parseInt(chunks[i], 16); // insert decimal
    }
}

function insertWordEast(matrix, input, positions, inputOrResult) {
    let splitString = chunkString(input, 1);
    let down = positions[0],
        over = positions[1];
    // TextEncoder is safer than charCodeAt() for multibyte characters, similar to unescape(encodeURI(input))
    let encoded = new TextEncoder().encode(input);

    if (down < 0 || over < 0 || down > matrix.length - 1 || over + encoded.length > matrix.length) {
        alert("Cannot insert input into matrix, use a valid position to insert");
        throw new Error("Cannot insert input into matrix, use a valid position to insert");
    } else {
        if (inputOrResult === "input") {
            for (let i = 0; i < splitString.length; i++) {
                matrix[down][over + i] = splitString[i];
            }
        }
        if (inputOrResult === "result") {
            for (let i = 0; i < encoded.length; i++) {
                matrix[down][over + i] = encoded[i];
            }
        }
    }
}

function insertWordSouth(matrix, input, positions, inputOrResult) {
    let splitString = chunkString(input, 1);
    let down = positions[0],
        over = positions[1];
    // TextEncoder is safer than charCodeAt() for multibyte characters, similar to unescape(encodeURI(string))
    let encoded = new TextEncoder().encode(input);

    if (down < 0 || over < 0 || down + encoded.length > matrix.length || over > matrix.length - 1) {
        alert("Cannot insert input into matrix, use a valid position to insert");
        throw new Error("Cannot insert input into matrix, use a valid position to insert");
    } else {
        if (inputOrResult === "input") {
            for (let i = 0; i < splitString.length; i++) {
                matrix[down + i][over] = splitString[i];
            }
        }
        if (inputOrResult === "result") {
            for (let i = 0; i < encoded.length; i++) {
                matrix[down + i][over] = encoded[i];
            }
        }
    }
}

function extractSubMatrix(matrix, down, over) {
    let newMat = makeMatrix(8, 8);
    let size = 8;

    for (let i = 0; i < size; i++) {
        newMat[i] = [matrix[down + i][over]];
        for (let j = 0; j < size; j++) {
            newMat[i][j] = matrix[down + i][over + j];
        }
    }
    return newMat;
}

// insertSubMatrix is destructive/in-place non-copying modify
function insertSubMatrix(inputMatrix, destinationMatrix, down, over) {
    let size = 8;

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            destinationMatrix[down + i][over + j] = inputMatrix[i][j];
        }
    }
}

function extractHorizontalRow(matrix, row) {
    return matrix[row].join("");
}

function extractVerticalColumn(matrix, column) {
    let vertical = [];

    for (let i = 0; i < matrix.length; i++) {
        vertical[i] = matrix[i][column];
    }
    return vertical.join("");
}

// blake2b code wanted a <= 64 byte typed array for its key
function hashToTypedArray(hash, length) {
    let typedArray = new Uint8Array(length);
    let chunkedHash = chunkString(hash, hash.length / length);

    for (let i = 0; i < chunkedHash.length; i++) {
        typedArray[i] = parseInt(chunkedHash[i], 16);
    }
    return typedArray;
}

function hashWholeMatrix(matrix, hashAlgorithm, domainHash) {
    // plug in any 512-bit hash algorithm here
    // hashes each row then each column and inserts for next step
    let hmac = "";
    switch (hashAlgorithm) {
        case "blake2b":
            let typedArrayKey = hashToTypedArray(domainHash, 64);
            for (let i = 0; i < matrix.length; i++) { // hash each row
                hmac = blake2bHex(extractHorizontalRow(matrix, i), typedArrayKey);
                insertHashHorizontal(hmac, matrix, i);
            }
            for (let j = 0; j < matrix.length; j++) { // hash each column
                hmac = blake2bHex(extractVerticalColumn(matrix, j), typedArrayKey);
                insertHashVertical(hmac, matrix, j);
            }
            break;
        case "sha512":
            for (let i = 0; i < matrix.length; i++) { // hash each row
                hmac = hex_hmac_sha512(extractHorizontalRow(matrix, i), domainHash);
                insertHashHorizontal(hmac, matrix, i);
            }
            for (let j = 0; j < matrix.length; j++) { // hash each column
                hmac = hex_hmac_sha512(extractVerticalColumn(matrix, j), domainHash);
                insertHashVertical(hmac, matrix, j);
            }
            break;
    }
}

function mixMatrix(matrix) {
    // this is the mds (maximum distance seperable) matrix for the matrix multiply
    // default 8x8 mds matrix is from the photon hash function
    let photon256 = [
        [02, 04, 02, 11, 02, 08, 05, 06],
        [12, 09, 08, 13, 07, 07, 05, 02],
        [04, 04, 13, 13, 09, 04, 13, 09],
        [01, 06, 05, 01, 12, 13, 15, 14],
        [15, 12, 09, 13, 14, 05, 14, 13],
        [09, 14, 05, 15, 04, 12, 09, 06],
        [12, 02, 02, 10, 03, 01, 01, 14],
        [15, 01, 13, 10, 05, 10, 02, 03]
    ];

    let oldMatrix = [],
        newMatrix = [];

    for (let i = 0; i < matrix.length; i += 8) {
        for (let j = 0; j < matrix.length; j += 8) {
            oldMatrix = extractSubMatrix(matrix, i, j);
            newMatrix = matrixMultiply(photon256, oldMatrix);
            insertSubMatrix(newMatrix, matrix, i, j);
        }
    }
}

function insertIntoMatrix(matrix, input, positions, direction, inputOrResult) {
    if (input.length !== 0) {
        switch (direction) { // these directions of input are like directions on a compass
            case "1": // this is the default input direction, left to right horizontally
                insertWordEast(matrix, input, positions, inputOrResult);
                break;
            case "2":
                // insertWordSouthEast(matrix, input, positions, inputOrResult);
                break;
            case "3": // this is down vertically
                insertWordSouth(matrix, input, positions, inputOrResult);
                break;
            case "4":
                // insertWordSouthWest(matrix, input, positions, inputOrResult);
                break;
            case "5": // this is backwards, right to left horizontally
                // insertWordWest(matrix, input, positions, inputOrResult);
                break;
            case "6":
                // insertWordNorthWest(matrix, input, positions, inputOrResult);
                break;
            case "7": // this is up vertically
                // insertWordNorth(matrix, input, positions, inputOrResult);
                break;
            case "8":
                // insertWordNorthEast(matrix, input, positions, inputOrResult);
                break;
        }
    }
}

function flattenToHex(matrix) {
    let flattened = matrix.flat();
    let hexResult = "";

    for (let i = 0; i < flattened.length; i++) {
        hexResult += flattened[i].toString(16).padStart(2, "0").toUpperCase();
    }
    return hexResult;
}

function calculatePassMatrix(matrix, hashAlgorithm, domainHash) {
    // high level operations here
    hashWholeMatrix(matrix, hashAlgorithm, domainHash);
    mixMatrix(matrix);
    hashWholeMatrix(matrix, hashAlgorithm, domainHash);
}
