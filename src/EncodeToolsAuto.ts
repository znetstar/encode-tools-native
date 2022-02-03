import * as Regular from "./EncodeTools";
import EncodeTools, {
  ConvertableFormat,
  ConvertableFormatMimeTypes,
  DEFAULT_ENCODE_TOOLS_OPTIONS,
  EncodingOptions, MimeTypesConvertableFormat
} from "./EncodeTools";
import * as Native from "./EncodeToolsNative";
import EncodeToolsRegular, {
  BinaryEncoding,
  BinaryInputOutput,
  CompressionFormat,
  EncodeToolsFormat,
  EncodeToolsFunction,
  HashAlgorithm,
  IDFormat,
  ImageFormat,
  InvalidFormat,
  SerializationFormat,
  SerializationFormatMimeTypes
} from "./EncodeTools";
import {Buffer} from "buffer";
import {
  ExtractedContentType, ExtractedImageFormatContentType,
  ExtractedSerializationFormatContentType,
  HTTPRequestWithHeader,
  IEncodeTools,
  CropDims
} from "./IEncodeTools";
import {ConfiguredEncodingOptions} from "@znetstar/encode-tools/lib/IEncodeTools";

export {
  BinaryEncoding
  ,
  BinaryInputOutput,
  EncodingOptions as BaseEncodingOptions,
  InvalidFormat,
  IDFormat,
  EncodingOptions,
  SerializationFormat,
  CompressionFormat,
  EncodeToolsFormat,
  ImageFormat,
  EncodeToolsFunction,
  HashAlgorithm,
  SerializationFormatMimeTypes,
  DEFAULT_ENCODE_TOOLS_OPTIONS
} from './EncodeTools';

/**
 * Contains boolean values to identify which native modules are currently available
 */
export interface AvailableNativeModules {
  lzmaNative: boolean;
  sharp: boolean;
  bsonExt: boolean;
  xxhashAddon: boolean;
  cborExtract: boolean;
  crypto: boolean;
}

/**
 * Contains tools for encoding/decoding data in different circumstances.
 *
 * Will automatically use native modules (via `EncodeToolsNative`) if they are installed.
 */
export class EncodeToolsAuto implements IEncodeTools {
  /**
   * Lists all native modules that can currently be used
   */
  public get availableNativeModules(): AvailableNativeModules {
    return {
      lzmaNative: !!EncodeTools.safeLoadModule('lzma-native'),
      sharp: !!EncodeTools.safeLoadModule('sharp'),
      bsonExt: !!EncodeTools.safeLoadModule('bson-ext'),
      xxhashAddon: !!EncodeTools.safeLoadModule('xxhash-addon'),
      cborExtract: !!EncodeTools.safeLoadModule('cbor-extract'),
      crypto: !!EncodeTools.safeLoadModule('crypto')
    }
  }

  protected regular: EncodeTools;
  protected native: Native.EncodeToolsNative;
  public options: ConfiguredEncodingOptions;


  public get toPojoInstance() { return this.regular.toPojoInstance; }

  protected  nativeOptions: Native.ConfiguredEncodingOptions;
  protected  fallbackOptions: Regular.ConfiguredEncodingOptions;
  /**
   *
   * @param nativeOptions Options for the `EncodeToolsNative` constructor that will be used if the corresponding native module is available
   * @param fallbackOptions A set of fallback options to be used if the native module needed for the option in the first argument is missing
   *
   * @example
   * const enc = new EncodeToolsAuto({ hashAlgorithm: HashAlgorithm.xxhash3 }, { hashAlgorithm: HashAlgorithm.xxhash64 });
   */
  constructor(nativeOptions?: Native.EncodingOptions, fallbackOptions?: Regular.EncodingOptions) {
    this.nativeOptions = {
      ...nativeOptions,
      ...Native.DEFAULT_ENCODE_TOOLS_NATIVE_OPTIONS
    };
    this.fallbackOptions = {
      ...fallbackOptions,
      ...Regular.DEFAULT_ENCODE_TOOLS_OPTIONS
    };

    this.options = {
      ...this.nativeOptions
    };
    if (this.options.hashAlgorithm === HashAlgorithm.xxhash3 && !(this.availableNativeModules.xxhashAddon)) {
      this.options.hashAlgorithm = fallbackOptions.hashAlgorithm;
    }

    this.regular = new EncodeTools(fallbackOptions);
    this.native = new Native.EncodeToolsNative(this.options);

    if ([
      Native.ImageFormat.gif,
      Native.ImageFormat.webp,
      Native.ImageFormat.tiff,
      Native.ImageFormat.avif,
    ].includes(this.options.imageFormat) && !this.availableNativeModules.sharp) {
      this.options.imageFormat = fallbackOptions.imageFormat;
    }
  }


