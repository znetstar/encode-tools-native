import {assert} from 'chai';
import {Chance} from 'chance';
import {Buffer} from 'buffer';
import EncodeToolsNative, {
  default as EncodeTools,
  BinaryInputOutput,
  DEFAULT_ENCODE_TOOLS_NATIVE_OPTIONS as DEFAULT_ENCODE_TOOLS_OPTIONS,
  ConvertableFormatMimeTypes, MimeTypesConvertableFormat, SerializationFormatMimeTypes,
  ImageFormat
} from '../../EncodeToolsNative';
const LZMA = require('lzma-native').LZMA;
import {
  CompressRunner, EncodeToolsNativeRunner,
  HashObjectRunner,
  HashRunner,
  HashStringRunner,
  randomBuffer,
  randomOptions, SerializeObjectRunner,
  ImageResizeRunner, ImageConvertRunner, ImageCropRunner, ImageBrightnessRunner
} from "../common/EncodeToolsNativeRunner";
import {ImageRunnerBase} from "@znetstar/encode-tools/lib/test/common/EncodeToolsRunner";
const crypto = require('crypto');

const sharp = require('sharp');


const toBuffer = require('typedarray-to-buffer');
const  Hashids = require('hashids/cjs');

const base32 = require('base32.js');

describe('MimeTypesConvertableFormat', async function  () {
  it('should have the same entries as SerializationFormatMimeTypes except the key and value reversed', async function () {
    assert.deepEqual(
      Array.from(MimeTypesConvertableFormat.entries()),
      Array.from(ConvertableFormatMimeTypes.entries())
        .map(([k,v]) => [v,k]),
    );
  });
});

describe('EncodeToolsNative', async function () {
  let chance = Chance();

  let tests: EncodeToolsNativeRunner<any, any, any, any>[] = [
    new HashObjectRunner(),
    new HashStringRunner(),
    new HashRunner(),
    new SerializeObjectRunner(),
    new CompressRunner(),
    new ImageResizeRunner(),
    new ImageCropRunner(),
    new ImageConvertRunner(),
    new ImageBrightnessRunner()
  ];

  describe('convertableFormatMimeTypes', async function () {
    const enc = new EncodeTools();
    it('should be the same as static map', async function () {
      assert.deepEqual(
        Array.from(enc.convertableFormatMimeTypes.entries()),
        Array.from(ConvertableFormatMimeTypes.entries())
      )
    });
  });

  describe('mimeTypesConvertableFormat', async function () {
    const enc = new EncodeTools();
    it('should be the same as static map', async function () {
      assert.deepEqual(
        Array.from(enc.mimeTypesConvertableFormat.entries()),
        Array.from(MimeTypesConvertableFormat.entries())
      )
    });
  });

  for (let xxhash of [ 'XXHash3', 'XXHash64', 'XXHash32' ]) {
    let xxhashLowercase = xxhash.toLowerCase();
    describe(xxhashLowercase, async function () {
      it('should return a valid '+xxhashLowercase, async function (){
        let buf = randomBuffer();

        const Hash = require('xxhash-addon')[xxhash];
        let hash = new Hash();
        let buf1 = hash.hash(buf);
        let buf2 = await (EncodeTools as any)[xxhashLowercase](buf);

        assert.deepEqual(buf2, buf1, 'Hashes were not the same');
      });
    });
  }

  function nativeHash(buffer: BinaryInputOutput, algo: string): Buffer {
    const hash = crypto.createHash(algo);
    hash.update(Buffer.from(buffer as any));
    return hash.digest();
  }

  for (let algo of [ 'sha1', 'sha512', 'md5' ]) {
    describe(algo, async function () {
      it('should return a valid '+algo, async function (){
        let buf = randomBuffer();

        let buf1 = nativeHash(buf, algo);
        let buf2 = await (EncodeTools as any)[algo](buf);

        assert.deepEqual(buf2, buf1, 'Hashes were not the same');
      });
    });
  }

  describe('compressLZMA', async function () {
    this.timeout(60e3);
    it('should compress buffer as lzma', async function () {
      let inBuf = randomBuffer();
      let lzma = new LZMA();
      let buf1 = await EncodeTools.compressLZMA(inBuf, chance.integer({ min: 1, max: 9 }))
      let buf2 = Buffer.from(await new Promise<Buffer>((resolve, reject) => {
        lzma.decompress(buf1, (result: any, error: any) => {
          if (error) reject(error);
          else resolve(result);
        });
      }));

      assert.isTrue(Buffer.isBuffer(buf2), 'LZMA did not return a buffer');
      assert.deepEqual(buf2, inBuf, 'Buffers are not the same');
    });
  });

  describe('decompressLZMA', async function () {
    this.timeout(60e3);
    it('should compress buffer as lzma', async function () {
      let inBuf = randomBuffer();
      let lzma = new LZMA();
      let buf1 = Buffer.from(await new Promise<Buffer>((resolve, reject) => {
        lzma.compress(inBuf, chance.integer({ min: 1, max: 9 }),(result: any, error: any) => {
          if (error) reject(error);
          else resolve(result);
        });
      }));

      let buf2 = await EncodeTools.decompressLZMA(buf1);

      assert.isTrue(Buffer.isBuffer(buf2), 'LZMA did not return a buffer');
      assert.deepEqual(buf2, inBuf, 'Buffers are not the same');
    });
  });


  describe('get WithDefaults', async function () {
    it('encode tools options should have the default options', async function () {
      let enc = EncodeTools.WithDefaults;
      assert.deepEqual(enc.options, DEFAULT_ENCODE_TOOLS_OPTIONS, 'Options are not the default options');
    });
  });
  describe('create', async function () {
    it('encode tools options should have the random options', async function () {
      let opts = randomOptions();
      let enc = new EncodeTools(opts);
      assert.deepEqual(enc.options, opts, 'Options are not the default options');
    });
  });

  describe('getImageMetadata', async function () {
    it('create an image an get the metadata for that image', async function () {
      let dims = {
        width: chance.integer({ min: 1, max: 1e3}),
        height: chance.integer({ min: 1, max: 1e3}),
        format: chance.shuffle([ ImageFormat.png, ImageFormat.jpeg ])[0]
      }

      let image: Buffer = await sharp({
        create: {
          width: dims.width,
          height: dims.height,
          channels: 3,
          background: '#'+ImageRunnerBase.getRandomColor()
        }
      })[dims.format]().toBuffer();

      let obj2 = await EncodeToolsNative.getImageMetadata(image);

      assert.deepEqual(obj2, dims, 'Image metadata is not the same as the image that was create');
    });
  });


  for (let test of tests) {
    await test.testEncode();

    if (test.hasDecode) {
      await test.testDecode();
    }
  }

});
