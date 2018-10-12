/* For example, if you were writing a file for "super-greeter", this
 * ~file should be 'super-greeter/index.d.ts'
 * /

/*~ Note that ES6 modules cannot directly export callable functions.
 *~ This file should be imported using the CommonJS-style:
 *~   import x = require('someLibrary');
 *~
 *~ Refer to the documentation to understand common
 *~ workarounds for this limitation of ES6 modules.
 */

/*~ If this module is a UMD module that exposes a global variable 'myFuncLib' when
 *~ loaded outside a module loader environment, declare that global here.
 *~ Otherwise, delete this declaration.
 */
// export as namespace myFuncLib;

/*~ This declaration specifies that the function
 *~ is the exported object from the file
 */

/*~ If you want to expose types from your module as well, you can
 *~ place them in this block. Often you will want to describe the
 *~ shape of the return type of the function; that type should
 *~ be declared in here, as this example shows.
 */
declare module 'json-to-ast' {
  export interface JsonParseSettings {
    loc?: boolean;
    source?: string;
  }
  export interface JsonLiteral {
    type: 'Literal';
    value: string | number | boolean | null;
    raw: string;
    loc?: Object;
  }
  export interface JsonIdentifier {
    type: 'Identifier';
    value: string;
    raw: string;
    loc?: Object;
  }
  export interface JsonObject {
    type: 'Object';
    children: JsonProperty[];
    loc?: JsonLoc;
  }
  export interface JsonArray {
    type: 'Array';
    children: (JsonObject[] | JsonArray | JsonLiteral)[];
    loc?: JsonLoc;
  }
  export interface JsonProperty {
    type: 'Property';
    key: JsonIdentifier;
    value: JsonObject | JsonArray | JsonLiteral;
    loc?: JsonLoc;
  }
  export interface JsonLoc {
    start: JsonPosition;
    end: JsonPosition;
  }
  export interface JsonPosition {
    line: number;
    column: number;
    offset: number;
  }

  /*~ This example shows how to have multiple overloads for your function */
  export default function parse(
    code: string,
    options: JsonParseSettings
  ): JsonObject;
}