  /**
   * Combined map of all `SerializationFormat` and `ImageFormat` entries to their respective MIME Types
   */
  public get convertableFormatMimeTypes()  {
    return this.availableNativeModules.sharp ? this.native.convertableFormatMimeTypes : this.regular.convertableFormatMimeTypes;
  }
  /**
   * Map of MIME Type to each `ImageFormat` or `SerializationFormat`.
   */
  public get mimeTypesConvertableFormat()  {
    return (this.availableNativeModules.bsonExt && this.availableNativeModules.cborExtract) ? this.native.mimeTypesConvertableFormat : this.regular.mimeTypesConvertableFormat;
  }

  public headerToConvertableFormat(req: HTTPRequestWithHeader, key: string, defaultValue?: ConvertableFormat): ExtractedContentType<ConvertableFormat> {
    return this.regular.headerToConvertableFormat(req, key, defaultValue);
  }

  public headerToSerializationFormat(req: HTTPRequestWithHeader, key: string): ExtractedSerializationFormatContentType {
    return this.regular.headerToSerializationFormat(req, key);
  }

  public headerToImageFormat(req: HTTPRequestWithHeader, key: string): ExtractedImageFormatContentType {
    return this.regular.headerToImageFormat(req, key);
  }

  /**
   * Adjust brightness of image
   * @param buffer - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  public async adjustImageBrightness(buffer: Buffer|ArrayBuffer, factor: number, format?: ImageFormat.png): Promise<Buffer>;
  /**
   * Adjust brightness of image
   * @param buffer - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  public async adjustImageBrightness(buffer: Buffer|ArrayBuffer, factor: number, format?: ImageFormat.jpeg): Promise<Buffer>;
  /**
   * Adjust brightness of image
   * @param buffer - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  public async adjustImageBrightness(buffer: BinaryInputOutput, factor: number, format?: ImageFormat): Promise<Buffer>;
  /**
   * Adjust brightness of image
   * @param data - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  public async adjustImageBrightness(data: BinaryInputOutput, factor: number, format: ImageFormat): Promise<Buffer> {
      if (this.availableNativeModules.sharp) {
        return this.native.adjustImageBrightness(data, factor, format);
      } else {
        return this.regular.adjustImageBrightness(data, factor ,format);
      }
  }

  /**
   * Saves an image in the provided format, performing no operations on the image
   * @param buffer - Image
   * @param format - Format to save result as
   */
  public async convertImage(buffer: Buffer|ArrayBuffer, format?: ImageFormat.png): Promise<Buffer>;
  /**
   * Saves an image in the provided format, performing no operations on the image
   * @param buffer - Image
   * @param format - Format to save result as
   */
  public async convertImage(buffer: Buffer|ArrayBuffer, format?: ImageFormat.jpeg): Promise<Buffer>;
  /**
   * Saves an image in the provided format, performing no operations on the image
   * @param data - Image
   * @param format - Format to save result as
   */
  public async convertImage(data: BinaryInputOutput, format?: ImageFormat): Promise<Buffer>;
  /**
   * Saves an image in the provided format, performing no operations on the image
   * @param data - Image
   * @param format - Format to save result as
   */
  public async convertImage(data: BinaryInputOutput, format: ImageFormat = this.options.imageFormat): Promise<Buffer> {
    if (this.availableNativeModules.sharp) {
      return this.native.convertImage(data, format);
    } else {
      return this.regular.convertImage(data, format);
    }
  }

