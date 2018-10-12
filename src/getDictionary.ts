import { workspace, window } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getConfig } from './config';
import { KEY_INTL_DICTIONARY_PATH } from './constant';
import { request } from 'http';

/**
 * Get and update i18n directory
 */
export const getDictionary = (): object => {
  const dictionaryPath = getConfig(KEY_INTL_DICTIONARY_PATH);
  const fullDictionaryPath = path.resolve(workspace.rootPath, dictionaryPath);
  let v = {};
  v = requireRealtime(fullDictionaryPath) || v;
  return v;
};

/**
 * remove module cache
 * @param fullModuleName fullModuleName received by calling require.resolve(path)
 */
export const removeModuleCache = (fullModuleName: string) => {
  if (fullModuleName) {
    const mod = require.cache[fullModuleName];
    if (mod) {
      // remove children
      mod.children.forEach(str => {
        removeModuleCache(str);
      });

      // remove cache
      delete require.cache[fullModuleName];

      // remove path cache
      // notslint
      const pathCaches = Object.keys(module.constructor['_pathCache']);
      const len = pathCaches.length;
      let pathCache: string;
      for (let i: number = 0; i < len; i++) {
        pathCache = pathCaches[i];
        if (pathCache.indexOf(fullModuleName) > -1) {
          delete module.constructor['_pathCache'][pathCache];
        }
      }
    }
  }
};

/**
 * load module up to date, if no match, undefined will be returned.
 * @param modulePath string path of module to be reloaded
 */
export const requireRealtime = (modulePath: string): any => {
  const fullModuleName = require.resolve(modulePath);
  let v = undefined;
  if (fullModuleName) {
    removeModuleCache(fullModuleName);
    if (fs.existsSync(fullModuleName)) {
      v = require(fullModuleName);
    }
  }
  return v;
};
