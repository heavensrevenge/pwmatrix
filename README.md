# Password Matrix (2D Passwords)

![Simple Password Matrix](/Example-picture-intro.png "Just a Simple Password Matrix")

## High-level Explanation

1. Insert user input like username & passwords into a matrix
2. Hash each row and then each column keyed on the hash of the domain
3. Do a matrix multiply through the entire matrix with an MDS matrix such as Photon256 or 8x8 based AES to mix data to diffuse bits
4. Hash each row and column one last time to hide the matrix multiply
5. Serialize/Flatten resulting matrix for storage and comparison

---

## Introduction

This is a natural evolution of passwords, which simply brings a one-dimensional password (a line of characters) into 2 dimensions (width and height), which is also known as a matrix, aka an array of arrays. This method of construction, I believe, is the correct way of using a password "phrase" by having a memorable yet complex password.

Technically, a 3-dimensional password is also possible, but I didn't care to go that far yet since it is far more complex to understand and thus get adopted.

Instead of simple 16x8 or 24x24 two-dimensional password matrices which are possible too, I go all-out and use a full 64x64 (zero based indexing) to house the entirety of a 512-bit cryptographic hash function result on both the vertical and horizontal direction to make a unique matrix/bit-map which is both strong and reproducible.

![Example Password Matrix](/Example-picture-implementation.png "Example Implementation")

---

## Complexity

This example implementation is a 64x64 matrix with 8 bits (two hex characters) per cell.  This means it is an 8 bits x 64 length x 64 width matrix result which is 32,768 bits in total.  2 to the power of 32,768 bits, 2n ** 32768n (BigNum Exponential JavaScript), is a number 9,865 digits long (bring it on quantum).

---

## Initial concepts

### 1. Cryptographic Hash (checksum) functions

* Is a unique digest (value) of a unique amount of data
* It is asymmetric (it cannot be easily or efficiently reversed)
* The longer the better (more entropy and harder to brute-force)
* 512-bit hashes/checksums are extremely strong and among the strongest that exist today

### 2. Matrix multiply

* A matrix multiply changes all values in the matrix as long as it isn't an identity matrix or a matrix full of 0's
* MDS Matrix = Maximum Distance Separable matrix; An MDS matrix maximizes bit mixing/diffusion with the matrix that it is multiplied with
* The MDS matrix multiply is mainly only for mixing/diffusing bits both horizontally and vertically in the matrix

---

## Construction

The initial implementation uses a 64 x 64 matrix because 512-bits/64-bits = 8 bits which are 2 hex characters together for representation per "cell" or location in the matrix.

The matrix isn't required to be 64 x 64 but it helps initial implementation and concept explanation.

The 64 x 64 matrix was initially an identity matrix which have 1's along a matrix' diagonal which also has the property of being easily reversible. For bit diffusion (different hash results), I changed from an identity matrix to have successive numbers along the diagonal which also helps custom input placement indexed 0-63 which you can see while trying this implementation.

The users’ input is inserted into the matrix starting from [0, 0] aka top left and successively use new rows down for each new input value/password unless specifically defined by the user of the position on which to insert data into the matrix before computation

An example input position is [amount down, amount over to the right] or [3, 8] or 3, 8 without brackets which means insert input 3 positions down and 8 over to the right.

The direction is how individual inputs get inserted into the matrix.
I have only implemented two directions for the time being since I want to keep it simple for understanding, which is horizontally left to right (East), and vertically up to down (South).
Alternative or future implementations can use all or any of the 8 directions such as languages which have words that go from right to left.

The "Show Input Matrix" button is the best way to see the initial state of the matrix before computation.

---

## Execution

### 1. Domain/HMAC key

The domain/key, if supplied, is the key for the HMAC of everything that follows.
If there is no domain key supplied then the hashes for each row and column are keyed using the resulting hash algorithm result of an empty string.

The domain is hashed to a 512-bit value since the larger the key, the better, versus just XOR padding the key with 0x36363636 and 0x5C5C5C5C even though they are tried and true. This is the only place where a non-HMAC version of the users selected hash function is used, all following hashes are now keyed HMAC hashes.

So, each domain/key will have its own large 512-bit hash value which is used to key the HMAC hash functions which process the entire rest of the matrix.  This keying of the function on a domain makes sure any user's username and password are not similar to any other domain's result making a breach unable to compromise another domain's result.

### 2. Hashing the Matrix

Processing the matrix starts with one row at a time, hashing it to a new 512-bit value based on the domain as a key, and inserts the resulting hash back into the row that it hashed, replacing input data in the row.

Each row is read/extracted, HMAC hashed using the domain/key and inserted back into the matrix until each row is processed.