  /**
   * Resizes an image and returns a Buffer containing the result in the provided format
   * @param buffer - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  public async resizeImage(buffer: Buffer|ArrayBuffer, dims: { height: number, width?: number }|{ height?: number, width: number }, format?: ImageFormat.png): Promise<Buffer>;
  /**
   * Resizes an image and returns a Buffer containing the result in the provided format
   * @param buffer - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  public async resizeImage(buffer: Buffer|ArrayBuffer, dims: { height: number, width?: number }|{ height?: number, width: number }, format?: ImageFormat.jpeg): Promise<Buffer>;
  /**
   * Resizes an image and returns a Buffer containing the result in the provided format
   * @param data - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  public async resizeImage(data: BinaryInputOutput, dims: { height: number, width?: number }|{ height?: number, width: number }, format?: ImageFormat): Promise<Buffer>;
  /**
   * Resizes an image and returns a Buffer containing the result in the provided format
   * @param data - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  public async resizeImage(data: BinaryInputOutput, dims: { height: number, width?: number }|{ height?: number, width: number }, format: ImageFormat = this.options.imageFormat): Promise<Buffer> {
    if (this.availableNativeModules.sharp) {
      return this.native.resizeImage(data, dims, format);
    } else {
      return this.regular.resizeImage(data,  dims, format);
    }
  }

  /**
   * Crops an image and returns a Buffer containing the result in the provided format
   * @param buffer - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  public async cropImage(buffer: Buffer|ArrayBuffer, dims: CropDims, format?: ImageFormat.png): Promise<Buffer>;
  /**
   * Crops an image and returns a Buffer containing the result in the provided format
   * @param buffer - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  public async cropImage(buffer: Buffer|ArrayBuffer, dims: CropDims, format?: ImageFormat.jpeg): Promise<Buffer>;
  /**
   * Crops an image and returns a Buffer containing the result in the provided format
   * @param data - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  public async cropImage(data: BinaryInputOutput, dims: CropDims, format?: ImageFormat): Promise<Buffer>;
  /**
   * Crops an image and returns a Buffer containing the result in the provided format
   * @param data - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  public async cropImage(data: BinaryInputOutput, dims: CropDims, format: ImageFormat = this.options.imageFormat): Promise<Buffer> {
    if (this.availableNativeModules.sharp) {
      return this.native.cropImage(data, dims, format);
    } else {
      return this.regular.cropImage(data,  dims, format);
    }
  }

  /**
   * Hashes data using the provided algorithm, returning a node.js Buffer.
   *
   * @param buffer
   * @param algorithm
   */
  public async hash(buffer: BinaryInputOutput, algorithm: HashAlgorithm = this.options.hashAlgorithm, ...args: any[]): Promise<Buffer> {
    if ((this.availableNativeModules.xxhashAddon && algorithm === HashAlgorithm.xxhash3) || (this.availableNativeModules.crypto && [
      HashAlgorithm.sha2,
      HashAlgorithm.md5,
      HashAlgorithm.sha512,
      HashAlgorithm.sha1,
      HashAlgorithm.md5
    ].includes(algorithm))) {
      return this.native.hash(buffer, algorithm, ...args);
    } else {
      return this.regular.hash(buffer, algorithm, ...args);
    }
  }

  /**
   * Hashes data using the provided algorithm, returning a node.js Buffer.
   *
   * @param buffer
   * @param algorithm
   */
  public async hashString(buffer: BinaryInputOutput, algorithm: HashAlgorithm = this.options.hashAlgorithm, ...args: any[]): Promise<string> {
    if ((this.availableNativeModules.xxhashAddon && algorithm === HashAlgorithm.xxhash3) || (this.availableNativeModules.crypto && [
      HashAlgorithm.sha2,
      HashAlgorithm.md5,
      HashAlgorithm.sha512,
      HashAlgorithm.sha1,
      HashAlgorithm.md5
    ].includes(algorithm))) {
      return this.native.hashString(buffer, algorithm, ...args);
    } else {
      return this.regular.hashString(buffer, algorithm, ...args);
    }
  }

