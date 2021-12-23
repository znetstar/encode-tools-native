import * as Regular from "./EncodeTools";
import * as Native from "./EncodeToolsNative";
import {Buffer} from "buffer";
import {ConvertableFormatMimeTypes} from "./EncodeToolsNative";
import {ConvertableFormat, MimeTypesConvertableFormat} from "./EncodeTools";

export type EncodingOptions = Regular.EncodingOptions|Native.EncodingOptions;
export type BaseEncodingOptions = EncodingOptions;
export type BinaryEncoding = Regular.BinaryEncoding|Native.BinaryEncoding;
export type BinaryInputOutput = Regular.BinaryInputOutput|Native.BinaryInputOutput;
export type ImageFormat = Regular.ImageFormat|Native.ImageFormat;
export type IDFormat = Regular.IDFormat|Native.IDFormat;
export type SerializationFormat = Regular.SerializationFormat|Native.SerializationFormat;
export type CompressionFormat = Regular.CompressionFormat|Native.CompressionFormat;
export type HashAlgorithm = Regular.HashAlgorithm|Native.HashAlgorithm;
export type EncodeToolsFormat = Regular.EncodeToolsFormat|Native.EncodeToolsFormat;
export type ImageFormatMimeTypesCollection =  Map<ImageFormat, string>;
export type SerializationFormatMimeTypesCollection =  Map<SerializationFormat, string>;

/**
 * Image dimensions for resize
 */
export type ImageDims = { height: number, width?: number }|{ height?: number, width: number }
/**
 * Image dimensions for crop
 */
export type CropDims = { height: number, width: number, left: number, top: number };

/**
 * Format and content type extracted from the HTTP request
 */
export interface ExtractedContentType<T extends ConvertableFormat>  {
  /**
   * Extracted format if found, or the default value, if provided
   */
  format: T|null;
  /**
   * Content type if found or null
   */
  mimeType: string|null;
  /**
   * Header that was used to extract
   */
  header: string;
}

/**
 * `SerializationFormat` and content type extracted from the HTTP request
 */
export type ExtractedSerializationFormatContentType = ExtractedContentType<SerializationFormat>;
/**
 * `ImageFormat` and content type extracted from the HTTP request
 */
export type ExtractedImageFormatContentType = ExtractedContentType<ImageFormat>;


/**
 * Metadata specific to each image
 */
export interface ImageMetadataBase<I> {
  format: I;
  width: number;
  height: number;
}

export type HTTPRequestWithHeader = { headers: { [name: string]: string|string[]; } };

export interface IEncodeTools {
  options: EncodingOptions;
  /**
   * Combined map of all `SerializationFormat` and `ImageFormat` entries to their respective MIME Types
   */
  convertableFormatMimeTypes: Map<ConvertableFormat, string>;
  /**
   * Map of MIME Type to each `ImageFormat` or `SerializationFormat`.
   */
  mimeTypesConvertableFormat: Map<string, ConvertableFormat>;

  /**
   * Extracts a `SerializationFormat` or `ImageFormat` from the specified HTTP header,
   * or defaults to the `SerializationFormat` or `Image Format` in the options of the encoder.
   * @param req HTTP Request
   * @param key Name of the header to extract from
   */
  headerToConvertableFormat(req: HTTPRequestWithHeader, key: string, defaultValue?: ConvertableFormat): ExtractedContentType<ConvertableFormat>;
  /**
   * Extracts a `ImageFormat` from the specified HTTP header,
   * or defaults to the `Image Format` in the options of the encoder.
   * @param req HTTP Request
   * @param key Name of the header to extract from
   */
  headerToImageFormat(req: HTTPRequestWithHeader, key: string): ExtractedImageFormatContentType;

