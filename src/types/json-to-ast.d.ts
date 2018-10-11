// Type definitions for Json-to-ast
// Project: [~THE PROJECT NAME~]
// Definitions by: [~YOUR NAME~] <[~A URL FOR YOU~]>

/*~ This is the module template file. You should rename it to index.d.ts
 *~ and place it in a folder with the same name as the module.
 *~ For example, if you were writing a file for "super-greeter", this
 *~ file should be 'super-greeter/index.d.ts'
 */

/*~ If this module is a UMD module that exposes a global variable 'myLib' when
 *~ loaded outside a module loader environment, declare that global here.
 *~ Otherwise, delete this declaration.
 */
declare module 'json-to-ast' {
  export as namespace JsonToAst;

  /*~ You can declare types that are available via importing the module */
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

  declare function parse(code: string, settings: JsonParseSettings): JsonObject;
  export default parse;
}