  /**
   * Hashes an object using the provided algorithm, returning a node.js Buffer.
   *
   * @param buffer
   * @param algorithm
   */
  public async hashObject(obj: any, algorithm: HashAlgorithm = this.options.hashAlgorithm, ...args: any[]): Promise<Buffer> {
    if ((this.availableNativeModules.xxhashAddon && algorithm === HashAlgorithm.xxhash3) || (this.availableNativeModules.crypto && [
      HashAlgorithm.sha2,
      HashAlgorithm.md5,
      HashAlgorithm.sha512,
      HashAlgorithm.sha1,
      HashAlgorithm.md5
    ].includes(algorithm))) {
      return this.native.hashObject(obj, algorithm, ...args);
    } else {
      return this.regular.hashObject(obj, algorithm, ...args);
    }
  }

  /**
   * Decompresses arbitrary data using the provided format and any options
   * @param data - Data to decompress
   * @param format - Format to use
   */
  public async decompress(data: Buffer|ArrayBuffer, format: CompressionFormat.lzma, ...args: any[]): Promise<Buffer>;
  /**
   * Decompresses arbitrary data using the provided format and any options
   * @param data - Data to decompress
   * @param format - Format to use
   */
  public async decompress(data: Buffer|ArrayBuffer, format: CompressionFormat.zstd, ...args: any[]): Promise<Buffer>;
  /**
   * Decompresses arbitrary data using the provided format and any options
   * @param data - Data to decompress
   * @param format - Format to use
   */
  public async decompress(data: BinaryInputOutput, format: CompressionFormat, ...args: any[]): Promise<Buffer>;
  /**
   * Decompresses arbitrary data using the provided format and any options
   * @param data - Data to decompress
   * @param format - Format to use
   */
  public async decompress(data: BinaryInputOutput,  format: CompressionFormat = CompressionFormat.lzma, ...args: any[]): Promise<Buffer> {
    if (format === CompressionFormat.lzma && this.availableNativeModules.lzmaNative) {
      return this.native.decompress(data, format, ...args);
    } else {
      return this.regular.decompress(data, format, ...args);
    }
  }

  /**
   * Compresses arbitrary data using the provided format and any options
   * @param data - Data to compress
   * @param format - Format to use
   * @param args - Options
   */
  public async compress(data: Buffer|ArrayBuffer, format?: CompressionFormat.lzma, level?: number, ...args: any[]): Promise<Buffer>;
  /**
   * Compresses arbitrary data using the provided format and any options
   * @param data - Data to compress
   * @param format - Format to use
   * @param args - Options
   */
  public async compress(data: Buffer|ArrayBuffer, format?: CompressionFormat.zstd, level?: number, ...args: any[]): Promise<Buffer>;
  /**
   * Compresses arbitrary data using the provided format and any options
   * @param data - Data to compress
   * @param format - Format to use
   * @param args - Options
   */
  public async compress(data: BinaryInputOutput, format?: CompressionFormat, level?: number, ...args: any[]): Promise<Buffer>;
  /**
   * Compresses arbitrary data using the provided format and any options
   * @param data - Data to compress
   * @param format - Format to use
   * @param args - Options
   */
  public async compress(data: BinaryInputOutput, format: CompressionFormat = CompressionFormat.lzma, level: number = this.options.compressionLevel, ...args: any[]): Promise<Buffer> {
    if (format === CompressionFormat.lzma && this.availableNativeModules.lzmaNative) {
      return this.native.compress(data, format, level, ...args);
    } else {
      return this.regular.compress(data, format, level, ...args);
    }
  }