  /**
   * Extracts a `SerializationFormat` from the specified HTTP header,
   * or defaults to the `SerializationFormat` in the options of the encoder.
   * @param req HTTP Request
   * @param key Name of the header to extract from
   */
  headerToSerializationFormat(req: HTTPRequestWithHeader, key: string): ExtractedSerializationFormatContentType;


  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param buffer
   * @param format
   */
  encodeBuffer(inputBuffer: BinaryInputOutput, format: BinaryEncoding, ...args: any[]): BinaryInputOutput;
  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param buffer
   * @param format
   */
  decodeBuffer(buffer: BinaryInputOutput, format: BinaryEncoding, ...args: any[]): Buffer;

  /**
   * Hashes data using the provided algorithm, returning a node.js Buffer.
   *
   * @param buffer
   * @param algorithm
   */
  hash(buffer: BinaryInputOutput, algorithm: HashAlgorithm, ...args: any[]): Promise<Buffer>;

  /**
   * Hashes data using the provided algorithm, returning a node.js Buffer.
   *
   * @param buffer
   * @param algorithm
   */
  hashString(buffer: BinaryInputOutput, algorithm: HashAlgorithm, ...args: any[]): Promise<string>;

  /**
   * Hashes an object using the provided algorithm, returning a node.js Buffer.
   *
   * @param buffer
   * @param algorithm
   */
  hashObject(obj: any, algorithm: HashAlgorithm, ...args: any[]): Promise<Buffer>;

  /**
   * Generates a unique ID using one of the available algorithms, returning the result as a Buffer, string or number.
   *
   * @param idFormat Algorithm to use to generate the unique id
   * @param args Extra args to pass to the ID generation function
   */
  uniqueId(idFormat: IDFormat, ...args: any[]): Buffer|string|number;


  /**
   * Serializes an object using one of the available algorithms, returning the result as a Buffer or a string
   *
   * @param obj Object to serialize
   * @param serializationFormat - Algorithm to serialize with
   */
  serializeObject<T>(obj: T, serializationFormat: SerializationFormat): Buffer|string;

  /**
   * Deserializes an object serialized using one of the available algorithms, returning the result as an object
   *
   * @param data Data to deserialize
   * @param serializationFormat - Algorithm to deserialize with
   */
  deserializeObject<T>(data: Buffer|ArrayBuffer|string, serializationFormat: SerializationFormat): T;

  /**
   * Encodes binary data using the provided format returning either a node.js buffer, array buffer, or string
   * @param inputObject
   * @param format
   */
  encodeObject<T>(inputObject: T, format: BinaryEncoding, ...args: any[]): BinaryInputOutput;

  /**
   * Decodes binary data from the provided format returning either a node.js buffer.
   * @param inputBuffer
   * @param format
   */
  decodeObject<T>(inputBuffer: BinaryInputOutput, format: BinaryEncoding, ...args: any[]): T;

  /**
   * Compresses arbitrary data using the provided format and any options
   * @param data - Data to compress
   * @param format - Format to use
   * @param args - Options
   */
  compress(data: BinaryInputOutput, format: CompressionFormat, level?: number , ...args: any[]): Promise<Buffer>;

  /**
   * Decompresses arbitrary data using the provided format and any options
   * @param data - Data to decompress
   * @param format - Format to use
   */
  decompress(data: BinaryInputOutput, format: CompressionFormat, ...args: any[]): Promise<Buffer>;

  /**
   * Crops an image and returns a Buffer containing the result in the provided format
   * @param data - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  cropImage(data: BinaryInputOutput, dims: CropDims, format: ImageFormat): Promise<Buffer>;

  /**
   * Resizes an image and returns a Buffer containing the result in the provided format
   * @param data - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  resizeImage(data: BinaryInputOutput, dims: ImageDims, format: ImageFormat): Promise<Buffer>;
  /**
   * Adjust brightness of image
   * @param data - Image
   * @param dims - Height/Width to resize to
   * @param format - Format to save result as
   */
  adjustImageBrightness(data: BinaryInputOutput, factor: number, format: ImageFormat): Promise<Buffer>;
  /**
   * Saves an image in the provided format, performing no operations on the image
   * @param data - Image
   * @param format - Format to save result as
   */
  convertImage(data: BinaryInputOutput, format: ImageFormat): Promise<Buffer>;

}
