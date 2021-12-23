import {assert} from 'chai';
import {Chance} from 'chance';
import {Buffer} from 'buffer';
import {
  default as EncodeTools,
  BinaryInputOutput,
  DEFAULT_ENCODE_TOOLS_OPTIONS
} from '../../EncodeToolsAuto';
const LZMA = require('lzma-native').LZMA;
import {
  CompressRunner, EncodeToolsAutoRunner,
  HashObjectRunner,
  HashRunner,
  HashStringRunner,
  randomBuffer,
  randomOptions, SerializeObjectRunner,
  ImageResizeRunner, ImageConvertRunner, ImageCropRunner, ImageBrightnessRunner
} from "../common/EncodeToolsAutoRunner";
import {ImageFormat} from "../../EncodeTools";
import {EncodeToolsNative} from "../../EncodeToolsNative";
import {ImageRunnerBase} from "@znetstar/encode-tools/lib/test/common/EncodeToolsRunner";
const crypto = require('crypto');

const sharp = require('sharp');


for (const [ name, $native ] of [ [ 'Native', true ] ]) {
  describe(`EncodeToolsAuto#${name}`, async function () {
    let chance = Chance();
    const native = $native as boolean;

    let tests: EncodeToolsAutoRunner<any, any, any, any>[] = [
      new CompressRunner(native),
      new ImageResizeRunner(native),
      new ImageCropRunner(native),
      new ImageConvertRunner(native),
      new ImageBrightnessRunner(native),
      new HashObjectRunner(native),
      new HashRunner(native),
      new HashStringRunner(native),
      new SerializeObjectRunner(native)
    ];
    for (let test of tests) {
      await test.testEncode();

      if (test.hasDecode) {
        await test.testDecode();
      }
    }

  });
}