  /**
   * Serializes an object using one of the available algorithms, returning the result as a Buffer or a string
   *
   * @param obj Object to serialize
   * @param serializationFormat - Algorithm to serialize with
   */
  public serializeObject<T>(obj: T, serializationFormat?: SerializationFormat.json, useToPojoBeforeSerializing?: boolean): string;
  /**
   * Serializes an object using one of the available algorithms, returning the result as a Buffer or a string
   *
   * @param obj Object to serialize
   * @param serializationFormat - Algorithm to serialize with
   */
  public serializeObject<T>(obj: T, serializationFormat?: SerializationFormat.json5, useToPojoBeforeSerializing?: boolean): string;
  /**
   * Serializes an object using one of the available algorithms, returning the result as a Buffer or a string
   *
   * @param obj Object to serialize
   * @param serializationFormat - Algorithm to serialize with
   */
  public serializeObject<T>(obj: T, serializationFormat?: SerializationFormat.cbor, useToPojoBeforeSerializing?: boolean): Buffer;
  /**
   * Serializes an object using one of the available algorithms, returning the result as a Buffer or a string
   *
   * @param obj Object to serialize
   * @param serializationFormat - Algorithm to serialize with
   */
  public serializeObject<T>(obj: T, serializationFormat?: SerializationFormat.msgpack, useToPojoBeforeSerializing?: boolean): Buffer;
  /**
   * Serializes an object using one of the available algorithms, returning the result as a Buffer or a string
   *
   * @param obj Object to serialize
   * @param serializationFormat - Algorithm to serialize with
   */
  public serializeObject<T>(obj: T, serializationFormat?: SerializationFormat.bson, useToPojoBeforeSerializing?: boolean): Buffer;
  /**
   * Serializes an object using one of the available algorithms, returning the result as a Buffer or a string
   *
   * @param obj Object to serialize
   * @param serializationFormat - Algorithm to serialize with
   */
  public serializeObject<T>(obj: T, serializationFormat?: SerializationFormat, useToPojoBeforeSerializing?: boolean): Buffer;
  /**
   * Serializes an object using one of the available algorithms, returning the result as a Buffer or a string
   *
   * @param obj Object to serialize
   * @param serializationFormat - Algorithm to serialize with
   */
  public serializeObject<T>(obj: T, serializationFormat: SerializationFormat = this.options.serializationFormat, useToPojoBeforeSerializing: boolean|undefined = this.options.useToPojoBeforeSerializing): Buffer|string {
    if (serializationFormat === SerializationFormat.cbor && this.availableNativeModules.cborExtract) {
      return this.native.serializeObject(obj, serializationFormat);
    } else {
      return this.regular.serializeObject(obj, serializationFormat);
    }
  }

