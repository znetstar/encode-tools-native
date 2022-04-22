# Encode Tools

[![npm version](https://badge.fury.io/js/@znetstar%2Fencode-tools-native.svg)](https://badge.fury.io/js/@znetstar%2Fencode-tools-native)

[![Build Status](https://travis-ci.com/znetstar/encode-tools.svg?branch=master)](https://travis-ci.com/znetstar/encode-tools)

This package aggregates different libraries for encoding, serializing, compressing, generating ids and hashing things, exposing a common interface. 

*Many* other packages serve the same purpose, but our objective is to ensure a consistent experience in both node.js and the browser and standardize the api so functions work the same way across different underlying libraries.

Encode Tools also has a command line wrapper [`encode-cli`](https://zb.gy/gh/encode-cli).

## Examples
Encoding a Buffer as base64url	

```javascript
  let enc = new EncodeTools();
  let buf = Buffer.from('hello world', 'utf8');
  let newBuf = enc.encodeBuffer(buf, BinaryEncoding.base64url);
  console.log(newBuf.toString('utf8'));
```

Hashing an object wth xxhash
```javascript
let enc = new EncodeTools();
let obj = { foo: 'bar' };
let newBuf = await enc.hashObject(obj, HashAlgorithm.xxhash64);
console.log(newBuf.toString('utf8'));
```

Serializing an object wth msgpack
```javascript
let enc = new EncodeTools();
let obj = { foo: 'bar' };
let newBuf = await enc.serializeObject(obj, SerializationFormat.msgpack);
console.log(newBuf.toString('base64'));
```

Generating a base64-encoded UUID v4
```javascript
let enc = new EncodeTools();
let newBuf = await enc.uniqueId(IDFormat.uuidv4);
console.log(newBuf.toString('base64'));
```


Compressing a buffer with lzma
```javascript
let enc = new EncodeTools();
let newBuf = await enc.compress(Buffer.from('hi', 'utf8'), CompressionFormat.lzma);
console.log(newBuf.toString('base64'));
```

Resizing a png image
```javascript
let enc = new EncodeTools();
let imageBuf = await (await new Promise((resolve, reject) => {
  new (Jimp)(500, 500, '#FFFFFF', (err: unknown, image: any) => {
    if (err) reject(err);
    else resolve(image);
  });
})).getBufferAsync('image/png');

let myResizedPng = await enc.resizeImage(imageBuf, { width: 250 }, ImageFormat.png);
```

## Structure

This project is divided into two packages, a core package with no native dependencies ([@znetstar/encode-tools](https://zb.gy/gh/encode-tools)), and a full version with native modules as optional dependencies ([@znetstar/encode-tools-native](https://zb.gy/gh/encode-tools-native)). The core package should work well in the browser via Webpack or Browserify, whereas the full version includes more formats and should have better performance.

## Algorithms

Below are a list of supported algorithms, their backing library, and their support in the browser.

### Binary Encoding

| Name             | Works In Browser? | Package                                              | Native Package                                   |
| ---------------- | ----------------- | ---------------------------------------------------- | ------------------------------------------------ |
| nodeBuffer       | ✓                 | [buffer](https://www.npmjs.com/package/buffer)       | [(built-in)](https://nodejs.org/api/buffer.html) |
| base64           | ✓                 | [buffer](https://www.npmjs.com/package/buffer)       | [(built-in)](https://nodejs.org/api/buffer.html) |
| base64url        | ✓                 | [buffer](https://www.npmjs.com/package/buffer)       | [(built-in)](https://nodejs.org/api/buffer.html) |
| hex              | ✓                 | [buffer](https://www.npmjs.com/package/buffer)       |                                                  |
| base32           | ✓                 | [base32.js](https://www.npmjs.com/package/base32.js) |                                                  |
| hashids          | ✓                 | [hashids](https://www.npmjs.com/package/hashids)     |                                                  |
| arrayBuffer      | ✓                 | (built-in)                                           |                                                  |
| base85 (ascii85) | ✓                 | [base85](https://www.npmjs.com/package/base85)       |                                                  |
| ascii85          | ✓                 | [base85](https://www.npmjs.com/package/base85)       |                                                  |

### Hashing
| Name          | Works In Browser? | Package                                              | Native Package                                             |
| ------------- | ----------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| crc32         | ✓                 | [hash-wasm](https://www.npmjs.com/package/hash-wasm) |                                                            |
| xxhash3       | ✓                 | [hash-wasm](https://www.npmjs.com/package/hash-wasm) | [xxhash-addon](https://www.npmjs.com/package/xxhash-addon) |
| xxhash64      | ✓                 | [hash-wasm](https://www.npmjs.com/package/hash-wasm) | [xxhash-addon](https://www.npmjs.com/package/xxhash-addon) |
| xxhash32      | ✓                 | [hash-wasm](https://www.npmjs.com/package/hash-wasm) | [xxhash-addon](https://www.npmjs.com/package/xxhash-addon) |
| md5           | ✓                 | [hash-wasm](https://www.npmjs.com/package/hash-wasm) | [(built-in)](https://nodejs.org/api/crypto.html)           |
| sha1          | ✓                 | [hash-wasm](https://www.npmjs.com/package/hash-wasm) | [(built-in)](https://nodejs.org/api/crypto.html)           |
| sha2 (sha512) | ✓                 | [hash-wasm](https://www.npmjs.com/package/hash-wasm) | [(built-in)](https://nodejs.org/api/crypto.html)           |
| sha512        | ✓                 | [hash-wasm](https://www.npmjs.com/package/hash-wasm) | [(built-in)](https://nodejs.org/api/crypto.html)           |
| sha3          | ✓                 | [hash-wasm](https://www.npmjs.com/package/hash-wasm) |                                                            |
| bcrypt        | ✓                 | [hash-wasm](https://www.npmjs.com/package/hash-wasm) |                                                            |

### ID Generation

| Name         | Works In Browser? | Package    | Native Package |
| ------------ | ----------------- | ---------- | -------------- |
| uuidv4       | ✓                 | uuid       |                |
| uuidv2       | ✓                 | uuid       |                |
| uuidv4string | ✓                 | uuid       |                |
| uuidv2string | ✓                 | uuid       |                |
| objectId     | ✓                 | bson       | bson-ext       |
| nanoid       | ✓                 | nanoid     |                |
| timestamp    | ✓                 | (built in) |                |

### Serialization

| Name    | Works In Browser? | Package          | Native Package |
|---------|-------------------|------------------|----------------|
| json    | ✓                 | (built in)       |                |
| cbor    | ✓                 | cbor-web         | cbor           |
| msgpack | ✓                 | @msgpack/msgpack |                |
| bson    | ✓                 | bson             | bson-ext       |
| json5   | ✓                 | json5            |                |

### Compression

| Name | Works In Browser? | Package    | Native Package |
| ---- | ----------------- | ---------- | -------------- |
| zstd | ✓                 | zstd-codec |                |
| lzma | ✓                 | lzma       | lzma-native    |

### Image Manipulation

| Name | Works In Browser? | Package | Native Package |
|------| ----------------- | ------- | -------------- |
| png  | ✓                 | jimp    | sharp          |
| jpeg | ✓                 | jimp    | sharp          |
| webp |                   | sharp   |                |
| avif |                   | sharp   |                |
| tiff |                   | sharp   |                |
| gif  |                   | sharp   |                |

## Requirements

Encode Tools runs in the browser and in node.js, with a few exceptions. The `bson-ext`, `lzma-native`, `xxhash-addon` and `cbor-extract` packages have native bindings, and so cannot run in the browser. For browser compatibility, the `EncodeTools` class uses the pure javascript `bson`, `lzma`, `hash-wsam`, and `cbor-x` packages, respectively,  to provide equivalent support albeit at the cost of performance. Additionally, `hash-wsam` lacks support for xxhash3.

The `EncodeToolsAuto` class will use the native packages `bson-ext`, `lzma-native` and `xxhash-addon` (and any future native packages). `bson-ext`, `lzma-native` and `xxhash-addon` are listed as optional dependencies, and NPM will attempt to install them automatically. 

The constructor of `EncodeToolsAuto` takes a second set of default `EncodingOptions` to use as a fallback if it cannot
find the needed module.

```javascript
const enc = new EncodeToolsAuto({ hashAlgorithm: HashAlgorithm.xxhash3 }, { hashAlgorithm: HashAlgorithm.xxhash64 });
if (enc.availableNativeModules.xxhashAddon)
    console.log('should be xxhash3', await enc.hashString('Test'));
else
    console.log('should be xxhash64', await enc.hashString('Test'));
```

## Usage

Please see the documentation located at https://znetstar.github.io/encode-tools/ and https://znetstar.github.io/encode-tools-native/ 

## Webpack

For issues with Webpack, try adding all the native dependencies to the `externals` section.

```javascript
{
  externals: {
      'xxhash-addon': 'commonjs xxhash-addon',
      'bson-ext': 'commonjs bson-ext',
      'shelljs': 'commonjs shelljs',
      'lzma-native': 'commonjs lzma-native',
      'sharp': 'commonjs sharp'
  },
  // For Webpack 5+ only, add `node-polyfill-webpack-plugin`
  plugins: [
    new (require('node-polyfill-webpack-plugin'))()
  ]
}
```

## Next.js

For Next.js, you can insert into `next.config.js`
```javascript
{
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false
      }
      config.externals = {
        ...config.externals,
        'xxhash-addon': 'commonjs xxhash-addon',
        'bson-ext': 'commonjs bson-ext',
        'shelljs': 'commonjs shelljs',
        'lzma-native': 'commonjs lzma-native',
        'sharp': 'commonjs sharp'
      }
      config.plugins = [
        ...config.plugins,
        new (require('node-polyfill-webpack-plugin'))()
      ]
    }
    return config;
  }
}
```

## Tests

Tests are written in Mocha, to run use `npm test`.

## Attribution

This project is a fork of [@etomon/encode-tools](https://github.com/EtomonUSA/encode-tools). 

## License

znetstar Encode Tools is licensed under the GNU LGPL-3.0, a copy of which can be found at [https://www.gnu.org/licenses/](https://www.gnu.org/licenses/).
