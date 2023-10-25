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

function makeZeroMatrix(width, height) {
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
            switch (showInput) {
                case "showInput": // shows input
                    if (myMatrix[i][j] === 0) {
                        result += "<td>00</td>";
                    } else {
                        result += "<td>" + myMatrix[i][j].toString() + "</td>";
                    }
                    break;
                case "showHex": // hex output
                    result += "<td>" + myMatrix[i][j].toString(16).padStart(2, "0").toUpperCase() + "</td>";
                    break;
                default:
                    throw new Error("Unknown input or output type");
            }
        }
        result += "</tr>";
    }
    result += "</table>";
    return result;
}

function chunkString(inputString, chunkSize) {
    let result = [];
    let i = 0;

    while (i < inputString.length) {
        result.push(inputString.slice(i, (i += chunkSize)));
    }
    return result;
}

function safeCompare(a, b) {
    let strA = String(a);
    let strB = String(b);
    let lenA = strA.length;
    let result = 0;

    if (lenA !== strB.length) {
        result = 1;
    }
    for (let i = 0; i < lenA; i++) {
        result |= strA.charCodeAt(i) ^ strB.charCodeAt(i);
    }
    return result === 0;
}

function makePwIdentityMatrix(size) {
    let zeroMatrix = makeZeroMatrix(size, size);

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

function encodeInput(input) {
    // TextEncoder is safer than charCodeAt() for multibyte characters
    let encoder = new TextEncoder();
    let encoded = [];
    let preEncoded = encoder.encode(input);
    if (input.length === preEncoded.length) {
        encoded = preEncoded;
    } else {
        for (let i = 0; i < input.length; i++) {
            // sum multibyte characters bytes together
            encoded[i] = encoder.encode(input[i]).reduce((a, b) => a + b, 0);
        }
    }
    return encoded;
}

function insertWordEast(matrix, input, positions, inputOrResult) {
    let splitString = chunkString(input, 1);
    let down = positions[0],
        over = positions[1];
    let encoded = encodeInput(input);

    if (down < 0 || over < 0 || down > matrix.length - 1 || over + encoded.length > matrix.length) {
        alert("Cannot insert input into matrix, use a valid position to insert");
        console.log("Cannot insert input into matrix, use a valid position to insert");
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
    let encoded = encodeInput(input);

    if (down < 0 || over < 0 || down + encoded.length > matrix.length || over > matrix.length - 1) {
        alert("Cannot insert input into matrix, use a valid position to insert");
        console.log("Cannot insert input into matrix, use a valid position to insert");
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
    let newMat = makeZeroMatrix(8, 8);
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
    let size = inputMatrix.length;

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
        case "blake2b": // blake2b = data THEN hmac key
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
        case "sha_512":
            for (let i = 0; i < matrix.length; i++) { // hash each row
                hmac = new jsSHA("SHA-512", "TEXT", { hmacKey: { value: domainHash, format: "TEXT" } })
                    .update(extractHorizontalRow(matrix, i))
                    .getHash("HEX");
                insertHashHorizontal(hmac, matrix, i);
            }
            for (let j = 0; j < matrix.length; j++) { // hash each column
                hmac = new jsSHA("SHA-512", "TEXT", { hmacKey: { value: domainHash, format: "TEXT" } })
                    .update(extractVerticalColumn(matrix, j))
                    .getHash("HEX");
                insertHashVertical(hmac, matrix, j);
            }
            break;
        case "sha3_512":
            for (let i = 0; i < matrix.length; i++) { // hash each row
                hmac = new jsSHA("SHA3-512", "TEXT", { hmacKey: { value: domainHash, format: "TEXT" } })
                    .update(extractHorizontalRow(matrix, i))
                    .getHash("HEX");
                insertHashHorizontal(hmac, matrix, i);
            }
            for (let j = 0; j < matrix.length; j++) { // hash each column
                hmac = new jsSHA("SHA3-512", "TEXT", { hmacKey: { value: domainHash, format: "TEXT" } })
                    .update(extractVerticalColumn(matrix, j))
                    .getHash("HEX");
                insertHashVertical(hmac, matrix, j);
            }
            break;
    }
}

function mixMatrix(matrix) {
    // this is the mds (maximum distance seperable) matrix for the matrix multiply
    // default 8x8 mds matrix is from the photon hash function
    const photon256 = [
        [0x2, 0x4, 0x2, 0xb, 0x2, 0x8, 0x5, 0x6],
        [0xc, 0x9, 0x8, 0xd, 0x7, 0x7, 0x5, 0x2],
        [0x4, 0x4, 0xd, 0xd, 0x9, 0x4, 0xd, 0x9],
        [0x1, 0x6, 0x5, 0x1, 0xc, 0xd, 0xf, 0xe],
        [0xf, 0xc, 0x9, 0xd, 0xe, 0x5, 0xe, 0xd],
        [0x9, 0xe, 0x5, 0xf, 0x4, 0xc, 0x9, 0x6],
        [0xc, 0x2, 0x2, 0xa, 0x3, 0x1, 0x1, 0xe],
        [0xf, 0x1, 0xd, 0xa, 0x5, 0xa, 0x2, 0x3],
    ];
    // alternate aes based 8x8 mds matrix
    const aes8x8 = [
        [0x1, 0x3, 0x4, 0x5, 0x6, 0x8, 0xb, 0x7],
        [0x3, 0x1, 0x5, 0x4, 0x8, 0x6, 0x7, 0xb],
        [0x4, 0x5, 0x1, 0x3, 0xb, 0x7, 0x6, 0x8],
        [0x5, 0x4, 0x3, 0x1, 0x7, 0xb, 0x8, 0x6],
        [0x6, 0x8, 0xb, 0x7, 0x1, 0x3, 0x4, 0x5],
        [0x8, 0x6, 0x7, 0xb, 0x3, 0x1, 0x5, 0x4],
        [0xb, 0x7, 0x6, 0x8, 0x4, 0x5, 0x1, 0x3],
        [0x7, 0xb, 0x8, 0x6, 0x5, 0x4, 0x3, 0x1],
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
    let flattened = [];
    let hexResult = "";

    for (let i = 0; i < matrix.length; i++) {
        flattened = flattened.concat(matrix[i]);
    }

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