  /**
   * Deserializes an object serialized using one of the available algorithms, returning the result as an object
   *
   * @param data Data to deserialize
   * @param serializationFormat - Algorithm to deserialize with
   */
  public deserializeObject<T>(data: Buffer|ArrayBuffer|string, serializationFormat?: SerializationFormat.json): T;
  /**
   * Deserializes an object serialized using one of the available algorithms, returning the result as an object
   *
   * @param data Data to deserialize
   * @param serializationFormat - Algorithm to deserialize with
   */
  public deserializeObject<T>(data: Buffer|ArrayBuffer|string, serializationFormat?: SerializationFormat.json5): T;
  /**
   * Deserializes an object serialized using one of the available algorithms, returning the result as an object
   *
   * @param data Data to deserialize
   * @param serializationFormat - Algorithm to deserialize with
   */
  public deserializeObject<T>(data: Buffer|ArrayBuffer, serializationFormat?: SerializationFormat.cbor): T;
  /**
   * Deserializes an object serialized using one of the available algorithms, returning the result as an object
   *
   * @param data Data to deserialize
   * @param serializationFormat - Algorithm to deserialize with
   */
  public deserializeObject<T>(data: Buffer|ArrayBuffer, serializationFormat?: SerializationFormat.msgpack): T;
  /**
   * Deserializes an object serialized using one of the available algorithms, returning the result as an object
   *
   * @param data Data to deserialize
   * @param serializationFormat - Algorithm to deserialize with
   */
  public deserializeObject<T>(data: Buffer|ArrayBuffer, serializationFormat?: SerializationFormat.bson): T;
  /**
   * Deserializes an object serialized using one of the available algorithms, returning the result as an object
   *
   * @param data Data to deserialize
   * @param serializationFormat - Algorithm to deserialize with
   */
  public deserializeObject<T>(data: Buffer|ArrayBuffer, serializationFormat?: SerializationFormat): T;
  /**
   * Deserializes an object serialized using one of the available algorithms, returning the result as an object
   *
   * @param data Data to deserialize
   * @param serializationFormat - Algorithm to deserialize with
   */
  public deserializeObject<T>(data: Buffer|ArrayBuffer|string, serializationFormat: SerializationFormat = this.options.serializationFormat): T {
    if (serializationFormat === SerializationFormat.cbor && this.availableNativeModules.cborExtract) {
      return this.native.deserializeObject<T>(data as any, serializationFormat);
    } else {
      return this.regular.deserializeObject<T>(data as any, serializationFormat);
    }
  }

  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param inputObject
   * @param format
   */
  public encodeObject<T>(inputObject: T, format?: BinaryEncoding.nodeBuffer, ...args: any[]): Buffer;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param inputObject
   * @param format
   */
  public encodeObject<T>(inputObject: T, format?: BinaryEncoding.base64, ...args: any[]): string;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param inputObject
   * @param format
   */
  public encodeObject<T>(inputObject: T, format?: BinaryEncoding.base64url, ...args: any[]): string;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param inputObject
   * @param format
   */
  public encodeObject<T>(inputObject: T, format?: BinaryEncoding.hex, ...args: any[]): string;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param inputObject
   * @param format
   */
  public encodeObject<T>(inputObject: T, format?: BinaryEncoding.base32, ...args: any[]): string;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param inputObject
   * @param format
   */
  public encodeObject<T>(inputObject: T, format?: BinaryEncoding.hashids, ...args: any[]): string;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param inputObject
   * @param format
   */
  public encodeObject<T>(inputObject: T, format?: BinaryEncoding.arrayBuffer, ...args: any[]): ArrayBuffer;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param inputObject
   * @param format
   */
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param inputObject
   * @param format
   */
  public encodeObject<T>(inputObject: T, format?: BinaryEncoding.base85, ...args: any[]): string;
  // /**
  //  * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
  //  * @param inputObject
  //  * @param format
  //  */
  // public encodeObject<T>(inputObject: T, format?: BinaryEncoding.z85, ...args: any[]): string;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param inputObject
   * @param format
   */
  public encodeObject<T>(inputObject: T, format?: BinaryEncoding.ascii85, ...args: any[]): string;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param inputObject
   * @param format
   */
  public encodeObject<T>(inputObject: T, format?: BinaryEncoding, ...args: any[]): BinaryInputOutput;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param inputObject
   * @param format
   */
  public encodeObject<T>(inputObject: T, format = this.options.binaryEncoding, ...args: any[]): BinaryInputOutput {
    if (this.options.serializationFormat === SerializationFormat.cbor && this.availableNativeModules.cborExtract) {
      return this.native.encodeObject<T>(inputObject as any, format);
    } else {
      return this.regular.encodeObject<T>(inputObject as any, format);
    }
  }

  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeObject<T>(buffer: Buffer, format?: BinaryEncoding.nodeBuffer, ...args: any[]): T;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeObject<T>(buffer: string, format?: BinaryEncoding.base64, ...args: any[]): T;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeObject<T>(buffer: string, format?: BinaryEncoding.base64url, ...args: any[]): T;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeObject<T>(buffer: string, format?: BinaryEncoding.hex, ...args: any[]): T;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeObject<T>(buffer: string, format?: BinaryEncoding.base32, ...args: any[]): T;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeObject<T>(buffer: string, format?: BinaryEncoding.hashids, ...args: any[]): T;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeObject<T>(buffer: ArrayBuffer, format?: BinaryEncoding.arrayBuffer, ...args: any[]): T;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeObject<T>(buffer: string, format?: BinaryEncoding.base85, ...args: any[]): T;
  // /**
  //  * Decodes binary data from the provided format returning either a node.js buffer.
  //  * @param buffer
  //  * @param format
  //  */
  // public decodeObject<T>(buffer: string, format?: BinaryEncoding.z85, ...args: any[]): T;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeObject<T>(buffer: string, format?: BinaryEncoding.ascii85, ...args: any[]): T;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param inputBuffer
   * @param format
   */
  public decodeObject<T>(inputBuffer: BinaryInputOutput, format?: BinaryEncoding, ...args: any[]): T;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param inputBuffer
   * @param format
   */
  public decodeObject<T>(inputBuffer: BinaryInputOutput, format = this.options.binaryEncoding, ...args: any[]): T {
    if (this.options.serializationFormat === SerializationFormat.cbor && this.availableNativeModules.cborExtract) {
      return this.native.decodeObject<T>(inputBuffer as any, format);
    } else {
      return this.regular.decodeObject<T>(inputBuffer as any, format);
    }
  }


  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeBuffer(buffer: ArrayBuffer, format?: BinaryEncoding.arrayBuffer, ...args: any[]): Buffer;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeBuffer(buffer: Buffer, format?: BinaryEncoding.nodeBuffer, ...args: any[]): Buffer;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeBuffer(input: string, format?: BinaryEncoding.hex, ...args: any[]): Buffer;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeBuffer(input: string, format?: BinaryEncoding.base32, ...args: any[]): Buffer;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeBuffer(input: string, format?: BinaryEncoding.hashids, ...args: any[]): Buffer;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeBuffer(input: string, format?: BinaryEncoding.base64, ...args: any[]): Buffer;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeBuffer(input: string, format?: BinaryEncoding.base64url, ...args: any[]): Buffer;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeBuffer(input: string, format?: BinaryEncoding.base85, ...args: any[]): Buffer;
  // /**
  //  * Decodes binary data from the provided format returning either a node.js buffer.
  //  * @param buffer
  //  * @param format
  //  */
  // public decodeBuffer(input: string, format?: BinaryEncoding.z85, ...args: any[]): Buffer;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeBuffer(input: string, format?: BinaryEncoding.ascii85, ...args: any[]): Buffer;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeBuffer(buffer: BinaryInputOutput, format?: BinaryEncoding, ...args: any[]): Buffer;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  public decodeBuffer(buffer: BinaryInputOutput, format = this.options.binaryEncoding, ...args: any[]): Buffer {
    return this.regular.decodeBuffer(buffer, format, ...args);
  }

  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param buffer
   * @param format
   */
  public encodeBuffer(inputBuffer: Buffer|ArrayBuffer, format?: BinaryEncoding.nodeBuffer, ...args: any[]): Buffer;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param buffer
   * @param format
   */
  public encodeBuffer(inputBuffer: Buffer|ArrayBuffer, format?: BinaryEncoding.arrayBuffer, ...args: any[]): ArrayBuffer;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param buffer
   * @param format
   */
  public encodeBuffer(inputBuffer: Buffer|ArrayBuffer|string, format?: BinaryEncoding.hex, ...args: any[]): string;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param buffer
   * @param format
   */
  public encodeBuffer(inputBuffer: Buffer|ArrayBuffer|string, format?: BinaryEncoding.base64, ...args: any[]): string;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param buffer
   * @param format
   */
  public encodeBuffer(inputBuffer: Buffer|ArrayBuffer|string, format?: BinaryEncoding.base32, ...args: any[]): string;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param buffer
   * @param format
   */
  public encodeBuffer(inputBuffer: Buffer|ArrayBuffer|string, format?: BinaryEncoding.base64url, ...args: any[]): string;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param buffer
   * @param format
   */
  public encodeBuffer(inputBuffer: Buffer|ArrayBuffer|string, format?: BinaryEncoding.hashids, ...args: any[]): string;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param buffer
   * @param format
   */
  public encodeBuffer(inputBuffer: Buffer|ArrayBuffer|string, format?: BinaryEncoding.base85, ...args: any[]): string;
  // /**
  //  * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
  //  * @param buffer
  //  * @param format
  //  */
  // public encodeBuffer(inputBuffer: Buffer|ArrayBuffer|string, format?: BinaryEncoding.z85, ...args: any[]): string;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param buffer
   * @param format
   */
  public encodeBuffer(inputBuffer: Buffer|ArrayBuffer|string, format?: BinaryEncoding.ascii85, ...args: any[]): string;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param buffer
   * @param format
   */
  public encodeBuffer(inputBuffer: BinaryInputOutput, format?: BinaryEncoding, ...args: any[]): BinaryInputOutput;
  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param buffer
   * @param format
   */
  public encodeBuffer(inputBuffer: BinaryInputOutput, format = this.options.binaryEncoding, ...args: any[]): BinaryInputOutput {
      return this.regular.encodeBuffer(inputBuffer, format, ...args);
  }


  /**
   * Generates a unique ID using one of the available algorithms, returning the result as a Buffer, string or number.
   *
   * @param idFormat Algorithm to use to generate the unique id
   * @param args Extra args to pass to the ID generation function
   */
  public uniqueId(idFormat: IDFormat.uuidv4): Buffer;
  /**
   * Generates a unique ID using one of the available algorithms, returning the result as a Buffer, string or number.
   *
   * @param idFormat Algorithm to use to generate the unique id
   * @param args Extra args to pass to the ID generation function
   */
  public uniqueId(idFormat: IDFormat.uuidv1): Buffer;
  /**
   * Generates a unique ID using one of the available algorithms, returning the result as a Buffer, string or number.
   *
   * @param idFormat Algorithm to use to generate the unique id
   * @param args Extra args to pass to the ID generation function
   */
  public uniqueId(idFormat: IDFormat.uuidv4String): string;
  /**
   * Generates a unique ID using one of the available algorithms, returning the result as a Buffer, string or number.
   *
   * @param idFormat Algorithm to use to generate the unique id
   * @param args Extra args to pass to the ID generation function
   */
  public uniqueId(idFormat: IDFormat.uuidv1String): string;
  /**
   * Generates a unique ID using one of the available algorithms, returning the result as a Buffer, string or number.
   *
   * @param idFormat Algorithm to use to generate the unique id
   * @param args Extra args to pass to the ID generation function
   */
  public uniqueId(idFormat: IDFormat.objectId): Buffer;
  /**
   * Generates a unique ID using one of the available algorithms, returning the result as a Buffer, string or number.
   *
   * @param idFormat Algorithm to use to generate the unique id
   * @param args Extra args to pass to the ID generation function
   */
  public uniqueId(idFormat: IDFormat.nanoid, size?: number): string;
  /**
   * Generates a unique ID using one of the available algorithms, returning the result as a Buffer, string or number.
   *
   * @param idFormat Algorithm to use to generate the unique id
   * @param args Extra args to pass to the ID generation function
   */
  public uniqueId(idFormat: IDFormat.timestamp): number;
  /**
   * Generates a unique ID using one of the available algorithms, returning the result as a Buffer, string or number.
   *
   * @param idFormat Algorithm to use to generate the unique id
   * @param args Extra args to pass to the ID generation function
   */
  public uniqueId(idFormat?: IDFormat, ...args: any[]): Buffer|string|number;
  /**
   * Generates a unique ID using one of the available algorithms, returning the result as a Buffer, string or number.
   *
   * @param idFormat Algorithm to use to generate the unique id
   * @param args Extra args to pass to the ID generation function
   */
  public uniqueId(idFormat: IDFormat = this.options.uniqueIdFormat, ...args: any[]): Buffer|string|number {
    return this.regular.uniqueId(idFormat, ...args);
  }


  /**
   * Returns an EncodeTools instance with the default properties
   */
  public static get WithDefaults() {
    return new EncodeToolsAuto();
  }
  /**
   * Creates an an EncodeTools instance with the provided properties
   */
  public static create(nativeOptions?: Native.EncodingOptions, fallbackOptions?: Regular.EncodingOptions): EncodeTools {
    return new EncodeToolsAuto(nativeOptions, fallbackOptions);
  }
}

export default EncodeToolsAuto;