Each column is also read/extracted, HMAC hashed using the domain/key and inserted back vertically into the matrix like each row.

**A key concept here: inputs (passwords) are usually horizontal (one dimensional) and are generally a single input (word) per row, which is why hashing each row will give a completely different hash for each row of the matrix. This then influences how each column will be unique because the row hashes used as input are directly influential for the vertical hash computations. This begins an avalanche effect for the entire resulting matrix.**

I have included three initial 512-bit hash functions for preference, flexibility and comparison and as an example on how to add future algorithms.

1. Blake2b: New yet strong + fast hashes (this is my recent favourite hash even though Blake3 is now out, but time has not yet given Blake3 time to prove its strength, SipHash isn't big enough for my liking but is also one of my favourites).
2. SHA-512: Tried and true and so far, unbroken for many years, it is a bit slower in software but some systems have hardware/accelerated/integrated/pre-existing implementations that can be used for this algorithm.
3. SHA3-512: New and future proof algorithm, is the slowest algorithm of the bunch.

Other implementations can use any size hash and matrix so long as both of their sizes match and the hash function can be used as a keyed HMAC.

### 3. Matrix Multiply/Bit Mixing

The last critical concept is how to mix the data of the resulting hashes in a way that mixes both rows and columns, which **is** a matrix multiply. I won't describe how matrix multiplication works here; you can research how it is done yourself.

The matrix multiply uses an MDS matrix to allow maximum bit diffusion/bit mixing within the matrix after the first step of row and column matrix-wide hashes to be sure that any result here can never be reversed. I use the 8x8 Photon256 MDS matrix for the matrix multiply but in theory, any MDS matrix would work, so long as it fits within the resulting size of the matrix and the whole password matrix is effectively chunked up for processing.

Values in cells get changed back into 2 hex characters per cell during the final hashing stage for storage and comparison (16-bits of JS TypedArray size per cell for this computation stage should be enough even though this implementation is as generic as possible and doesn't use JavaScript typed arrays).

I do all math (matrix multiplies) in decimal instead of hex, even though I display all results in hex values for comfort.

### 4. Final Matrix Hash

The final step after mixing the bits of both rows and columns from the MDS matrix multiply is to hash each row and column one last time.  Just like in step #2, this is to hide any possible reversal of the matrix wide multiply using the selected asymmetric cryptographic hash function that the user selected to use, all of which are still keyed on the domain/key.

The result of this final matrix hash is the actual final result, without conversion for storage or comparison, I envisioned; and is still a two-dimensional bit-map password.

### 5. Storage and Comparison

The resulting 2D matrix is flattened from two dimensions (an array of arrays) to one dimension (single line/array depth of one) for both comparison and storage.

The resulting flat/one dimensional array is converted into 2 hex values per cell from their original decimal values in the matrix for recognizability and storage space which turns out to be 8,192 characters long.

The resulting matrix can be hashed into a 256 or 512-bit hash value or used in a key derivation function to reduce storage space in databases and is a common practice.  Reducing length also reduces strength significantly, since length is the largest factor for strength.  Ultimately, I prefer the entire 64x64 matrix flattened/serialized into one big 8,192 hex character long representation for true future proof strength to be used if possible and if not too resource intensive.  Databases, password managers or adoption may suffer if the matrix is in it's true 8,192 character long form but hopefully not.

The comparison I use is a constant time comparison algorithm to mitigate timing attacks.

---

## Some example representations of input or internal state can be:

``` javascript
let inputObject = {
    hmacKey: "hi.com", // domain to key the hmac hashes, special input value to key everything else
    // input#: [input (usually username but not always), position[y down, x over], insertion direction]
    1: {input: "userName", position: [1, 0], direction: 1},
    // input#: [input (usually the first password), position[y down, x over], insertion direction]
    2: {input: "hello", position: [2, 0], direction: 1},
    // any additional inputs, same format as previous normal inputs
    3: {input: "world", position: [3, 0], direction: 3}
}

// example string input format to use as input for password matrix generation in alternate implementations
let inputString1 = '{"hmacKey":"hi.com","1":["userName",[1,0],1],"2":["hello",[2,0],1],"3":["world",[3,0],3]}';
// or
let inputString2 = '{"hmacKey":"hi.com","1":{"input":"userName","position":[1,0],"direction":1},"2":{"input":"hello","position":[2,0],"direction":1},"3":{"input":"world","position":[3,0],"direction":3}}'
```

I probably should have started with these representations, but I wanted to try and stay as stateless as possible.  The only state needed is the domain key and the matrix itself, which I just pass to the next step vs keeping them around when not in use.
