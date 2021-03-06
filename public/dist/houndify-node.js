(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("json-bigint"), require("uuid"), require("pako"), require("create-hmac"), require("node-fetch"), require("ws"), require("https-proxy-agent"), require("url"));
	else if(typeof define === 'function' && define.amd)
		define(["json-bigint", "uuid", "pako", "create-hmac", "node-fetch", "ws", "https-proxy-agent", "url"], factory);
	else if(typeof exports === 'object')
		exports["Houndify"] = factory(require("json-bigint"), require("uuid"), require("pako"), require("create-hmac"), require("node-fetch"), require("ws"), require("https-proxy-agent"), require("url"));
	else
		root["Houndify"] = factory(root["json-bigint"], root["uuid"], root["pako"], root["create-hmac"], root["node-fetch"], root["ws"], root["https-proxy-agent"], root["url"]);
})(typeof self !== 'undefined' ? self : this, function(__WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_6__, __WEBPACK_EXTERNAL_MODULE_8__, __WEBPACK_EXTERNAL_MODULE_12__, __WEBPACK_EXTERNAL_MODULE_15__, __WEBPACK_EXTERNAL_MODULE_20__, __WEBPACK_EXTERNAL_MODULE_21__, __WEBPACK_EXTERNAL_MODULE_22__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 9);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var createHmac = __webpack_require__(12);
var JSONbig = __webpack_require__(2);
var uuid = __webpack_require__(6);
__webpack_require__(13);

var Module = __webpack_require__(3);
var speex = __webpack_require__(4);
var config = __webpack_require__(1);

/*
 * We use the URL-encoded version of base64.  The conversion is very simple:
 */
function convertBase64URL(encoded, isURL) {
  if (isURL) {
    encoded = encoded.replace(/-/g, "+");
    encoded = encoded.replace(/_/g, "/");
  } else {
    encoded = encoded.replace(/\+/g, "-");
    encoded = encoded.replace(/\//g, "_");
  }

  return encoded;
}

/* HMAC sign the token with the access key */
function sign(token, accessKey) {
  var clientKeyBin = new Buffer(convertBase64URL(accessKey, true), "base64");
  var hash = createHmac("sha256", clientKeyBin).update(token).digest("base64");
  return convertBase64URL(hash, false);
}

module.exports = {
  cloneObject: function cloneObject(obj) {
    if (!obj) return {};

    return JSONbig.parse(JSONbig.stringify(obj));
  },
  setDebug: function setDebug(isDebugging) {
    config.debug = !!isDebugging;
  },
  log: function log() {
    if (config.debug) {
      console.log.apply(console, arguments);
    }
  },
  wrapListener: function wrapListener(fn, name) {
    return function () {
      try {
        if (fn) {
          fn.apply(this, arguments);
        }
      } catch (e) {
        console.log("Error in \'" + name + "\' handler: " + e);
        if (e.stack) {
          console.log(e.stack);
        }
      }
    };
  },
  signToken: function signToken(token, houndifyRequest, callback) {
    if (houndifyRequest.clientKey) {
      var signed = sign(token, houndifyRequest.clientKey);
      callback(null, signed);
    } else if (houndifyRequest.authURL) {
      this.request({
        uri: houndifyRequest.authURL,
        qs: { token: token }
      }, function (error, response, body) {
        if (error) return callback(error, null);

        if (response.statusCode !== 200) return callback(body, null);

        callback(null, body);
      });
    } else {
      throw new Error("Authentication failed");
    }
  },
  escapeUnicode: function escapeUnicode(string) {
    return string.split("").map(function (char) {
      var charCode = char.charCodeAt(0);
      if (charCode > 127) {
        var hex = charCode.toString(16);
        var leadingZeros = new Array(5 - hex.length).join("0");
        return '\\u' + leadingZeros + hex;
      } else {
        return char;
      }
    }).join("");
  },
  request: function request(opts, callback) {
    // request "lite" for browser side (add more features as needed)

    var url = (opts.proxy || opts.uri) + "?";
    for (var query_key in opts.qs) {
      url += query_key + "=" + encodeURIComponent(opts.qs[query_key]);
    }

    var reqOpts = {
      method: opts.method || 'GET',
      headers: opts.headers || {}
    };

    if (reqOpts.method !== 'GET') {
      reqOpts.body = opts.body;
    }

    fetch(url, reqOpts).then(function (response) {
      response.text().then(function (responseText) {
        callback(null, { statusCode: response.status }, responseText);
      });
    });
  },
  decodeAudioData: function decodeAudioData(arrayBuffer, callback) {
    try {
      if (typeof AudioContext === 'undefined') AudioContext = webkitAudioContext;
      config.audioCtx = config.audioCtx || new AudioContext();
    } catch (error) {
      callback("Web Audio API is not supported by your browser.");
    }

    config.audioCtx.decodeAudioData(arrayBuffer, function (audioBuffer) {
      callback(null, {
        audioData: audioBuffer.getChannelData(0).slice(),
        sampleRate: config.audioCtx.sampleRate
      });
    }, callback);
  },
  decodeBase64: function decodeBase64(b64) {
    return new Buffer(b64, 'base64');
  },
  decodeSpeex: function decodeSpeex(buffer) {
    var inputSize = buffer.length;

    var inBuffer = new Uint8Array(Module.HEAPU8.buffer, Module._malloc(inputSize), inputSize);
    for (var idx = 0; idx < inputSize; idx++) {
      inBuffer[idx] = buffer[idx];
    }

    var outputPointerBuf = new Uint32Array(Module.HEAPU32.buffer, Module._malloc(Module.HEAPU32.BYTES_PER_ELEMENT), 1);
    var outputSizeBuf = new Uint32Array(Module.HEAPU32.buffer, Module._malloc(Module.HEAPU32.BYTES_PER_ELEMENT), 1);

    var isWB = speex.decodeSpeex(inBuffer.byteOffset, inputSize, outputPointerBuf.byteOffset, outputSizeBuf.byteOffset);

    var outputPointer = outputPointerBuf[0];
    var outputSize = outputSizeBuf[0] / 2; // in shorts
    var outBuffer = new Int16Array(Module.HEAP16.buffer, outputPointer, outputSize);

    var result = {
      sampleRate: isWB ? 16000 : 8000,
      audioData: outBuffer.slice()
    };

    Module._free(outputPointerBuf.byteOffset);
    Module._free(outputSizeBuf.byteOffset);
    Module._free(inBuffer.byteOffset);
    Module._free(outBuffer.byteOffset);

    return result;
  },
  generateAuthenticationHeaders: function generateAuthenticationHeaders(_ref) {
    var clientId = _ref.clientId,
        clientKey = _ref.clientKey,
        userId = _ref.userId,
        requestId = _ref.requestId,
        timestamp = _ref.timestamp;

    if (!clientId || !clientKey) throw "Error: clientId and clientKey are required to generate authentication headers.";

    userId = userId || uuid.v1();
    requestId = requestId || uuid.v1();
    timestamp = timestamp || Math.floor(Date.now() / 1000);

    var requestData = userId + ';' + requestId;
    var token = requestData + timestamp;

    return {
      'Hound-Request-Authentication': requestData,
      'Hound-Client-Authentication': clientId + ';' + timestamp + ';' + sign(token, clientKey)
    };
  },
  isString: function isString(obj) {
    try {
      return typeof obj === 'string' || obj instanceof String;
    } catch (e) {
      return false;
    }
  },
  isBlob: function isBlob(obj) {
    try {
      return obj instanceof Blob;
    } catch (e) {
      return false;
    }
  }
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
  version: __webpack_require__(10).version,
  VOICE_ENDPOINT_WS: "wss://apiws.houndify.com:443",
  TEXT_ENDPOINT: "https://api.houndify.com/v1/text",
  debug: false
};

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Module;if (!Module) Module = (typeof Module !== "undefined" ? Module : null) || {};var moduleOverrides = {};for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}var ENVIRONMENT_IS_WEB = false;var ENVIRONMENT_IS_WORKER = false;var ENVIRONMENT_IS_NODE = false;var ENVIRONMENT_IS_SHELL = false;if (Module["ENVIRONMENT"]) {
  if (Module["ENVIRONMENT"] === "WEB") {
    ENVIRONMENT_IS_WEB = true;
  } else if (Module["ENVIRONMENT"] === "WORKER") {
    ENVIRONMENT_IS_WORKER = true;
  } else if (Module["ENVIRONMENT"] === "NODE") {
    ENVIRONMENT_IS_NODE = true;
  } else if (Module["ENVIRONMENT"] === "SHELL") {
    ENVIRONMENT_IS_SHELL = true;
  } else {
    throw new Error("The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.");
  }
} else {
  ENVIRONMENT_IS_WEB = typeof window === "object";ENVIRONMENT_IS_WORKER = typeof importScripts === "function";ENVIRONMENT_IS_NODE = typeof process === "object" && "function" === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
}if (ENVIRONMENT_IS_NODE) {
  if (!Module["print"]) Module["print"] = console.log;if (!Module["printErr"]) Module["printErr"] = console.warn;var nodeFS;var nodePath;Module["read"] = function read(filename, binary) {
    if (!nodeFS) nodeFS = __webpack_require__(16);if (!nodePath) nodePath = __webpack_require__(17);filename = nodePath["normalize"](filename);var ret = nodeFS["readFileSync"](filename);return binary ? ret : ret.toString();
  };Module["readBinary"] = function readBinary(filename) {
    var ret = Module["read"](filename, true);if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }assert(ret.buffer);return ret;
  };Module["load"] = function load(f) {
    globalEval(read(f));
  };if (!Module["thisProgram"]) {
    if (process["argv"].length > 1) {
      Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/");
    } else {
      Module["thisProgram"] = "unknown-program";
    }
  }Module["arguments"] = process["argv"].slice(2);if (true) {
    module["exports"] = Module;
  }process["on"]("uncaughtException", function (ex) {
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });Module["inspect"] = function () {
    return "[Emscripten Module object]";
  };
} else if (ENVIRONMENT_IS_SHELL) {
  if (!Module["print"]) Module["print"] = print;if (typeof printErr != "undefined") Module["printErr"] = printErr;if (typeof read != "undefined") {
    Module["read"] = read;
  } else {
    Module["read"] = function read() {
      throw "no read() available";
    };
  }Module["readBinary"] = function readBinary(f) {
    if (typeof readbuffer === "function") {
      return new Uint8Array(readbuffer(f));
    }var data = read(f, "binary");assert(typeof data === "object");return data;
  };if (typeof scriptArgs != "undefined") {
    Module["arguments"] = scriptArgs;
  } else if (typeof arguments != "undefined") {
    Module["arguments"] = arguments;
  }if (typeof quit === "function") {
    Module["quit"] = function (status, toThrow) {
      quit(status);
    };
  }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module["read"] = function read(url) {
    var xhr = new XMLHttpRequest();xhr.open("GET", url, false);xhr.send(null);return xhr.responseText;
  };if (ENVIRONMENT_IS_WORKER) {
    Module["readBinary"] = function read(url) {
      var xhr = new XMLHttpRequest();xhr.open("GET", url, false);xhr.responseType = "arraybuffer";xhr.send(null);return xhr.response;
    };
  }Module["readAsync"] = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();xhr.open("GET", url, true);xhr.responseType = "arraybuffer";xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
        onload(xhr.response);
      } else {
        onerror();
      }
    };xhr.onerror = onerror;xhr.send(null);
  };if (typeof arguments != "undefined") {
    Module["arguments"] = arguments;
  }if (typeof console !== "undefined") {
    if (!Module["print"]) Module["print"] = function print(x) {
      console.log(x);
    };if (!Module["printErr"]) Module["printErr"] = function printErr(x) {
      console.warn(x);
    };
  } else {
    var TRY_USE_DUMP = false;if (!Module["print"]) Module["print"] = TRY_USE_DUMP && typeof dump !== "undefined" ? function (x) {
      dump(x);
    } : function (x) {};
  }if (ENVIRONMENT_IS_WORKER) {
    Module["load"] = importScripts;
  }if (typeof Module["setWindowTitle"] === "undefined") {
    Module["setWindowTitle"] = function (title) {
      document.title = title;
    };
  }
} else {
  throw "Unknown runtime environment. Where are we?";
}function globalEval(x) {
  eval.call(null, x);
}if (!Module["load"] && Module["read"]) {
  Module["load"] = function load(f) {
    globalEval(Module["read"](f));
  };
}if (!Module["print"]) {
  Module["print"] = function () {};
}if (!Module["printErr"]) {
  Module["printErr"] = Module["print"];
}if (!Module["arguments"]) {
  Module["arguments"] = [];
}if (!Module["thisProgram"]) {
  Module["thisProgram"] = "./this.program";
}if (!Module["quit"]) {
  Module["quit"] = function (status, toThrow) {
    throw toThrow;
  };
}Module.print = Module["print"];Module.printErr = Module["printErr"];Module["preRun"] = [];Module["postRun"] = [];for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}moduleOverrides = undefined;var Runtime = { setTempRet0: function setTempRet0(value) {
    tempRet0 = value;return value;
  }, getTempRet0: function getTempRet0() {
    return tempRet0;
  }, stackSave: function stackSave() {
    return STACKTOP;
  }, stackRestore: function stackRestore(stackTop) {
    STACKTOP = stackTop;
  }, getNativeTypeSize: function getNativeTypeSize(type) {
    switch (type) {case "i1":case "i8":
        return 1;case "i16":
        return 2;case "i32":
        return 4;case "i64":
        return 8;case "float":
        return 4;case "double":
        return 8;default:
        {
          if (type[type.length - 1] === "*") {
            return Runtime.QUANTUM_SIZE;
          } else if (type[0] === "i") {
            var bits = parseInt(type.substr(1));assert(bits % 8 === 0);return bits / 8;
          } else {
            return 0;
          }
        }}
  }, getNativeFieldSize: function getNativeFieldSize(type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  }, STACK_ALIGN: 16, prepVararg: function prepVararg(ptr, type) {
    if (type === "double" || type === "i64") {
      if (ptr & 7) {
        assert((ptr & 7) === 4);ptr += 4;
      }
    } else {
      assert((ptr & 3) === 0);
    }return ptr;
  }, getAlignSize: function getAlignSize(type, size, vararg) {
    if (!vararg && (type == "i64" || type == "double")) return 8;if (!type) return Math.min(size, 8);return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  }, dynCall: function dynCall(sig, ptr, args) {
    if (args && args.length) {
      return Module["dynCall_" + sig].apply(null, [ptr].concat(args));
    } else {
      return Module["dynCall_" + sig].call(null, ptr);
    }
  }, functionPointers: [], addFunction: function addFunction(func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;return 2 * (1 + i);
      }
    }throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.";
  }, removeFunction: function removeFunction(index) {
    Runtime.functionPointers[(index - 2) / 2] = null;
  }, warnOnce: function warnOnce(text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;Module.printErr(text);
    }
  }, funcWrappers: {}, getFuncWrapper: function getFuncWrapper(func, sig) {
    assert(sig);if (!Runtime.funcWrappers[sig]) {
      Runtime.funcWrappers[sig] = {};
    }var sigCache = Runtime.funcWrappers[sig];if (!sigCache[func]) {
      if (sig.length === 1) {
        sigCache[func] = function dynCall_wrapper() {
          return Runtime.dynCall(sig, func);
        };
      } else if (sig.length === 2) {
        sigCache[func] = function dynCall_wrapper(arg) {
          return Runtime.dynCall(sig, func, [arg]);
        };
      } else {
        sigCache[func] = function dynCall_wrapper() {
          return Runtime.dynCall(sig, func, Array.prototype.slice.call(arguments));
        };
      }
    }return sigCache[func];
  }, getCompilerSetting: function getCompilerSetting(name) {
    throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work";
  }, stackAlloc: function stackAlloc(size) {
    var ret = STACKTOP;STACKTOP = STACKTOP + size | 0;STACKTOP = STACKTOP + 15 & -16;return ret;
  }, staticAlloc: function staticAlloc(size) {
    var ret = STATICTOP;STATICTOP = STATICTOP + size | 0;STATICTOP = STATICTOP + 15 & -16;return ret;
  }, dynamicAlloc: function dynamicAlloc(size) {
    var ret = HEAP32[DYNAMICTOP_PTR >> 2];var end = (ret + size + 15 | 0) & -16;HEAP32[DYNAMICTOP_PTR >> 2] = end;if (end >= TOTAL_MEMORY) {
      var success = enlargeMemory();if (!success) {
        HEAP32[DYNAMICTOP_PTR >> 2] = ret;return 0;
      }
    }return ret;
  }, alignMemory: function alignMemory(size, quantum) {
    var ret = size = Math.ceil(size / (quantum ? quantum : 16)) * (quantum ? quantum : 16);return ret;
  }, makeBigInt: function makeBigInt(low, high, unsigned) {
    var ret = unsigned ? +(low >>> 0) + +(high >>> 0) * +4294967296 : +(low >>> 0) + +(high | 0) * +4294967296;return ret;
  }, GLOBAL_BASE: 8, QUANTUM_SIZE: 4, __dummy__: 0 };Module["Runtime"] = Runtime;var ABORT = 0;var EXITSTATUS = 0;function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed: " + text);
  }
}function getCFunc(ident) {
  var func = Module["_" + ident];if (!func) {
    try {
      func = eval("_" + ident);
    } catch (e) {}
  }assert(func, "Cannot call unknown function " + ident + " (perhaps LLVM optimizations or closure removed it?)");return func;
}var cwrap, ccall;(function () {
  var JSfuncs = { "stackSave": function stackSave() {
      Runtime.stackSave();
    }, "stackRestore": function stackRestore() {
      Runtime.stackRestore();
    }, "arrayToC": function arrayToC(arr) {
      var ret = Runtime.stackAlloc(arr.length);writeArrayToMemory(arr, ret);return ret;
    }, "stringToC": function stringToC(str) {
      var ret = 0;if (str !== null && str !== undefined && str !== 0) {
        var len = (str.length << 2) + 1;ret = Runtime.stackAlloc(len);stringToUTF8(str, ret, len);
      }return ret;
    } };var toC = { "string": JSfuncs["stringToC"], "array": JSfuncs["arrayToC"] };ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
    var func = getCFunc(ident);var cArgs = [];var stack = 0;if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];if (converter) {
          if (stack === 0) stack = Runtime.stackSave();cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }var ret = func.apply(null, cArgs);if (returnType === "string") ret = Pointer_stringify(ret);if (stack !== 0) {
      if (opts && opts.async) {
        EmterpreterAsync.asyncFinalizers.push(function () {
          Runtime.stackRestore(stack);
        });return;
      }Runtime.stackRestore(stack);
    }return ret;
  };var sourceRegex = /^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;function parseJSFunc(jsfunc) {
    var parsed = jsfunc.toString().match(sourceRegex).slice(1);return { arguments: parsed[0], body: parsed[1], returnValue: parsed[2] };
  }var JSsource = null;function ensureJSsource() {
    if (!JSsource) {
      JSsource = {};for (var fun in JSfuncs) {
        if (JSfuncs.hasOwnProperty(fun)) {
          JSsource[fun] = parseJSFunc(JSfuncs[fun]);
        }
      }
    }
  }cwrap = function cwrap(ident, returnType, argTypes) {
    argTypes = argTypes || [];var cfunc = getCFunc(ident);var numericArgs = argTypes.every(function (type) {
      return type === "number";
    });var numericRet = returnType !== "string";if (numericRet && numericArgs) {
      return cfunc;
    }var argNames = argTypes.map(function (x, i) {
      return "$" + i;
    });var funcstr = "(function(" + argNames.join(",") + ") {";var nargs = argTypes.length;if (!numericArgs) {
      ensureJSsource();funcstr += "var stack = " + JSsource["stackSave"].body + ";";for (var i = 0; i < nargs; i++) {
        var arg = argNames[i],
            type = argTypes[i];if (type === "number") continue;var convertCode = JSsource[type + "ToC"];funcstr += "var " + convertCode.arguments + " = " + arg + ";";funcstr += convertCode.body + ";";funcstr += arg + "=(" + convertCode.returnValue + ");";
      }
    }var cfuncname = parseJSFunc(function () {
      return cfunc;
    }).returnValue;funcstr += "var ret = " + cfuncname + "(" + argNames.join(",") + ");";if (!numericRet) {
      var strgfy = parseJSFunc(function () {
        return Pointer_stringify;
      }).returnValue;funcstr += "ret = " + strgfy + "(ret);";
    }if (!numericArgs) {
      ensureJSsource();funcstr += JSsource["stackRestore"].body.replace("()", "(stack)") + ";";
    }funcstr += "return ret})";return eval(funcstr);
  };
})();Module["ccall"] = ccall;Module["cwrap"] = cwrap;function setValue(ptr, value, type, noSafe) {
  type = type || "i8";if (type.charAt(type.length - 1) === "*") type = "i32";switch (type) {case "i1":
      HEAP8[ptr >> 0] = value;break;case "i8":
      HEAP8[ptr >> 0] = value;break;case "i16":
      HEAP16[ptr >> 1] = value;break;case "i32":
      HEAP32[ptr >> 2] = value;break;case "i64":
      tempI64 = [value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= +1 ? tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];break;case "float":
      HEAPF32[ptr >> 2] = value;break;case "double":
      HEAPF64[ptr >> 3] = value;break;default:
      abort("invalid type for setValue: " + type);}
}Module["setValue"] = setValue;function getValue(ptr, type, noSafe) {
  type = type || "i8";if (type.charAt(type.length - 1) === "*") type = "i32";switch (type) {case "i1":
      return HEAP8[ptr >> 0];case "i8":
      return HEAP8[ptr >> 0];case "i16":
      return HEAP16[ptr >> 1];case "i32":
      return HEAP32[ptr >> 2];case "i64":
      return HEAP32[ptr >> 2];case "float":
      return HEAPF32[ptr >> 2];case "double":
      return HEAPF64[ptr >> 3];default:
      abort("invalid type for setValue: " + type);}return null;
}Module["getValue"] = getValue;var ALLOC_NORMAL = 0;var ALLOC_STACK = 1;var ALLOC_STATIC = 2;var ALLOC_DYNAMIC = 3;var ALLOC_NONE = 4;Module["ALLOC_NORMAL"] = ALLOC_NORMAL;Module["ALLOC_STACK"] = ALLOC_STACK;Module["ALLOC_STATIC"] = ALLOC_STATIC;Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;Module["ALLOC_NONE"] = ALLOC_NONE;function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;if (typeof slab === "number") {
    zeroinit = true;size = slab;
  } else {
    zeroinit = false;size = slab.length;
  }var singleType = typeof types === "string" ? types : null;var ret;if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [typeof _malloc === "function" ? _malloc : Runtime.staticAlloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }if (zeroinit) {
    var ptr = ret,
        stop;assert((ret & 3) == 0);stop = ret + (size & ~3);for (; ptr < stop; ptr += 4) {
      HEAP32[ptr >> 2] = 0;
    }stop = ret + size;while (ptr < stop) {
      HEAP8[ptr++ >> 0] = 0;
    }return ret;
  }if (singleType === "i8") {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }return ret;
  }var i = 0,
      type,
      typeSize,
      previousType;while (i < size) {
    var curr = slab[i];if (typeof curr === "function") {
      curr = Runtime.getFunctionIndex(curr);
    }type = singleType || types[i];if (type === 0) {
      i++;continue;
    }if (type == "i64") type = "i32";setValue(ret + i, curr, type);if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);previousType = type;
    }i += typeSize;
  }return ret;
}Module["allocate"] = allocate;function getMemory(size) {
  if (!staticSealed) return Runtime.staticAlloc(size);if (!runtimeInitialized) return Runtime.dynamicAlloc(size);return _malloc(size);
}Module["getMemory"] = getMemory;function Pointer_stringify(ptr, length) {
  if (length === 0 || !ptr) return "";var hasUtf = 0;var t;var i = 0;while (1) {
    t = HEAPU8[ptr + i >> 0];hasUtf |= t;if (t == 0 && !length) break;i++;if (length && i == length) break;
  }if (!length) length = i;var ret = "";if (hasUtf < 128) {
    var MAX_CHUNK = 1024;var curr;while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));ret = ret ? ret + curr : curr;ptr += MAX_CHUNK;length -= MAX_CHUNK;
    }return ret;
  }return Module["UTF8ToString"](ptr);
}Module["Pointer_stringify"] = Pointer_stringify;function AsciiToString(ptr) {
  var str = "";while (1) {
    var ch = HEAP8[ptr++ >> 0];if (!ch) return str;str += String.fromCharCode(ch);
  }
}Module["AsciiToString"] = AsciiToString;function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}Module["stringToAscii"] = stringToAscii;var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;function UTF8ArrayToString(u8Array, idx) {
  var endPtr = idx;while (u8Array[endPtr]) {
    ++endPtr;
  }if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var u0, u1, u2, u3, u4, u5;var str = "";while (1) {
      u0 = u8Array[idx++];if (!u0) return str;if (!(u0 & 128)) {
        str += String.fromCharCode(u0);continue;
      }u1 = u8Array[idx++] & 63;if ((u0 & 224) == 192) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);continue;
      }u2 = u8Array[idx++] & 63;if ((u0 & 240) == 224) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2;
      } else {
        u3 = u8Array[idx++] & 63;if ((u0 & 248) == 240) {
          u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u3;
        } else {
          u4 = u8Array[idx++] & 63;if ((u0 & 252) == 248) {
            u0 = (u0 & 3) << 24 | u1 << 18 | u2 << 12 | u3 << 6 | u4;
          } else {
            u5 = u8Array[idx++] & 63;u0 = (u0 & 1) << 30 | u1 << 24 | u2 << 18 | u3 << 12 | u4 << 6 | u5;
          }
        }
      }if (u0 < 65536) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 65536;str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
      }
    }
  }
}Module["UTF8ArrayToString"] = UTF8ArrayToString;function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8, ptr);
}Module["UTF8ToString"] = UTF8ToString;function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) return 0;var startIdx = outIdx;var endIdx = outIdx + maxBytesToWrite - 1;for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;if (u <= 127) {
      if (outIdx >= endIdx) break;outU8Array[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;outU8Array[outIdx++] = 192 | u >> 6;outU8Array[outIdx++] = 128 | u & 63;
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;outU8Array[outIdx++] = 224 | u >> 12;outU8Array[outIdx++] = 128 | u >> 6 & 63;outU8Array[outIdx++] = 128 | u & 63;
    } else if (u <= 2097151) {
      if (outIdx + 3 >= endIdx) break;outU8Array[outIdx++] = 240 | u >> 18;outU8Array[outIdx++] = 128 | u >> 12 & 63;outU8Array[outIdx++] = 128 | u >> 6 & 63;outU8Array[outIdx++] = 128 | u & 63;
    } else if (u <= 67108863) {
      if (outIdx + 4 >= endIdx) break;outU8Array[outIdx++] = 248 | u >> 24;outU8Array[outIdx++] = 128 | u >> 18 & 63;outU8Array[outIdx++] = 128 | u >> 12 & 63;outU8Array[outIdx++] = 128 | u >> 6 & 63;outU8Array[outIdx++] = 128 | u & 63;
    } else {
      if (outIdx + 5 >= endIdx) break;outU8Array[outIdx++] = 252 | u >> 30;outU8Array[outIdx++] = 128 | u >> 24 & 63;outU8Array[outIdx++] = 128 | u >> 18 & 63;outU8Array[outIdx++] = 128 | u >> 12 & 63;outU8Array[outIdx++] = 128 | u >> 6 & 63;outU8Array[outIdx++] = 128 | u & 63;
    }
  }outU8Array[outIdx] = 0;return outIdx - startIdx;
}Module["stringToUTF8Array"] = stringToUTF8Array;function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}Module["stringToUTF8"] = stringToUTF8;function lengthBytesUTF8(str) {
  var len = 0;for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;if (u <= 127) {
      ++len;
    } else if (u <= 2047) {
      len += 2;
    } else if (u <= 65535) {
      len += 3;
    } else if (u <= 2097151) {
      len += 4;
    } else if (u <= 67108863) {
      len += 5;
    } else {
      len += 6;
    }
  }return len;
}Module["lengthBytesUTF8"] = lengthBytesUTF8;var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;function demangle(func) {
  var __cxa_demangle_func = Module["___cxa_demangle"] || Module["__cxa_demangle"];if (__cxa_demangle_func) {
    try {
      var s = func.substr(1);var len = lengthBytesUTF8(s) + 1;var buf = _malloc(len);stringToUTF8(s, buf, len);var status = _malloc(4);var ret = __cxa_demangle_func(buf, 0, 0, status);if (getValue(status, "i32") === 0 && ret) {
        return Pointer_stringify(ret);
      }
    } catch (e) {} finally {
      if (buf) _free(buf);if (status) _free(status);if (ret) _free(ret);
    }return func;
  }Runtime.warnOnce("warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");return func;
}function demangleAll(text) {
  var regex = /__Z[\w\d_]+/g;return text.replace(regex, function (x) {
    var y = demangle(x);return x === y ? x : x + " [" + y + "]";
  });
}function jsStackTrace() {
  var err = new Error();if (!err.stack) {
    try {
      throw new Error(0);
    } catch (e) {
      err = e;
    }if (!err.stack) {
      return "(no stack trace available)";
    }
  }return err.stack.toString();
}function stackTrace() {
  var js = jsStackTrace();if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();return demangleAll(js);
}Module["stackTrace"] = stackTrace;var HEAP;var buffer;var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;function updateGlobalBufferViews() {
  Module["HEAP8"] = HEAP8 = new Int8Array(buffer);Module["HEAP16"] = HEAP16 = new Int16Array(buffer);Module["HEAP32"] = HEAP32 = new Int32Array(buffer);Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer);
}var STATIC_BASE, STATICTOP, staticSealed;var STACK_BASE, STACKTOP, STACK_MAX;var DYNAMIC_BASE, DYNAMICTOP_PTR;STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;staticSealed = false;function abortOnCannotGrowMemory() {
  abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which adjusts the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ");
}function enlargeMemory() {
  abortOnCannotGrowMemory();
}var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;if (TOTAL_MEMORY < TOTAL_STACK) Module.printErr("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + TOTAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");if (Module["buffer"]) {
  buffer = Module["buffer"];
} else {
  {
    buffer = new ArrayBuffer(TOTAL_MEMORY);
  }
}updateGlobalBufferViews();function getTotalMemory() {
  return TOTAL_MEMORY;
}HEAP32[0] = 1668509029;HEAP16[1] = 25459;if (HEAPU8[2] !== 115 || HEAPU8[3] !== 99) throw "Runtime error: expected the system to be little-endian!";Module["HEAP"] = HEAP;Module["buffer"] = buffer;Module["HEAP8"] = HEAP8;Module["HEAP16"] = HEAP16;Module["HEAP32"] = HEAP32;Module["HEAPU8"] = HEAPU8;Module["HEAPU16"] = HEAPU16;Module["HEAPU32"] = HEAPU32;Module["HEAPF32"] = HEAPF32;Module["HEAPF64"] = HEAPF64;function callRuntimeCallbacks(callbacks) {
  while (callbacks.length > 0) {
    var callback = callbacks.shift();if (typeof callback == "function") {
      callback();continue;
    }var func = callback.func;if (typeof func === "number") {
      if (callback.arg === undefined) {
        Module["dynCall_v"](func);
      } else {
        Module["dynCall_vi"](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}var __ATPRERUN__ = [];var __ATINIT__ = [];var __ATMAIN__ = [];var __ATEXIT__ = [];var __ATPOSTRUN__ = [];var runtimeInitialized = false;var runtimeExited = false;function preRun() {
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }callRuntimeCallbacks(__ATPRERUN__);
}function ensureInitRuntime() {
  if (runtimeInitialized) return;runtimeInitialized = true;callRuntimeCallbacks(__ATINIT__);
}function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);runtimeExited = true;
}function postRun() {
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }callRuntimeCallbacks(__ATPOSTRUN__);
}function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}Module["addOnPreRun"] = addOnPreRun;function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}Module["addOnInit"] = addOnInit;function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}Module["addOnPreMain"] = addOnPreMain;function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}Module["addOnExit"] = addOnExit;function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}Module["addOnPostRun"] = addOnPostRun;function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;var u8array = new Array(len);var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);if (dontAddNull) u8array.length = numBytesWritten;return u8array;
}Module["intArrayFromString"] = intArrayFromString;function intArrayToString(array) {
  var ret = [];for (var i = 0; i < array.length; i++) {
    var chr = array[i];if (chr > 255) {
      chr &= 255;
    }ret.push(String.fromCharCode(chr));
  }return ret.join("");
}Module["intArrayToString"] = intArrayToString;function writeStringToMemory(string, buffer, dontAddNull) {
  Runtime.warnOnce("writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!");var lastChar, end;if (dontAddNull) {
    end = buffer + lengthBytesUTF8(string);lastChar = HEAP8[end];
  }stringToUTF8(string, buffer, Infinity);if (dontAddNull) HEAP8[end] = lastChar;
}Module["writeStringToMemory"] = writeStringToMemory;function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer);
}Module["writeArrayToMemory"] = writeArrayToMemory;function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    HEAP8[buffer++ >> 0] = str.charCodeAt(i);
  }if (!dontAddNull) HEAP8[buffer >> 0] = 0;
}Module["writeAsciiToMemory"] = writeAsciiToMemory;if (!Math["imul"] || Math["imul"](4294967295, 5) !== -5) Math["imul"] = function imul(a, b) {
  var ah = a >>> 16;var al = a & 65535;var bh = b >>> 16;var bl = b & 65535;return al * bl + (ah * bl + al * bh << 16) | 0;
};Math.imul = Math["imul"];if (!Math["clz32"]) Math["clz32"] = function (x) {
  x = x >>> 0;for (var i = 0; i < 32; i++) {
    if (x & 1 << 31 - i) return i;
  }return 32;
};Math.clz32 = Math["clz32"];if (!Math["trunc"]) Math["trunc"] = function (x) {
  return x < 0 ? Math.ceil(x) : Math.floor(x);
};Math.trunc = Math["trunc"];var Math_abs = Math.abs;var Math_cos = Math.cos;var Math_sin = Math.sin;var Math_tan = Math.tan;var Math_acos = Math.acos;var Math_asin = Math.asin;var Math_atan = Math.atan;var Math_atan2 = Math.atan2;var Math_exp = Math.exp;var Math_log = Math.log;var Math_sqrt = Math.sqrt;var Math_ceil = Math.ceil;var Math_floor = Math.floor;var Math_pow = Math.pow;var Math_imul = Math.imul;var Math_fround = Math.fround;var Math_round = Math.round;var Math_min = Math.min;var Math_clz32 = Math.clz32;var Math_trunc = Math.trunc;var runDependencies = 0;var runDependencyWatcher = null;var dependenciesFulfilled = null;function addRunDependency(id) {
  runDependencies++;if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }
}Module["addRunDependency"] = addRunDependency;function removeRunDependency(id) {
  runDependencies--;if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);runDependencyWatcher = null;
    }if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;dependenciesFulfilled = null;callback();
    }
  }
}Module["removeRunDependency"] = removeRunDependency;Module["preloadedImages"] = {};Module["preloadedAudios"] = {};var ASM_CONSTS = [];STATIC_BASE = 8;STATICTOP = STATIC_BASE + 17328;__ATINIT__.push();allocate([0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 64, 0, 0, 32, 64, 0, 0, 0, 64, 154, 153, 153, 63, 0, 0, 0, 63, 0, 0, 0, 0, 0, 0, 0, 191, 51, 51, 51, 191, 205, 204, 76, 191, 102, 102, 102, 191, 0, 0, 128, 191, 0, 0, 32, 65, 0, 0, 208, 64, 102, 102, 166, 64, 0, 0, 144, 64, 154, 153, 121, 64, 0, 0, 96, 64, 0, 0, 64, 64, 0, 0, 32, 64, 51, 51, 19, 64, 102, 102, 230, 63, 0, 0, 128, 63, 0, 0, 48, 65, 205, 204, 12, 65, 0, 0, 240, 64, 0, 0, 208, 64, 0, 0, 160, 64, 154, 153, 121, 64, 154, 153, 121, 64, 154, 153, 121, 64, 0, 0, 96, 64, 0, 0, 64, 64, 0, 0, 128, 63, 0, 0, 48, 65, 0, 0, 48, 65, 102, 102, 30, 65, 0, 0, 8, 65, 0, 0, 224, 64, 0, 0, 192, 64, 0, 0, 144, 64, 0, 0, 128, 64, 0, 0, 128, 64, 0, 0, 128, 64, 0, 0, 0, 64, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 24, 65, 0, 0, 8, 65, 0, 0, 0, 65, 0, 0, 224, 64, 0, 0, 192, 64, 0, 0, 160, 64, 0, 0, 64, 64, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 24, 65, 0, 0, 8, 65, 0, 0, 224, 64, 0, 0, 192, 64, 0, 0, 160, 64, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 205, 204, 28, 65, 0, 0, 24, 65, 0, 0, 240, 64, 0, 0, 224, 64, 0, 0, 144, 64, 205, 204, 108, 64, 0, 0, 64, 64, 0, 0, 32, 64, 0, 0, 0, 64, 102, 102, 230, 63, 0, 0, 192, 63, 0, 0, 128, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 128, 191, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 24, 65, 0, 0, 8, 65, 0, 0, 240, 64, 0, 0, 192, 64, 0, 0, 160, 64, 154, 153, 121, 64, 0, 0, 64, 64, 0, 0, 0, 64, 0, 0, 128, 63, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 24, 65, 51, 51, 11, 65, 154, 153, 249, 64, 0, 0, 224, 64, 0, 0, 208, 64, 0, 0, 128, 64, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 0, 0, 48, 65, 205, 204, 28, 65, 0, 0, 240, 64, 0, 0, 176, 64, 164, 2, 0, 0, 1, 0, 0, 0, 40, 48, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 160, 0, 0, 0, 40, 0, 0, 0, 10, 0, 0, 0, 17, 0, 0, 0, 144, 0, 0, 0, 51, 115, 205, 76, 7, 0, 0, 0, 0, 0, 0, 0, 48, 3, 0, 0, 104, 3, 0, 0, 160, 3, 0, 0, 216, 3, 0, 0, 16, 4, 0, 0, 72, 4, 0, 0, 128, 4, 0, 0, 184, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 1, 0, 0, 0, 8, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 255, 255, 0, 0, 43, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 120, 5, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 132, 5, 0, 0, 205, 76, 0, 0, 119, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 88, 5, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 100, 5, 0, 0, 102, 70, 0, 0, 160, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 56, 5, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 68, 5, 0, 0, 154, 57, 0, 0, 220, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 4, 5, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 16, 5, 0, 0, 102, 38, 0, 0, 44, 1, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 4, 5, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 36, 5, 0, 0, 154, 25, 0, 0, 108, 1, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 4, 5, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 16, 5, 0, 0, 205, 12, 0, 0, 236, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 240, 4, 0, 0, 0, 64, 0, 0, 79, 0, 0, 0, 20, 0, 0, 0, 2, 0, 0, 0, 40, 30, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 112, 18, 0, 0, 7, 0, 0, 0, 7, 0, 0, 0, 5, 0, 0, 0, 8, 0, 0, 0, 168, 37, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 8, 0, 0, 0, 168, 32, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 232, 38, 0, 0, 5, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 5, 0, 0, 0, 112, 14, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 232, 38, 0, 0, 5, 0, 0, 0, 7, 0, 0, 0, 10, 0, 0, 0, 4, 0, 0, 0, 48, 13, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 232, 38, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 4, 0, 0, 0, 136, 29, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 204, 5, 0, 0, 6, 0, 0, 0, 51, 48, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 7, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 112, 2, 0, 0, 160, 0, 0, 0, 40, 0, 0, 0, 8, 0, 0, 0, 51, 115, 205, 76, 7, 0, 51, 115, 0, 0, 0, 0, 104, 6, 0, 0, 160, 6, 0, 0, 216, 6, 0, 0, 16, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 8, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 7, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 148, 1, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 0, 0, 36, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 92, 7, 0, 0, 255, 255, 0, 0, 112, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 72, 7, 0, 0, 255, 255, 0, 0, 192, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 72, 7, 0, 0, 255, 255, 0, 0, 96, 1, 0, 0, 8, 0, 0, 0, 5, 0, 0, 0, 112, 20, 0, 0, 7, 0, 0, 0, 1, 0, 0, 0, 10, 0, 0, 0, 4, 0, 0, 0, 104, 39, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 212, 73, 0, 0, 62, 98, 0, 0, 188, 130, 0, 0, 248, 173, 0, 0, 129, 231, 0, 0, 17, 52, 1, 0, 242, 153, 1, 0, 133, 33, 2, 0, 238, 213, 2, 0, 1, 198, 3, 0, 121, 5, 5, 0, 153, 174, 6, 0, 80, 228, 8, 0, 30, 213, 11, 0, 226, 190, 15, 0, 241, 243, 20, 0, 221, 225, 27, 0, 113, 26, 37, 0, 177, 95, 49, 0, 203, 179, 65, 0, 78, 110, 87, 0, 104, 88, 116, 0, 121, 210, 154, 0, 19, 6, 206, 0, 134, 40, 18, 1, 102, 211, 108, 1, 102, 122, 229, 1, 26, 8, 134, 2, 164, 174, 91, 3, 85, 253, 119, 4, 38, 82, 242, 5, 95, 197, 233, 7, 0, 0, 0, 0, 36, 0, 0, 0, 112, 0, 0, 0, 192, 0, 0, 0, 96, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 200, 0, 0, 0, 24, 8, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 160, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 140, 9, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 12, 0, 0, 0, 168, 63, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 140, 9, 0, 0, 122, 254, 4, 6, 127, 236, 155, 78, 155, 78, 127, 236, 4, 6, 216, 251, 1, 11, 218, 229, 101, 123, 181, 26, 34, 252, 47, 255, 47, 255, 34, 252, 181, 26, 101, 123, 218, 229, 1, 11, 216, 251, 56, 61, 144, 133, 56, 61, 186, 61, 143, 132, 186, 61, 231, 61, 50, 132, 231, 61, 34, 63, 190, 129, 34, 63, 82, 56, 92, 143, 82, 56, 0, 64, 175, 133, 143, 58, 0, 64, 175, 132, 145, 59, 0, 64, 67, 132, 224, 59, 0, 64, 199, 129, 75, 62, 0, 64, 82, 168, 137, 25, 49, 7, 43, 15, 163, 23, 126, 31, 204, 40, 12, 53, 128, 72, 234, 3, 120, 10, 222, 19, 104, 27, 148, 35, 5, 46, 20, 60, 236, 84, 49, 56, 26, 45, 72, 67, 255, 127, 251, 122, 19, 109, 77, 89, 126, 67, 23, 47, 84, 30, 8, 18, 229, 9, 3, 5, 2, 0, 249, 255, 249, 255, 18, 0, 15, 0, 217, 255, 231, 255, 75, 0, 35, 0, 126, 255, 215, 255, 212, 0, 38, 0, 185, 254, 239, 255, 227, 1, 224, 255, 79, 253, 124, 0, 188, 3, 229, 254, 229, 250, 31, 2, 244, 6, 51, 252, 93, 246, 197, 6, 49, 14, 245, 242, 247, 230, 99, 35, 201, 117, 201, 117, 99, 35, 247, 230, 245, 242, 49, 14, 197, 6, 93, 246, 51, 252, 244, 6, 31, 2, 229, 250, 229, 254, 188, 3, 124, 0, 79, 253, 224, 255, 227, 1, 239, 255, 185, 254, 38, 0, 212, 0, 215, 255, 126, 255, 35, 0, 75, 0, 231, 255, 217, 255, 15, 0, 18, 0, 249, 255, 249, 255, 2, 0, 39, 0, 44, 0, 50, 0, 57, 0, 64, 0, 73, 0, 83, 0, 94, 0, 106, 0, 120, 0, 136, 0, 154, 0, 175, 0, 198, 0, 225, 0, 255, 0, 32, 1, 71, 1, 114, 1, 164, 1, 220, 1, 27, 2, 99, 2, 180, 2, 16, 3, 121, 3, 239, 3, 117, 4, 13, 5, 185, 5, 124, 6, 89, 7, 125, 0, 164, 0, 215, 0, 26, 1, 114, 1, 228, 1, 123, 2, 64, 3, 66, 4, 148, 5, 79, 7, 148, 9, 141, 12, 114, 16, 140, 21, 60, 28, 0, 64, 209, 63, 71, 63, 98, 62, 40, 61, 156, 59, 198, 57, 174, 55, 91, 53, 215, 50, 42, 48, 30, 5, 33, 5, 41, 5, 53, 5, 72, 5, 95, 5, 123, 5, 156, 5, 195, 5, 238, 5, 31, 6, 85, 6, 143, 6, 207, 6, 19, 7, 92, 7, 170, 7, 252, 7, 84, 8, 176, 8, 16, 9, 117, 9, 222, 9, 76, 10, 190, 10, 52, 11, 174, 11, 44, 12, 174, 12, 52, 13, 190, 13, 75, 14, 220, 14, 112, 15, 8, 16, 163, 16, 65, 17, 226, 17, 134, 18, 45, 19, 215, 19, 131, 20, 49, 21, 226, 21, 149, 22, 75, 23, 2, 24, 187, 24, 118, 25, 50, 26, 240, 26, 175, 27, 112, 28, 49, 29, 244, 29, 183, 30, 123, 31, 64, 32, 4, 33, 202, 33, 143, 34, 84, 35, 25, 36, 222, 36, 163, 37, 103, 38, 42, 39, 236, 39, 174, 40, 110, 41, 45, 42, 235, 42, 168, 43, 99, 44, 28, 45, 211, 45, 136, 46, 59, 47, 236, 47, 155, 48, 71, 49, 241, 49, 152, 50, 60, 51, 221, 51, 123, 52, 22, 53, 174, 53, 66, 54, 211, 54, 96, 55, 234, 55, 112, 56, 242, 56, 112, 57, 234, 57, 96, 58, 210, 58, 64, 59, 169, 59, 14, 60, 110, 60, 202, 60, 33, 61, 116, 61, 194, 61, 11, 62, 79, 62, 143, 62, 201, 62, 255, 62, 47, 63, 91, 63, 129, 63, 163, 63, 191, 63, 214, 63, 232, 63, 245, 63, 253, 63, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 233, 63, 166, 63, 55, 63, 156, 62, 214, 61, 228, 60, 200, 59, 131, 58, 21, 57, 127, 55, 195, 53, 226, 51, 222, 49, 183, 47, 111, 45, 8, 43, 133, 40, 230, 37, 47, 35, 97, 32, 127, 29, 141, 26, 140, 23, 131, 20, 118, 17, 111, 14, 127, 11, 200, 8, 160, 6, 7, 17, 17, 27, 25, 22, 12, 4, 253, 0, 28, 220, 39, 232, 241, 3, 247, 15, 251, 10, 31, 228, 11, 31, 235, 9, 245, 245, 254, 249, 231, 14, 234, 31, 4, 242, 19, 244, 14, 251, 4, 249, 4, 251, 9, 0, 254, 42, 209, 240, 1, 8, 0, 9, 23, 199, 0, 28, 245, 6, 225, 55, 211, 3, 251, 4, 2, 254, 4, 249, 253, 6, 254, 7, 253, 12, 5, 8, 54, 246, 8, 249, 248, 232, 231, 229, 242, 251, 8, 5, 44, 23, 5, 247, 245, 245, 243, 247, 244, 248, 227, 248, 234, 6, 241, 3, 244, 255, 251, 253, 34, 255, 29, 240, 17, 252, 12, 2, 1, 4, 254, 252, 2, 255, 11, 253, 204, 28, 30, 247, 224, 25, 44, 236, 232, 4, 6, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 231, 246, 22, 29, 13, 243, 234, 243, 252, 0, 252, 240, 10, 15, 220, 232, 28, 25, 255, 253, 66, 223, 245, 241, 6, 0, 3, 4, 254, 5, 24, 236, 209, 29, 19, 254, 252, 255, 0, 255, 254, 3, 1, 8, 245, 5, 5, 199, 28, 28, 0, 240, 4, 252, 12, 250, 255, 2, 236, 61, 247, 24, 234, 214, 29, 6, 17, 8, 4, 2, 191, 15, 8, 10, 5, 6, 5, 3, 2, 254, 253, 5, 247, 4, 251, 23, 13, 23, 253, 193, 3, 251, 252, 250, 0, 253, 23, 220, 210, 9, 5, 5, 8, 4, 9, 251, 1, 253, 10, 1, 250, 10, 245, 24, 209, 31, 22, 244, 14, 246, 6, 11, 249, 249, 7, 225, 51, 244, 250, 7, 6, 239, 9, 245, 236, 52, 237, 3, 250, 250, 248, 251, 23, 215, 37, 1, 235, 10, 242, 8, 7, 5, 241, 241, 23, 39, 230, 223, 7, 2, 224, 226, 235, 248, 4, 12, 17, 15, 14, 11, 242, 9, 13, 224, 2, 246, 31, 246, 248, 248, 6, 252, 255, 10, 192, 23, 6, 20, 13, 6, 8, 234, 16, 34, 7, 42, 207, 228, 5, 26, 4, 241, 41, 34, 41, 32, 33, 24, 23, 14, 8, 40, 34, 4, 232, 215, 237, 241, 13, 243, 33, 202, 24, 27, 212, 33, 27, 241, 241, 24, 237, 14, 220, 14, 247, 24, 244, 252, 37, 251, 16, 222, 5, 10, 33, 241, 202, 240, 12, 25, 12, 1, 2, 0, 3, 255, 252, 252, 11, 2, 200, 54, 27, 236, 13, 250, 210, 215, 223, 245, 251, 7, 12, 14, 242, 251, 8, 20, 6, 3, 4, 248, 251, 214, 11, 8, 242, 25, 254, 2, 13, 11, 234, 39, 247, 9, 5, 211, 247, 7, 247, 12, 249, 34, 239, 154, 7, 2, 214, 18, 35, 247, 222, 11, 251, 254, 3, 22, 46, 204, 231, 247, 162, 8, 11, 251, 251, 251, 4, 249, 221, 249, 54, 5, 224, 3, 24, 247, 234, 8, 65, 37, 255, 244, 233, 250, 247, 228, 55, 223, 14, 253, 2, 18, 196, 41, 239, 8, 240, 17, 245, 0, 245, 29, 228, 37, 9, 203, 33, 242, 247, 7, 231, 249, 245, 26, 224, 248, 24, 235, 22, 237, 19, 246, 29, 242, 0, 0, 0, 0, 0, 0, 0, 0, 251, 204, 10, 41, 6, 226, 252, 16, 32, 22, 229, 234, 32, 253, 228, 253, 3, 221, 6, 17, 23, 21, 8, 2, 4, 211, 239, 14, 23, 252, 225, 245, 253, 14, 1, 19, 245, 2, 61, 248, 9, 244, 7, 246, 12, 253, 232, 99, 208, 23, 50, 219, 251, 233, 0, 8, 242, 35, 192, 251, 46, 231, 13, 255, 207, 237, 241, 9, 34, 50, 25, 11, 250, 247, 240, 236, 224, 223, 224, 229, 10, 248, 12, 241, 56, 242, 224, 33, 3, 247, 1, 65, 247, 247, 246, 254, 250, 233, 9, 17, 3, 228, 13, 224, 4, 254, 246, 4, 240, 76, 12, 204, 6, 13, 33, 250, 4, 242, 247, 253, 1, 241, 240, 28, 1, 241, 11, 16, 9, 4, 235, 219, 216, 250, 22, 12, 241, 233, 242, 239, 240, 247, 246, 247, 13, 217, 41, 5, 247, 16, 218, 25, 46, 209, 4, 49, 242, 17, 254, 6, 18, 5, 250, 223, 234, 44, 50, 254, 1, 3, 250, 7, 7, 253, 235, 38, 238, 34, 242, 215, 60, 243, 6, 16, 232, 35, 19, 243, 220, 24, 3, 239, 242, 246, 36, 44, 212, 227, 253, 3, 202, 248, 12, 55, 26, 4, 254, 251, 2, 245, 22, 233, 2, 22, 1, 231, 217, 66, 207, 21, 248, 254, 10, 242, 196, 25, 6, 10, 27, 231, 16, 5, 254, 247, 26, 243, 236, 58, 254, 7, 52, 247, 2, 5, 252, 241, 23, 255, 218, 23, 8, 27, 250, 0, 229, 249, 39, 246, 242, 26, 11, 211, 244, 9, 251, 34, 4, 221, 10, 43, 234, 245, 56, 249, 20, 1, 10, 1, 230, 9, 94, 11, 229, 242, 243, 1, 245, 0, 14, 251, 250, 246, 252, 241, 248, 215, 21, 251, 1, 228, 248, 22, 247, 33, 233, 252, 252, 244, 39, 4, 249, 3, 196, 80, 8, 239, 2, 250, 12, 251, 1, 9, 15, 27, 31, 30, 27, 23, 61, 47, 26, 10, 251, 248, 244, 243, 5, 238, 25, 241, 252, 241, 245, 12, 254, 254, 240, 254, 250, 24, 12, 11, 252, 9, 1, 247, 14, 211, 57, 12, 20, 221, 26, 11, 192, 32, 246, 246, 42, 252, 247, 240, 32, 24, 7, 10, 52, 245, 199, 29, 0, 8, 0, 250, 17, 239, 200, 216, 7, 20, 18, 12, 250, 16, 5, 7, 255, 9, 1, 10, 29, 12, 16, 13, 254, 23, 7, 9, 253, 252, 251, 18, 192, 13, 55, 231, 9, 247, 24, 14, 231, 15, 245, 216, 226, 37, 1, 237, 22, 251, 225, 13, 254, 0, 7, 252, 16, 189, 12, 66, 220, 24, 248, 18, 241, 233, 19, 0, 211, 249, 4, 3, 243, 13, 35, 5, 13, 33, 10, 27, 23, 0, 249, 245, 43, 182, 36, 244, 2, 5, 248, 6, 223, 11, 240, 242, 251, 249, 253, 17, 222, 27, 240, 11, 247, 15, 33, 225, 8, 240, 7, 250, 249, 63, 201, 239, 11, 255, 20, 210, 34, 226, 6, 9, 19, 28, 247, 5, 232, 248, 233, 254, 31, 237, 240, 251, 241, 238, 0, 26, 18, 37, 251, 241, 254, 17, 5, 229, 21, 223, 44, 12, 229, 247, 17, 11, 25, 235, 225, 249, 13, 33, 248, 231, 249, 7, 246, 4, 250, 247, 48, 174, 233, 248, 6, 11, 233, 3, 253, 49, 227, 25, 31, 4, 14, 16, 9, 252, 238, 10, 230, 3, 5, 212, 247, 9, 209, 201, 15, 9, 28, 1, 4, 253, 46, 6, 250, 218, 227, 225, 241, 250, 3, 0, 14, 250, 8, 202, 206, 33, 251, 1, 242, 33, 208, 26, 252, 251, 253, 251, 253, 251, 228, 234, 77, 55, 255, 2, 10, 10, 247, 242, 190, 207, 11, 220, 250, 236, 10, 246, 16, 12, 4, 255, 240, 45, 212, 206, 31, 254, 25, 42, 23, 224, 234, 0, 11, 20, 216, 221, 216, 220, 224, 230, 235, 243, 52, 234, 6, 232, 236, 17, 251, 248, 36, 231, 245, 21, 230, 6, 34, 248, 7, 20, 253, 5, 231, 248, 18, 251, 247, 252, 1, 247, 20, 20, 39, 48, 232, 9, 5, 191, 22, 29, 4, 3, 213, 245, 32, 250, 9, 19, 229, 246, 209, 242, 24, 10, 249, 220, 249, 255, 252, 251, 251, 16, 53, 25, 230, 227, 252, 244, 45, 198, 222, 33, 251, 2, 255, 27, 208, 31, 241, 22, 251, 4, 7, 7, 231, 253, 11, 234, 16, 244, 8, 253, 7, 245, 45, 14, 183, 237, 56, 210, 24, 236, 28, 244, 254, 255, 220, 253, 223, 19, 250, 7, 2, 241, 5, 225, 211, 8, 35, 13, 20, 0, 247, 48, 243, 213, 253, 243, 2, 251, 72, 188, 229, 2, 1, 254, 249, 5, 36, 33, 216, 244, 252, 251, 23, 19, 224, 224, 224, 0, 228, 189, 251, 33, 214, 250, 224, 18, 199, 246, 202, 35, 240, 27, 215, 42, 19, 237, 216, 36, 211, 24, 235, 40, 248, 242, 238, 28, 1, 14, 198, 53, 238, 168, 217, 39, 218, 21, 238, 37, 237, 20, 213, 38, 10, 17, 208, 54, 204, 198, 243, 33, 212, 255, 245, 32, 244, 245, 222, 22, 14, 0, 210, 46, 219, 221, 222, 5, 231, 44, 226, 43, 6, 252, 193, 49, 225, 43, 215, 43, 233, 30, 213, 41, 213, 26, 242, 44, 223, 1, 243, 27, 243, 18, 219, 37, 210, 183, 211, 34, 220, 24, 231, 34, 220, 245, 236, 19, 231, 12, 238, 33, 220, 187, 197, 34, 211, 6, 8, 46, 234, 242, 232, 18, 255, 13, 212, 44, 217, 208, 230, 15, 224, 31, 219, 34, 223, 15, 210, 31, 232, 30, 220, 37, 215, 31, 233, 41, 206, 22, 252, 50, 234, 2, 235, 28, 239, 30, 222, 40, 249, 196, 228, 29, 218, 42, 228, 42, 212, 245, 21, 43, 240, 8, 212, 34, 217, 201, 213, 21, 245, 221, 26, 41, 247, 0, 222, 29, 248, 121, 175, 113, 7, 240, 234, 33, 219, 33, 225, 36, 229, 249, 220, 17, 222, 70, 199, 65, 219, 245, 208, 21, 216, 17, 255, 44, 223, 6, 250, 33, 247, 0, 236, 34, 235, 69, 223, 57, 227, 33, 225, 35, 201, 12, 255, 49, 223, 27, 234, 35, 206, 223, 209, 17, 206, 54, 51, 94, 255, 251, 212, 35, 252, 22, 216, 45, 217, 190, 231, 24, 223, 1, 230, 20, 232, 233, 231, 12, 245, 21, 211, 44, 231, 211, 237, 17, 213, 105, 240, 82, 5, 235, 1, 41, 240, 11, 223, 30, 243, 157, 252, 57, 219, 33, 241, 44, 231, 37, 193, 54, 220, 24, 225, 31, 203, 200, 218, 26, 215, 252, 4, 37, 223, 13, 226, 24, 49, 52, 162, 114, 251, 226, 241, 23, 1, 38, 216, 56, 233, 12, 220, 29, 239, 40, 209, 51, 219, 215, 217, 11, 207, 34, 0, 58, 238, 249, 252, 34, 240, 17, 229, 35, 30, 5, 194, 65, 4, 48, 188, 76, 213, 11, 245, 38, 238, 19, 241, 41, 233, 194, 217, 23, 214, 10, 254, 41, 235, 243, 243, 25, 247, 13, 209, 42, 233, 194, 232, 24, 212, 60, 235, 58, 238, 253, 204, 32, 234, 22, 220, 34, 181, 57, 16, 90, 237, 3, 10, 45, 227, 23, 218, 32, 251, 194, 205, 38, 205, 40, 238, 53, 214, 13, 232, 32, 222, 14, 236, 30, 200, 181, 230, 37, 230, 32, 15, 59, 230, 17, 227, 29, 249, 28, 204, 53, 244, 226, 5, 30, 251, 208, 251, 35, 2, 2, 213, 40, 21, 16, 16, 75, 231, 211, 224, 10, 213, 18, 246, 42, 9, 0, 255, 52, 255, 7, 226, 36, 19, 208, 252, 48, 228, 25, 227, 32, 234, 0, 225, 22, 224, 17, 246, 36, 192, 215, 194, 36, 204, 15, 16, 58, 226, 234, 224, 6, 249, 9, 218, 36, 232, 21, 236, 5, 251, 249, 14, 246, 2, 229, 16, 236, 0, 224, 26, 19, 8, 245, 215, 31, 28, 229, 224, 34, 42, 34, 239, 22, 246, 13, 227, 18, 244, 230, 232, 11, 22, 5, 251, 251, 54, 188, 213, 57, 231, 24, 4, 4, 26, 248, 244, 239, 54, 30, 211, 1, 10, 241, 18, 215, 11, 68, 189, 37, 240, 232, 240, 38, 234, 6, 227, 30, 66, 229, 5, 7, 240, 13, 2, 244, 249, 253, 236, 36, 4, 228, 9, 3, 32, 48, 26, 39, 3, 0, 7, 235, 243, 5, 174, 249, 73, 236, 34, 247, 251, 1, 255, 10, 251, 246, 255, 9, 1, 247, 10, 0, 242, 11, 255, 254, 255, 11, 20, 96, 175, 234, 244, 247, 198, 9, 24, 226, 26, 221, 27, 244, 13, 238, 56, 197, 15, 249, 23, 241, 255, 6, 231, 14, 234, 236, 47, 245, 16, 2, 38, 233, 237, 226, 247, 40, 245, 5, 4, 250, 8, 26, 235, 245, 127, 4, 1, 6, 247, 2, 249, 254, 253, 7, 251, 10, 237, 7, 150, 91, 253, 9, 252, 21, 248, 26, 176, 8, 1, 254, 246, 239, 239, 229, 32, 71, 6, 227, 11, 233, 54, 218, 29, 234, 39, 87, 225, 244, 236, 3, 254, 254, 2, 20, 0, 255, 221, 27, 9, 250, 244, 3, 244, 250, 13, 1, 14, 234, 197, 241, 239, 231, 13, 249, 7, 3, 0, 1, 249, 6, 253, 61, 219, 233, 233, 227, 38, 225, 27, 1, 248, 2, 229, 23, 230, 36, 222, 5, 24, 232, 250, 7, 3, 197, 78, 194, 44, 240, 1, 6, 0, 17, 8, 45, 0, 146, 6, 14, 254, 32, 179, 200, 62, 253, 3, 243, 4, 240, 102, 241, 220, 255, 9, 143, 6, 23, 0, 9, 9, 5, 248, 255, 242, 5, 244, 121, 203, 229, 248, 247, 22, 243, 3, 2, 253, 1, 254, 185, 95, 38, 237, 15, 240, 251, 71, 10, 2, 224, 243, 251, 15, 255, 254, 242, 171, 30, 29, 6, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 191, 200, 247, 18, 18, 23, 242, 254, 0, 12, 227, 26, 244, 1, 2, 244, 192, 90, 250, 4, 1, 5, 251, 146, 253, 225, 22, 227, 9, 0, 8, 216, 251, 21, 251, 251, 13, 10, 238, 40, 1, 35, 236, 30, 228, 11, 250, 19, 7, 14, 18, 192, 9, 250, 16, 51, 68, 8, 16, 12, 248, 0, 247, 20, 234, 25, 7, 252, 243, 41, 221, 93, 238, 202, 11, 255, 1, 247, 4, 190, 66, 225, 20, 234, 25, 233, 11, 10, 9, 19, 15, 11, 251, 225, 246, 233, 228, 250, 250, 253, 252, 5, 3, 228, 22, 245, 214, 25, 231, 240, 41, 34, 47, 250, 2, 42, 237, 234, 5, 217, 32, 6, 221, 22, 17, 226, 8, 230, 245, 245, 3, 244, 33, 33, 219, 21, 255, 6, 252, 3, 0, 251, 5, 12, 244, 57, 27, 195, 253, 20, 239, 2, 0, 4, 0, 254, 223, 198, 81, 233, 39, 246, 251, 2, 6, 249, 5, 4, 253, 254, 243, 233, 184, 107, 15, 251, 0, 249, 253, 250, 5, 252, 15, 47, 12, 225, 25, 240, 8, 22, 231, 194, 200, 238, 14, 28, 12, 2, 245, 74, 190, 41, 236, 249, 16, 236, 16, 248, 0, 240, 4, 237, 92, 12, 197, 242, 217, 49, 231, 240, 23, 229, 19, 253, 223, 19, 85, 227, 6, 249, 246, 16, 249, 244, 1, 250, 2, 4, 254, 64, 10, 231, 41, 254, 225, 15, 0, 110, 50, 69, 35, 28, 19, 246, 2, 213, 207, 200, 241, 240, 10, 3, 12, 255, 248, 1, 26, 244, 255, 7, 245, 229, 41, 25, 1, 245, 238, 22, 249, 255, 209, 248, 23, 253, 239, 249, 18, 131, 59, 251, 3, 18, 1, 2, 3, 27, 221, 65, 203, 50, 210, 37, 235, 228, 7, 14, 219, 251, 251, 12, 5, 248, 78, 237, 21, 250, 240, 8, 249, 5, 2, 7, 2, 10, 250, 12, 196, 44, 11, 220, 224, 31, 0, 2, 254, 2, 1, 253, 7, 246, 17, 235, 10, 6, 254, 19, 254, 59, 218, 170, 38, 8, 215, 226, 211, 223, 7, 15, 28, 29, 249, 24, 216, 7, 7, 5, 254, 9, 24, 233, 238, 6, 227, 30, 2, 28, 49, 245, 210, 10, 43, 243, 247, 255, 253, 249, 249, 239, 250, 97, 223, 235, 3, 5, 1, 12, 213, 248, 28, 7, 213, 249, 17, 236, 19, 255, 2, 243, 9, 54, 34, 9, 228, 245, 247, 239, 110, 197, 44, 230, 0, 3, 244, 209, 73, 222, 213, 38, 223, 16, 251, 210, 252, 250, 254, 231, 19, 227, 28, 243, 5, 14, 27, 216, 213, 4, 32, 243, 254, 221, 252, 112, 214, 9, 244, 37, 228, 17, 14, 237, 35, 217, 23, 3, 242, 255, 199, 251, 94, 247, 3, 217, 5, 30, 246, 224, 42, 243, 242, 159, 193, 30, 247, 1, 249, 12, 5, 20, 17, 247, 220, 226, 25, 47, 247, 241, 12, 234, 98, 248, 206, 15, 229, 21, 240, 245, 2, 12, 246, 10, 253, 33, 36, 160, 0, 239, 31, 247, 9, 3, 236, 13, 245, 8, 252, 10, 246, 9, 1, 112, 186, 229, 5, 235, 2, 199, 253, 227, 10, 19, 235, 21, 246, 190, 253, 91, 221, 30, 244, 0, 249, 59, 228, 26, 2, 14, 238, 1, 1, 11, 17, 20, 202, 197, 27, 4, 29, 32, 5, 19, 12, 252, 1, 7, 246, 5, 254, 10, 0, 23, 251, 28, 152, 46, 11, 16, 3, 29, 1, 248, 242, 1, 7, 206, 88, 194, 26, 8, 239, 242, 50, 0, 32, 244, 253, 229, 18, 248, 251, 8, 3, 236, 245, 37, 244, 9, 33, 46, 155, 255, 252, 1, 6, 255, 28, 214, 241, 16, 5, 255, 254, 201, 85, 38, 247, 252, 11, 254, 247, 250, 3, 236, 246, 179, 89, 24, 253, 152, 199, 230, 225, 236, 250, 247, 14, 20, 233, 46, 241, 225, 28, 1, 241, 254, 6, 254, 31, 45, 180, 23, 231, 39, 12, 242, 236, 227, 195, 189, 180, 224, 185, 189, 68, 77, 46, 34, 5, 243, 208, 210, 184, 175, 172, 196, 198, 216, 228, 82, 93, 68, 45, 29, 3, 237, 209, 228, 213, 221, 226, 248, 243, 217, 165, 165, 133, 160, 10, 10, 250, 238, 201, 196, 165, 200, 220, 229, 240, 208, 181, 40, 28, 246, 228, 35, 9, 37, 19, 1, 236, 225, 215, 238, 231, 221, 188, 176, 45, 27, 255, 47, 13, 0, 227, 221, 199, 206, 177, 183, 218, 237, 5, 35, 14, 246, 233, 16, 248, 5, 232, 216, 194, 233, 229, 234, 240, 238, 210, 184, 179, 43, 21, 33, 1, 176, 186, 186, 192, 200, 204, 217, 223, 225, 218, 237, 237, 241, 32, 33, 254, 7, 241, 241, 232, 233, 223, 215, 200, 232, 199, 5, 89, 64, 41, 27, 5, 247, 209, 196, 159, 159, 132, 236, 247, 212, 183, 31, 29, 252, 64, 48, 7, 221, 199, 0, 253, 230, 209, 253, 250, 216, 180, 177, 208, 12, 81, 55, 10, 9, 232, 213, 183, 199, 187, 16, 5, 228, 203, 18, 29, 20, 0, 252, 245, 6, 243, 23, 7, 239, 221, 219, 219, 226, 188, 193, 6, 24, 247, 242, 3, 21, 243, 229, 199, 207, 176, 232, 215, 251, 240, 251, 1, 45, 25, 12, 249, 3, 241, 250, 240, 241, 248, 6, 243, 214, 175, 176, 169, 14, 1, 246, 253, 213, 187, 210, 232, 228, 227, 36, 6, 213, 200, 244, 12, 54, 79, 43, 9, 54, 22, 2, 8, 244, 213, 210, 204, 218, 187, 167, 251, 75, 38, 33, 5, 243, 203, 194, 169, 167, 143, 157, 201, 222, 219, 62, 55, 33, 16, 21, 254, 239, 210, 227, 218, 218, 208, 217, 214, 220, 181, 184, 168, 208, 226, 21, 2, 241, 199, 192, 158, 172, 180, 25, 1, 210, 176, 244, 18, 249, 3, 34, 6, 38, 31, 23, 4, 255, 20, 14, 241, 213, 178, 165, 232, 14, 253, 54, 16, 0, 229, 228, 212, 200, 173, 164, 167, 253, 34, 56, 41, 36, 22, 20, 248, 249, 221, 214, 194, 207, 3, 12, 246, 206, 169, 160, 190, 92, 70, 38, 9, 186, 185, 194, 214, 217, 213, 245, 249, 206, 177, 198, 206, 225, 32, 31, 250, 252, 231, 7, 239, 218, 186, 198, 229, 213, 173, 228, 59, 36, 20, 31, 2, 229, 185, 176, 147, 158, 181, 223, 224, 225, 254, 33, 15, 250, 43, 33, 251, 0, 234, 246, 229, 222, 207, 245, 236, 215, 165, 156, 135, 217, 57, 41, 10, 237, 206, 218, 197, 196, 186, 238, 236, 248, 225, 248, 241, 1, 242, 230, 231, 33, 21, 32, 17, 1, 237, 237, 230, 198, 175, 221, 234, 45, 30, 11, 245, 3, 230, 208, 169, 189, 173, 198, 3, 255, 230, 236, 44, 10, 25, 39, 5, 247, 221, 229, 218, 7, 10, 4, 247, 214, 171, 154, 129, 52, 44, 28, 10, 209, 195, 216, 217, 239, 255, 246, 223, 214, 182, 208, 21, 252, 70, 52, 10, 220, 194, 6, 247, 246, 242, 200, 23, 1, 230, 23, 208, 239, 12, 8, 249, 23, 29, 220, 228, 250, 227, 239, 251, 40, 23, 10, 10, 210, 243, 36, 6, 4, 226, 227, 62, 32, 224, 255, 22, 242, 1, 252, 234, 211, 2, 54, 4, 226, 199, 197, 244, 27, 253, 225, 8, 247, 5, 10, 242, 32, 66, 19, 9, 2, 231, 219, 23, 241, 18, 218, 225, 5, 247, 235, 15, 0, 22, 62, 30, 15, 244, 242, 210, 77, 21, 33, 3, 34, 29, 237, 50, 2, 11, 9, 218, 244, 219, 62, 1, 241, 54, 32, 6, 2, 232, 20, 35, 235, 2, 19, 24, 243, 55, 4, 9, 39, 237, 30, 255, 235, 73, 54, 33, 8, 18, 3, 15, 6, 237, 209, 6, 253, 208, 206, 1, 26, 20, 8, 233, 206, 65, 242, 201, 239, 225, 219, 228, 53, 255, 239, 203, 1, 57, 11, 248, 231, 226, 219, 64, 5, 204, 211, 15, 23, 31, 15, 14, 231, 24, 33, 254, 212, 200, 238, 6, 235, 213, 4, 244, 17, 219, 20, 246, 34, 15, 2, 15, 55, 21, 245, 225, 250, 46, 25, 16, 247, 231, 248, 194, 28, 17, 20, 224, 227, 26, 30, 25, 237, 2, 240, 239, 26, 205, 2, 50, 42, 19, 190, 23, 29, 254, 3, 19, 237, 219, 32, 15, 6, 30, 222, 13, 11, 251, 40, 31, 10, 214, 4, 247, 26, 247, 186, 17, 254, 233, 20, 234, 201, 51, 232, 225, 22, 234, 15, 243, 3, 246, 228, 240, 56, 4, 193, 11, 238, 241, 238, 218, 221, 16, 249, 34, 255, 235, 207, 209, 9, 219, 7, 8, 69, 55, 20, 6, 223, 211, 246, 247, 6, 247, 12, 71, 15, 253, 214, 249, 232, 32, 221, 254, 214, 239, 251, 0, 254, 223, 202, 13, 244, 222, 47, 23, 19, 55, 7, 248, 74, 31, 14, 16, 233, 230, 19, 12, 238, 207, 228, 225, 236, 2, 242, 236, 209, 78, 40, 13, 233, 245, 21, 250, 18, 1, 47, 5, 38, 35, 32, 46, 22, 8, 13, 16, 242, 18, 51, 19, 40, 39, 11, 230, 255, 239, 47, 2, 203, 241, 31, 234, 38, 21, 241, 240, 5, 223, 53, 15, 218, 86, 11, 253, 232, 49, 13, 252, 245, 238, 28, 20, 244, 229, 230, 35, 231, 221, 253, 236, 195, 30, 10, 201, 244, 234, 204, 202, 242, 19, 224, 244, 45, 15, 248, 208, 247, 11, 224, 8, 240, 222, 243, 51, 18, 38, 254, 224, 239, 22, 254, 238, 228, 186, 59, 27, 228, 237, 246, 236, 247, 247, 248, 235, 21, 248, 35, 254, 45, 253, 247, 12, 0, 30, 7, 217, 43, 27, 218, 165, 30, 26, 19, 201, 252, 63, 14, 239, 13, 9, 13, 2, 7, 4, 6, 61, 72, 255, 239, 29, 255, 234, 239, 8, 228, 219, 63, 44, 41, 3, 2, 14, 9, 250, 75, 248, 249, 244, 241, 244, 13, 9, 252, 30, 234, 191, 15, 0, 211, 4, 252, 1, 5, 22, 11, 23, 85, 110, 107, 110, 111, 119, 110, 32, 110, 98, 95, 109, 111, 100, 101, 95, 113, 117, 101, 114, 121, 32, 114, 101, 113, 117, 101, 115, 116, 58, 32, 0, 80, 97, 99, 107, 101, 116, 32, 105, 115, 32, 108, 97, 114, 103, 101, 114, 32, 116, 104, 97, 110, 32, 97, 108, 108, 111, 99, 97, 116, 101, 100, 32, 98, 117, 102, 102, 101, 114, 0, 67, 111, 117, 108, 100, 32, 110, 111, 116, 32, 114, 101, 115, 105, 122, 101, 32, 105, 110, 112, 117, 116, 32, 98, 117, 102, 102, 101, 114, 58, 32, 116, 114, 117, 110, 99, 97, 116, 105, 110, 103, 32, 105, 110, 112, 117, 116, 0, 68, 111, 32, 110, 111, 116, 32, 111, 119, 110, 32, 105, 110, 112, 117, 116, 32, 98, 117, 102, 102, 101, 114, 58, 32, 116, 114, 117, 110, 99, 97, 116, 105, 110, 103, 32, 111, 118, 101, 114, 115, 105, 122, 101, 32, 105, 110, 112, 117, 116, 0, 66, 117, 102, 102, 101, 114, 32, 116, 111, 111, 32, 115, 109, 97, 108, 108, 32, 116, 111, 32, 112, 97, 99, 107, 32, 98, 105, 116, 115, 0, 67, 111, 117, 108, 100, 32, 110, 111, 116, 32, 114, 101, 115, 105, 122, 101, 32, 105, 110, 112, 117, 116, 32, 98, 117, 102, 102, 101, 114, 58, 32, 110, 111, 116, 32, 112, 97, 99, 107, 105, 110, 103, 0, 68, 111, 32, 110, 111, 116, 32, 111, 119, 110, 32, 105, 110, 112, 117, 116, 32, 98, 117, 102, 102, 101, 114, 58, 32, 110, 111, 116, 32, 112, 97, 99, 107, 105, 110, 103, 0, 22, 39, 14, 44, 11, 35, 254, 23, 252, 6, 46, 228, 13, 229, 233, 12, 4, 20, 251, 9, 37, 238, 233, 23, 0, 9, 250, 236, 4, 255, 239, 251, 252, 17, 0, 1, 9, 254, 1, 2, 2, 244, 8, 231, 39, 15, 9, 16, 201, 245, 9, 11, 5, 10, 254, 196, 8, 13, 250, 11, 240, 27, 209, 244, 11, 1, 16, 249, 9, 253, 227, 9, 242, 25, 237, 34, 36, 12, 40, 246, 253, 232, 242, 219, 235, 221, 254, 220, 3, 250, 67, 28, 6, 239, 253, 244, 240, 241, 239, 249, 197, 220, 243, 1, 7, 1, 2, 10, 2, 11, 13, 10, 8, 254, 7, 3, 5, 4, 2, 2, 253, 248, 4, 251, 6, 7, 214, 15, 35, 254, 210, 38, 28, 236, 247, 1, 7, 253, 0, 254, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 241, 228, 52, 32, 5, 251, 239, 236, 246, 255, 12, 32, 25, 46, 36, 33, 9, 14, 253, 6, 1, 248, 0, 246, 251, 249, 249, 249, 251, 251, 31, 229, 24, 224, 252, 10, 245, 21, 253, 19, 23, 247, 22, 24, 246, 255, 246, 243, 249, 245, 42, 223, 31, 19, 248, 0, 246, 240, 1, 235, 239, 10, 248, 14, 8, 4, 11, 254, 5, 254, 223, 11, 240, 33, 11, 252, 9, 252, 11, 2, 6, 251, 8, 251, 11, 252, 250, 26, 220, 240, 0, 4, 254, 248, 12, 6, 255, 34, 210, 234, 9, 9, 21, 9, 5, 190, 251, 26, 2, 10, 13, 2, 19, 9, 12, 175, 3, 13, 13, 0, 242, 22, 221, 6, 249, 252, 6, 250, 10, 250, 225, 38, 223, 0, 246, 245, 5, 244, 12, 239, 5, 0, 250, 13, 247, 10, 8, 25, 33, 2, 244, 8, 250, 10, 254, 21, 7, 17, 43, 5, 11, 249, 247, 236, 220, 236, 233, 252, 252, 253, 27, 247, 247, 207, 217, 218, 245, 247, 6, 5, 23, 25, 5, 3, 3, 4, 1, 2, 253, 255, 87, 39, 17, 235, 247, 237, 247, 241, 243, 242, 239, 245, 246, 245, 248, 250, 255, 253, 253, 255, 202, 222, 229, 248, 245, 252, 251, 0, 0, 4, 8, 6, 9, 7, 9, 7, 6, 5, 5, 5, 48, 10, 19, 246, 12, 255, 9, 253, 2, 5, 253, 2, 254, 254, 0, 254, 230, 6, 9, 249, 240, 247, 2, 7, 7, 251, 213, 11, 22, 245, 247, 34, 37, 241, 243, 250, 1, 255, 1, 1, 192, 56, 52, 245, 229, 5, 4, 3, 1, 2, 1, 3, 255, 252, 252, 246, 249, 252, 252, 2, 255, 249, 249, 244, 246, 241, 247, 251, 251, 245, 240, 243, 6, 16, 4, 243, 240, 246, 252, 2, 209, 243, 25, 47, 19, 242, 236, 248, 239, 0, 253, 243, 1, 6, 239, 242, 15, 1, 10, 6, 232, 0, 246, 19, 187, 248, 14, 49, 17, 251, 33, 227, 3, 252, 0, 2, 248, 5, 250, 2, 120, 200, 244, 209, 23, 247, 6, 251, 1, 2, 251, 1, 246, 4, 255, 255, 4, 255, 0, 253, 30, 204, 189, 30, 22, 11, 255, 252, 3, 0, 7, 2, 0, 1, 246, 252, 248, 243, 5, 1, 1, 255, 5, 13, 247, 253, 246, 194, 22, 48, 252, 250, 2, 3, 5, 1, 1, 4, 1, 13, 3, 236, 10, 247, 13, 254, 252, 9, 236, 44, 255, 20, 224, 189, 19, 0, 28, 11, 8, 2, 245, 15, 237, 203, 31, 2, 34, 10, 6, 252, 198, 8, 10, 13, 14, 1, 12, 2, 0, 0, 128, 37, 248, 44, 247, 26, 253, 18, 2, 6, 11, 255, 9, 1, 5, 3, 0, 1, 1, 2, 12, 3, 254, 253, 7, 25, 9, 18, 250, 219, 3, 248, 240, 3, 246, 249, 17, 222, 212, 11, 17, 241, 253, 240, 255, 243, 11, 210, 191, 254, 8, 13, 2, 4, 4, 5, 15, 5, 9, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 247, 19, 244, 12, 228, 38, 29, 255, 12, 2, 5, 23, 246, 3, 4, 241, 21, 252, 3, 3, 6, 17, 247, 252, 248, 236, 26, 5, 246, 6, 1, 237, 18, 241, 244, 47, 250, 254, 249, 247, 255, 239, 254, 254, 242, 30, 242, 2, 249, 252, 255, 244, 11, 231, 16, 253, 244, 11, 249, 7, 239, 1, 19, 228, 31, 249, 246, 7, 246, 3, 12, 5, 240, 6, 24, 41, 227, 202, 0, 1, 7, 255, 5, 250, 13, 10, 252, 248, 8, 247, 229, 203, 218, 255, 10, 19, 17, 16, 12, 12, 0, 3, 249, 252, 13, 12, 225, 242, 6, 251, 3, 5, 17, 43, 50, 25, 10, 1, 250, 254, 248, 219, 5, 213, 5, 73, 61, 39, 12, 253, 195, 224, 2, 42, 30, 253, 17, 229, 9, 34, 20, 255, 251, 2, 23, 249, 210, 26, 53, 209, 20, 254, 223, 167, 205, 192, 27, 11, 15, 222, 251, 200, 25, 247, 255, 227, 1, 40, 67, 233, 240, 16, 33, 19, 7, 14, 85, 22, 246, 246, 244, 249, 255, 52, 89, 29, 11, 236, 219, 210, 241, 17, 232, 228, 24, 2, 1, 0, 23, 155, 23, 14, 255, 233, 238, 9, 5, 243, 38, 1, 228, 228, 4, 27, 51, 230, 34, 216, 35, 47, 54, 38, 202, 230, 250, 42, 231, 13, 226, 220, 18, 41, 252, 223, 23, 224, 249, 252, 51, 253, 17, 204, 56, 209, 36, 254, 235, 36, 10, 8, 223, 31, 19, 9, 251, 216, 10, 247, 235, 19, 18, 178, 238, 251, 0, 230, 220, 209, 205, 212, 18, 40, 27, 254, 29, 49, 230, 2, 32, 202, 30, 183, 54, 3, 251, 36, 22, 53, 10, 255, 172, 203, 227, 251, 3, 212, 53, 205, 4, 22, 71, 221, 255, 33, 251, 229, 249, 36, 17, 233, 217, 16, 247, 201, 241, 236, 39, 221, 6, 217, 242, 18, 48, 192, 239, 241, 9, 39, 81, 37, 188, 37, 47, 235, 250, 152, 13, 6, 9, 254, 35, 8, 233, 18, 42, 45, 21, 33, 251, 207, 9, 250, 213, 200, 39, 2, 240, 231, 87, 1, 253, 247, 17, 231, 245, 247, 255, 10, 2, 242, 242, 4, 255, 246, 28, 233, 40, 224, 26, 247, 26, 4, 229, 233, 3, 42, 196, 1, 49, 253, 27, 10, 204, 216, 254, 18, 45, 233, 17, 212, 3, 253, 17, 210, 52, 216, 209, 25, 75, 31, 207, 53, 30, 226, 224, 220, 38, 250, 241, 240, 54, 229, 208, 3, 38, 227, 224, 234, 242, 252, 233, 243, 32, 217, 9, 8, 211, 243, 34, 240, 49, 40, 32, 31, 28, 23, 23, 32, 47, 59, 188, 8, 62, 44, 25, 242, 232, 191, 240, 36, 67, 231, 218, 235, 4, 223, 254, 42, 5, 193, 40, 11, 26, 214, 233, 195, 79, 225, 23, 236, 10, 224, 53, 231, 220, 10, 230, 251, 3, 0, 185, 5, 246, 219, 1, 232, 21, 202, 239, 1, 227, 231, 241, 229, 32, 68, 45, 240, 219, 238, 251, 1, 0, 179, 71, 250, 3, 236, 71, 189, 29, 221, 10, 226, 19, 4, 16, 17, 5, 0, 242, 19, 2, 28, 26, 59, 3, 2, 24, 39, 55, 206, 211, 238, 239, 33, 221, 14, 255, 1, 8, 87, 221, 227, 0, 229, 13, 249, 23, 243, 37, 216, 50, 221, 14, 19, 249, 242, 49, 54, 251, 22, 254, 227, 248, 229, 38, 13, 27, 48, 12, 215, 235, 241, 28, 7, 240, 232, 237, 236, 11, 236, 9, 2, 13, 23, 236, 11, 27, 229, 71, 187, 8, 2, 250, 22, 12, 16, 16, 9, 240, 248, 239, 1, 25, 1, 40, 219, 223, 66, 94, 53, 4, 234, 231, 215, 214, 25, 35, 240, 241, 57, 31, 227, 224, 21, 16, 196, 45, 15, 255, 7, 57, 230, 209, 227, 11, 8, 15, 19, 151, 248, 54, 27, 10, 239, 6, 244, 255, 246, 4, 0, 23, 246, 31, 13, 11, 10, 12, 192, 23, 253, 248, 237, 16, 52, 24, 216, 16, 10, 40, 5, 9, 0, 243, 249, 235, 248, 250, 249, 235, 59, 16, 203, 18, 196, 11, 209, 14, 238, 25, 243, 232, 4, 217, 16, 228, 54, 26, 189, 30, 27, 236, 204, 20, 244, 55, 12, 18, 240, 39, 242, 250, 230, 56, 168, 201, 12, 25, 26, 219, 6, 75, 0, 222, 175, 54, 226, 1, 249, 49, 233, 242, 21, 10, 194, 198, 199, 209, 222, 15, 252, 34, 178, 31, 25, 245, 7, 50, 246, 42, 193, 14, 220, 252, 57, 55, 57, 53, 42, 214, 255, 15, 40, 37, 15, 25, 245, 6, 1, 31, 254, 250, 255, 249, 192, 34, 28, 30, 255, 3, 21, 0, 168, 244, 200, 25, 228, 40, 8, 228, 242, 9, 12, 2, 250, 239, 22, 49, 250, 230, 14, 28, 236, 4, 244, 50, 35, 40, 13, 218, 198, 227, 17, 30, 22, 60, 26, 202, 217, 244, 58, 228, 193, 10, 235, 248, 244, 26, 194, 6, 246, 245, 234, 250, 249, 4, 1, 18, 2, 186, 11, 14, 4, 13, 19, 232, 222, 24, 67, 17, 51, 235, 13, 23, 54, 226, 48, 1, 243, 80, 26, 240, 254, 13, 252, 6, 226, 29, 232, 73, 198, 30, 229, 20, 254, 235, 41, 45, 30, 229, 253, 251, 238, 236, 207, 253, 221, 10, 42, 237, 189, 203, 245, 9, 13, 241, 223, 205, 226, 15, 7, 25, 226, 4, 28, 234, 222, 54, 227, 39, 210, 20, 16, 34, 252, 47, 75, 1, 212, 201, 232, 7, 255, 9, 214, 50, 248, 220, 41, 68, 0, 252, 246, 233, 241, 206, 64, 36, 247, 229, 12, 25, 218, 209, 219, 32, 207, 51, 220, 2, 252, 69, 230, 19, 7, 45, 67, 46, 13, 193, 46, 15, 209, 4, 215, 13, 250, 5, 235, 37, 26, 201, 249, 33, 255, 228, 10, 239, 192, 242, 0, 220, 239, 93, 253, 247, 190, 44, 235, 3, 244, 38, 250, 243, 244, 19, 13, 43, 213, 246, 244, 6, 251, 9, 207, 32, 251, 2, 4, 5, 15, 240, 10, 235, 8, 194, 248, 64, 8, 79, 255, 190, 207, 238, 5, 40, 251, 226, 211, 1, 250, 21, 224, 93, 238, 226, 235, 32, 21, 238, 22, 8, 5, 215, 202, 80, 22, 246, 249, 248, 233, 192, 66, 56, 242, 226, 215, 210, 242, 227, 219, 27, 242, 42, 254, 247, 227, 34, 14, 33, 242, 22, 4, 10, 26, 26, 28, 32, 23, 184, 224, 3, 0, 242, 35, 214, 178, 224, 6, 29, 238, 211, 251, 7, 223, 211, 253, 234, 222, 8, 248, 4, 205, 231, 247, 59, 178, 21, 251, 231, 208, 66, 241, 239, 232, 207, 243, 25, 233, 192, 250, 40, 232, 237, 245, 57, 223, 248, 1, 10, 204, 202, 28, 39, 49, 34, 245, 195, 215, 213, 10, 15, 241, 51, 30, 15, 205, 32, 222, 254, 222, 14, 18, 16, 1, 1, 253, 253, 1, 1, 238, 6, 16, 48, 12, 251, 214, 7, 36, 48, 7, 236, 246, 7, 12, 2, 54, 39, 218, 37, 54, 4, 245, 248, 210, 246, 5, 246, 222, 46, 244, 29, 219, 39, 36, 245, 24, 56, 17, 14, 20, 25, 0, 231, 228, 55, 249, 251, 27, 3, 9, 230, 248, 6, 232, 246, 226, 225, 222, 18, 4, 22, 21, 40, 255, 227, 219, 248, 235, 92, 227, 11, 253, 11, 73, 23, 22, 7, 4, 212, 247, 245, 21, 243, 11, 9, 178, 255, 47, 114, 244, 219, 237, 251, 245, 234, 19, 12, 226, 7, 38, 45, 235, 248, 247, 55, 211, 56, 235, 7, 17, 46, 199, 169, 250, 27, 31, 31, 7, 200, 244, 46, 21, 251, 244, 36, 3, 3, 235, 43, 19, 12, 249, 9, 242, 0, 247, 223, 165, 7, 26, 3, 245, 64, 83, 225, 210, 25, 2, 9, 5, 2, 2, 255, 20, 239, 10, 251, 229, 248, 20, 8, 237, 16, 235, 243, 225, 5, 5, 42, 24, 9, 34, 236, 28, 195, 22, 11, 217, 64, 236, 255, 226, 247, 236, 24, 231, 232, 227, 22, 196, 6, 251, 41, 247, 169, 14, 34, 15, 199, 52, 69, 15, 253, 154, 58, 16, 3, 6, 60, 181, 224, 26, 7, 199, 229, 224, 232, 235, 227, 240, 62, 210, 31, 30, 229, 241, 7, 15, 1, 5, 241, 49, 190, 208, 252, 50, 212, 7, 37, 16, 238, 25, 230, 230, 241, 19, 19, 229, 209, 28, 57, 5, 239, 224, 215, 68, 21, 254, 64, 56, 8, 240, 243, 230, 247, 240, 11, 6, 217, 25, 237, 22, 225, 20, 211, 55, 213, 10, 240, 47, 216, 40, 236, 205, 3, 239, 242, 241, 232, 53, 236, 210, 46, 27, 188, 32, 3, 238, 251, 9, 225, 16, 247, 246, 255, 233, 48, 95, 47, 25, 215, 224, 253, 15, 231, 201, 36, 41, 229, 20, 5, 13, 14, 234, 5, 2, 233, 18, 46, 241, 17, 238, 222, 251, 248, 27, 201, 73, 16, 2, 255, 239, 40, 178, 33, 0, 2, 19, 4, 53, 240, 241, 240, 228, 253, 243, 49, 8, 249, 227, 27, 243, 32, 20, 32, 195, 16, 14, 41, 44, 40, 24, 20, 7, 4, 48, 196, 179, 17, 250, 208, 65, 241, 32, 226, 185, 246, 253, 250, 10, 254, 249, 227, 200, 67, 226, 7, 251, 86, 250, 246, 0, 5, 225, 60, 34, 218, 253, 24, 10, 254, 30, 23, 24, 215, 12, 70, 213, 15, 239, 6, 13, 16, 243, 8, 30, 241, 248, 5, 23, 222, 158, 252, 243, 13, 208, 225, 70, 12, 31, 25, 24, 232, 26, 249, 33, 240, 8, 5, 245, 242, 248, 191, 13, 10, 254, 247, 0, 253, 188, 5, 35, 7, 0, 225, 255, 239, 247, 247, 16, 219, 238, 255, 69, 208, 228, 22, 235, 245, 5, 49, 55, 23, 170, 220, 16, 2, 13, 63, 205, 30, 245, 13, 24, 238, 250, 14, 237, 1, 41, 9, 251, 27, 220, 212, 222, 219, 235, 230, 31, 217, 15, 43, 5, 248, 29, 20, 248, 236, 204, 228, 255, 13, 26, 222, 246, 247, 27, 248, 8, 27, 190, 4, 12, 234, 49, 10, 179, 32, 238, 3, 218, 12, 253, 255, 2, 2, 0, 224, 224, 224, 0, 225, 198, 240, 22, 215, 232, 213, 14, 200, 234, 201, 29, 243, 33, 215, 47, 252, 217, 247, 29, 215, 15, 244, 38, 248, 241, 244, 31, 1, 2, 212, 40, 234, 190, 214, 27, 218, 28, 233, 38, 235, 14, 219, 31, 0, 21, 206, 52, 203, 185, 229, 33, 219, 255, 237, 25, 237, 251, 228, 22, 6, 65, 212, 74, 223, 208, 223, 9, 216, 57, 242, 58, 239, 4, 211, 32, 225, 38, 223, 36, 233, 28, 216, 39, 213, 29, 244, 46, 222, 13, 233, 28, 240, 15, 229, 34, 242, 174, 241, 43, 225, 25, 224, 29, 235, 5, 251, 38, 209, 193, 205, 33, 210, 12, 3, 47, 228, 239, 227, 11, 246, 14, 216, 38, 253, 254, 255, 0, 252, 5, 35, 216, 247, 13, 212, 5, 229, 255, 249, 6, 245, 7, 248, 7, 19, 242, 15, 252, 9, 246, 10, 248, 10, 247, 255, 1, 0, 0, 2, 5, 238, 22, 203, 50, 1, 233, 50, 220, 15, 3, 243, 14, 246, 6, 1, 5, 253, 4, 254, 5, 224, 25, 5, 254, 255, 252, 1, 11, 227, 26, 250, 241, 30, 238, 0, 15, 239, 40, 215, 3, 9, 254, 254, 3, 253, 255, 251, 2, 21, 250, 240, 235, 23, 2, 60, 15, 16, 240, 247, 14, 9, 255, 7, 247, 0, 1, 1, 0, 255, 250, 17, 228, 54, 211, 255, 1, 255, 250, 250, 2, 11, 26, 227, 254, 46, 235, 34, 12, 233, 32, 233, 16, 246, 3, 66, 19, 236, 24, 7, 11, 253, 0, 253, 255, 206, 210, 2, 238, 253, 4, 255, 254, 3, 253, 237, 41, 220, 9, 11, 232, 21, 240, 9, 253], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);allocate([231, 253, 10, 18, 247, 254, 251, 255, 251, 6, 252, 253, 2, 230, 21, 237, 35, 241, 7, 243, 17, 237, 39, 213, 48, 225, 16, 247, 7, 254, 251, 3, 252, 9, 237, 27, 201, 63, 221, 10, 26, 212, 254, 9, 4, 1, 250, 8, 247, 5, 248, 255, 253, 240, 45, 214, 5, 15, 240, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 240, 24, 201, 47, 218, 27, 237, 7, 253, 1, 16, 27, 20, 237, 18, 5, 249, 1, 251, 2, 250, 8, 234, 0, 253, 253, 8, 255, 7, 248, 1, 253, 5, 0, 17, 208, 58, 204, 29, 249, 254, 3, 246, 6, 230, 58, 225, 1, 250, 3, 93, 227, 39, 3, 17, 5, 6, 255, 255, 255, 27, 13, 10, 19, 249, 222, 12, 10, 252, 9, 180, 9, 8, 228, 254, 245, 2, 255, 3, 1, 173, 38, 217, 4, 240, 250, 254, 251, 5, 254, 30, 19, 38, 34, 40, 32, 46, 43, 58, 43, 5, 238, 231, 216, 223, 201, 204, 20, 34, 28, 236, 193, 159, 164, 61, 53, 47, 49, 53, 75, 242, 203, 179, 177, 0, 253, 251, 19, 22, 26, 247, 203, 201, 66, 90, 72, 85, 68, 74, 52, 252, 215, 198, 225, 238, 225, 27, 32, 30, 18, 24, 3, 8, 5, 244, 253, 26, 28, 74, 63, 254, 217, 189, 179, 150, 182, 59, 59, 73, 65, 44, 40, 71, 72, 82, 83, 98, 88, 89, 60, 250, 225, 209, 208, 243, 217, 247, 7, 2, 79, 255, 217, 196, 239, 87, 81, 65, 50, 45, 19, 235, 189, 165, 169, 215, 206, 7, 18, 39, 74, 10, 225, 228, 39, 24, 13, 23, 5, 56, 45, 29, 10, 251, 243, 245, 221, 238, 248, 246, 248, 231, 185, 179, 235, 2, 16, 50, 63, 87, 87, 5, 224, 216, 205, 188, 0, 12, 6, 54, 34, 5, 244, 32, 52, 68, 64, 69, 59, 65, 45, 14, 240, 225, 216, 191, 189, 41, 49, 47, 37, 245, 204, 181, 172, 252, 57, 48, 42, 42, 33, 245, 205, 188, 250, 13, 0, 8, 248, 26, 32, 233, 203, 0, 36, 56, 76, 97, 105, 111, 97, 255, 228, 217, 216, 213, 202, 212, 216, 238, 35, 16, 236, 237, 228, 214, 29, 47, 38, 74, 45, 3, 227, 208, 194, 176, 152, 223, 56, 59, 59, 10, 17, 46, 72, 84, 101, 117, 123, 123, 106, 249, 223, 207, 205, 186, 189, 229, 225, 70, 67, 240, 194, 171, 236, 82, 71, 86, 80, 85, 74, 237, 198, 181, 211, 227, 223, 238, 231, 45, 57, 244, 214, 251, 12, 28, 36, 52, 64, 81, 82, 13, 247, 229, 228, 22, 3, 2, 22, 26, 6, 250, 212, 205, 2, 15, 10, 48, 43, 49, 34, 237, 194, 172, 167, 154, 232, 8, 17, 61, 68, 39, 24, 23, 19, 16, 251, 12, 15, 27, 15, 248, 212, 207, 196, 238, 224, 228, 52, 54, 62, 248, 208, 179, 186, 66, 101, 83, 63, 61, 37, 244, 206, 181, 192, 33, 17, 13, 25, 15, 77, 1, 214, 227, 72, 64, 46, 49, 31, 61, 44, 248, 209, 202, 210, 226, 19, 20, 255, 240, 0, 16, 244, 238, 247, 230, 229, 246, 234, 53, 45, 246, 209, 181, 174, 151, 147, 8, 25, 49, 77, 50, 65, 114, 117, 124, 118, 115, 96, 90, 61, 247, 211, 193, 196, 181, 199, 8, 11, 20, 29, 0, 221, 207, 213, 40, 47, 35, 40, 55, 38, 232, 180, 153, 144, 229, 3, 23, 34, 52, 75, 8, 227, 213, 12, 63, 38, 35, 29, 24, 8, 25, 11, 1, 241, 238, 213, 249, 37, 40, 21, 236, 200, 237, 237, 252, 254, 11, 29, 51, 63, 254, 212, 194, 181, 167, 30, 57, 51, 74, 51, 50, 46, 68, 64, 65, 52, 63, 55, 65, 43, 18, 247, 230, 221, 201, 187, 3, 6, 8, 17, 241, 195, 170, 159, 1, 86, 93, 74, 78, 67, 255, 218, 190, 208, 48, 39, 29, 25, 17, 255, 13, 13, 29, 39, 50, 51, 69, 82, 97, 98, 254, 220, 210, 229, 240, 226, 243, 252, 249, 252, 25, 251, 245, 250, 231, 235, 33, 12, 31, 29, 248, 218, 204, 193, 188, 167, 223, 255, 10, 74, 254, 241, 59, 91, 105, 105, 101, 87, 84, 62, 249, 223, 206, 221, 202, 209, 25, 17, 82, 81, 243, 200, 173, 21, 58, 31, 42, 25, 72, 65, 232, 190, 165, 200, 9, 254, 21, 10, 69, 75, 2, 232, 11, 22, 25, 28, 38, 34, 48, 33, 7, 227, 230, 17, 15, 255, 14, 0, 254, 0, 250, 215, 189, 6, 254, 247, 19, 2, 85, 74, 234, 189, 172, 185, 206, 3, 11, 247, 2, 62, 222, 204, 241, 45, 2, 23, 21, 52, 24, 223, 247, 255, 9, 212, 215, 243, 239, 44, 22, 239, 250, 252, 255, 22, 38, 26, 16, 2, 50, 27, 221, 222, 247, 215, 6, 0, 240, 222, 51, 8, 242, 225, 207, 15, 223, 45, 49, 33, 245, 219, 194, 202, 45, 11, 251, 184, 11, 255, 244, 245, 24, 27, 245, 213, 46, 43, 33, 244, 247, 255, 1, 252, 233, 199, 185, 11, 8, 16, 17, 248, 236, 225, 215, 53, 48, 240, 3, 65, 232, 248, 233, 224, 219, 224, 207, 246, 239, 6, 38, 5, 247, 239, 210, 8, 52, 3, 6, 45, 40, 39, 249, 250, 222, 182, 31, 8, 1, 240, 43, 68, 245, 237, 225, 4, 6, 0, 250, 239, 240, 218, 240, 226, 2, 9, 217, 240, 255, 43, 246, 48, 3, 3, 240, 225, 253, 62, 68, 43, 13, 3, 246, 8, 20, 200, 12, 12, 254, 238, 22, 241, 216, 220, 1, 7, 41, 0, 1, 46, 250, 194, 252, 244, 254, 245, 173, 243, 254, 91, 33, 246, 0, 4, 245, 240, 79, 32, 37, 14, 9, 51, 235, 228, 200, 222, 0, 21, 9, 230, 11, 28, 214, 202, 233, 254, 241, 31, 30, 8, 217, 190, 217, 220, 31, 228, 216, 210, 35, 40, 22, 24, 33, 48, 23, 222, 14, 40, 32, 17, 27, 253, 25, 26, 243, 195, 239, 11, 4, 31, 60, 250, 230, 215, 192, 13, 16, 230, 54, 31, 245, 233, 247, 245, 222, 185, 235, 222, 221, 55, 50, 29, 234, 229, 206, 218, 57, 33, 42, 57, 48, 26, 11, 0, 207, 225, 26, 252, 242, 5, 78, 37, 17, 0, 207, 244, 233, 26, 14, 2, 2, 213, 239, 244, 10, 248, 252, 8, 18, 12, 250, 20, 244, 250, 243, 231, 34, 15, 40, 49, 7, 8, 13, 20, 20, 237, 234, 254, 248, 2, 51, 205, 250, 53, 235, 232, 4, 26, 17, 252, 219, 25, 17, 220, 243, 31, 3, 250, 27, 15, 246, 31, 28, 26, 246, 246, 216, 16, 249, 15, 13, 41, 247, 0, 252, 50, 250, 249, 14, 38, 22, 0, 208, 2, 1, 243, 237, 32, 253, 196, 11, 239, 255, 232, 222, 255, 35, 251, 229, 28, 44, 13, 25, 15, 42, 245, 15, 51, 35, 220, 20, 8, 252, 244, 227, 19, 209, 49, 241, 252, 16, 227, 217, 14, 226, 4, 25, 247, 251, 205, 242, 253, 216, 224, 38, 5, 247, 248, 252, 255, 234, 71, 253, 14, 26, 238, 234, 24, 215, 231, 232, 6, 23, 19, 246, 39, 230, 229, 65, 45, 2, 249, 230, 248, 22, 244, 16, 15, 16, 221, 251, 33, 235, 248, 0, 23, 33, 34, 6, 21, 36, 6, 249, 234, 8, 219, 242, 31, 38, 11, 252, 253, 217, 224, 248, 32, 233, 250, 244, 16, 20, 228, 252, 23, 13, 204, 255, 22, 6, 223, 216, 250, 4, 194, 13, 5, 230, 35, 39, 11, 2, 57, 245, 9, 236, 228, 223, 52, 251, 250, 254, 22, 242, 240, 208, 35, 1, 198, 20, 13, 33, 255, 182, 56, 238, 234, 225, 12, 6, 242, 4, 254, 247, 209, 10, 253, 29, 239, 251, 61, 14, 47, 244, 2, 72, 217, 239, 92, 64, 203, 205, 241, 226, 218, 215, 227, 228, 27, 9, 36, 9, 221, 214, 81, 235, 20, 25, 240, 251, 239, 221, 21, 15, 228, 48, 2, 254, 9, 237, 29, 216, 30, 238, 238, 18, 240, 199, 15, 236, 244, 241, 219, 241, 33, 217, 21, 234, 243, 35, 11, 13, 218, 193, 29, 23, 229, 32, 18, 3, 230, 42, 33, 192, 190, 239, 16, 56, 2, 36, 3, 31, 21, 215, 217, 8, 199, 14, 37, 254, 19, 220, 237, 233, 227, 240, 1, 253, 248, 246, 31, 64, 191, 230, 248, 29, 21, 4, 19, 217, 33, 249, 220, 56, 54, 48, 40, 29, 252, 232, 214, 190, 213, 196, 19, 254, 37, 41, 246, 219, 196, 192, 18, 234, 77, 73, 40, 25, 4, 19, 237, 190, 254, 11, 5, 21, 14, 26, 231, 170, 252, 18, 1, 26, 219, 10, 37, 255, 24, 244, 197, 245, 20, 250, 34, 240, 240, 42, 19, 228, 205, 53, 32, 4, 10, 62, 21, 244, 222, 27, 4, 208, 208, 206, 207, 31, 249, 235, 214, 231, 252, 213, 234, 59, 2, 27, 12, 247, 250, 240, 248, 224, 198, 240, 227, 251, 41, 23, 226, 223, 210, 243, 246, 218, 52, 52, 1, 239, 247, 10, 26, 231, 250, 33, 236, 53, 55, 25, 224, 251, 214, 23, 21, 66, 5, 228, 20, 9, 75, 29, 249, 214, 217, 15, 3, 233, 21, 6, 11, 1, 227, 14, 63, 10, 54, 26, 232, 205, 207, 7, 233, 205, 15, 190, 1, 60, 25, 10, 0, 226, 252, 241, 17, 19, 59, 40, 4, 251, 33, 6, 234, 198, 186, 251, 23, 250, 60, 44, 227, 240, 209, 227, 52, 237, 50, 28, 16, 35, 31, 36, 0, 235, 6, 21, 27, 22, 42, 7, 190, 216, 248, 7, 19, 46, 0, 252, 60, 36, 45, 249, 227, 250, 224, 217, 2, 6, 247, 33, 20, 205, 222, 18, 250, 19, 6, 11, 5, 237, 227, 254, 42, 245, 211, 235, 201, 57, 37, 2, 242, 189, 240, 229, 218, 69, 48, 19, 2, 239, 20, 236, 240, 222, 239, 231, 195, 10, 73, 45, 16, 216, 192, 239, 227, 234, 56, 17, 217, 8, 245, 8, 231, 238, 243, 237, 8, 54, 57, 36, 239, 230, 252, 6, 235, 40, 42, 252, 20, 31, 53, 10, 222, 203, 31, 239, 35, 0, 15, 250, 236, 193, 183, 22, 25, 29, 17, 8, 227, 217, 187, 18, 15, 241, 251, 11, 47, 16, 247, 210, 224, 26, 192, 34, 251, 38, 249, 47, 20, 2, 183, 157, 253, 211, 20, 70, 204, 15, 250, 249, 174, 31, 21, 47, 51, 39, 253, 9, 0, 215, 249, 241, 202, 2, 0, 27, 225, 9, 211, 234, 218, 232, 232, 8, 223, 23, 5, 50, 220, 239, 238, 205, 254, 13, 19, 43, 12, 241, 244, 61, 38, 38, 7, 13, 0, 6, 255, 3, 62, 9, 27, 22, 223, 38, 221, 247, 30, 213, 247, 224, 255, 4, 252, 1, 251, 245, 248, 38, 31, 11, 246, 214, 235, 219, 1, 43, 15, 243, 221, 237, 238, 15, 23, 230, 59, 1, 235, 53, 8, 215, 206, 242, 228, 4, 21, 25, 228, 216, 5, 216, 215, 4, 51, 223, 248, 248, 1, 17, 196, 12, 25, 215, 17, 34, 43, 19, 45, 7, 219, 24, 241, 56, 254, 35, 246, 48, 4, 209, 254, 5, 251, 202, 5, 253, 223, 246, 30, 254, 212, 232, 218, 9, 247, 42, 4, 6, 200, 44, 240, 9, 216, 230, 18, 236, 10, 28, 215, 235, 252, 13, 238, 32, 226, 253, 37, 15, 22, 28, 50, 216, 3, 227, 192, 7, 51, 237, 245, 17, 229, 216, 192, 24, 244, 249, 229, 3, 37, 48, 255, 2, 247, 218, 222, 46, 1, 27, 250, 19, 243, 26, 10, 34, 20, 25, 40, 50, 250, 249, 30, 9, 232, 0, 233, 71, 195, 22, 58, 222, 252, 2, 207, 223, 25, 30, 248, 250, 240, 77, 2, 38, 248, 221, 250, 226, 56, 78, 31, 33, 236, 13, 217, 20, 22, 4, 21, 248, 4, 250, 10, 173, 215, 9, 231, 213, 15, 249, 244, 222, 217, 219, 223, 19, 30, 16, 223, 42, 231, 25, 188, 44, 241, 245, 252, 23, 50, 14, 4, 217, 213, 20, 226, 60, 9, 236, 7, 16, 19, 223, 37, 29, 16, 221, 7, 38, 229, 110, 97, 114, 114, 111, 119, 98, 97, 110, 100, 0, 119, 105, 100, 101, 98, 97, 110, 100, 32, 40, 115, 117, 98, 45, 98, 97, 110, 100, 32, 67, 69, 76, 80, 41, 0, 85, 110, 107, 110, 111, 119, 110, 32, 119, 98, 95, 109, 111, 100, 101, 95, 113, 117, 101, 114, 121, 32, 114, 101, 113, 117, 101, 115, 116, 58, 32, 0, 97, 115, 115, 101, 114, 116, 105, 111, 110, 32, 102, 97, 105, 108, 101, 100, 58, 32, 115, 116, 45, 62, 119, 105, 110, 100, 111, 119, 83, 105, 122, 101, 45, 115, 116, 45, 62, 102, 114, 97, 109, 101, 83, 105, 122, 101, 32, 61, 61, 32, 115, 116, 45, 62, 115, 117, 98, 102, 114, 97, 109, 101, 83, 105, 122, 101, 0, 97, 115, 115, 101, 114, 116, 105, 111, 110, 32, 102, 97, 105, 108, 101, 100, 58, 32, 83, 85, 66, 77, 79, 68, 69, 40, 108, 116, 112, 95, 113, 117, 97, 110, 116, 41, 0, 97, 115, 115, 101, 114, 116, 105, 111, 110, 32, 102, 97, 105, 108, 101, 100, 58, 32, 83, 85, 66, 77, 79, 68, 69, 40, 105, 110, 110, 111, 118, 97, 116, 105, 111, 110, 95, 113, 117, 97, 110, 116, 41, 0, 70, 97, 116, 97, 108, 32, 40, 105, 110, 116, 101, 114, 110, 97, 108, 41, 32, 101, 114, 114, 111, 114, 32, 105, 110, 32, 37, 115, 44, 32, 108, 105, 110, 101, 32, 37, 100, 58, 32, 37, 115, 10, 0, 115, 114, 99, 47, 110, 98, 95, 99, 101, 108, 112, 46, 99, 0, 77, 111, 114, 101, 32, 116, 104, 97, 110, 32, 116, 119, 111, 32, 119, 105, 100, 101, 98, 97, 110, 100, 32, 108, 97, 121, 101, 114, 115, 32, 102, 111, 117, 110, 100, 46, 32, 84, 104, 101, 32, 115, 116, 114, 101, 97, 109, 32, 105, 115, 32, 99, 111, 114, 114, 117, 112, 116, 101, 100, 46, 0, 97, 115, 115, 101, 114, 116, 105, 111, 110, 32, 102, 97, 105, 108, 101, 100, 58, 32, 83, 85, 66, 77, 79, 68, 69, 40, 108, 116, 112, 95, 117, 110, 113, 117, 97, 110, 116, 41, 0, 97, 115, 115, 101, 114, 116, 105, 111, 110, 32, 102, 97, 105, 108, 101, 100, 58, 32, 83, 85, 66, 77, 79, 68, 69, 40, 105, 110, 110, 111, 118, 97, 116, 105, 111, 110, 95, 117, 110, 113, 117, 97, 110, 116, 41, 0, 73, 110, 118, 97, 108, 105, 100, 32, 109, 111, 100, 101, 32, 101, 110, 99, 111, 117, 110, 116, 101, 114, 101, 100, 46, 32, 84, 104, 101, 32, 115, 116, 114, 101, 97, 109, 32, 105, 115, 32, 99, 111, 114, 114, 117, 112, 116, 101, 100, 46, 0, 119, 97, 114, 110, 105, 110, 103, 58, 32, 37, 115, 32, 37, 100, 10, 0, 85, 110, 107, 110, 111, 119, 110, 32, 110, 98, 95, 99, 116, 108, 32, 114, 101, 113, 117, 101, 115, 116, 58, 32, 0, 115, 112, 101, 101, 120, 45, 49, 46, 50, 98, 101, 116, 97, 51, 0, 119, 97, 114, 110, 105, 110, 103, 58, 32, 37, 115, 10, 0, 84, 104, 105, 115, 32, 109, 111, 100, 101, 32, 105, 115, 32, 109, 101, 97, 110, 116, 32, 116, 111, 32, 98, 101, 32, 117, 115, 101, 100, 32, 97, 108, 111, 110, 101, 0, 110, 111, 116, 105, 102, 105, 99, 97, 116, 105, 111, 110, 58, 32, 37, 115, 10, 0, 84, 104, 105, 115, 32, 100, 111, 101, 115, 110, 39, 116, 32, 108, 111, 111, 107, 32, 108, 105, 107, 101, 32, 97, 32, 83, 112, 101, 101, 120, 32, 102, 105, 108, 101, 0, 83, 112, 101, 101, 120, 32, 104, 101, 97, 100, 101, 114, 32, 116, 111, 111, 32, 115, 109, 97, 108, 108, 0, 83, 80, 69, 69, 88, 95, 68, 69, 67, 79, 68, 69, 95, 69, 82, 82, 79, 82, 58, 32, 105, 110, 112, 117, 116, 32, 116, 111, 111, 32, 115, 104, 111, 114, 116, 32, 116, 111, 32, 100, 101, 116, 101, 114, 109, 105, 110, 101, 32, 99, 111, 109, 112, 114, 101, 115, 115, 105, 111, 110, 46, 0, 83, 112, 101, 101, 120, 32, 32, 32, 0, 83, 80, 69, 69, 88, 95, 68, 69, 67, 79, 68, 69, 95, 69, 82, 82, 79, 82, 58, 32, 105, 110, 112, 117, 116, 32, 110, 111, 116, 32, 97, 32, 115, 112, 101, 101, 120, 46, 0, 83, 80, 69, 69, 88, 95, 68, 69, 67, 79, 68, 69, 95, 69, 82, 82, 79, 82, 58, 32, 111, 110, 108, 121, 32, 115, 117, 112, 112, 111, 114, 116, 32, 115, 112, 101, 101, 120, 32, 110, 97, 114, 114, 111, 119, 98, 97, 110, 100, 32, 97, 110, 100, 32, 119, 105, 100, 101, 98, 97, 110, 100, 46, 32, 84, 114, 121, 105, 110, 103, 32, 116, 111, 32, 100, 101, 99, 111, 100, 101, 32, 97, 115, 32, 110, 97, 114, 114, 111, 119, 98, 97, 110, 100, 0, 69, 82, 82, 79, 82, 58, 32, 115, 116, 114, 101, 97, 109, 32, 99, 111, 114, 114, 117, 112, 116, 101, 100, 63, 32, 32, 101, 110, 99, 111, 100, 101, 100, 95, 102, 114, 97, 109, 101, 95, 115, 105, 122, 101, 32, 40, 112, 97, 99, 107, 101, 116, 32, 115, 105, 122, 101, 41, 46, 0, 69, 82, 82, 79, 82, 58, 32, 80, 97, 99, 107, 101, 116, 32, 119, 97, 115, 32, 105, 110, 99, 111, 109, 112, 108, 101, 116, 101, 46, 0, 17, 0, 10, 0, 17, 17, 17, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 15, 10, 17, 17, 17, 3, 10, 7, 0, 1, 19, 9, 11, 11, 0, 0, 9, 6, 11, 0, 0, 11, 0, 6, 17, 0, 0, 0, 17, 17, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 10, 10, 17, 17, 17, 0, 10, 0, 0, 2, 0, 9, 11, 0, 0, 0, 9, 0, 11, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 12, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 4, 13, 0, 0, 0, 0, 9, 14, 0, 0, 0, 0, 0, 14, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 9, 16, 0, 0, 0, 0, 0, 16, 0, 0, 16, 0, 0, 18, 0, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 10, 0, 0, 0, 0, 9, 11, 0, 0, 0, 0, 0, 11, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 12, 0, 0, 12, 0, 0, 45, 43, 32, 32, 32, 48, 88, 48, 120, 0, 40, 110, 117, 108, 108, 41, 0, 45, 48, 88, 43, 48, 88, 32, 48, 88, 45, 48, 120, 43, 48, 120, 32, 48, 120, 0, 105, 110, 102, 0, 73, 78, 70, 0, 110, 97, 110, 0, 78, 65, 78, 0, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 69, 70, 46, 0, 84, 33, 34, 25, 13, 1, 2, 3, 17, 75, 28, 12, 16, 4, 11, 29, 18, 30, 39, 104, 110, 111, 112, 113, 98, 32, 5, 6, 15, 19, 20, 21, 26, 8, 22, 7, 40, 36, 23, 24, 9, 10, 14, 27, 31, 37, 35, 131, 130, 125, 38, 42, 43, 60, 61, 62, 63, 67, 71, 74, 77, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 99, 100, 101, 102, 103, 105, 106, 107, 108, 114, 115, 116, 121, 122, 123, 124, 0, 73, 108, 108, 101, 103, 97, 108, 32, 98, 121, 116, 101, 32, 115, 101, 113, 117, 101, 110, 99, 101, 0, 68, 111, 109, 97, 105, 110, 32, 101, 114, 114, 111, 114, 0, 82, 101, 115, 117, 108, 116, 32, 110, 111, 116, 32, 114, 101, 112, 114, 101, 115, 101, 110, 116, 97, 98, 108, 101, 0, 78, 111, 116, 32, 97, 32, 116, 116, 121, 0, 80, 101, 114, 109, 105, 115, 115, 105, 111, 110, 32, 100, 101, 110, 105, 101, 100, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 110, 111, 116, 32, 112, 101, 114, 109, 105, 116, 116, 101, 100, 0, 78, 111, 32, 115, 117, 99, 104, 32, 102, 105, 108, 101, 32, 111, 114, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 78, 111, 32, 115, 117, 99, 104, 32, 112, 114, 111, 99, 101, 115, 115, 0, 70, 105, 108, 101, 32, 101, 120, 105, 115, 116, 115, 0, 86, 97, 108, 117, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 32, 102, 111, 114, 32, 100, 97, 116, 97, 32, 116, 121, 112, 101, 0, 78, 111, 32, 115, 112, 97, 99, 101, 32, 108, 101, 102, 116, 32, 111, 110, 32, 100, 101, 118, 105, 99, 101, 0, 79, 117, 116, 32, 111, 102, 32, 109, 101, 109, 111, 114, 121, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 98, 117, 115, 121, 0, 73, 110, 116, 101, 114, 114, 117, 112, 116, 101, 100, 32, 115, 121, 115, 116, 101, 109, 32, 99, 97, 108, 108, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 116, 101, 109, 112, 111, 114, 97, 114, 105, 108, 121, 32, 117, 110, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 73, 110, 118, 97, 108, 105, 100, 32, 115, 101, 101, 107, 0, 67, 114, 111, 115, 115, 45, 100, 101, 118, 105, 99, 101, 32, 108, 105, 110, 107, 0, 82, 101, 97, 100, 45, 111, 110, 108, 121, 32, 102, 105, 108, 101, 32, 115, 121, 115, 116, 101, 109, 0, 68, 105, 114, 101, 99, 116, 111, 114, 121, 32, 110, 111, 116, 32, 101, 109, 112, 116, 121, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 115, 101, 116, 32, 98, 121, 32, 112, 101, 101, 114, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 116, 105, 109, 101, 100, 32, 111, 117, 116, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 102, 117, 115, 101, 100, 0, 72, 111, 115, 116, 32, 105, 115, 32, 100, 111, 119, 110, 0, 72, 111, 115, 116, 32, 105, 115, 32, 117, 110, 114, 101, 97, 99, 104, 97, 98, 108, 101, 0, 65, 100, 100, 114, 101, 115, 115, 32, 105, 110, 32, 117, 115, 101, 0, 66, 114, 111, 107, 101, 110, 32, 112, 105, 112, 101, 0, 73, 47, 79, 32, 101, 114, 114, 111, 114, 0, 78, 111, 32, 115, 117, 99, 104, 32, 100, 101, 118, 105, 99, 101, 32, 111, 114, 32, 97, 100, 100, 114, 101, 115, 115, 0, 66, 108, 111, 99, 107, 32, 100, 101, 118, 105, 99, 101, 32, 114, 101, 113, 117, 105, 114, 101, 100, 0, 78, 111, 32, 115, 117, 99, 104, 32, 100, 101, 118, 105, 99, 101, 0, 78, 111, 116, 32, 97, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 73, 115, 32, 97, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 84, 101, 120, 116, 32, 102, 105, 108, 101, 32, 98, 117, 115, 121, 0, 69, 120, 101, 99, 32, 102, 111, 114, 109, 97, 116, 32, 101, 114, 114, 111, 114, 0, 73, 110, 118, 97, 108, 105, 100, 32, 97, 114, 103, 117, 109, 101, 110, 116, 0, 65, 114, 103, 117, 109, 101, 110, 116, 32, 108, 105, 115, 116, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 83, 121, 109, 98, 111, 108, 105, 99, 32, 108, 105, 110, 107, 32, 108, 111, 111, 112, 0, 70, 105, 108, 101, 110, 97, 109, 101, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 84, 111, 111, 32, 109, 97, 110, 121, 32, 111, 112, 101, 110, 32, 102, 105, 108, 101, 115, 32, 105, 110, 32, 115, 121, 115, 116, 101, 109, 0, 78, 111, 32, 102, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 115, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 66, 97, 100, 32, 102, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 0, 78, 111, 32, 99, 104, 105, 108, 100, 32, 112, 114, 111, 99, 101, 115, 115, 0, 66, 97, 100, 32, 97, 100, 100, 114, 101, 115, 115, 0, 70, 105, 108, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 0, 84, 111, 111, 32, 109, 97, 110, 121, 32, 108, 105, 110, 107, 115, 0, 78, 111, 32, 108, 111, 99, 107, 115, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 100, 101, 97, 100, 108, 111, 99, 107, 32, 119, 111, 117, 108, 100, 32, 111, 99, 99, 117, 114, 0, 83, 116, 97, 116, 101, 32, 110, 111, 116, 32, 114, 101, 99, 111, 118, 101, 114, 97, 98, 108, 101, 0, 80, 114, 101, 118, 105, 111, 117, 115, 32, 111, 119, 110, 101, 114, 32, 100, 105, 101, 100, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 99, 97, 110, 99, 101, 108, 101, 100, 0, 70, 117, 110, 99, 116, 105, 111, 110, 32, 110, 111, 116, 32, 105, 109, 112, 108, 101, 109, 101, 110, 116, 101, 100, 0, 78, 111, 32, 109, 101, 115, 115, 97, 103, 101, 32, 111, 102, 32, 100, 101, 115, 105, 114, 101, 100, 32, 116, 121, 112, 101, 0, 73, 100, 101, 110, 116, 105, 102, 105, 101, 114, 32, 114, 101, 109, 111, 118, 101, 100, 0, 68, 101, 118, 105, 99, 101, 32, 110, 111, 116, 32, 97, 32, 115, 116, 114, 101, 97, 109, 0, 78, 111, 32, 100, 97, 116, 97, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 68, 101, 118, 105, 99, 101, 32, 116, 105, 109, 101, 111, 117, 116, 0, 79, 117, 116, 32, 111, 102, 32, 115, 116, 114, 101, 97, 109, 115, 32, 114, 101, 115, 111, 117, 114, 99, 101, 115, 0, 76, 105, 110, 107, 32, 104, 97, 115, 32, 98, 101, 101, 110, 32, 115, 101, 118, 101, 114, 101, 100, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 101, 114, 114, 111, 114, 0, 66, 97, 100, 32, 109, 101, 115, 115, 97, 103, 101, 0, 70, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 32, 105, 110, 32, 98, 97, 100, 32, 115, 116, 97, 116, 101, 0, 78, 111, 116, 32, 97, 32, 115, 111, 99, 107, 101, 116, 0, 68, 101, 115, 116, 105, 110, 97, 116, 105, 111, 110, 32, 97, 100, 100, 114, 101, 115, 115, 32, 114, 101, 113, 117, 105, 114, 101, 100, 0, 77, 101, 115, 115, 97, 103, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 119, 114, 111, 110, 103, 32, 116, 121, 112, 101, 32, 102, 111, 114, 32, 115, 111, 99, 107, 101, 116, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 110, 111, 116, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 83, 111, 99, 107, 101, 116, 32, 116, 121, 112, 101, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 78, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 102, 97, 109, 105, 108, 121, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 65, 100, 100, 114, 101, 115, 115, 32, 102, 97, 109, 105, 108, 121, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 32, 98, 121, 32, 112, 114, 111, 116, 111, 99, 111, 108, 0, 65, 100, 100, 114, 101, 115, 115, 32, 110, 111, 116, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 78, 101, 116, 119, 111, 114, 107, 32, 105, 115, 32, 100, 111, 119, 110, 0, 78, 101, 116, 119, 111, 114, 107, 32, 117, 110, 114, 101, 97, 99, 104, 97, 98, 108, 101, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 115, 101, 116, 32, 98, 121, 32, 110, 101, 116, 119, 111, 114, 107, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 97, 98, 111, 114, 116, 101, 100, 0, 78, 111, 32, 98, 117, 102, 102, 101, 114, 32, 115, 112, 97, 99, 101, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 83, 111, 99, 107, 101, 116, 32, 105, 115, 32, 99, 111, 110, 110, 101, 99, 116, 101, 100, 0, 83, 111, 99, 107, 101, 116, 32, 110, 111, 116, 32, 99, 111, 110, 110, 101, 99, 116, 101, 100, 0, 67, 97, 110, 110, 111, 116, 32, 115, 101, 110, 100, 32, 97, 102, 116, 101, 114, 32, 115, 111, 99, 107, 101, 116, 32, 115, 104, 117, 116, 100, 111, 119, 110, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 97, 108, 114, 101, 97, 100, 121, 32, 105, 110, 32, 112, 114, 111, 103, 114, 101, 115, 115, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 105, 110, 32, 112, 114, 111, 103, 114, 101, 115, 115, 0, 83, 116, 97, 108, 101, 32, 102, 105, 108, 101, 32, 104, 97, 110, 100, 108, 101, 0, 82, 101, 109, 111, 116, 101, 32, 73, 47, 79, 32, 101, 114, 114, 111, 114, 0, 81, 117, 111, 116, 97, 32, 101, 120, 99, 101, 101, 100, 101, 100, 0, 78, 111, 32, 109, 101, 100, 105, 117, 109, 32, 102, 111, 117, 110, 100, 0, 87, 114, 111, 110, 103, 32, 109, 101, 100, 105, 117, 109, 32, 116, 121, 112, 101, 0, 78, 111, 32, 101, 114, 114, 111, 114, 32, 105, 110, 102, 111, 114, 109, 97, 116, 105, 111, 110, 0, 0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE + 10240);var tempDoublePtr = STATICTOP;STATICTOP += 16;Module["_i64Subtract"] = _i64Subtract;Module["_i64Add"] = _i64Add;Module["_memset"] = _memset;Module["_bitshift64Lshr"] = _bitshift64Lshr;Module["_bitshift64Shl"] = _bitshift64Shl;function _abort() {
  Module["abort"]();
}function ___lock() {}function ___unlock() {}var SYSCALLS = { varargs: 0, get: function get(varargs) {
    SYSCALLS.varargs += 4;var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];return ret;
  }, getStr: function getStr() {
    var ret = Pointer_stringify(SYSCALLS.get());return ret;
  }, get64: function get64() {
    var low = SYSCALLS.get(),
        high = SYSCALLS.get();if (low >= 0) assert(high === 0);else assert(high === -1);return low;
  }, getZero: function getZero() {
    assert(SYSCALLS.get() === 0);
  } };function ___syscall6(which, varargs) {
  SYSCALLS.varargs = varargs;try {
    var stream = SYSCALLS.getStreamFromFD();FS.close(stream);return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);return -e.errno;
  }
}var cttz_i8 = allocate([8, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 7, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0], "i8", ALLOC_STATIC);Module["_llvm_cttz_i32"] = _llvm_cttz_i32;Module["___udivmoddi4"] = ___udivmoddi4;Module["___udivdi3"] = ___udivdi3;function _llvm_stackrestore(p) {
  var self = _llvm_stacksave;var ret = self.LLVM_SAVEDSTACKS[p];self.LLVM_SAVEDSTACKS.splice(p, 1);Runtime.stackRestore(ret);
}function ___setErrNo(value) {
  if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;return value;
}Module["_sbrk"] = _sbrk;function _llvm_stacksave() {
  var self = _llvm_stacksave;if (!self.LLVM_SAVEDSTACKS) {
    self.LLVM_SAVEDSTACKS = [];
  }self.LLVM_SAVEDSTACKS.push(Runtime.stackSave());return self.LLVM_SAVEDSTACKS.length - 1;
}function _emscripten_memcpy_big(dest, src, num) {
  HEAPU8.set(HEAPU8.subarray(src, src + num), dest);return dest;
}Module["_memcpy"] = _memcpy;Module["_memmove"] = _memmove;Module["___uremdi3"] = ___uremdi3;function __exit(status) {
  Module["exit"](status);
}function _exit(status) {
  __exit(status);
}Module["_llvm_bswap_i16"] = _llvm_bswap_i16;var _llvm_pow_f64 = Math_pow;Module["_llvm_bswap_i32"] = _llvm_bswap_i32;function ___syscall140(which, varargs) {
  SYSCALLS.varargs = varargs;try {
    var stream = SYSCALLS.getStreamFromFD(),
        offset_high = SYSCALLS.get(),
        offset_low = SYSCALLS.get(),
        result = SYSCALLS.get(),
        whence = SYSCALLS.get();var offset = offset_low;assert(offset_high === 0);FS.llseek(stream, offset, whence);HEAP32[result >> 2] = stream.position;if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);return -e.errno;
  }
}function ___syscall146(which, varargs) {
  SYSCALLS.varargs = varargs;try {
    var stream = SYSCALLS.get(),
        iov = SYSCALLS.get(),
        iovcnt = SYSCALLS.get();var ret = 0;if (!___syscall146.buffer) {
      ___syscall146.buffers = [null, [], []];___syscall146.printChar = function (stream, curr) {
        var buffer = ___syscall146.buffers[stream];assert(buffer);if (curr === 0 || curr === 10) {
          (stream === 1 ? Module["print"] : Module["printErr"])(UTF8ArrayToString(buffer, 0));buffer.length = 0;
        } else {
          buffer.push(curr);
        }
      };
    }for (var i = 0; i < iovcnt; i++) {
      var ptr = HEAP32[iov + i * 8 >> 2];var len = HEAP32[iov + (i * 8 + 4) >> 2];for (var j = 0; j < len; j++) {
        ___syscall146.printChar(stream, HEAPU8[ptr + j]);
      }ret += len;
    }return ret;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);return -e.errno;
  }
}function ___syscall54(which, varargs) {
  SYSCALLS.varargs = varargs;try {
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);return -e.errno;
  }
}__ATEXIT__.push(function () {
  var fflush = Module["_fflush"];if (fflush) fflush(0);var printChar = ___syscall146.printChar;if (!printChar) return;var buffers = ___syscall146.buffers;if (buffers[1].length) printChar(1, 10);if (buffers[2].length) printChar(2, 10);
});DYNAMICTOP_PTR = allocate(1, "i32", ALLOC_STATIC);STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);STACK_MAX = STACK_BASE + TOTAL_STACK;DYNAMIC_BASE = Runtime.alignMemory(STACK_MAX);HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;staticSealed = true;function invoke_iiii(index, a1, a2, a3) {
  try {
    return Module["dynCall_iiii"](index, a1, a2, a3);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;Module["setThrew"](1, 0);
  }
}function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
  try {
    Module["dynCall_viiiiii"](index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;Module["setThrew"](1, 0);
  }
}function invoke_viiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
  try {
    Module["dynCall_viiiiiiiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;Module["setThrew"](1, 0);
  }
}function invoke_vi(index, a1) {
  try {
    Module["dynCall_vi"](index, a1);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;Module["setThrew"](1, 0);
  }
}function invoke_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
  try {
    Module["dynCall_viiiiiiiiiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;Module["setThrew"](1, 0);
  }
}function invoke_ii(index, a1) {
  try {
    return Module["dynCall_ii"](index, a1);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;Module["setThrew"](1, 0);
  }
}function invoke_viii(index, a1, a2, a3) {
  try {
    Module["dynCall_viii"](index, a1, a2, a3);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;Module["setThrew"](1, 0);
  }
}function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;Module["setThrew"](1, 0);
  }
}function invoke_iiiiiiiiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20) {
  try {
    return Module["dynCall_iiiiiiiiiiiiiiiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;Module["setThrew"](1, 0);
  }
}function invoke_viiii(index, a1, a2, a3, a4) {
  try {
    Module["dynCall_viiii"](index, a1, a2, a3, a4);
  } catch (e) {
    if (typeof e !== "number" && e !== "longjmp") throw e;Module["setThrew"](1, 0);
  }
}Module.asmGlobalArg = { "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array, "NaN": NaN, "Infinity": Infinity };Module.asmLibraryArg = { "abort": abort, "assert": assert, "enlargeMemory": enlargeMemory, "getTotalMemory": getTotalMemory, "abortOnCannotGrowMemory": abortOnCannotGrowMemory, "invoke_iiii": invoke_iiii, "invoke_viiiiii": invoke_viiiiii, "invoke_viiiiiiiiiiiii": invoke_viiiiiiiiiiiii, "invoke_vi": invoke_vi, "invoke_viiiiiiiiiiiiiii": invoke_viiiiiiiiiiiiiii, "invoke_ii": invoke_ii, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_iiiiiiiiiiiiiiiiiiiii": invoke_iiiiiiiiiiiiiiiiiiiii, "invoke_viiii": invoke_viiii, "___syscall6": ___syscall6, "_llvm_pow_f64": _llvm_pow_f64, "___lock": ___lock, "_abort": _abort, "___setErrNo": ___setErrNo, "_llvm_stacksave": _llvm_stacksave, "___syscall140": ___syscall140, "_emscripten_memcpy_big": _emscripten_memcpy_big, "___syscall54": ___syscall54, "___unlock": ___unlock, "_exit": _exit, "_llvm_stackrestore": _llvm_stackrestore, "__exit": __exit, "___syscall146": ___syscall146, "DYNAMICTOP_PTR": DYNAMICTOP_PTR, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "cttz_i8": cttz_i8 }; // EMSCRIPTEN_START_ASM
var asm = function (global, env, buffer) {
  "use asm";

  var _ref;

  var a = new global.Int8Array(buffer);var b = new global.Int16Array(buffer);var c = new global.Int32Array(buffer);var d = new global.Uint8Array(buffer);var e = new global.Uint16Array(buffer);var f = new global.Uint32Array(buffer);var g = new global.Float32Array(buffer);var h = new global.Float64Array(buffer);var i = env.DYNAMICTOP_PTR | 0;var j = env.tempDoublePtr | 0;var k = env.ABORT | 0;var l = env.STACKTOP | 0;var m = env.STACK_MAX | 0;var n = env.cttz_i8 | 0;var o = 0;var p = 0;var q = 0;var r = 0;var s = global.NaN,
      t = global.Infinity;var u = 0,
      v = 0,
      w = 0,
      x = 0,
      y = 0.0,
      z = 0,
      A = 0,
      B = 0,
      C = 0.0;var D = 0;var E = global.Math.floor;var F = global.Math.abs;var G = global.Math.sqrt;var H = global.Math.pow;var I = global.Math.cos;var J = global.Math.sin;var K = global.Math.tan;var L = global.Math.acos;var M = global.Math.asin;var N = global.Math.atan;var O = global.Math.atan2;var P = global.Math.exp;var Q = global.Math.log;var R = global.Math.ceil;var S = global.Math.imul;var T = global.Math.min;var U = global.Math.max;var V = global.Math.clz32;var W = env.abort;var X = env.assert;var Y = env.enlargeMemory;var Z = env.getTotalMemory;var _ = env.abortOnCannotGrowMemory;var $ = env.invoke_iiii;var aa = env.invoke_viiiiii;var ba = env.invoke_viiiiiiiiiiiii;var ca = env.invoke_vi;var da = env.invoke_viiiiiiiiiiiiiii;var ea = env.invoke_ii;var fa = env.invoke_viii;var ga = env.invoke_v;var ha = env.invoke_iiiiiiiiiiiiiiiiiiiii;var ia = env.invoke_viiii;var ja = env.___syscall6;var ka = env._llvm_pow_f64;var la = env.___lock;var ma = env._abort;var na = env.___setErrNo;var oa = env._llvm_stacksave;var pa = env.___syscall140;var qa = env._emscripten_memcpy_big;var ra = env.___syscall54;var sa = env.___unlock;var ta = env._exit;var ua = env._llvm_stackrestore;var va = env.__exit;var wa = env.___syscall146;var xa = 0.0;
  // EMSCRIPTEN_START_FUNCS
  function Ia(a) {
    a = a | 0;var b = 0;b = l;l = l + a | 0;l = l + 15 & -16;return b | 0;
  }function Ja() {
    return l | 0;
  }function Ka(a) {
    a = a | 0;l = a;
  }function La(a, b) {
    a = a | 0;b = b | 0;l = a;m = b;
  }function Ma(a, b) {
    a = a | 0;b = b | 0;if (!o) {
      o = a;p = b;
    }
  }function Na(a) {
    a = a | 0;D = a;
  }function Oa() {
    return D | 0;
  }function Pa(d, f, g, h, i, j, k, m, n, o, p, q, r) {
    d = d | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;m = m | 0;n = n | 0;o = o | 0;p = p | 0;q = q | 0;r = r | 0;var s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        E = 0,
        F = 0,
        G = 0,
        H = 0,
        I = 0,
        J = 0,
        K = 0,
        L = 0,
        M = 0,
        N = 0,
        O = 0,
        P = 0,
        Q = 0,
        R = 0,
        T = 0,
        U = 0,
        V = 0,
        W = 0,
        X = 0,
        Y = 0,
        Z = 0,
        _ = 0,
        $ = 0,
        aa = 0,
        ba = 0,
        ca = 0,
        da = 0,
        ea = 0,
        fa = 0,
        ga = 0,
        ha = 0,
        ia = 0;ha = l;l = l + 16 | 0;M = ha + 4 | 0;P = ha;q = ((q | 0) < 10 ? q : 10) << 1;_ = (q | 0) / 3 | 0;if ((q | 0) < 6 | (q + -3 | 0) >>> 0 < 3) {
      E = c[i >> 2] | 0;F = c[i + 4 >> 2] | 0;G = i + 12 | 0;ga = c[G >> 2] | 0;H = 1 << ga;I = c[i + 8 >> 2] | 0;D = c[i + 16 >> 2] | 0;z = E << ga << 1;C = p + (p & 1) + z | 0;z = C + (0 - z) | 0;q = H << 2;C = C + (0 - C & 3) + q | 0;A = C + (0 - q) | 0;J = k << 1;C = C + (C & 1) + J | 0;L = 0 - J | 0;B = C + L | 0;Q = k << 2;C = C + (0 - C & 3) + Q | 0;Q = C + (0 - Q) | 0;Zd(B | 0, d | 0, J | 0) | 0;K = C + (C & 1) | 0;x = E << 1;x = K + x + (0 - x) | 0;do {
        if ((ga | 0) != 31) {
          if ((E | 0) > 0) w = 0;else {
            Sd(A | 0, 0, q | 0) | 0;break;
          }do {
            p = S(w, E) | 0;q = 0;do {
              b[x + (q << 1) >> 1] = a[I + (q + p) >> 0] | 0;q = q + 1 | 0;
            } while ((q | 0) != (E | 0));u = z + (p << 1) | 0;s = A + (w << 2) | 0;c[s >> 2] = 0;p = 0;t = 0;v = 1;while (1) {
              q = 0;i = 0;do {
                q = (S(b[n + (p - i << 1) >> 1] | 0, b[x + (i << 1) >> 1] | 0) | 0) + q | 0;i = i + 1 | 0;
              } while ((i | 0) != (v | 0));ga = q >>> 13;fa = ga << 16 >> 16;t = (S(fa, fa) | 0) + t | 0;b[u + (p << 1) >> 1] = ga;p = p + 1 | 0;if ((p | 0) == (E | 0)) break;else v = v + 1 | 0;
            }c[s >> 2] = t;w = w + 1 | 0;
          } while ((w | 0) != (H | 0));
        }
      } while (0);if ((F | 0) > 0) {
        x = (D | 0) == 0;y = (E | 0) > 0;q = 0;do {
          s = S(q, E) | 0;p = B + (s << 1) | 0;if (x) Jb(p, z, E, H, A, 1, M, P, C);else Kb(p, z, E, H, A, 1, M, P, C);Qb(o, c[M >> 2] | 0, (c[G >> 2] | 0) + D | 0);w = c[M >> 2] | 0;t = (w | 0) < (H | 0);w = S(w - (t ? 0 : H) | 0, E) | 0;i = z + (w << 1) | 0;if (t) {
            if (y) {
              p = 0;do {
                ga = B + (p + s << 1) | 0;b[ga >> 1] = (e[ga >> 1] | 0) - (e[i + (p << 1) >> 1] | 0);p = p + 1 | 0;
              } while ((p | 0) != (E | 0));v = 24;
            } else v = 27;
          } else if (y) {
            p = 0;do {
              ga = B + (p + s << 1) | 0;b[ga >> 1] = (e[i + (p << 1) >> 1] | 0) + (e[ga >> 1] | 0);p = p + 1 | 0;
            } while ((p | 0) != (E | 0));v = 24;
          } else v = 27;do {
            if ((v | 0) == 24) {
              v = 0;if (t) {
                if (y) p = 0;else {
                  v = 27;break;
                }do {
                  c[Q + (p + s << 2) >> 2] = a[I + (p + w) >> 0] << 9;p = p + 1 | 0;
                } while ((p | 0) != (E | 0));
              } else {
                if (y) p = 0;else {
                  v = 27;break;
                }do {
                  c[Q + (p + s << 2) >> 2] = 0 - (a[I + (p + w) >> 0] << 9);p = p + 1 | 0;
                } while ((p | 0) != (E | 0));
              }q = q + 1 | 0;if (y ? (O = S(q, E) | 0, N = B + (O << 1) | 0, O = k - O | 0, (O | 0) > 0) : 0) {
                s = t ? 65536 : -65536;i = 0;do {
                  t = n + (E - i << 1) | 0;u = (S(a[I + (i + w) >> 0] | 0, s) | 0) >> 16;p = 0;do {
                    ga = N + (p << 1) | 0;b[ga >> 1] = (e[ga >> 1] | 0) - (((S(b[t + (p << 1) >> 1] | 0, u) | 0) + 4096 | 0) >>> 13);p = p + 1 | 0;
                  } while ((p | 0) != (O | 0));i = i + 1 | 0;
                } while ((i | 0) != (E | 0));
              }
            }
          } while (0);if ((v | 0) == 27) q = q + 1 | 0;
        } while ((q | 0) != (F | 0));
      }s = (k | 0) > 0;if (s) {
        q = 0;do {
          o = m + (q << 2) | 0;c[o >> 2] = (c[Q + (q << 2) >> 2] | 0) + (c[o >> 2] | 0);q = q + 1 | 0;
        } while ((q | 0) != (k | 0));
      }do {
        if (r | 0) {
          p = K + J | 0;i = p + L | 0;if (s) q = 0;else {
            cb(i, f, g, h, i, k, j, p);break;
          }do {
            b[i + (q << 1) >> 1] = ((c[Q + (q << 2) >> 2] | 0) + 32 | 0) >>> 6;q = q + 1 | 0;
          } while ((q | 0) != (k | 0));cb(i, f, g, h, i, k, j, p);q = 0;do {
            j = d + (q << 1) | 0;b[j >> 1] = (e[j >> 1] | 0) - (((b[i + (q << 1) >> 1] | 0) + 2 | 0) >>> 2);q = q + 1 | 0;
          } while ((q | 0) != (k | 0));
        }
      } while (0);l = ha;return;
    }t = _ << 2;p = p + (0 - p & 3) + t | 0;s = 0 - t | 0;z = p + s | 0;p = p + (0 - p & 3) + t | 0;A = p + s | 0;p = p + (0 - p & 3) + t | 0;W = p + s | 0;p = p + (0 - p & 3) + t | 0;Y = p + s | 0;aa = c[i >> 2] | 0;ba = c[i + 4 >> 2] | 0;Z = i + 12 | 0;w = c[Z >> 2] | 0;ca = 1 << w;da = c[i + 8 >> 2] | 0;X = c[i + 16 >> 2] | 0;U = aa << w << 1;p = p + (p & 1) + U | 0;U = p + (0 - U) | 0;v = ca << 2;p = p + (0 - p & 3) + v | 0;V = p + (0 - v) | 0;ea = k << 1;p = p + (p & 1) + ea | 0;fa = 0 - ea | 0;u = p + fa | 0;ga = k << 2;p = p + (0 - p & 3) + ga | 0;ga = p + (0 - ga) | 0;$ = ba << 2;p = p + (0 - p & 3) + $ | 0;$ = p + (0 - $) | 0;i = S(ea, _ << 1) | 0;p = p + (p & 1) + i | 0;i = p + (0 - i) | 0;T = (q | 0) > 2;if (T) {
      q = 0;do {
        R = q << 1;c[z + (q << 2) >> 2] = i + ((S(R, k) | 0) << 1);c[A + (q << 2) >> 2] = i + ((S(R | 1, k) | 0) << 1);q = q + 1 | 0;
      } while ((q | 0) < (_ | 0));
    }y = p + (0 - p & 3) + t | 0;M = y + s | 0;y = y + (0 - y & 3) + t | 0;N = y + s | 0;y = y + (0 - y & 3) + t | 0;O = y + s | 0;y = y + (0 - y & 3) + t | 0;P = y + s | 0;y = y + (0 - y & 3) + t | 0;Q = y + s | 0;y = y + (0 - y & 3) | 0;L = y + t | 0;K = L + s | 0;p = S(_ << 3, ba) | 0;L = L + (0 - L & 3) + p | 0;p = L + (0 - p) | 0;if (T) {
      q = 0;do {
        R = q << 1;c[Y + (q << 2) >> 2] = p + ((S(R, ba) | 0) << 2);c[W + (q << 2) >> 2] = p + ((S(R | 1, ba) | 0) << 2);q = q + 1 | 0;
      } while ((q | 0) < (_ | 0));Zd(u | 0, d | 0, ea | 0) | 0;if (T) {
        q = 0;do {
          Zd(c[z + (q << 2) >> 2] | 0, u | 0, ea | 0) | 0;q = q + 1 | 0;
        } while ((q | 0) < (_ | 0));
      }
    } else Zd(u | 0, d | 0, ea | 0) | 0;R = L + (L & 1) | 0;x = aa << 1;x = R + x + (0 - x) | 0;do {
      if ((w | 0) != 31) {
        if ((aa | 0) > 0) w = 0;else {
          Sd(V | 0, 0, v | 0) | 0;break;
        }do {
          p = S(w, aa) | 0;q = 0;do {
            b[x + (q << 1) >> 1] = a[da + (q + p) >> 0] | 0;q = q + 1 | 0;
          } while ((q | 0) != (aa | 0));u = U + (p << 1) | 0;s = V + (w << 2) | 0;c[s >> 2] = 0;p = 0;t = 0;v = 1;while (1) {
            q = 0;i = 0;do {
              q = (S(b[n + (p - i << 1) >> 1] | 0, b[x + (i << 1) >> 1] | 0) | 0) + q | 0;i = i + 1 | 0;
            } while ((i | 0) != (v | 0));J = q >>> 13;I = J << 16 >> 16;t = (S(I, I) | 0) + t | 0;b[u + (p << 1) >> 1] = J;p = p + 1 | 0;if ((p | 0) == (aa | 0)) break;else v = v + 1 | 0;
          }c[s >> 2] = t;w = w + 1 | 0;
        } while ((w | 0) != (ca | 0));
      }
    } while (0);if (T) Sd(y | 0, 0, ((_ | 0) > 1 ? _ : 1) << 2 | 0) | 0;J = (ba | 0) > 0;if (J) {
      F = (aa | 0) > 0;G = (X | 0) == 0;H = _ + -1 | 0;I = Q + (H << 2) | 0;E = F ^ 1;D = z;B = A;C = 0;while (1) {
        if (T) {
          q = 0;do {
            c[Q + (q << 2) >> 2] = 2147483647;q = q + 1 | 0;
          } while ((q | 0) < (_ | 0));if (T) {
            q = 0;do {
              c[P + (q << 2) >> 2] = 0;c[O + (q << 2) >> 2] = 0;q = q + 1 | 0;
            } while ((q | 0) < (_ | 0));if (T) {
              x = S(C, aa) | 0;y = (C | 0) != 0;w = 0;do {
                i = (c[D + (w << 2) >> 2] | 0) + (x << 1) | 0;if (F) {
                  q = 0;p = 0;do {
                    A = b[i + (p << 1) >> 1] | 0;q = (S(A, A) | 0) + q | 0;p = p + 1 | 0;
                  } while ((p | 0) != (aa | 0));
                } else q = 0;v = q >> 1;if (G) Jb(i, U, aa, ca, V, _, M, N, L);else Kb(i, U, aa, ca, V, _, M, N, L);t = K + (w << 2) | 0;s = 0;do {
                  u = (c[t >> 2] | 0) + v + (c[N + (s << 2) >> 2] | 0) | 0;a: do {
                    if ((u | 0) < (c[I >> 2] | 0)) {
                      q = 0;while (1) {
                        i = Q + (q << 2) | 0;if ((u | 0) < (c[i >> 2] | 0)) break;q = q + 1 | 0;if ((q | 0) >= (_ | 0)) break a;
                      }if ((H | 0) > (q | 0)) {
                        p = H;do {
                          A = p;p = p + -1 | 0;c[Q + (A << 2) >> 2] = c[Q + (p << 2) >> 2];c[O + (A << 2) >> 2] = c[O + (p << 2) >> 2];c[P + (A << 2) >> 2] = c[P + (p << 2) >> 2];
                        } while ((p | 0) > (q | 0));
                      } else q = H;c[i >> 2] = u;c[O + (q << 2) >> 2] = c[M + (s << 2) >> 2];c[P + (q << 2) >> 2] = w;
                    }
                  } while (0);s = s + 1 | 0;
                } while ((s | 0) < (_ | 0));w = w + 1 | 0;
              } while (y & (w | 0) < (_ | 0));if (T) {
                x = S(C + 1 | 0, aa) | 0;y = (x | 0) < (k | 0);z = k - x | 0;A = (z | 0) < 1 | E;w = 0;do {
                  if (y) {
                    p = c[D + (c[P + (w << 2) >> 2] << 2) >> 2] | 0;i = c[B + (w << 2) >> 2] | 0;q = x;do {
                      b[i + (q << 1) >> 1] = b[p + (q << 1) >> 1] | 0;q = q + 1 | 0;
                    } while ((q | 0) != (k | 0));
                  }if (!A) {
                    p = c[O + (w << 2) >> 2] | 0;t = (p | 0) < (ca | 0);s = (c[B + (w << 2) >> 2] | 0) + (x << 1) | 0;i = t ? 65536 : -65536;t = S(p - (t ? 0 : ca) | 0, aa) | 0;p = 0;do {
                      u = n + (aa - p << 1) | 0;v = (S(i, a[da + (t + p) >> 0] | 0) | 0) >> 16;q = 0;do {
                        ia = s + (q << 1) | 0;b[ia >> 1] = (e[ia >> 1] | 0) - (((S(b[u + (q << 1) >> 1] | 0, v) | 0) + 4096 | 0) >>> 13);q = q + 1 | 0;
                      } while ((q | 0) != (z | 0));p = p + 1 | 0;
                    } while ((p | 0) != (aa | 0));
                  }p = c[Y + (w << 2) >> 2] | 0;i = P + (w << 2) | 0;q = 0;do {
                    c[p + (q << 2) >> 2] = c[(c[W + (c[i >> 2] << 2) >> 2] | 0) + (q << 2) >> 2];q = q + 1 | 0;
                  } while ((q | 0) != (ba | 0));c[p + (C << 2) >> 2] = c[O + (w << 2) >> 2];w = w + 1 | 0;
                } while ((w | 0) < (_ | 0));if (T) {
                  p = 0;do {
                    i = c[Y + (p << 2) >> 2] | 0;s = c[W + (p << 2) >> 2] | 0;q = 0;do {
                      c[s + (q << 2) >> 2] = c[i + (q << 2) >> 2];q = q + 1 | 0;
                    } while ((q | 0) != (ba | 0));p = p + 1 | 0;
                  } while ((p | 0) < (_ | 0));if (T) {
                    q = 0;do {
                      c[K + (q << 2) >> 2] = c[Q + (q << 2) >> 2];q = q + 1 | 0;
                    } while ((q | 0) < (_ | 0));
                  }
                }
              }
            }
          }
        }C = C + 1 | 0;if ((C | 0) == (ba | 0)) break;else {
          ia = B;B = D;D = ia;
        }
      }if (J) {
        q = 0;do {
          ia = c[(c[Y >> 2] | 0) + (q << 2) >> 2] | 0;c[$ + (q << 2) >> 2] = ia;Qb(o, ia, (c[Z >> 2] | 0) + X | 0);q = q + 1 | 0;
        } while ((q | 0) != (ba | 0));if (J & (aa | 0) > 0) {
          p = 0;do {
            i = c[$ + (p << 2) >> 2] | 0;ia = (i | 0) < (ca | 0);i = S(i - (ia ? 0 : ca) | 0, aa) | 0;s = S(p, aa) | 0;if (ia) {
              q = 0;do {
                c[ga + (q + s << 2) >> 2] = a[da + (q + i) >> 0] << 9;q = q + 1 | 0;
              } while ((q | 0) != (aa | 0));
            } else {
              q = 0;do {
                c[ga + (q + s << 2) >> 2] = 0 - (a[da + (q + i) >> 0] << 9);q = q + 1 | 0;
              } while ((q | 0) != (aa | 0));
            }p = p + 1 | 0;
          } while ((p | 0) != (ba | 0));
        }
      }
    }s = (k | 0) > 0;if (s) {
      q = 0;do {
        ia = m + (q << 2) | 0;c[ia >> 2] = (c[ga + (q << 2) >> 2] | 0) + (c[ia >> 2] | 0);q = q + 1 | 0;
      } while ((q | 0) != (k | 0));
    }if (!r) {
      l = ha;return;
    }p = R + ea | 0;i = p + fa | 0;if (s) q = 0;else {
      cb(i, f, g, h, i, k, j, p);l = ha;return;
    }do {
      b[i + (q << 1) >> 1] = ((c[ga + (q << 2) >> 2] | 0) + 32 | 0) >>> 6;q = q + 1 | 0;
    } while ((q | 0) != (k | 0));cb(i, f, g, h, i, k, j, p);if (s) q = 0;else {
      l = ha;return;
    }do {
      ia = d + (q << 1) | 0;b[ia >> 1] = (e[ia >> 1] | 0) - (((b[i + (q << 1) >> 1] | 0) + 2 | 0) >>> 2);q = q + 1 | 0;
    } while ((q | 0) != (k | 0));l = ha;return;
  }function Qa(b, d, e, f, g, h) {
    b = b | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;var i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0;m = c[d >> 2] | 0;n = c[d + 4 >> 2] | 0;i = d + 12 | 0;l = c[d + 8 >> 2] | 0;h = n << 2;g = g + (0 - g & 3) + h | 0;k = 0 - h | 0;j = g + k | 0;k = g + (0 - g & 3) + h + k | 0;h = (n | 0) > 0;if (!h) return;if (!(c[d + 16 >> 2] | 0)) {
      e = 0;do {
        c[k + (e << 2) >> 2] = 0;c[j + (e << 2) >> 2] = Rb(f, c[i >> 2] | 0) | 0;e = e + 1 | 0;
      } while ((e | 0) != (n | 0));
    } else {
      e = 0;do {
        c[k + (e << 2) >> 2] = Rb(f, 1) | 0;c[j + (e << 2) >> 2] = Rb(f, c[i >> 2] | 0) | 0;e = e + 1 | 0;
      } while ((e | 0) != (n | 0));
    }if (h & (m | 0) > 0) h = 0;else return;do {
      g = j + (h << 2) | 0;d = S(h, m) | 0;if (!(c[k + (h << 2) >> 2] | 0)) {
        e = 0;do {
          c[b + (e + d << 2) >> 2] = a[l + ((S(c[g >> 2] | 0, m) | 0) + e) >> 0] << 9;e = e + 1 | 0;
        } while ((e | 0) != (m | 0));
      } else {
        e = 0;do {
          c[b + (e + d << 2) >> 2] = 0 - (a[l + ((S(c[g >> 2] | 0, m) | 0) + e) >> 0] << 9);e = e + 1 | 0;
        } while ((e | 0) != (m | 0));
      }h = h + 1 | 0;
    } while ((h | 0) != (n | 0));return;
  }function Ra(a, d, e, f, g, h, i, j, k, l, m, n, o) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;l = l | 0;m = m | 0;n = n | 0;o = o | 0;g = i << 1;m = m + (m & 1) + g | 0;o = m + (0 - g) | 0;db(a, d, e, f, o, i, h, m);if ((i | 0) > 0) n = 0;else {
      Sd(a | 0, 0, g | 0) | 0;return;
    }do {
      h = j + (n << 2) | 0;c[h >> 2] = (b[o + (n << 1) >> 1] << 8) + (c[h >> 2] | 0);n = n + 1 | 0;
    } while ((n | 0) != (i | 0));Sd(a | 0, 0, g | 0) | 0;return;
  }function Sa(a, b, d, e, f, g) {
    a = a | 0;b = b | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;if ((d | 0) > 0) b = 0;else return;do {
      f = (S(c[g >> 2] | 0, 1664525) | 0) + 1013904223 | 0;c[g >> 2] = f;c[a + (b << 2) >> 2] = 8192 - (f >> 19) + (f >> 16) >> 14 << 14;b = b + 1 | 0;
    } while ((b | 0) != (d | 0));return;
  }function Ta(a, c, d, e) {
    a = a | 0;c = c | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0;if ((e | 0) <= 0) return;g = a << 16 >> 16;f = 0;do {
      h = a << 16 >> 16;b[d + (f << 1) >> 1] = ((S(b[c + (f << 1) >> 1] | 0, h) | 0) + 16384 | 0) >>> 15;a = ((S(h, g) | 0) + 16384 | 0) >>> 15 & 65535;f = f + 1 | 0;
    } while ((f | 0) != (e | 0));return;
  }function Ua(a, b, d, e) {
    a = a | 0;b = b | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0,
        i = 0;if ((e | 0) > 0) f = 0;else return;do {
      g = a + (f << 2) | 0;i = c[g >> 2] | 0;h = (i | 0) < (b | 0);i = (i | 0) > (d | 0);if (h | i) c[g >> 2] = h ? b : i ? d : 0;f = f + 1 | 0;
    } while ((f | 0) != (e | 0));return;
  }function Va(a, d, f, g, h) {
    a = a | 0;d = d | 0;f = f | 0;g = g | 0;h = h | 0;var i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0;g = (g | 0) < 4 ? g : 4;if ((f | 0) <= 0) return;p = b[2614 + (g * 6 | 0) >> 1] | 0;l = h + 4 | 0;m = b[2614 + (g * 6 | 0) + 2 >> 1] | 0;n = 0 - (e[2644 + (g * 6 | 0) + 2 >> 1] | 0) << 16 >> 16;o = b[2614 + (g * 6 | 0) + 4 >> 1] | 0;i = 0 - (e[2644 + (g * 6 | 0) + 4 >> 1] | 0) << 16 >> 16;g = 0;j = c[h >> 2] | 0;k = c[l >> 2] | 0;do {
      r = b[a + (g << 1) >> 1] | 0;t = (S(r, p) | 0) + j | 0;q = t + 8192 >> 14;s = t << 1 >> 16;t = t & 32767;j = (S(m, r) | 0) + k + (((S(n, t) | 0) >> 15) + (S(n, s) | 0) << 1) | 0;k = (((S(i, t) | 0) >> 15) + (S(i, s) | 0) << 1) + (S(o, r) | 0) | 0;b[d + (g << 1) >> 1] = (q | 0) > 32767 ? 32767 : ((q | 0) > -32767 ? q : -32767) & 65535;g = g + 1 | 0;
    } while ((g | 0) != (f | 0));c[h >> 2] = j;c[l >> 2] = k;return;
  }function Wa(a, b, d, e) {
    a = a | 0;b = b | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0;if ((e | 0) <= 0) return;g = d << 2 >> 16;f = d & 16383;d = 0;do {
      h = c[a + (d << 2) >> 2] << 9 >> 16;c[b + (d << 2) >> 2] = ((S(h, f) | 0) >> 14) + (S(h, g) | 0) << 7;d = d + 1 | 0;
    } while ((d | 0) != (e | 0));return;
  }function Xa(a, c, d, f) {
    a = a | 0;c = c | 0;d = d | 0;f = f | 0;var g = 0;if ((d | 0) > 4194304) {
      d = (d << 2) + 32768 | 0;if ((f | 0) <= 0) return;g = (((d >> 17) + 2097152 | 0) / (d >> 16 | 0) | 0) << 16 >> 16;d = 0;do {
        b[c + (d << 1) >> 1] = ((S(b[a + (d << 1) >> 1] | 0, g) | 0) + 16384 | 0) >>> 15;d = d + 1 | 0;
      } while ((d | 0) != (f | 0));return;
    }if ((d | 0) > 4096) {
      if ((f | 0) <= 0) return;g = (131072 / ((d << 7) + 32768 >> 16 | 0) | 0) << 16 >> 16;d = 0;do {
        b[c + (d << 1) >> 1] = ((S(e[a + (d << 1) >> 1] << 18 >> 16, g) | 0) + 128 | 0) >>> 8;d = d + 1 | 0;
      } while ((d | 0) != (f | 0));return;
    } else {
      d = d + 64 >> 7;if ((f | 0) <= 0) return;g = (131072 / (((d | 0) > 5 ? d : 5) << 16 >> 16 | 0) | 0) << 16 >> 16;d = 0;do {
        b[c + (d << 1) >> 1] = ((S(e[a + (d << 1) >> 1] << 18 >> 16, g) | 0) + 32 | 0) >>> 6;d = d + 1 | 0;
      } while ((d | 0) != (f | 0));return;
    }
  }function Ya(a, b) {
    a = a | 0;b = b | 0;var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;f = (b | 0) > 0;if (f) {
      e = 1;d = 0;do {
        g = c[a + (d << 2) >> 2] | 0;g = (g | 0) < 0 ? 0 - g | 0 : g;e = (g | 0) > (e | 0) ? g : e;d = d + 1 | 0;
      } while ((d | 0) != (b | 0));if ((e | 0) > 16383) {
        d = 0;while (1) {
          d = d + 1 | 0;if (e >>> 0 > 32767) e = e >>> 1;else break;
        }
      } else d = 0;if (f) {
        e = 0;f = 0;do {
          g = c[a + (f << 2) >> 2] >> d << 16 >> 16;g = S(g, g) | 0;h = c[a + ((f | 1) << 2) >> 2] >> d << 16 >> 16;g = (S(h, h) | 0) + g | 0;h = c[a + ((f | 2) << 2) >> 2] >> d << 16 >> 16;h = g + (S(h, h) | 0) | 0;g = c[a + ((f | 3) << 2) >> 2] >> d << 16 >> 16;e = ((h + (S(g, g) | 0) | 0) >>> 6) + e | 0;f = f + 4 | 0;
        } while ((f | 0) < (b | 0));
      } else e = 0;
    } else {
      e = 0;d = 0;
    }b = (e | 0) / (b | 0) | 0;h = b >>> 0 > 65535;a = h ? b >>> 16 : b;h = h ? 8 : 0;g = a >>> 0 > 255;a = g ? a >>> 8 : a;h = g ? h | 4 : h;g = a >>> 0 > 15;h = (g ? a >>> 4 : a) >>> 0 > 3 | (g ? h | 2 : h);g = h << 1;g = ((h & 65535) << 16 >> 16 > 6 ? b >> g + -12 : b << 12 - g) << 16 >> 16;g = ((S(((S((g * 16816 | 0) + -827523072 >> 16, g) | 0) >>> 14 << 16) + 1387593728 >> 16, g) | 0) >>> 14 << 16) + 238157824 >> 16;h = 13 - h | 0;return ((((h | 0) > 0 ? g >> h : g << 0 - h) << 16 >> 16 << d + 3) + 8192 | 0) >>> 14 & 65535 | 0;
  }function Za(a, c) {
    a = a | 0;c = c | 0;var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;f = (c | 0) > 0;a: do {
      if (f) {
        d = 0;e = 10;do {
          h = b[a + (d << 1) >> 1] | 0;g = h << 16 >> 16;g = h << 16 >> 16 < 0 ? 0 - g | 0 : g;e = (g | 0) > (e << 16 >> 16 | 0) ? g & 65535 : e;d = d + 1 | 0;
        } while ((d | 0) != (c | 0));if (e << 16 >> 16 <= 16383) {
          e = e << 16 >> 16 < 2048 ? 3 : e << 16 >> 16 < 4096 ? 2 : e << 16 >> 16 < 8192 & 1;if (f) {
            d = 0;f = 0;
          } else {
            d = 0;break;
          }while (1) {
            h = b[a + (f << 1) >> 1] << e << 16 >> 16;h = S(h, h) | 0;g = b[a + ((f | 1) << 1) >> 1] << e << 16 >> 16;h = (S(g, g) | 0) + h | 0;g = b[a + ((f | 2) << 1) >> 1] << e << 16 >> 16;g = h + (S(g, g) | 0) | 0;h = b[a + ((f | 3) << 1) >> 1] << e << 16 >> 16;d = ((g + (S(h, h) | 0) | 0) >>> 6) + d | 0;f = f + 4 | 0;if ((f | 0) >= (c | 0)) break a;
          }
        }if (f) {
          d = 0;e = 0;do {
            h = b[a + (e << 1) >> 1] >> 1;h = S(h, h) | 0;g = b[a + ((e | 1) << 1) >> 1] >> 1;h = (S(g, g) | 0) + h | 0;g = b[a + ((e | 2) << 1) >> 1] >> 1;g = h + (S(g, g) | 0) | 0;h = b[a + ((e | 3) << 1) >> 1] >> 1;d = ((g + (S(h, h) | 0) | 0) >>> 6) + d | 0;e = e + 4 | 0;
          } while ((e | 0) < (c | 0));
        } else d = 0;c = (d | 0) / (c | 0) | 0;h = c >>> 0 > 65535;a = h ? c >>> 16 : c;h = h ? 8 : 0;g = a >>> 0 > 255;a = g ? a >>> 8 : a;h = g ? h | 4 : h;g = a >>> 0 > 15;h = (g ? a >>> 4 : a) >>> 0 > 3 | (g ? h | 2 : h);g = h << 1;g = ((h & 65535) << 16 >> 16 > 6 ? c >> g + -12 : c << 12 - g) << 16 >> 16;g = ((S(((S((g * 16816 | 0) + -827523072 >> 16, g) | 0) >>> 14 << 16) + 1387593728 >> 16, g) | 0) >>> 14 << 16) + 238157824 >> 16;h = 13 - h | 0;h = ((h | 0) > 0 ? g >> h : g << 0 - h) << 16 >> 12;h = h & 65535;return h | 0;
      } else {
        e = 3;d = 0;
      }
    } while (0);c = (d | 0) / (c | 0) | 0;h = c >>> 0 > 65535;a = h ? c >>> 16 : c;h = h ? 8 : 0;g = a >>> 0 > 255;a = g ? a >>> 8 : a;h = g ? h | 4 : h;g = a >>> 0 > 15;h = (g ? a >>> 4 : a) >>> 0 > 3 | (g ? h | 2 : h);g = h << 1;g = ((h & 65535) << 16 >> 16 > 6 ? c >> g + -12 : c << 12 - g) << 16 >> 16;g = ((S(((S((g * 16816 | 0) + -827523072 >> 16, g) | 0) >>> 14 << 16) + 1387593728 >> 16, g) | 0) >>> 14 << 16) + 238157824 >> 16;h = 13 - h | 0;h = ((h | 0) > 0 ? g >> h : g << 0 - h) << 16 >> 16 << (e ^ 3);h = h & 65535;return h | 0;
  }function _a(a, d, e, f) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;var g = 0,
        h = 0,
        i = 0,
        j = 0;i = (f | 0) > 0;if (i) {
      g = 1;h = 0;do {
        j = c[a + (h << 2) >> 2] | 0;j = (j | 0) < 0 ? 0 - j | 0 : j;g = (j | 0) < (g | 0) ? g : j;h = h + 1 | 0;
      } while ((h | 0) != (f | 0));
    } else g = 1;if ((g | 0) > (e | 0)) {
      h = 0;do {
        h = h + 1 | 0;g = g >> 1;
      } while ((g | 0) > (e | 0));
    } else h = 0;if (i) g = 0;else return h | 0;do {
      b[d + (g << 1) >> 1] = c[a + (g << 2) >> 2] >> h;g = g + 1 | 0;
    } while ((g | 0) != (f | 0));return h | 0;
  }function $a(a, d, e, f, g, h, i, j) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;var k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0;if ((g | 0) <= 0) return;n = h + -1 | 0;o = d + (n << 1) | 0;p = e + (n << 1) | 0;q = i + (n << 2) | 0;if ((h | 0) > 1) h = 0;else {
      j = 0;do {
        d = b[a + (j << 1) >> 1] | 0;e = ((c[i >> 2] | 0) + 4096 >> 13) + d | 0;e = (e | 0) > 32767 ? 32767 : (e | 0) > -32767 ? e : -32767;d = S(b[o >> 1] | 0, d) | 0;c[q >> 2] = (S(b[p >> 1] | 0, 0 - e << 16 >> 16) | 0) + d;b[f + (j << 1) >> 1] = e;j = j + 1 | 0;
      } while ((j | 0) != (g | 0));return;
    }do {
      k = b[a + (h << 1) >> 1] | 0;l = ((c[i >> 2] | 0) + 4096 >> 13) + k | 0;l = (l | 0) > 32767 ? 32767 : (l | 0) > -32767 ? l : -32767;m = 0 - l << 16 >> 16;j = 0;do {
        r = j;j = j + 1 | 0;s = (S(b[d + (r << 1) >> 1] | 0, k) | 0) + (c[i + (j << 2) >> 2] | 0) | 0;c[i + (r << 2) >> 2] = s + (S(b[e + (r << 1) >> 1] | 0, m) | 0);
      } while ((j | 0) != (n | 0));s = S(b[o >> 1] | 0, k) | 0;c[q >> 2] = (S(b[p >> 1] | 0, m) | 0) + s;b[f + (h << 1) >> 1] = l;h = h + 1 | 0;
    } while ((h | 0) != (g | 0));return;
  }function ab(a, d, e, f, g, h, i) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;var j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0;if ((f | 0) <= 0) return;l = g + -1 | 0;m = d + (l << 1) | 0;n = h + (l << 2) | 0;if ((g | 0) > 1) g = 0;else {
      i = 0;do {
        d = ((c[h >> 2] | 0) + 4096 >> 13) + (b[a + (i << 1) >> 1] | 0) | 0;d = (d | 0) > 32767 ? 32767 : (d | 0) > -32767 ? d : -32767;c[n >> 2] = S(b[m >> 1] | 0, 0 - d << 16 >> 16) | 0;b[e + (i << 1) >> 1] = d;i = i + 1 | 0;
      } while ((i | 0) != (f | 0));return;
    }do {
      j = ((c[h >> 2] | 0) + 4096 >> 13) + (b[a + (g << 1) >> 1] | 0) | 0;j = (j | 0) > 32767 ? 32767 : (j | 0) > -32767 ? j : -32767;k = 0 - j << 16 >> 16;i = 0;do {
        o = i;i = i + 1 | 0;c[h + (o << 2) >> 2] = (S(b[d + (o << 1) >> 1] | 0, k) | 0) + (c[h + (i << 2) >> 2] | 0);
      } while ((i | 0) != (l | 0));c[n >> 2] = S(b[m >> 1] | 0, k) | 0;b[e + (g << 1) >> 1] = j;g = g + 1 | 0;
    } while ((g | 0) != (f | 0));return;
  }function bb(a, d, e, f, g, h, i) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;var j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0;if ((f | 0) <= 0) return;m = g + -1 | 0;n = d + (m << 1) | 0;o = h + (m << 2) | 0;if ((g | 0) > 1) g = 0;else {
      i = 0;do {
        m = b[a + (i << 1) >> 1] | 0;d = ((c[h >> 2] | 0) + 4096 >> 13) + m | 0;c[o >> 2] = S(b[n >> 1] | 0, m) | 0;b[e + (i << 1) >> 1] = (d | 0) > 32767 ? 32767 : ((d | 0) > -32767 ? d : -32767) & 65535;i = i + 1 | 0;
      } while ((i | 0) != (f | 0));return;
    }do {
      j = b[a + (g << 1) >> 1] | 0;k = ((c[h >> 2] | 0) + 4096 >> 13) + j | 0;l = ((k | 0) > -32767 ? k : -32767) & 65535;i = 0;do {
        p = i;i = i + 1 | 0;c[h + (p << 2) >> 2] = (S(b[d + (p << 1) >> 1] | 0, j) | 0) + (c[h + (i << 2) >> 2] | 0);
      } while ((i | 0) != (m | 0));c[o >> 2] = S(b[n >> 1] | 0, j) | 0;b[e + (g << 1) >> 1] = (k | 0) > 32767 ? 32767 : l;g = g + 1 | 0;
    } while ((g | 0) != (f | 0));return;
  }function cb(a, b, c, d, e, f, g, h) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;var i = 0,
        j = 0;h = h + (0 - h & 3) | 0;i = g << 2;j = h + i + (0 - i) | 0;if ((g | 0) > 0) {
      Sd(h | 0, 0, i | 0) | 0;ab(a, b, e, f, g, j, 0);Sd(h | 0, 0, i | 0) | 0;$a(e, c, d, e, f, g, j, 0);return;
    } else {
      ab(a, b, e, f, g, j, 0);$a(e, c, d, e, f, g, j, 0);return;
    }
  }function db(a, d, e, f, g, h, i, j) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;var k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0;j = j + (0 - j & 3) | 0;k = i << 2;o = j + k + (0 - k) | 0;if ((i | 0) > 0) {
      Sd(j | 0, 0, k | 0) | 0;$a(a, d, e, g, h, i, o, 0);Sd(j | 0, 0, k | 0) | 0;
    } else $a(a, d, e, g, h, i, o, 0);if ((h | 0) <= 0) return;l = i + -1 | 0;m = f + (l << 1) | 0;n = o + (l << 2) | 0;if ((i | 0) > 1) a = 0;else {
      j = 0;do {
        f = g + (j << 1) | 0;i = b[f >> 1] | 0;l = ((c[o >> 2] | 0) + 4096 >> 13) + i | 0;c[n >> 2] = S(b[m >> 1] | 0, i) | 0;b[f >> 1] = (l | 0) > 32767 ? 32767 : ((l | 0) > -32767 ? l : -32767) & 65535;j = j + 1 | 0;
      } while ((j | 0) != (h | 0));return;
    }do {
      d = g + (a << 1) | 0;e = b[d >> 1] | 0;i = ((c[o >> 2] | 0) + 4096 >> 13) + e | 0;j = (i | 0) > -32767 ? i : -32767;k = 0;do {
        p = k;k = k + 1 | 0;c[o + (p << 2) >> 2] = (S(b[f + (p << 1) >> 1] | 0, e) | 0) + (c[o + (k << 2) >> 2] | 0);
      } while ((k | 0) != (l | 0));c[n >> 2] = S(b[m >> 1] | 0, e) | 0;b[d >> 1] = (i | 0) > 32767 ? 32767 : j & 65535;a = a + 1 | 0;
    } while ((a | 0) != (h | 0));return;
  }function eb(a, d, f, g, h, i, j) {
    a = a | 0;d = d | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;var k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0;m = i << 2;q = j + (0 - j & 3) + m | 0;s = 0 - m | 0;r = q + s | 0;s = q + (0 - q & 3) + m + s | 0;b[g >> 1] = 8192;m = (i | 0) > 0;if (m) {
      j = i + 1 | 0;k = 0;l = 1;while (1) {
        b[g + (l << 1) >> 1] = b[d + (k << 1) >> 1] | 0;k = l + 1 | 0;if ((k | 0) == (j | 0)) break;else {
          q = l;l = k;k = q;
        }
      }
    } else j = 1;if ((j | 0) < (h | 0)) Sd(g + (j << 1) | 0, 0, h - j << 1 | 0) | 0;if (m) {
      j = 0;do {
        c[s + (j << 2) >> 2] = 0;c[r + (j << 2) >> 2] = 0;j = j + 1 | 0;
      } while ((j | 0) != (i | 0));
    }if ((h | 0) <= 0) return;m = i + -1 | 0;n = f + (m << 1) | 0;o = r + (m << 2) | 0;p = a + (m << 1) | 0;q = s + (m << 2) | 0;if ((i | 0) > 1) k = 0;else {
      j = 0;do {
        i = g + (j << 1) | 0;a = (((c[r >> 2] | 0) + 4096 | 0) >>> 13) + (e[i >> 1] | 0) | 0;f = ((c[s >> 2] | 0) + 4096 + (a << 14 & 1073725440) | 0) >>> 13;b[i >> 1] = f;c[o >> 2] = S(b[n >> 1] | 0, 0 - a << 16 >> 16) | 0;c[q >> 2] = S(b[p >> 1] | 0, 0 - f << 16 >> 16) | 0;j = j + 1 | 0;
      } while ((j | 0) != (h | 0));return;
    }do {
      j = g + (k << 1) | 0;d = (((c[r >> 2] | 0) + 4096 | 0) >>> 13) + (e[j >> 1] | 0) | 0;l = ((c[s >> 2] | 0) + 4096 + (d << 14 & 1073725440) | 0) >>> 13;b[j >> 1] = l;l = 0 - l << 16 >> 16;d = 0 - d << 16 >> 16;j = 0;do {
        i = j;j = j + 1 | 0;c[r + (i << 2) >> 2] = (S(b[f + (i << 1) >> 1] | 0, d) | 0) + (c[r + (j << 2) >> 2] | 0);c[s + (i << 2) >> 2] = (S(b[a + (i << 1) >> 1] | 0, l) | 0) + (c[s + (j << 2) >> 2] | 0);
      } while ((j | 0) != (m | 0));c[o >> 2] = S(b[n >> 1] | 0, d) | 0;c[q >> 2] = S(b[p >> 1] | 0, l) | 0;k = k + 1 | 0;
    } while ((k | 0) != (h | 0));return;
  }function fb(a, c, d, e, f, g, h, i) {
    a = a | 0;c = c | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;var j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0;k = g << 1;m = i + (i & 1) + k | 0;k = m + (0 - k) | 0;l = g + f << 1;l = m + (m & 1) + (l + -2) + (2 - l) | 0;m = l + (g << 1) + -2 | 0;n = g >> 1;j = g + -1 | 0;if ((g | 0) > 0) {
      i = 0;do {
        b[k + (j - i << 1) >> 1] = b[c + (i << 1) >> 1] | 0;i = i + 1 | 0;
      } while ((i | 0) != (g | 0));c = (g | 0) > 1;if (c) {
        g = g + -2 | 0;i = 0;do {
          b[l + (i << 1) >> 1] = b[h + (g - i << 1) >> 1] | 0;i = i + 1 | 0;
        } while ((i | 0) != (j | 0));
      } else c = 0;
    } else c = 0;g = (f | 0) > 0;if (g) {
      i = 0;do {
        b[l + (j + i << 1) >> 1] = b[a + (i << 1) >> 1] >> 1;i = i + 1 | 0;
      } while ((i | 0) != (f | 0));
    }if (c) {
      c = f + -1 | 0;i = 0;do {
        b[h + (i << 1) >> 1] = b[a + (c - i << 1) >> 1] >> 1;i = i + 1 | 0;
      } while ((i | 0) != (j | 0));
    }if (!g) return;f = (f + -1 | 0) >>> 1;if ((n | 0) > 0) {
      g = 0;a = 0;
    } else {
      i = 0;while (1) {
        b[d + (i << 1) >> 1] = 0;b[e + (i << 1) >> 1] = 0;if ((i | 0) == (f | 0)) break;else i = i + 1 | 0;
      }return;
    }while (1) {
      i = 0;c = 0;j = 0;do {
        q = b[k + (c << 1) >> 1] | 0;h = b[l + (c + a << 1) >> 1] | 0;o = b[m + (a - c << 1) >> 1] | 0;r = (S(o + h << 16 >> 16, q) | 0) + i | 0;q = j - (S(h - o << 16 >> 16, q) | 0) | 0;o = c | 1;h = b[k + (o << 1) >> 1] | 0;p = b[l + (o + a << 1) >> 1] | 0;o = b[m + (a - o << 1) >> 1] | 0;i = r + (S(o + p << 16 >> 16, h) | 0) | 0;j = q + (S(p - o << 16 >> 16, h) | 0) | 0;c = c + 2 | 0;
      } while ((c | 0) < (n | 0));r = i + 16384 >> 15;b[d + (g << 1) >> 1] = (r | 0) > 32767 ? 32767 : ((r | 0) > -32767 ? r : -32767) & 65535;r = j + 16384 >> 15;b[e + (g << 1) >> 1] = (r | 0) > 32767 ? 32767 : ((r | 0) > -32767 ? r : -32767) & 65535;if ((g | 0) == (f | 0)) break;else {
        g = g + 1 | 0;a = a + 2 | 0;
      }
    }return;
  }function gb(a, c, d, e, f, g, h, i, j) {
    a = a | 0;c = c | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;var k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        E = 0,
        F = 0,
        G = 0;v = g >> 1;s = f >> 1;r = v + s << 1;j = j + (j & 1) + r | 0;u = 0 - r | 0;t = j + u | 0;u = j + (j & 1) + r + u | 0;j = (s | 0) > 0;if (j) {
      f = s + -1 | 0;g = 0;do {
        b[t + (g << 1) >> 1] = b[a + (f - g << 1) >> 1] | 0;g = g + 1 | 0;
      } while ((g | 0) != (s | 0));
    }r = (v | 0) > 0;if (r) {
      g = 0;do {
        b[t + (g + s << 1) >> 1] = b[h + ((g << 1 | 1) << 1) >> 1] | 0;g = g + 1 | 0;
      } while ((g | 0) != (v | 0));
    }if (j) {
      f = s + -1 | 0;g = 0;do {
        b[u + (g << 1) >> 1] = b[c + (f - g << 1) >> 1] | 0;g = g + 1 | 0;
      } while ((g | 0) != (s | 0));
    }if (r) {
      g = 0;do {
        b[u + (g + s << 1) >> 1] = b[i + ((g << 1 | 1) << 1) >> 1] | 0;g = g + 1 | 0;
      } while ((g | 0) != (v | 0));
    }if (j) {
      p = s + -2 | 0;q = s + -1 | 0;f = 0;o = 0;while (1) {
        g = p + f | 0;if (r) {
          n = q + f | 0;m = f + s | 0;k = 0;a = 0;j = 0;l = b[u + (g << 1) >> 1] | 0;c = b[t + (g << 1) >> 1] | 0;f = 0;g = 0;do {
            x = k << 1;B = n + k | 0;D = b[d + (x << 1) >> 1] | 0;C = b[t + (B << 1) >> 1] | 0;E = 0 - D << 16 >> 16;B = b[u + (B << 1) >> 1] | 0;a = (S(C, D) | 0) + a + (S(B, E) | 0) | 0;A = b[d + ((x | 1) << 1) >> 1] | 0;y = c << 16 >> 16;z = l << 16 >> 16;E = (S(D, y) | 0) + g + (S(E, z) | 0) | 0;D = m + k | 0;c = b[t + (D << 1) >> 1] | 0;l = b[u + (D << 1) >> 1] | 0;D = b[d + ((x | 2) << 1) >> 1] | 0;F = c << 16 >> 16;g = 0 - D << 16 >> 16;G = l << 16 >> 16;a = a + (S(F, D) | 0) + (S(G, g) | 0) | 0;x = b[d + ((x | 3) << 1) >> 1] | 0;w = B + C | 0;j = (S(w, A) | 0) + j + (S(G + F | 0, x) | 0) | 0;g = E + (S(D, C) | 0) + (S(g, B) | 0) | 0;f = (S(A, z + y | 0) | 0) + f + (S(x, w) | 0) | 0;k = k + 2 | 0;
          } while ((k | 0) < (v | 0));
        } else {
          a = 0;j = 0;f = 0;g = 0;
        }F = a + 16384 >> 15;G = o << 1;b[e + (G << 1) >> 1] = (F | 0) > 32767 ? 32767 : ((F | 0) > -32767 ? F : -32767) & 65535;F = j + 16384 >> 15;b[e + ((G | 1) << 1) >> 1] = (F | 0) > 32767 ? 32767 : ((F | 0) > -32767 ? F : -32767) & 65535;g = g + 16384 >> 15;b[e + ((G | 2) << 1) >> 1] = (g | 0) > 32767 ? 32767 : ((g | 0) > -32767 ? g : -32767) & 65535;g = f + 16384 >> 15;b[e + ((G | 3) << 1) >> 1] = (g | 0) > 32767 ? 32767 : ((g | 0) > -32767 ? g : -32767) & 65535;g = o + 2 | 0;if ((g | 0) < (s | 0)) {
          f = -2 - o | 0;o = g;
        } else break;
      }
    }if (r) g = 0;else return;do {
      b[h + ((g << 1 | 1) << 1) >> 1] = b[t + (g << 1) >> 1] | 0;g = g + 1 | 0;
    } while ((g | 0) != (v | 0));if (r) g = 0;else return;do {
      b[i + ((g << 1 | 1) << 1) >> 1] = b[u + (g << 1) >> 1] | 0;g = g + 1 | 0;
    } while ((g | 0) != (v | 0));return;
  }function hb(a, d, e, f) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0;r = l;l = l + 112 | 0;o = r;k = a + (0 - e << 1) + -6 | 0;c[o >> 2] = nb(a, k, f) | 0;c[o + 4 >> 2] = nb(a, k + 2 | 0, f) | 0;c[o + 8 >> 2] = nb(a, k + 4 | 0, f) | 0;c[o + 12 >> 2] = nb(a, k + 6 | 0, f) | 0;c[o + 16 >> 2] = nb(a, k + 8 | 0, f) | 0;c[o + 20 >> 2] = nb(a, k + 10 | 0, f) | 0;c[o + 24 >> 2] = nb(a, k + 12 | 0, f) | 0;k = 0;do {
      h = 3 - k | 0;h = (h | 0) > 0 ? h : 0;i = 10 - k | 0;i = (i | 0) < 7 ? i : 7;if ((h | 0) < (i | 0)) {
        j = k + -3 | 0;g = 0;do {
          q = b[2572 + (h << 1) >> 1] | 0;p = c[o + (j + h << 2) >> 2] | 0;g = ((S(p & 32767, q) | 0) >> 15) + g + (S(p << 1 >> 16, q) | 0) | 0;h = h + 1 | 0;
        } while ((h | 0) < (i | 0));
      } else g = 0;c[o + 28 + (k << 2) >> 2] = g;k = k + 1 | 0;
    } while ((k | 0) != 7);k = 0;do {
      h = 3 - k | 0;h = (h | 0) > 0 ? h : 0;i = 10 - k | 0;i = (i | 0) < 7 ? i : 7;if ((h | 0) < (i | 0)) {
        j = k + -3 | 0;g = 0;do {
          q = b[2586 + (h << 1) >> 1] | 0;p = c[o + (j + h << 2) >> 2] | 0;g = ((S(p & 32767, q) | 0) >> 15) + g + (S(p << 1 >> 16, q) | 0) | 0;h = h + 1 | 0;
        } while ((h | 0) < (i | 0));
      } else g = 0;c[o + 56 + (k << 2) >> 2] = g;k = k + 1 | 0;
    } while ((k | 0) != 7);k = 0;do {
      h = 3 - k | 0;h = (h | 0) > 0 ? h : 0;i = 10 - k | 0;i = (i | 0) < 7 ? i : 7;if ((h | 0) < (i | 0)) {
        j = k + -3 | 0;g = 0;do {
          q = b[2600 + (h << 1) >> 1] | 0;p = c[o + (j + h << 2) >> 2] | 0;g = ((S(p & 32767, q) | 0) >> 15) + g + (S(p << 1 >> 16, q) | 0) | 0;h = h + 1 | 0;
        } while ((h | 0) < (i | 0));
      } else g = 0;c[o + 84 + (k << 2) >> 2] = g;k = k + 1 | 0;
    } while ((k | 0) != 7);g = c[o >> 2] | 0;k = 0;i = 0;h = g;n = 0;while (1) {
      m = (g | 0) > (h | 0);g = m ? g : h;h = c[o + (n * 28 | 0) + 4 >> 2] | 0;q = (h | 0) > (g | 0);g = q ? h : g;h = c[o + (n * 28 | 0) + 8 >> 2] | 0;p = (h | 0) > (g | 0);g = p ? h : g;h = c[o + (n * 28 | 0) + 12 >> 2] | 0;s = (h | 0) > (g | 0);g = s ? h : g;h = c[o + (n * 28 | 0) + 16 >> 2] | 0;t = (h | 0) > (g | 0);g = t ? h : g;h = c[o + (n * 28 | 0) + 20 >> 2] | 0;u = (h | 0) > (g | 0);g = u ? h : g;h = c[o + (n * 28 | 0) + 24 >> 2] | 0;j = (h | 0) > (g | 0);i = j | (u | (t | (s | (p | (q | m))))) ? n : i;k = j ? 6 : u ? 5 : t ? 4 : s ? 3 : p ? 2 : q ? 1 : m ? 0 : k;m = n + 1 | 0;if ((m | 0) == 4) break;h = j ? h : g;n = m;g = c[o + (m * 28 | 0) >> 2] | 0;
    }if ((f | 0) <= 0) {
      u = e + 3 | 0;u = u - k | 0;l = r;return u | 0;
    }h = -3 - e + k | 0;q = -6 - e + k | 0;g = i + -1 | 0;if ((i | 0) <= 0) {
      g = 0;do {
        b[d + (g << 1) >> 1] = b[a + (h + g << 1) >> 1] | 0;g = g + 1 | 0;
      } while ((g | 0) != (f | 0));u = e + 3 | 0;u = u - k | 0;l = r;return u | 0;
    }i = b[2572 + (g * 14 | 0) >> 1] | 0;j = b[2572 + (g * 14 | 0) + 2 >> 1] | 0;m = b[2572 + (g * 14 | 0) + 4 >> 1] | 0;n = b[2572 + (g * 14 | 0) + 6 >> 1] | 0;o = b[2572 + (g * 14 | 0) + 8 >> 1] | 0;p = b[2572 + (g * 14 | 0) + 10 >> 1] | 0;h = b[2572 + (g * 14 | 0) + 12 >> 1] | 0;g = 0;do {
      t = q + g | 0;u = S(i, b[a + (t << 1) >> 1] | 0) | 0;u = (S(j, b[a + (t + 1 << 1) >> 1] | 0) | 0) + u | 0;u = (S(m, b[a + (t + 2 << 1) >> 1] | 0) | 0) + u | 0;u = (S(n, b[a + (t + 3 << 1) >> 1] | 0) | 0) + u | 0;u = (S(o, b[a + (t + 4 << 1) >> 1] | 0) | 0) + u | 0;u = (S(p, b[a + (t + 5 << 1) >> 1] | 0) | 0) + u | 0;b[d + (g << 1) >> 1] = ((S(h, b[a + (t + 6 << 1) >> 1] | 0) | 0) + u + 16384 | 0) >>> 15;g = g + 1 | 0;
    } while ((g | 0) != (f | 0));u = e + 3 | 0;u = u - k | 0;l = r;return u | 0;
  }function ib(a, c, d, f, g, h, i, j, k) {
    a = a | 0;c = c | 0;d = d | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;var l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0;f = g << 1;t = g << 2;t = k + (k & 1) + t + (0 - t) | 0;hb(a, t, h, 80) | 0;r = (h | 0) > (i | 0);k = t + (g << 1) | 0;if (r) hb(a, k, h << 1, 80) | 0;else hb(a, k, 0 - h | 0, 80) | 0;u = (g | 0) > 0;a: do {
      if (u) {
        d = 0;while (1) {
          q = b[a + (d << 1) >> 1] | 0;s = q << 16 >> 16;d = d + 1 | 0;if (((q << 16 >> 16 < 0 ? 0 - s | 0 : s) | 0) > 16383) {
            d = 0;break;
          }if ((d | 0) >= (g | 0)) {
            s = 1;break a;
          }
        }do {
          s = a + (d << 1) | 0;b[s >> 1] = b[s >> 1] >> 1;d = d + 1 | 0;
        } while ((d | 0) != (g | 0));d = 0;do {
          s = t + (d << 1) | 0;b[s >> 1] = b[s >> 1] >> 1;d = d + 1 | 0;
        } while ((d | 0) < (f | 0));s = 0;
      } else s = 1;
    } while (0);i = (nb(t, t, g) | 0) + 1e3 | 0;q = i >>> 0 > 65535;f = q ? i >>> 16 : i;q = q ? 8 : 0;l = f >>> 0 > 255;f = l ? f >>> 8 : f;q = l ? q | 4 : q;l = f >>> 0 > 15;q = (l ? f >>> 4 : f) >>> 0 > 3 | (l ? q | 2 : q);l = q << 1;l = ((q & 65535) << 16 >> 16 > 6 ? i >> l + -12 : i << 12 - l) << 16 >> 16;l = ((S(((S((l * 16816 | 0) + -827523072 >> 16, l) | 0) >>> 14 << 16) + 1387593728 >> 16, l) | 0) >>> 14 << 16) + 238157824 >> 16;q = 13 - q | 0;q = (q | 0) > 0 ? l >> q : l << 0 - q;l = (nb(k, k, g) | 0) + 1e3 | 0;i = l >>> 0 > 65535;f = i ? l >>> 16 : l;i = i ? 8 : 0;d = f >>> 0 > 255;f = d ? f >>> 8 : f;i = d ? i | 4 : i;d = f >>> 0 > 15;i = (d ? f >>> 4 : f) >>> 0 > 3 | (d ? i | 2 : i);d = i << 1;d = ((i & 65535) << 16 >> 16 > 6 ? l >> d + -12 : l << 12 - d) << 16 >> 16;d = ((S(((S((d * 16816 | 0) + -827523072 >> 16, d) | 0) >>> 14 << 16) + 1387593728 >> 16, d) | 0) >>> 14 << 16) + 238157824 >> 16;i = 13 - i | 0;i = (i | 0) > 0 ? d >> i : d << 0 - i;d = (nb(a, a, g) | 0) + 1 | 0;l = d >>> 0 > 65535;f = l ? d >>> 16 : d;l = l ? 8 : 0;h = f >>> 0 > 255;f = h ? f >>> 8 : f;l = h ? l | 4 : l;h = f >>> 0 > 15;l = (h ? f >>> 4 : f) >>> 0 > 3 | (h ? l | 2 : l);h = l << 1;h = ((l & 65535) << 16 >> 16 > 6 ? d >> h + -12 : d << 12 - h) << 16 >> 16;h = ((S(((S((h * 16816 | 0) + -827523072 >> 16, h) | 0) >>> 14 << 16) + 1387593728 >> 16, h) | 0) >>> 14 << 16) + 238157824 >> 16;l = 13 - l | 0;d = nb(t, a, g) | 0;d = (d | 0) > 0 ? d : 0;k = nb(k, a, g) | 0;k = (k | 0) > 0 ? k : 0;l = ((l | 0) > 0 ? h >> l : h << 0 - l) << 16;h = l >> 16;f = ((h + 32 | 0) >>> 6) + 1 | 0;q = ((q << 16 >> 10 | 0) < (h | 0) ? f : q) << 16;p = q >> 16;if ((d | 0) > (S(p, h) | 0)) o = 16384;else o = ((((((l >> 17) + d | 0) / (h | 0) | 0) << 14) + (q >> 17) | 0) / (p | 0) | 0) << 16 >> 16;n = ((i << 16 >> 10 | 0) < (h | 0) ? f : i) << 16;m = n >> 16;n = n >> 17;if ((k | 0) > (S(m, h) | 0)) k = 16384;else k = ((((((l >> 17) + k | 0) / (h | 0) | 0) << 14) + n | 0) / (m | 0) | 0) << 16 >> 16;i = l >> 8;if (j << 16 >> 16 > 0) {
      f = ((j << 16 >> 16) * 13107 | 0) >>> 15;d = (((f << 16 >> 16) * 28180 | 0) >>> 14 << 16) + 1073741824 >> 16;f = f + 2294 & 65535;
    } else {
      d = 0;f = 0;
    }l = 32767 - ((S((S(o << 1, d) | 0) >> 16, o) | 0) >>> 13) | 0;d = 32767 - ((S((S(k << 1, d) | 0) >> 16, k) | 0) >>> 13) | 0;o = f << 16 >> 16;j = o << 14;k = ((l << 16 >> 16 | 0) < (o | 0) ? f : l & 65535) << 16 >> 16;d = ((d << 16 >> 16 | 0) < (o | 0) ? f : d & 65535) << 16 >> 16;k = (S((((q >> 17) + i | 0) / (p | 0) | 0) << 16 >> 14, (((k >> 1) + j | 0) / (k | 0) | 0) << 16 >> 16) | 0) >> 16;d = (S(((n + i | 0) / (m | 0) | 0) << 16 >> 14, (((d >> 1) + j | 0) / (d | 0) | 0) << 16 >> 16) | 0) >> 16;if (r) {
      f = d * 9830 >> 15;d = k * 22938 >> 15;
    } else {
      f = (d * 19661 | 0) >>> 15;d = (k * 19661 | 0) >>> 15;
    }if (u) {
      k = d << 16 >> 16;f = f << 16 >> 16;d = 0;do {
        j = S(b[t + (d << 1) >> 1] | 0, k) | 0;b[c + (d << 1) >> 1] = ((j + 128 + (S(b[t + (d + g << 1) >> 1] | 0, f) | 0) | 0) >>> 8) + (e[a + (d << 1) >> 1] | 0);d = d + 1 | 0;
      } while ((d | 0) != (g | 0));
    }f = Za(c, g) | 0;d = Za(a, g) | 0;d = d << 16 >> 16 > 1 ? d : 1;f = f << 16 >> 16 > 1 ? f : 1;k = f & 65535;if (u) {
      f = ((((((d & 65535) > (f & 65535) ? f : d) & 65535) << 14 | k >>> 1) >>> 0) / (k >>> 0) | 0) << 16 >> 16;d = 0;do {
        t = c + (d << 1) | 0;b[t >> 1] = (S(b[t >> 1] | 0, f) | 0) >>> 14;d = d + 1 | 0;
      } while ((d | 0) != (g | 0));
    }if (s | u ^ 1) return;else d = 0;do {
      t = a + (d << 1) | 0;b[t >> 1] = b[t >> 1] << 1;d = d + 1 | 0;
    } while ((d | 0) != (g | 0));if (u) d = 0;else return;do {
      a = c + (d << 1) | 0;u = b[a >> 1] | 0;b[a >> 1] = u << 16 >> 16 > 16383 ? 32766 : (u << 16 >> 16 > -16383 ? u : -16383) << 16 >> 16 << 1 & 65535;d = d + 1 | 0;
    } while ((d | 0) != (g | 0));return;
  }function jb(a, d, e, f, g, h) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;var i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        E = 0;C = (d | 0) / 2 | 0;p = C + 1 | 0;o = p << 2;m = h + (0 - h & 3) + o | 0;r = 0 - o | 0;q = m + r | 0;o = m + (0 - m & 3) + o | 0;r = o + r | 0;c[r >> 2] = 8192;c[q >> 2] = 8192;m = (d | 0) > 1;if (m) {
      n = d + -1 | 0;h = q;i = r;j = q + 4 | 0;k = r + 4 | 0;l = 0;while (1) {
        A = b[a + (l << 1) >> 1] | 0;B = b[a + (n - l << 1) >> 1] | 0;c[k >> 2] = B + A - (c[i >> 2] | 0);c[j >> 2] = A - B + (c[h >> 2] | 0);l = l + 1 | 0;if ((l | 0) >= (C | 0)) break;else {
          h = h + 4 | 0;i = i + 4 | 0;j = j + 4 | 0;k = k + 4 | 0;
        }
      }if (m) {
        h = q;i = r;j = 0;while (1) {
          c[i >> 2] = (c[i >> 2] | 0) + 2 >> 2;c[h >> 2] = (c[h >> 2] | 0) + 2 >> 2;j = j + 1 | 0;if ((j | 0) >= (C | 0)) break;else {
            h = h + 4 | 0;i = i + 4 | 0;
          }
        }
      }
    }z = r + (C << 2) | 0;c[z >> 2] = (c[z >> 2] | 0) + 4 >> 3;z = q + (C << 2) | 0;c[z >> 2] = (c[z >> 2] | 0) + 4 >> 3;z = p << 1;y = o + (o & 1) + z | 0;B = 0 - z | 0;A = y + B | 0;B = y + (y & 1) + z + B | 0;if ((d | 0) < -1) {
      D = 0;return D | 0;
    } else h = 0;while (1) {
      b[A + (h << 1) >> 1] = c[r + (h << 2) >> 2];b[B + (h << 1) >> 1] = c[q + (h << 2) >> 2];if ((h | 0) < (C | 0)) h = h + 1 | 0;else break;
    }if ((d | 0) <= 0) {
      D = 0;return D | 0;
    }y = C + -1 | 0;z = (d | 0) < 4;w = g << 16 >> 16;x = (f | 0) < 0;v = f + 1 | 0;h = 0;n = 16384;j = 0;i = 0;u = 0;while (1) {
      s = (u & 1 | 0) == 0 ? A : B;l = n << 16 >> 16 < 16383 ? n : 16383;l = l << 16 >> 16 > -16383 ? l : -16383;q = s + (C << 1) | 0;r = s + (y << 1) | 0;o = l << 16 >> 16;k = ((S(b[r >> 1] | 0, o) | 0) + 8192 >> 14) + (b[q >> 1] | 0) | 0;if (!z) {
        m = 16384;a = 2;while (1) {
          m = ((S(l << 16 >> 16, o) | 0) >>> 13) - (m & 65535) | 0;k = ((S(m << 16 >> 16, b[s + (C - a << 1) >> 1] | 0) | 0) + 8192 >> 14) + k | 0;if ((C | 0) == (a | 0)) break;else {
            t = l;l = m & 65535;a = a + 1 | 0;m = t;
          }
        }
      }t = e + (u << 1) | 0;while (1) {
        if (j << 16 >> 16 <= -16385) {
          k = n;break;
        }m = n << 16 >> 16;j = (S(16384 - ((((S(m << 2, m) | 0) >> 16) * 56e3 | 0) >>> 16) << 16 >> 16, w) | 0) >>> 15;j = m - ((k + 511 | 0) >>> 0 < 1023 ? ((j << 16 >> 16) + 1 | 0) >>> 1 : j) & 65535;m = j << 16 >> 16 < 16383 ? j : 16383;m = m << 16 >> 16 > -16383 ? m : -16383;g = b[q >> 1] | 0;f = b[r >> 1] | 0;p = m << 16 >> 16;l = ((S(f, p) | 0) + 8192 >> 14) + g | 0;if (!z) {
          a = 16384;o = 2;while (1) {
            a = ((S(m << 16 >> 16, p) | 0) >>> 13) - (a & 65535) | 0;l = ((S(a << 16 >> 16, b[s + (C - o << 1) >> 1] | 0) | 0) + 8192 >> 14) + l | 0;if ((C | 0) == (o | 0)) break;else {
              E = m;m = a & 65535;o = o + 1 | 0;a = E;
            }
          }
        }if ((k | 0) == 0 | ((l ^ k) & 1879048192 | 0) != 0) {
          D = 17;break;
        } else {
          k = l;n = j;
        }
      }if ((D | 0) == 17) {
        D = 0;h = h + 1 | 0;a: do {
          if (!x) {
            if (z) {
              a = 0;while (1) {
                i = (((n << 16 >> 16) + 1 | 0) >>> 1) + (((j << 16 >> 16) + 1 | 0) >>> 1) & 65535;l = i << 16 >> 16 < 16383 ? i : 16383;l = ((S(f, (l << 16 >> 16 > -16383 ? l : -16383) << 16 >> 16) | 0) + 8192 >> 14) + g | 0;m = (k | 0) == 0 | ((l ^ k) & 1879048192 | 0) != 0;j = m ? i : j;a = a + 1 | 0;if ((a | 0) == (v | 0)) break a;else {
                  k = m ? k : l;n = m ? n : i;
                }
              }
            } else q = 0;while (1) {
              i = (((n << 16 >> 16) + 1 | 0) >>> 1) + (((j << 16 >> 16) + 1 | 0) >>> 1) & 65535;m = i << 16 >> 16 < 16383 ? i : 16383;m = m << 16 >> 16 > -16383 ? m : -16383;o = m << 16 >> 16;p = ((S(f, o) | 0) + 8192 >> 14) + g | 0;l = 16384;a = 2;while (1) {
                l = ((S(m << 16 >> 16, o) | 0) >>> 13) - (l & 65535) | 0;p = ((S(l << 16 >> 16, b[s + (C - a << 1) >> 1] | 0) | 0) + 8192 >> 14) + p | 0;if ((C | 0) == (a | 0)) break;else {
                  E = m;m = l & 65535;a = a + 1 | 0;l = E;
                }
              }l = (k | 0) == 0 | ((p ^ k) & 1879048192 | 0) != 0;j = l ? i : j;q = q + 1 | 0;if ((q | 0) == (v | 0)) break;else {
                k = l ? k : p;n = l ? n : i;
              }
            }
          }
        } while (0);E = i << 16 >> 16 < 0;g = 16384 - ((E ? 0 - (i & 65535) & 65535 : i) & 65535) << 16 >> 17;g = (S(g << 3, ((S((g * 11888 | 0) + 146931712 >> 16, g) | 0) >>> 13 << 16) + 1079312384 >> 16) | 0) >> 16;f = g << 13;k = f >>> 0 > 65535;g = k ? g >>> 3 & 65535 : f;k = k ? 8 : 0;s = g >>> 0 > 255;g = s ? g >>> 8 : g;k = s ? k | 4 : k;s = g >>> 0 > 15;k = (s ? g >>> 4 : g) >>> 0 > 3 | (s ? k | 2 : k);s = k << 1;s = ((k & 65535) << 16 >> 16 > 6 ? f >> s + -12 : f << 12 - s) << 16 >> 16;s = ((S(((S((s * 16816 | 0) + -827523072 >> 16, s) | 0) >>> 14 << 16) + 1387593728 >> 16, s) | 0) >>> 14 << 16) + 238157824 >> 16;k = 13 - k | 0;k = (k | 0) > 0 ? s >> k : s << 0 - k;b[t >> 1] = E ? 25736 - k | 0 : k;k = i;
      }u = u + 1 | 0;if ((u | 0) == (d | 0)) break;else n = k;
    }return h | 0;
  }function kb(a, d, e, f) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0;x = e >> 1;l = x + 1 | 0;k = l << 2;u = f + (0 - f & 3) + k | 0;w = 0 - k | 0;v = u + w | 0;g = e + 3 | 0;i = S(g << 2, l) | 0;u = u + (0 - u & 3) + i | 0;j = 0 - i | 0;h = u + j | 0;k = u + (0 - u & 3) + k | 0;w = k + w | 0;i = k + (0 - k & 3) + i | 0;j = i + j | 0;k = (x | 0) < 0;if (!k) {
      f = 0;do {
        u = S(f, g) | 0;c[v + (f << 2) >> 2] = h + (u << 2);c[w + (f << 2) >> 2] = j + (u << 2);f = f + 1 | 0;
      } while ((f | 0) != (l | 0));
    }u = e << 1;u = i + (i & 1) + u + (0 - u) | 0;if ((e | 0) > 0) {
      g = 0;do {
        t = b[a + (g << 1) >> 1] | 0;f = t << 16 >> 16;if (t << 16 >> 16 < 12868) {
          f = (S(f << 3, f) | 0) + 32768 >> 16;f = ((S((((S((((S(f, -10) | 0) + 4096 | 0) >>> 13 << 16) + 22282240 >> 16, f) | 0) + 4096 | 0) >>> 13 << 16) + -268435456 >> 16, f) | 0) + 4096 >> 13) + 8192 | 0;
        } else {
          f = 25736 - f << 16;f = (S(f >> 13, f >> 16) | 0) + 32768 >> 16;f = -8192 - (((S((((S((((S(f, -10) | 0) + 4096 | 0) >>> 13 << 16) + 22282240 >> 16, f) | 0) + 4096 | 0) >>> 13 << 16) + -268435456 >> 16, f) | 0) + 4096 | 0) >>> 13) | 0;
        }b[u + (g << 1) >> 1] = f << 2;g = g + 1 | 0;
      } while ((g | 0) != (e | 0));
    }if (!k) {
      f = 0;do {
        s = c[v + (f << 2) >> 2] | 0;c[s + 4 >> 2] = 0;c[s + 8 >> 2] = 1048576;t = (f << 1) + 2 | 0;c[s + (t << 2) >> 2] = 1048576;s = c[w + (f << 2) >> 2] | 0;c[s + 4 >> 2] = 0;c[s + 8 >> 2] = 1048576;c[s + (t << 2) >> 2] = 1048576;f = f + 1 | 0;
      } while ((f | 0) != (l | 0));
    }t = b[u >> 1] | 0;f = c[(c[v >> 2] | 0) + 8 >> 2] | 0;t = 0 - ((S(f << 2 >> 16, t) | 0) + ((S(f & 16383, t) | 0) >> 14)) | 0;f = c[v + 4 >> 2] | 0;c[f + 12 >> 2] = t;t = b[u + 2 >> 1] | 0;s = c[(c[w >> 2] | 0) + 8 >> 2] | 0;t = 0 - ((S(s << 2 >> 16, t) | 0) + ((S(s & 16383, t) | 0) >> 14)) | 0;c[(c[w + 4 >> 2] | 0) + 12 >> 2] = t;if ((x | 0) > 1) {
      t = 1;n = c[w + 4 >> 2] | 0;q = 4;r = 5;s = 3;while (1) {
        j = t;t = t + 1 | 0;h = t << 1;j = j << 1;i = b[u + (j << 1) >> 1] | 0;k = f;f = c[v + (t << 2) >> 2] | 0;o = n;n = c[w + (t << 2) >> 2] | 0;j = b[u + ((j | 1) << 1) >> 1] | 0;m = c[k + 8 >> 2] | 0;m = (S(m << 2 >> 16, i) | 0) + ((S(m & 16383, i) | 0) >> 14) | 0;g = 1;a = 3;l = c[k + 4 >> 2] | 0;p = 2;while (1) {
          c[f + (a << 2) >> 2] = l - m + (c[k + (a << 2) >> 2] | 0);z = c[o + (p << 2) >> 2] | 0;y = S(z << 2 >> 16, j) | 0;z = (S(z & 16383, j) | 0) >> 14;c[n + (a << 2) >> 2] = (c[o + (g << 2) >> 2] | 0) + (c[o + (a << 2) >> 2] | 0) - z - y;g = p + 1 | 0;a = c[k + (g << 2) >> 2] | 0;m = (S(a << 2 >> 16, i) | 0) + ((S(a & 16383, i) | 0) >> 14) | 0;l = c[k + (p << 2) >> 2] | 0;if ((p | 0) == (s | 0)) break;else {
            z = p;a = p + 2 | 0;p = g;g = z;
          }
        }c[f + (r << 2) >> 2] = l - m;y = c[o + (q << 2) >> 2] | 0;z = S(y << 2 >> 16, j) | 0;y = (S(y & 16383, j) | 0) >> 14;c[n + (r << 2) >> 2] = (c[o + (h + -1 << 2) >> 2] | 0) - y - z;if ((t | 0) == (x | 0)) break;else {
          q = q + 2 | 0;r = r + 2 | 0;s = s + 2 | 0;
        }
      }
    }if ((e | 0) < 1) return;j = c[v + (x << 2) >> 2] | 0;i = c[w + (x << 2) >> 2] | 0;f = 0;g = 0;h = 1;while (1) {
      x = h + 2 | 0;z = f;f = c[j + (x << 2) >> 2] | 0;y = g;g = c[i + (x << 2) >> 2] | 0;z = 128 - y + z + f + g >> 8;z = (z | 0) > -32767 ? z : -32767;b[d + (h + -1 << 1) >> 1] = (z | 0) < 32767 ? z : 32767;if ((h | 0) == (e | 0)) break;else h = h + 1 | 0;
    }return;
  }function lb(a, c, d) {
    a = a | 0;c = c | 0;d = d | 0;var e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;j = d << 16 >> 16;e = 25736 - j | 0;if ((b[a >> 1] | 0) < d << 16 >> 16) b[a >> 1] = d;i = c + -1 | 0;c = a + (i << 1) | 0;if ((b[c >> 1] | 0) > (e << 16 >> 16 | 0)) b[c >> 1] = e;if ((i | 0) <= 1) return;g = 1;h = b[a + 2 >> 1] | 0;c = b[a >> 1] | 0;do {
      f = a + (g << 1) | 0;c = (c << 16 >> 16) + j | 0;if ((h << 16 >> 16 | 0) < (c | 0)) {
        c = c & 65535;b[f >> 1] = c;
      } else c = h;d = c << 16 >> 16;g = g + 1 | 0;h = b[a + (g << 1) >> 1] | 0;e = (h << 16 >> 16) - j | 0;if ((d | 0) > (e | 0)) {
        c = (e >>> 1) + (d >>> 1) & 65535;b[f >> 1] = c;
      }
    } while ((g | 0) != (i | 0));return;
  }function mb(a, c, d, e, f, g) {
    a = a | 0;c = c | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;var h = 0,
        i = 0;g = (((f << 14) + 16384 | 0) / (g << 16 >> 16 | 0) | 0) << 16 >> 16;if ((e | 0) <= 0) return;h = 16384 - g << 16 >> 16;f = 0;do {
      i = ((S(b[a + (f << 1) >> 1] | 0, h) | 0) + 8192 | 0) >>> 14;b[d + (f << 1) >> 1] = (((S(b[c + (f << 1) >> 1] | 0, g) | 0) + 8192 | 0) >>> 14) + i;f = f + 1 | 0;
    } while ((f | 0) != (e | 0));return;
  }function nb(a, c, d) {
    a = a | 0;c = c | 0;d = d | 0;var e = 0,
        f = 0;e = d >> 2;if (!e) {
      c = 0;return c | 0;
    } else d = 0;while (1) {
      e = e + -1 | 0;f = S(b[c >> 1] | 0, b[a >> 1] | 0) | 0;f = (S(b[c + 2 >> 1] | 0, b[a + 2 >> 1] | 0) | 0) + f | 0;f = f + (S(b[c + 4 >> 1] | 0, b[a + 4 >> 1] | 0) | 0) | 0;d = (f + (S(b[c + 6 >> 1] | 0, b[a + 6 >> 1] | 0) | 0) >> 6) + d | 0;if (!e) break;else {
        c = c + 8 | 0;a = a + 8 | 0;
      }
    }return d | 0;
  }function ob(a, d, f, g, h, i, j, k) {
    a = a | 0;d = d | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;var l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        E = 0;v = f - d | 0;x = v + 1 | 0;o = x << 1;r = k + (k & 1) + o | 0;E = 0 - o | 0;D = r + E | 0;o = r + (r & 1) + o | 0;E = o + E | 0;o = o + (0 - o & 3) | 0;r = x << 2;z = o + r | 0;u = z + (0 - r) | 0;C = j << 2;z = z + (0 - z & 3) + C | 0;B = 0 - C | 0;A = z + B | 0;B = z + (0 - z & 3) + C + B | 0;C = (j | 0) > 0;if (C) {
      k = 0;do {
        c[A + (k << 2) >> 2] = -1;c[B + (k << 2) >> 2] = 0;c[h + (k << 2) >> 2] = d;k = k + 1 | 0;
      } while ((k | 0) != (j | 0));
    }k = 0 - f | 0;w = (k | 0) < (g | 0);a: do {
      if (w) {
        l = k;while (1) {
          y = b[a + (l << 1) >> 1] | 0;z = y << 16 >> 16;l = l + 1 | 0;if (((y << 16 >> 16 < 0 ? 0 - z | 0 : z) | 0) > 16383) {
            l = k;break;
          }if ((l | 0) >= (g | 0)) {
            t = 0;break a;
          }
        }do {
          z = a + (l << 1) | 0;b[z >> 1] = b[z >> 1] >> 1;l = l + 1 | 0;
        } while ((l | 0) != (g | 0));t = 1;
      } else t = 0;
    } while (0);s = g >> 2;p = (s | 0) == 0;if (p) {
      c[u >> 2] = 0;z = 0;
    } else {
      l = 0;m = s;n = a + (0 - d << 1) | 0;while (1) {
        m = m + -1 | 0;z = b[n >> 1] | 0;z = S(z, z) | 0;y = b[n + 2 >> 1] | 0;z = (S(y, y) | 0) + z | 0;y = b[n + 4 >> 1] | 0;y = z + (S(y, y) | 0) | 0;z = b[n + 6 >> 1] | 0;l = ((y + (S(z, z) | 0) | 0) >>> 6) + l | 0;if (!m) break;else n = n + 8 | 0;
      }c[u >> 2] = l;l = 0;m = s;n = a;while (1) {
        m = m + -1 | 0;z = b[n >> 1] | 0;z = S(z, z) | 0;y = b[n + 2 >> 1] | 0;z = (S(y, y) | 0) + z | 0;y = b[n + 4 >> 1] | 0;y = z + (S(y, y) | 0) | 0;z = b[n + 6 >> 1] | 0;l = ((y + (S(z, z) | 0) | 0) >>> 6) + l | 0;if (!m) {
          z = l;break;
        } else n = n + 8 | 0;
      }
    }if ((f | 0) > (d | 0)) {
      n = g + -1 | 0;m = d;l = c[o >> 2] | 0;do {
        q = b[a + (~m << 1) >> 1] | 0;q = ((S(q, q) | 0) >>> 6) + l | 0;y = b[a + (n - m << 1) >> 1] | 0;y = q - ((S(y, y) | 0) >>> 6) | 0;l = (y | 0) > 0 ? y : 0;c[u + (m - d + 1 << 2) >> 2] = l;m = m + 1 | 0;
      } while ((m | 0) != (f | 0));
    }y = _a(u, E, 32766, x) | 0;q = a + (k << 1) | 0;do {
      if ((v | 0) > -1) {
        if (p) {
          Sd(u | 0, 0, r | 0) | 0;break;
        } else l = 0;do {
          m = 0;n = s;o = q + (l << 1) | 0;p = a;while (1) {
            n = n + -1 | 0;r = S(b[o >> 1] | 0, b[p >> 1] | 0) | 0;r = (S(b[o + 2 >> 1] | 0, b[p + 2 >> 1] | 0) | 0) + r | 0;r = r + (S(b[o + 4 >> 1] | 0, b[p + 4 >> 1] | 0) | 0) | 0;m = (r + (S(b[o + 6 >> 1] | 0, b[p + 6 >> 1] | 0) | 0) >> 6) + m | 0;if (!n) break;else {
              o = o + 8 | 0;p = p + 8 | 0;
            }
          }c[u + (v - l << 2) >> 2] = m;l = l + 1 | 0;
        } while ((l | 0) != (x | 0));
      }
    } while (0);v = _a(u, D, 180, x) | 0;if (t & w) do {
      x = a + (k << 1) | 0;b[x >> 1] = b[x >> 1] << 1;k = k + 1 | 0;
    } while ((k | 0) != (g | 0));b: do {
      if ((f | 0) >= (d | 0)) {
        p = j + -1 | 0;s = B + (p << 2) | 0;t = A + (p << 2) | 0;u = h + (p << 2) | 0;if ((j | 0) > 1) o = d;else {
          k = d;while (1) {
            m = k - d | 0;l = b[D + (m << 1) >> 1] | 0;l = (S(l << 16, l) | 0) >> 16;B = S(l, c[s >> 2] << 16 >> 16) | 0;m = E + (m << 1) | 0;if ((B | 0) > (S((e[m >> 1] << 16) + 65536 >> 16, c[t >> 2] << 16 >> 16) | 0)) {
              c[t >> 2] = l;c[s >> 2] = (b[m >> 1] | 0) + 1;c[u >> 2] = k;
            }if ((k | 0) < (f | 0)) k = k + 1 | 0;else break b;
          }
        }while (1) {
          r = o - d | 0;q = b[D + (r << 1) >> 1] | 0;q = (S(q << 16, q) | 0) >> 16;g = S(q, c[s >> 2] << 16 >> 16) | 0;r = E + (r << 1) | 0;c: do {
            if ((g | 0) > (S((e[r >> 1] << 16) + 65536 >> 16, c[t >> 2] << 16 >> 16) | 0)) {
              c[t >> 2] = q;l = (b[r >> 1] | 0) + 1 | 0;c[s >> 2] = l;c[u >> 2] = o;l = l << 16 >> 16;k = 0;while (1) {
                m = B + (k << 2) | 0;g = S(c[m >> 2] << 16 >> 16, q) | 0;n = A + (k << 2) | 0;if ((g | 0) > (S(c[n >> 2] << 16 >> 16, l) | 0)) break;k = k + 1 | 0;if ((k | 0) >= (p | 0)) break c;
              }if ((p | 0) > (k | 0)) {
                l = p;do {
                  g = l;l = l + -1 | 0;c[A + (g << 2) >> 2] = c[A + (l << 2) >> 2];c[B + (g << 2) >> 2] = c[B + (l << 2) >> 2];c[h + (g << 2) >> 2] = c[h + (l << 2) >> 2];
                } while ((l | 0) > (k | 0));
              }c[n >> 2] = q;c[m >> 2] = (b[r >> 1] | 0) + 1;c[h + (k << 2) >> 2] = o;
            }
          } while (0);if ((o | 0) < (f | 0)) o = o + 1 | 0;else break;
        }
      }
    } while (0);if (!((i | 0) != 0 & C)) return;l = z >>> 0 > 65535;f = l ? z >>> 16 : z;l = l ? 8 : 0;k = f >>> 0 > 255;f = k ? f >>> 8 : f;l = k ? l | 4 : l;k = f >>> 0 > 15;l = (k ? f >>> 4 : f) >>> 0 > 3 | (k ? l | 2 : l);k = l << 1;k = ((l & 65535) << 16 >> 16 > 6 ? z >> k + -12 : z << 12 - k) << 16 >> 16;k = ((S(((S((k * 16816 | 0) + -827523072 >> 16, k) | 0) >>> 14 << 16) + 1387593728 >> 16, k) | 0) >>> 14 << 16) + 238157824 >> 16;l = 13 - l | 0;l = ((l | 0) > 0 ? k >> l : k << 0 - l) << 16 >> 16;k = 0;do {
      B = (c[h + (k << 2) >> 2] | 0) - d | 0;A = b[E + (B << 1) >> 1] << y;f = A >>> 0 > 65535;z = f ? A >>> 16 : A;f = f ? 8 : 0;C = z >>> 0 > 255;z = C ? z >>> 8 : z;f = C ? f | 4 : f;C = z >>> 0 > 15;f = (C ? z >>> 4 : z) >>> 0 > 3 | (C ? f | 2 : f);C = f << 1;C = ((f & 65535) << 16 >> 16 > 6 ? A >> C + -12 : A << 12 - C) << 16 >> 16;C = ((S(((S((C * 16816 | 0) + -827523072 >> 16, C) | 0) >>> 14 << 16) + 1387593728 >> 16, C) | 0) >>> 14 << 16) + 238157824 >> 16;f = 13 - f | 0;f = (b[D + (B << 1) >> 1] << v | 0) / (((S(((f | 0) > 0 ? C >> f : C << 0 - f) << 16 >> 16, l) | 0) >> 6) + 10 | 0) | 0;b[i + (k << 1) >> 1] = f & 32768 | 0 ? 0 : f & 65535;k = k + 1 | 0;
    } while ((k | 0) != (j | 0));return;
  }function pb(d, f, g, h, i, j, k, m, n, o, p, q, r, s, t, u, v, w, x, y) {
    d = d | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;m = m | 0;n = n | 0;o = o | 0;p = p | 0;q = q | 0;r = r | 0;s = s | 0;t = t | 0;u = u | 0;v = v | 0;w = w | 0;x = x | 0;y = y | 0;var z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        E = 0,
        F = 0,
        G = 0,
        H = 0,
        I = 0,
        J = 0,
        K = 0,
        L = 0,
        M = 0,
        N = 0,
        O = 0,
        P = 0,
        Q = 0,
        R = 0,
        T = 0,
        U = 0,
        V = 0,
        W = 0,
        X = 0,
        Y = 0,
        Z = 0,
        _ = 0,
        $ = 0,
        aa = 0,
        ba = 0,
        ca = 0,
        da = 0,
        ea = 0,
        fa = 0,
        ga = 0,
        ha = 0,
        ia = 0,
        ja = 0,
        ka = 0,
        la = 0,
        ma = 0,
        na = 0,
        oa = 0,
        pa = 0,
        qa = 0,
        ra = 0,
        sa = 0,
        ta = 0,
        ua = 0,
        va = 0,
        wa = 0,
        xa = 0,
        ya = 0,
        za = 0,
        Aa = 0,
        Ba = 0,
        Ca = 0,
        Da = 0,
        Ea = 0,
        Fa = 0,
        Ga = 0,
        Ha = 0,
        Ia = 0,
        Ja = 0,
        Ka = 0,
        La = 0,
        Ma = 0,
        Na = 0,
        Oa = 0,
        Pa = 0,
        Qa = 0,
        Ra = 0,
        Sa = 0,
        Ta = 0,
        Ua = 0,
        Va = 0,
        Wa = 0,
        Xa = 0;Va = l;l = l + 112 | 0;Ma = Va + 72 | 0;Na = Va + 36 | 0;Oa = Va + 102 | 0;Pa = Va;Qa = Va + 84 | 0;Ua = k + 4 | 0;z = c[Ua >> 2] | 0;Ra = 1 << z;La = (c[k >> 2] | 0) + (w << 2 << z) | 0;v = (v | 0) < 10 ? v : 10;v = (v | 0) > 1 ? v : 1;Ka = v << 2;s = s + (0 - s & 3) + Ka | 0;Ka = s + (0 - Ka) | 0;if ((n | 0) < (m | 0)) {
      Qb(r, 0, c[k + 8 >> 2] | 0);Qb(r, 0, c[Ua >> 2] | 0);Sd(j | 0, 0, q << 2 | 0) | 0;q = m;l = Va;return q | 0;
    }Sa = (q | 0) > 0;a: do {
      if (Sa) {
        o = 0;while (1) {
          Ia = b[d + (o << 1) >> 1] | 0;Ja = Ia << 16 >> 16;o = o + 1 | 0;if (((Ia << 16 >> 16 < 0 ? 0 - Ja | 0 : Ja) | 0) > 16383) {
            w = 1;break a;
          }if ((o | 0) >= (q | 0)) {
            w = 0;break;
          }
        }
      } else w = 0;
    } while (0);o = 0 - n | 0;b: do {
      if ((o | 0) < (q | 0)) while (1) {
        Ia = b[t + (o << 1) >> 1] | 0;Ja = Ia << 16 >> 16;o = o + 1 | 0;if (((Ia << 16 >> 16 < 0 ? 0 - Ja | 0 : Ja) | 0) > 16383) {
          Ja = 1;break b;
        }if ((o | 0) >= (q | 0)) {
          Ja = w;break;
        }
      } else Ja = w;
    } while (0);Ea = n - m + 1 | 0;Ea = (v | 0) > (Ea | 0) ? Ea : v;if ((n | 0) == (m | 0)) c[Ka >> 2] = n;else ob(f, m, n, q, Ka, 0, Ea, s);Ia = q << 2;o = s + (0 - s & 3) + Ia | 0;Fa = o + (0 - Ia) | 0;Ga = q << 1;o = o + (o & 1) + Ga | 0;w = 0 - Ga | 0;Da = o + w | 0;o = o + (o & 1) + Ga | 0;Ha = o + w | 0;if ((Ea | 0) > 0) {
      Ca = q * 6 | 0;ga = o + (o & 1) + Ca | 0;Ca = ga + (0 - Ca) | 0;ga = ga + (ga & 1) + Ga | 0;ba = ga + w | 0;ca = Ca + (q << 1) | 0;da = Ma + 4 | 0;ea = Ca + (Ga << 1) | 0;fa = Ma + 8 | 0;ga = ga + (0 - ga & 3) | 0;ha = p << 2;ia = ga + ha | 0;ja = ia + (0 - ha) | 0;ka = (Ja | 0) != 0;Ba = Sa & ka;la = (p | 0) > 0;ma = q >> 2;na = (ma | 0) == 0;oa = Pa + 4 | 0;pa = Pa + 8 | 0;qa = Na + 20 | 0;ra = Pa + 12 | 0;sa = Na + 4 | 0;ta = Pa + 16 | 0;ua = Na + 8 | 0;va = Pa + 20 | 0;wa = Na + 32 | 0;xa = Pa + 24 | 0;ya = Na + 16 | 0;za = Pa + 28 | 0;Aa = Pa + 32 | 0;aa = (x | 0) > 2 ? x : 2;aa = (S((aa | 0) < 30 ? aa : 30, 42926080) | 0) >>> 16;O = (z | 0) == 31;P = Oa + 2 | 0;Q = Oa + 4 | 0;R = Qa + 2 | 0;T = Qa + 4 | 0;U = Qa + 6 | 0;V = Qa + 8 | 0;W = Qa + 10 | 0;X = Qa + 12 | 0;Y = Qa + 14 | 0;Z = Qa + 16 | 0;_ = q + -1 | 0;$ = (q | 0) > 1;M = -1;v = 0;w = 0;N = 0;while (1) {
        o = c[Ka + (N << 2) >> 2] | 0;Sd(j | 0, 0, Ia | 0) | 0;L = (c[y >> 2] | 0) > 262144;c[Ma >> 2] = Ca;c[da >> 2] = ca;c[fa >> 2] = ea;if (Sa) {
          s = 0;do {
            b[Da + (s << 1) >> 1] = b[d + (s << 1) >> 1] | 0;s = s + 1 | 0;
          } while ((s | 0) != (q | 0));n = 1 - o | 0;f = 0;do {
            s = f + n | 0;if ((s | 0) >= 0) {
              s = s - o | 0;if ((s | 0) < 0) Ta = 19;else s = 0;
            } else Ta = 19;if ((Ta | 0) == 19) {
              Ta = 0;s = b[t + (s << 1) >> 1] | 0;
            }b[ba + (f << 1) >> 1] = s;f = f + 1 | 0;
          } while ((f | 0) != (q | 0));if (Ba) {
            s = 0;do {
              K = ba + (s << 1) | 0;b[K >> 1] = b[K >> 1] >> 1;s = s + 1 | 0;
            } while ((s | 0) != (q | 0));s = 0;do {
              K = Da + (s << 1) | 0;b[K >> 1] = b[K >> 1] >> 1;s = s + 1 | 0;
            } while ((s | 0) != (q | 0));f = 1;
          } else f = ka;
        } else f = ka;if (la) {
          Sd(ga | 0, 0, ha | 0) | 0;ab(ba, g, ba, q, p, ja, ia);Sd(ga | 0, 0, ha | 0) | 0;
        } else ab(ba, g, ba, q, p, ja, ia);$a(ba, h, i, ba, q, p, ja, ia);if (Sa) {
          s = 0;do {
            b[ea + (s << 1) >> 1] = b[ba + (s << 1) >> 1] | 0;s = s + 1 | 0;
          } while ((s | 0) != (q | 0));s = ~o;f = f & 1;if ($) {
            x = b[t + (0 - o << 1) >> 1] >> f << 16 >> 16;b[ca >> 1] = (S(b[u >> 1] | 0, x) | 0) >>> 14;n = 0;do {
              K = n;n = n + 1 | 0;b[ca + (n << 1) >> 1] = (((S(b[u + (n << 1) >> 1] | 0, x) | 0) + 8192 | 0) >>> 14) + (e[ea + (K << 1) >> 1] | 0);
            } while ((n | 0) != (_ | 0));f = b[t + (s << 1) >> 1] >> f << 16 >> 16;b[Ca >> 1] = (S(b[u >> 1] | 0, f) | 0) >>> 14;s = 0;do {
              K = s;s = s + 1 | 0;b[Ca + (s << 1) >> 1] = (((S(b[u + (s << 1) >> 1] | 0, f) | 0) + 8192 | 0) >>> 14) + (e[ca + (K << 1) >> 1] | 0);
            } while ((s | 0) != (_ | 0));
          } else Ta = 30;
        } else {
          f = f & 1;s = ~o;Ta = 30;
        }if ((Ta | 0) == 30) {
          Ta = 0;b[ca >> 1] = (S(b[u >> 1] | 0, b[t + (0 - o << 1) >> 1] >> f << 16 >> 16) | 0) >>> 14;b[Ca >> 1] = (S(b[u >> 1] | 0, b[t + (s << 1) >> 1] >> f << 16 >> 16) | 0) >>> 14;
        }if (na) {
          s = Na;f = s + 36 | 0;do {
            c[s >> 2] = 0;s = s + 4 | 0;
          } while ((s | 0) < (f | 0));D = 0;C = 0;s = 0;f = 0;n = 0;x = 0;z = 0;A = 0;B = 0;
        } else {
          A = 0;s = ma;f = Da;n = Ca;while (1) {
            s = s + -1 | 0;K = S(b[f >> 1] | 0, b[n >> 1] | 0) | 0;K = (S(b[f + 2 >> 1] | 0, b[n + 2 >> 1] | 0) | 0) + K | 0;K = K + (S(b[f + 4 >> 1] | 0, b[n + 4 >> 1] | 0) | 0) | 0;A = (K + (S(b[f + 6 >> 1] | 0, b[n + 6 >> 1] | 0) | 0) >> 6) + A | 0;if (!s) {
              C = 0;s = ma;f = Da;n = ca;break;
            } else {
              f = f + 8 | 0;n = n + 8 | 0;
            }
          }while (1) {
            s = s + -1 | 0;K = S(b[f >> 1] | 0, b[n >> 1] | 0) | 0;K = (S(b[f + 2 >> 1] | 0, b[n + 2 >> 1] | 0) | 0) + K | 0;K = K + (S(b[f + 4 >> 1] | 0, b[n + 4 >> 1] | 0) | 0) | 0;C = (K + (S(b[f + 6 >> 1] | 0, b[n + 6 >> 1] | 0) | 0) >> 6) + C | 0;if (!s) {
              D = 0;s = ma;f = Da;n = ea;break;
            } else {
              f = f + 8 | 0;n = n + 8 | 0;
            }
          }while (1) {
            s = s + -1 | 0;K = S(b[f >> 1] | 0, b[n >> 1] | 0) | 0;K = (S(b[f + 2 >> 1] | 0, b[n + 2 >> 1] | 0) | 0) + K | 0;K = K + (S(b[f + 4 >> 1] | 0, b[n + 4 >> 1] | 0) | 0) | 0;D = (K + (S(b[f + 6 >> 1] | 0, b[n + 6 >> 1] | 0) | 0) >> 6) + D | 0;if (!s) {
              s = 0;f = ma;n = Ca;break;
            } else {
              f = f + 8 | 0;n = n + 8 | 0;
            }
          }while (1) {
            f = f + -1 | 0;K = b[n >> 1] | 0;K = S(K, K) | 0;J = b[n + 2 >> 1] | 0;K = (S(J, J) | 0) + K | 0;J = b[n + 4 >> 1] | 0;J = K + (S(J, J) | 0) | 0;K = b[n + 6 >> 1] | 0;s = ((J + (S(K, K) | 0) | 0) >>> 6) + s | 0;if (!f) break;else n = n + 8 | 0;
          }c[Na >> 2] = s;z = 0;s = Ca;while (1) {
            n = 0;x = ma;f = ca;while (1) {
              x = x + -1 | 0;K = S(b[s >> 1] | 0, b[f >> 1] | 0) | 0;K = (S(b[s + 2 >> 1] | 0, b[f + 2 >> 1] | 0) | 0) + K | 0;K = K + (S(b[s + 4 >> 1] | 0, b[f + 4 >> 1] | 0) | 0) | 0;n = (K + (S(b[s + 6 >> 1] | 0, b[f + 6 >> 1] | 0) | 0) >> 6) + n | 0;if (!x) break;else {
                s = s + 8 | 0;f = f + 8 | 0;
              }
            }c[Na + (z * 12 | 0) + 4 >> 2] = n;c[Na + 12 + (z << 2) >> 2] = n;s = z + 1 | 0;if ((s | 0) == 2) {
              z = 0;s = Ca;break;
            }z = s;s = c[Ma + (s << 2) >> 2] | 0;
          }while (1) {
            n = 0;x = ma;f = ea;while (1) {
              x = x + -1 | 0;K = S(b[s >> 1] | 0, b[f >> 1] | 0) | 0;K = (S(b[s + 2 >> 1] | 0, b[f + 2 >> 1] | 0) | 0) + K | 0;K = K + (S(b[s + 4 >> 1] | 0, b[f + 4 >> 1] | 0) | 0) | 0;n = (K + (S(b[s + 6 >> 1] | 0, b[f + 6 >> 1] | 0) | 0) >> 6) + n | 0;if (!x) break;else {
                s = s + 8 | 0;f = f + 8 | 0;
              }
            }c[Na + (z * 12 | 0) + 8 >> 2] = n;c[Na + 24 + (z << 2) >> 2] = n;s = z + 1 | 0;if ((s | 0) == 3) break;z = s;s = c[Ma + (s << 2) >> 2] | 0;
          }s = A;f = c[qa >> 2] | 0;n = c[sa >> 2] | 0;x = c[ua >> 2] | 0;z = c[wa >> 2] | 0;A = c[ya >> 2] | 0;B = c[Na >> 2] | 0;
        }c[Pa >> 2] = D << 1;c[oa >> 2] = C << 1;c[pa >> 2] = s << 1;c[ra >> 2] = f << 1;c[ta >> 2] = n << 1;c[va >> 2] = x << 1;c[xa >> 2] = ((S(z & 32767, aa) | 0) >>> 15) + z + (S(z << 1 >> 16, aa) | 0);c[za >> 2] = ((S(A & 32767, aa) | 0) >>> 15) + A + (S(A << 1 >> 16, aa) | 0);c[Aa >> 2] = ((S(B & 32767, aa) | 0) >>> 15) + B + (S(B << 1 >> 16, aa) | 0);_a(Pa, Qa, 32767, 9) | 0;if (O) F = 0;else {
          C = b[Qa >> 1] | 0;D = b[R >> 1] | 0;E = b[T >> 1] | 0;F = b[U >> 1] | 0;G = b[V >> 1] | 0;H = b[W >> 1] | 0;I = b[X >> 1] | 0;J = b[Y >> 1] | 0;K = b[Z >> 1] | 0;x = L ? 31 : 128;s = 0;f = -2147483647;n = 0;while (1) {
            B = La + (n << 2) | 0;Xa = (a[B >> 0] | 0) + 32 | 0;A = (a[B + 1 >> 0] | 0) + 32 | 0;z = (a[B + 2 >> 0] | 0) + 32 | 0;Wa = Xa << 16;L = A << 16;z = ((S(A, D) | 0) + (S(Xa, C) | 0) + (S(z, E) | 0) << 6) - ((S((S(Wa, Xa) | 0) >> 16, I) | 0) + (S((S(Wa, A) | 0) >> 16, F) | 0) + (S((S(L, z) | 0) >> 16, G) | 0) + (S((S(z, Wa) | 0) >> 16, H) | 0) + (S((S(L, A) | 0) >> 16, J) | 0) + (S((S(z << 16, z) | 0) >> 16, K) | 0)) | 0;A = (z | 0) > (f | 0);B = (a[B + 3 >> 0] | 0) > (x | 0);s = A ? B ? s : n : s;n = n + 1 | 0;if ((n | 0) == (Ra | 0)) {
              F = s;break;
            } else f = A ? B ? f : z : f;
          }
        }E = F << 2;C = (a[La + E >> 0] | 0) + 32 | 0;b[Oa >> 1] = C;D = (a[La + (E | 1) >> 0] | 0) + 32 | 0;b[P >> 1] = D;E = (a[La + (E | 2) >> 0] | 0) + 32 | 0;b[Q >> 1] = E;Sd(j | 0, 0, Ia | 0) | 0;B = o + 1 | 0;A = 0;do {
          f = B - A | 0;z = (f | 0) < (q | 0) ? f : q;if ((z | 0) > 0) {
            n = e[Oa + (2 - A << 1) >> 1] << 23 >> 16;s = 0;do {
              Xa = j + (s << 2) | 0;c[Xa >> 2] = (S(b[t + (s - f << 1) >> 1] | 0, n) | 0) + (c[Xa >> 2] | 0);s = s + 1 | 0;
            } while ((s | 0) < (z | 0));
          }n = f + o | 0;f = (n | 0) < (q | 0) ? n : q;if ((z | 0) < (f | 0)) {
            x = e[Oa + (2 - A << 1) >> 1] << 23 >> 16;s = z;do {
              Xa = j + (s << 2) | 0;c[Xa >> 2] = (S(b[t + (s - n << 1) >> 1] | 0, x) | 0) + (c[Xa >> 2] | 0);s = s + 1 | 0;
            } while ((s | 0) < (f | 0));
          }A = A + 1 | 0;
        } while ((A | 0) != 3);if (Sa) {
          s = 0;do {
            K = S(b[ea + (s << 1) >> 1] | 0, C) | 0;L = S(b[ca + (s << 1) >> 1] | 0, D) | 0;Wa = S(b[Ca + (s << 1) >> 1] | 0, E) | 0;Xa = Da + (s << 1) | 0;b[Xa >> 1] = (e[Xa >> 1] | 0) - ((K + 32 + L + Wa | 0) >>> 6);s = s + 1 | 0;
          } while ((s | 0) != (q | 0));
        }if (na) s = 0;else {
          s = 0;f = ma;n = Da;while (1) {
            f = f + -1 | 0;Xa = b[n >> 1] | 0;Xa = S(Xa, Xa) | 0;Wa = b[n + 2 >> 1] | 0;Xa = (S(Wa, Wa) | 0) + Xa | 0;Wa = b[n + 4 >> 1] | 0;Wa = Xa + (S(Wa, Wa) | 0) | 0;Xa = b[n + 6 >> 1] | 0;s = ((Wa + (S(Xa, Xa) | 0) | 0) >>> 6) + s | 0;if (!f) break;else n = n + 8 | 0;
          }
        }if ((M | 0) < 0 | (s | 0) < (M | 0)) {
          Zd(Fa | 0, j | 0, Ia | 0) | 0;Zd(Ha | 0, Da | 0, Ga | 0) | 0;v = o;w = F;
        } else s = M;N = N + 1 | 0;if ((N | 0) >= (Ea | 0)) break;else M = s;
      }
    } else {
      o = 0;v = 0;w = 0;
    }Qb(r, v - m | 0, c[k + 8 >> 2] | 0);Qb(r, w, c[Ua >> 2] | 0);k = a[(c[k >> 2] | 0) + (w << 2 | 3) >> 0] << 8;Wa = c[y >> 2] | 0;m = (Wa | 0) < 1024;Xa = S(k, m ? 0 : Wa >>> 13 << 16 >> 16) | 0;c[y >> 2] = ((S(k, m ? 1024 : Wa & 8191) | 0) >> 13) + Xa;Zd(j | 0, Fa | 0, Ia | 0) | 0;Zd(d | 0, Ha | 0, Ga | 0) | 0;if ((Ja | 0) != 0 & Sa) w = 0;else {
      Xa = o;l = Va;return Xa | 0;
    }do {
      Xa = d + (w << 1) | 0;b[Xa >> 1] = b[Xa >> 1] << 1;w = w + 1 | 0;
    } while ((w | 0) != (q | 0));l = Va;return o | 0;
  }function qb(d, e, f, g, h, i, j, k, l, m, n, o, p, q, r) {
    d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;l = l | 0;m = m | 0;n = n | 0;o = o | 0;p = p | 0;q = q | 0;r = r | 0;var s = 0,
        t = 0,
        u = 0,
        v = 0;g = i + 4 | 0;s = (c[i >> 2] | 0) + (S(4 << c[g >> 2], r) | 0) | 0;v = (Rb(m, c[i + 8 >> 2] | 0) | 0) + f | 0;i = (Rb(m, c[g >> 2] | 0) | 0) << 2;g = (a[s + i >> 0] | 0) + 32 | 0;n = g & 65535;h = a[s + (i | 1) >> 0] | 0;m = h + 32 | 0;r = m & 65535;i = a[s + (i | 2) >> 0] | 0;s = (i << 24 >> 24) + 32 | 0;f = s & 65535;if ((o | 0) != 0 & (v | 0) > (p | 0) ? (t = q << 16 >> 16 >> ((o | 0) > 3 & 1), t = (t | 0) < 62 ? t : 62, u = (r << 16 >> 16 < 0 ? -32 - h | 0 : m) + (i << 24 >> 24 > -32 ? s : 0 - (s >>> 1) | 0) + (n << 16 >> 16 > 0 ? g : 0 - (g >>> 1) | 0) << 16 >> 16, (u | 0) > (t | 0)) : 0) {
      f = ((t << 14 | 0) / (u | 0) | 0) << 16 >> 16;n = (S(g, f) | 0) >>> 14 & 65535;r = (S(m, f) | 0) >>> 14 & 65535;f = (S(s, f) | 0) >>> 14 & 65535;
    }c[k >> 2] = v;b[l >> 1] = n;b[l + 2 >> 1] = r;b[l + 4 >> 1] = f;t = n << 16 >> 16;s = t << 23;m = r << 16 >> 16;i = m << 23;h = f << 16 >> 16;Sd(e | 0, 0, j << 2 | 0) | 0;f = v + 1 | 0;n = (f | 0) < (j | 0) ? f : j;if ((n | 0) > 0) {
      g = h << 23 >> 16;r = 0;do {
        l = e + (r << 2) | 0;c[l >> 2] = (S(b[d + (r - f << 1) >> 1] | 0, g) | 0) + (c[l >> 2] | 0);r = r + 1 | 0;
      } while ((r | 0) < (n | 0));
    }g = f + v | 0;f = (g | 0) < (j | 0) ? g : j;if ((n | 0) < (f | 0)) {
      r = h << 23 >> 16;do {
        l = e + (n << 2) | 0;c[l >> 2] = (S(b[d + (n - g << 1) >> 1] | 0, r) | 0) + (c[l >> 2] | 0);n = n + 1 | 0;
      } while ((n | 0) < (f | 0));
    }h = (v | 0) < (j | 0) ? v : j;if ((h | 0) > 0) {
      r = i >> 16;n = 0;do {
        l = e + (n << 2) | 0;c[l >> 2] = (S(b[d + (n - v << 1) >> 1] | 0, r) | 0) + (c[l >> 2] | 0);n = n + 1 | 0;
      } while ((n | 0) < (h | 0));
    }g = v << 1;f = (g | 0) < (j | 0) ? g : j;if ((h | 0) < (f | 0)) {
      r = m << 23 >> 16;n = h;do {
        l = e + (n << 2) | 0;c[l >> 2] = (S(b[d + (n - g << 1) >> 1] | 0, r) | 0) + (c[l >> 2] | 0);n = n + 1 | 0;
      } while ((n | 0) < (f | 0));
    }g = v + -1 | 0;n = (g | 0) < (j | 0) ? g : j;if ((n | 0) > 0) {
      f = s >> 16;r = 0;do {
        l = e + (r << 2) | 0;c[l >> 2] = (S(b[d + (r - g << 1) >> 1] | 0, f) | 0) + (c[l >> 2] | 0);r = r + 1 | 0;
      } while ((r | 0) < (n | 0));
    }g = g + v | 0;f = (g | 0) < (j | 0) ? g : j;if ((n | 0) >= (f | 0)) return;r = t << 23 >> 16;do {
      j = e + (n << 2) | 0;c[j >> 2] = (S(b[d + (n - g << 1) >> 1] | 0, r) | 0) + (c[j >> 2] | 0);n = n + 1 | 0;
    } while ((n | 0) < (f | 0));return;
  }function rb(a, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;l = l | 0;m = m | 0;n = n | 0;o = o | 0;p = p | 0;q = q | 0;r = r | 0;s = s | 0;t = t | 0;u = u | 0;v = v | 0;t = n << 1;s = p + (p & 1) + t | 0;t = s + (0 - t) | 0;p = l << 16 >> 16 < 63 ? l : 63;r = (n | 0) > 0;if (r & (j | 0) > 0) {
      o = (p & 65535) << 23 >> 16;d = 0;do {
        c[h + (d << 2) >> 2] = S(b[q + (d - j << 1) >> 1] | 0, o) | 0;d = d + 1 | 0;
      } while ((d | 0) < (n | 0) & (d | 0) < (j | 0));
    } else d = 0;if ((d | 0) < (n | 0)) {
      o = (p & 65535) << 25 >> 16;do {
        q = c[h + (d - j << 2) >> 2] | 0;c[h + (d << 2) >> 2] = (S(q << 1 >> 16, o) | 0) + ((S(q & 32767, o) | 0) >> 15);d = d + 1 | 0;
      } while ((d | 0) != (n | 0));
    }if (r) d = 0;else {
      cb(t, e, f, g, t, n, m, s);return j | 0;
    }do {
      b[t + (d << 1) >> 1] = ((c[h + (d << 2) >> 2] | 0) + 4096 | 0) >>> 13;d = d + 1 | 0;
    } while ((d | 0) != (n | 0));cb(t, e, f, g, t, n, m, s);if (r) d = 0;else return j | 0;do {
      h = a + (d << 1) | 0;g = (b[h >> 1] | 0) - (b[t + (d << 1) >> 1] | 0) | 0;b[h >> 1] = (g | 0) > 32700 ? 32700 : ((g | 0) > -32700 ? g : -32700) & 65535;d = d + 1 | 0;
    } while ((d | 0) != (n | 0));return j | 0;
  }function sb(a, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;l = l | 0;m = m | 0;n = n | 0;o = o | 0;p = p | 0;q = q | 0;m = g << 16 >> 16 < 63 ? g : 63;if ((i | 0) > 0) {
      o = (m & 65535) << 23 >> 16;n = 0;do {
        l = S(b[a + (n - e << 1) >> 1] | 0, o) | 0;c[d + (n << 2) >> 2] = l;b[a + (n << 1) >> 1] = (l + 4096 | 0) >>> 13;n = n + 1 | 0;
      } while ((n | 0) != (i | 0));
    }c[j >> 2] = e;b[k + 4 >> 1] = 0;b[k >> 1] = 0;b[k + 2 >> 1] = m;return;
  }function tb(a) {
    a = a | 0;return Da[c[a + 20 >> 2] & 7](a) | 0;
  }function ub(a) {
    a = a | 0;return Da[c[a + 32 >> 2] & 7](a) | 0;
  }function vb(a) {
    a = a | 0;Ba[c[(c[a >> 2] | 0) + 24 >> 2] & 7](a);return;
  }function wb(a) {
    a = a | 0;Ba[c[(c[a >> 2] | 0) + 36 >> 2] & 7](a);return;
  }function xb(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;return ya[c[(c[a >> 2] | 0) + 28 >> 2] & 15](a, b, d) | 0;
  }function yb(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;return ya[c[(c[a >> 2] | 0) + 40 >> 2] & 15](a, b, d) | 0;
  }function zb(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;return ya[c[(c[a >> 2] | 0) + 44 >> 2] & 15](a, b, d) | 0;
  }function Ab(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;return ya[c[(c[a >> 2] | 0) + 28 >> 2] & 15](a, b, d) | 0;
  }function Bb(a, d, e) {
    a = a | 0;d = d | 0;e = e | 0;var f = 0,
        h = 0,
        i = 0;i = l;l = l + 1296 | 0;f = i;h = i + 8 | 0;ya[c[(c[a >> 2] | 0) + 48 >> 2] & 15](a, 3, f) | 0;d = ya[c[(c[a >> 2] | 0) + 40 >> 2] & 15](a, d, h) | 0;f = c[f >> 2] | 0;if ((f | 0) > 0) a = 0;else {
      l = i;return d | 0;
    }do {
      g[e + (a << 2) >> 2] = +(b[h + (a << 1) >> 1] | 0);a = a + 1 | 0;
    } while ((a | 0) < (f | 0));l = i;return d | 0;
  }function Cb(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;return ya[c[(c[a >> 2] | 0) + 48 >> 2] & 15](a, b, d) | 0;
  }function Db(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;var e = 0,
        f = 0;f = l;l = l + 16 | 0;e = f;switch (b | 0) {case 0:
        {
          b = c[a >> 2] | 0;break;
        }case 1:
        {
          b = c[d >> 2] | 0;if (b) {
            b = c[a + 28 + (b << 2) >> 2] | 0;if (!b) b = -1;else b = c[b + 52 >> 2] | 0;
          } else b = 5;break;
        }default:
        {
          a = c[517] | 0;c[e >> 2] = 7280;c[e + 4 >> 2] = b;yd(a, 12799, e) | 0;a = -1;l = f;return a | 0;
        }}c[d >> 2] = b;a = 0;l = f;return a | 0;
  }function Eb(a) {
    a = a | 0;g[a + 4 >> 2] = 0.0;g[a + 8 >> 2] = 1.0;g[a + 32 >> 2] = 0.0;g[a >> 2] = .10000000149011612;g[a + 40 >> 2] = 0.0;g[a + 36 >> 2] = 0.0;g[a + 44 >> 2] = 0.0;g[a + 52 >> 2] = .6798535585403442;g[a + 56 >> 2] = .05000000074505806;g[a + 48 >> 2] = 13.597070693969727;c[a + 60 >> 2] = 0;g[a + 12 >> 2] = 8.699514389038086;g[a + 16 >> 2] = 8.699514389038086;g[a + 20 >> 2] = 8.699514389038086;g[a + 24 >> 2] = 8.699514389038086;g[a + 28 >> 2] = 8.699514389038086;return;
  }function Fb(a, d, e, f, h) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;h = +h;var i = 0.0,
        j = 0.0,
        k = 0,
        l = 0.0,
        m = 0.0,
        n = 0.0,
        o = 0.0,
        p = 0.0,
        q = 0.0,
        r = 0.0,
        s = 0.0,
        t = 0,
        u = 0,
        v = 0.0,
        w = 0.0,
        x = 0,
        y = 0.0,
        z = 0.0,
        A = 0.0,
        B = 0.0,
        C = 0,
        D = 0.0,
        E = 0,
        G = 0.0,
        I = 0,
        J = 0.0,
        K = 0,
        L = 0.0,
        M = 0,
        N = 0.0;k = e >> 1;if ((k | 0) > 0) {
      f = 0;i = 0.0;do {
        N = +(b[d + (f << 1) >> 1] | 0);i = i + N * N;f = f + 1 | 0;
      } while ((f | 0) != (k | 0));
    } else i = 0.0;if ((k | 0) < (e | 0)) {
      j = 0.0;f = k;do {
        N = +(b[d + (f << 1) >> 1] | 0);j = j + N * N;f = f + 1 | 0;
      } while ((f | 0) != (e | 0));
    } else j = 0.0;A = i + j;B = +Q(+(A + 6.0e3));C = a + 12 | 0;D = +g[C >> 2];s = B - D;E = a + 16 | 0;G = +g[E >> 2];p = B - G;I = a + 20 | 0;J = +g[I >> 2];z = B - J;K = a + 24 | 0;L = +g[K >> 2];y = B - L;M = a + 28 | 0;n = B - +g[M >> 2];n = (s * s + 0.0 + p * p + z * z + y * y + n * n) / 150.0;y = h;z = y + -.4;p = z * 3.0 * +F(+z);s = +g[a >> 2];t = a + 4 | 0;s = A * s + (1.0 - s) * +g[t >> 2];g[t >> 2] = s;t = a + 52 | 0;l = +g[t >> 2];u = a + 56 | 0;r = +g[u >> 2];v = l / r;g[a + 48 >> 2] = v;N = A;w = +H(+N, .3);q = r;x = A > 6.0e3;if (x & q < .06) {
      m = w * .05;g[t >> 2] = m;
    } else m = l;o = p;k = o < .3;l = n > 1.0 ? 1.0 : n;if (l < .2 & k ? w < v * 1.2 : 0) e = 14;else e = 9;do {
      if ((e | 0) == 9) {
        f = l < .05;if (f & k ? w < v * 1.5 : 0) {
          e = 14;break;
        }if (f & o < .4) {
          if (p < 0.0 | w < v * 1.2) {
            e = 14;break;
          }
        } else if (f & p < 0.0) {
          e = 14;break;
        }c[a + 60 >> 2] = 0;l = r;d = 0;
      }
    } while (0);if ((e | 0) == 14) {
      d = a + 60 | 0;e = c[d >> 2] | 0;f = e + 1 | 0;c[d >> 2] = f;l = v * 3.0;if ((e | 0) > 2) {
        m = (w > l ? l : w) * .05 + m * .95;g[t >> 2] = m;l = q * .95 + .05;g[u >> 2] = l;d = f;
      } else {
        l = r;d = f;
      }
    }if (x & w < v) {
      g[t >> 2] = w * .05 + m * .95;g[u >> 2] = l * .95 + .05;
    }if (A < 3.0e4) {
      i = A < 1.0e4 ? 5.600000381469727 : 6.300000190734863;if (A < 3.0e3) i = i + -.7;
    } else {
      r = A + 1.0;v = +Q(+(r / (+g[a + 8 >> 2] + 1.0)));r = +Q(+(r / (s + 1.0)));r = r < -5.0 ? -5.0 : r;r = r > 2.0 ? 2.0 : r;s = r;w = r > 0.0 ? s * .6 + 7.0 : 7.0;w = r < 0.0 ? s * .5 + w : w;w = v > 0.0 ? (v > 5.0 ? 5.0 : v) * .5 + w : w;i = j > i * 1.6 ? w + .5 : w;
    }g[a + 8 >> 2] = A;k = a + 40 | 0;y = y * .4 + +g[k >> 2] * .6;g[k >> 2] = y;i = i + (z + (y + -.4)) * 2.2;k = a + 44 | 0;z = +g[k >> 2];i = i < z ? z * .5 + i * .5 : i;i = i < 4.0 ? 4.0 : i;f = (d | 0) > 2;i = f ? 4.0 : i > 10.0 ? 10.0 : i;if (d) i = i - (+Q(+(+(d | 0) + 3.0)) + -1.0986122886681098);i = i < 0.0 ? 0.0 : i;if (!(A < 6.0e4)) {
      N = i;x = N < -1.0;N = x ? -1.0 : N;a = a + 36 | 0;g[a >> 2] = h;g[k >> 2] = N;g[M >> 2] = L;g[K >> 2] = J;g[I >> 2] = G;g[E >> 2] = D;g[C >> 2] = B;return +N;
    }if (f) {
      j = (+Q(+(+(d | 0) + 3.0)) + -1.0986122886681098) * .5;i = i - j;if (A < 1.0e4) i = i - j;
    }N = +Q(+(N / 6.0e4 + .0001)) * .3 + (i < 0.0 ? 0.0 : i);x = N < -1.0;N = x ? -1.0 : N;a = a + 36 | 0;g[a >> 2] = h;g[k >> 2] = N;g[M >> 2] = L;g[K >> 2] = J;g[I >> 2] = G;g[E >> 2] = D;g[C >> 2] = B;return +N;
  }function Gb(a) {
    a = a | 0;return;
  }function Hb(a, c, d) {
    a = a | 0;c = c | 0;d = d | 0;var e = 0;e = d + -1 | 0;a: do {
      if ((d | 0) > 1) {
        d = c;c = 0;while (1) {
          if ((b[d >> 1] | 0) >= a << 16 >> 16) break a;c = c + 1 | 0;if ((c | 0) < (e | 0)) d = d + 2 | 0;else break;
        }
      } else c = 0;
    } while (0);return c | 0;
  }function Ib(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;var e = 0;e = d + -1 | 0;a: do {
      if ((d | 0) > 1) {
        d = b;b = 0;while (1) {
          if ((c[d >> 2] | 0) >= (a | 0)) break a;b = b + 1 | 0;if ((b | 0) < (e | 0)) d = d + 4 | 0;else break;
        }
      } else b = 0;
    } while (0);return b | 0;
  }function Jb(a, d, e, f, g, h, i, j, k) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;var l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0;if ((f | 0) <= 0) return;r = h + -1 | 0;s = j + (r << 2) | 0;q = (h | 0) > 1;if ((e | 0) > 0) {
      k = 0;p = 0;o = d;do {
        d = 0;l = 0;m = o;while (1) {
          l = (S(b[m >> 1] | 0, b[a + (d << 1) >> 1] | 0) | 0) + l | 0;d = d + 1 | 0;if ((d | 0) == (e | 0)) break;else m = m + 2 | 0;
        }o = o + (e << 1) | 0;n = (c[g + (p << 2) >> 2] >> 1) - l | 0;if (!((p | 0) >= (h | 0) ? (n | 0) >= (c[s >> 2] | 0) : 0)) {
          a: do {
            if (q) {
              d = r;while (1) {
                l = d + -1 | 0;m = c[j + (l << 2) >> 2] | 0;if (!((d | 0) > (k | 0) | (n | 0) < (m | 0))) break a;c[j + (d << 2) >> 2] = m;c[i + (d << 2) >> 2] = c[i + (l << 2) >> 2];if ((d | 0) > 1) d = l;else {
                  d = l;break;
                }
              }
            } else d = r;
          } while (0);c[j + (d << 2) >> 2] = n;c[i + (d << 2) >> 2] = p;k = k + 1 | 0;
        }p = p + 1 | 0;
      } while ((p | 0) != (f | 0));return;
    }if (q) {
      k = 0;o = 0;
    } else {
      d = i + (r << 2) | 0;k = 0;do {
        l = c[g + (k << 2) >> 2] >> 1;if (!((k | 0) >= (h | 0) ? (l | 0) >= (c[s >> 2] | 0) : 0)) {
          c[s >> 2] = l;c[d >> 2] = k;
        }k = k + 1 | 0;
      } while ((k | 0) != (f | 0));return;
    }do {
      n = c[g + (o << 2) >> 2] >> 1;if (!((o | 0) >= (h | 0) ? (n | 0) >= (c[s >> 2] | 0) : 0)) {
        d = r;p = 16;
      }if ((p | 0) == 16) {
        while (1) {
          p = 0;l = d + -1 | 0;m = c[j + (l << 2) >> 2] | 0;if (!((d | 0) > (k | 0) | (n | 0) < (m | 0))) break;c[j + (d << 2) >> 2] = m;c[i + (d << 2) >> 2] = c[i + (l << 2) >> 2];if ((d | 0) > 1) {
            d = l;p = 16;
          } else {
            d = l;break;
          }
        }c[j + (d << 2) >> 2] = n;c[i + (d << 2) >> 2] = o;k = k + 1 | 0;
      }o = o + 1 | 0;
    } while ((o | 0) != (f | 0));return;
  }function Kb(a, d, e, f, g, h, i, j, k) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;var l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0;if ((f | 0) <= 0) return;r = h + -1 | 0;s = j + (r << 2) | 0;t = (h | 0) > 1;if ((e | 0) > 0) {
      k = 0;q = 0;
    } else {
      k = 0;o = 0;do {
        n = c[g + (o << 2) >> 2] >> 1;if (!((o | 0) >= (h | 0) ? (n | 0) >= (c[s >> 2] | 0) : 0)) {
          a: do {
            if (t) {
              d = r;while (1) {
                l = d + -1 | 0;m = c[j + (l << 2) >> 2] | 0;if (!((d | 0) > (k | 0) | (n | 0) < (m | 0))) break a;c[j + (d << 2) >> 2] = m;c[i + (d << 2) >> 2] = c[i + (l << 2) >> 2];if ((d | 0) > 1) d = l;else {
                  d = l;break;
                }
              }
            } else d = r;
          } while (0);c[j + (d << 2) >> 2] = n;c[i + (d << 2) >> 2] = o + f;k = k + 1 | 0;
        }o = o + 1 | 0;
      } while ((o | 0) != (f | 0));return;
    }do {
      l = 0;n = 0;m = d;while (1) {
        n = (S(b[m >> 1] | 0, b[a + (l << 1) >> 1] | 0) | 0) + n | 0;l = l + 1 | 0;if ((l | 0) == (e | 0)) break;else m = m + 2 | 0;
      }d = d + (e << 1) | 0;p = (n | 0) > 0;o = (c[g + (q << 2) >> 2] >> 1) + (p ? 0 - n | 0 : n) | 0;if (!((q | 0) >= (h | 0) ? (o | 0) >= (c[s >> 2] | 0) : 0)) {
        b: do {
          if (t) {
            l = r;while (1) {
              m = l + -1 | 0;n = c[j + (m << 2) >> 2] | 0;if (!((l | 0) > (k | 0) | (o | 0) < (n | 0))) break b;c[j + (l << 2) >> 2] = n;c[i + (l << 2) >> 2] = c[i + (m << 2) >> 2];if ((l | 0) > 1) l = m;else {
                l = m;break;
              }
            }
          } else l = r;
        } while (0);c[j + (l << 2) >> 2] = o;l = i + (l << 2) | 0;c[l >> 2] = q;k = k + 1 | 0;if (!p) c[l >> 2] = q + f;
      }q = q + 1 | 0;
    } while ((q | 0) != (f | 0));return;
  }function Lb(a) {
    a = a | 0;var b = 0;b = Gd(2e3, 1) | 0;c[a >> 2] = b;if (!b) return;c[a + 24 >> 2] = 2e3;c[a + 16 >> 2] = 1;c[a + 4 >> 2] = 0;c[a + 8 >> 2] = 0;c[a + 12 >> 2] = 0;c[a + 20 >> 2] = 0;return;
  }function Mb(b) {
    b = b | 0;a[c[b >> 2] >> 0] = 0;c[b + 4 >> 2] = 0;c[b + 8 >> 2] = 0;c[b + 12 >> 2] = 0;c[b + 20 >> 2] = 0;return;
  }function Nb(a) {
    a = a | 0;if (!(c[a + 16 >> 2] | 0)) return;Fd(c[a >> 2] | 0);return;
  }function Ob(b, d, e) {
    b = b | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;k = l;l = l + 32 | 0;g = k + 16 | 0;j = k + 8 | 0;f = k;h = b + 24 | 0;do {
      if ((c[h >> 2] | 0) < (e | 0)) {
        i = c[517] | 0;c[f >> 2] = 7312;yd(i, 12904, f) | 0;if (!(c[b + 16 >> 2] | 0)) {
          c[g >> 2] = 7399;yd(i, 12855, g) | 0;e = c[h >> 2] | 0;break;
        }f = Hd(c[b >> 2] | 0, e) | 0;if (!f) {
          e = c[h >> 2] | 0;c[j >> 2] = 7351;yd(i, 12855, j) | 0;break;
        } else {
          c[h >> 2] = e;c[b >> 2] = f;break;
        }
      }
    } while (0);if ((e | 0) > 0) {
      f = 0;do {
        a[(c[b >> 2] | 0) + f >> 0] = a[d + f >> 0] | 0;f = f + 1 | 0;
      } while ((f | 0) != (e | 0));
    }c[b + 4 >> 2] = e << 3;c[b + 8 >> 2] = 0;c[b + 12 >> 2] = 0;c[b + 20 >> 2] = 0;l = k;return;
  }function Pb(b, d, e) {
    b = b | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0;g = b + 12 | 0;h = c[g >> 2] | 0;i = b + 8 | 0;j = c[i >> 2] | 0;k = b + 4 | 0;l = c[k >> 2] | 0;if (!h) f = 0;else {
      Qb(b, 0, 1);m = 3;
    }while (1) {
      if ((m | 0) == 3) f = c[g >> 2] | 0;if (!f) break;Qb(b, 1, 1);m = 3;
    }c[g >> 2] = h;c[i >> 2] = j;c[k >> 2] = l;f = l + 7 >> 3;f = (f | 0) < (e | 0) ? f : e;if ((f | 0) <= 0) return f | 0;e = 0;do {
      a[d + e >> 0] = a[(c[b >> 2] | 0) + e >> 0] | 0;e = e + 1 | 0;
    } while ((e | 0) < (f | 0));return f | 0;
  }function Qb(b, e, f) {
    b = b | 0;e = e | 0;f = f | 0;var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0,
        n = 0,
        o = 0;o = l;l = l + 32 | 0;h = o + 16 | 0;k = o + 8 | 0;g = o;m = b + 8 | 0;n = b + 12 | 0;i = b + 24 | 0;do {
      if ((((c[n >> 2] | 0) + f >> 3) + (c[m >> 2] | 0) | 0) >= (c[i >> 2] | 0)) {
        j = c[517] | 0;c[g >> 2] = 7450;yd(j, 12904, g) | 0;if (!(c[b + 16 >> 2] | 0)) {
          c[h >> 2] = 7523;yd(j, 12855, h) | 0;l = o;return;
        }g = ((c[i >> 2] | 0) * 3 | 0) + 15 >> 1;h = Hd(c[b >> 2] | 0, g) | 0;if (h | 0) {
          c[i >> 2] = g;c[b >> 2] = h;break;
        }c[k >> 2] = 7480;yd(j, 12855, k) | 0;l = o;return;
      }
    } while (0);if (!f) {
      l = o;return;
    }g = b + 4 | 0;do {
      f = f + -1 | 0;k = (c[b >> 2] | 0) + (c[m >> 2] | 0) | 0;a[k >> 0] = d[k >> 0] | 0 | (e >>> f & 1) << 7 - (c[n >> 2] | 0);k = (c[n >> 2] | 0) + 1 | 0;c[n >> 2] = k;if ((k | 0) == 8) {
        c[n >> 2] = 0;k = (c[m >> 2] | 0) + 1 | 0;c[m >> 2] = k;a[(c[b >> 2] | 0) + k >> 0] = 0;
      }c[g >> 2] = (c[g >> 2] | 0) + 1;
    } while ((f | 0) != 0);l = o;return;
  }function Rb(b, d) {
    b = b | 0;d = d | 0;var e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;i = b + 8 | 0;f = c[i >> 2] | 0;j = b + 12 | 0;g = c[j >> 2] | 0;e = b + 20 | 0;if ((g + d + (f << 3) | 0) > (c[b + 4 >> 2] | 0)) {
      c[e >> 2] = 1;j = 0;return j | 0;
    }if ((c[e >> 2] | 0) != 0 | (d | 0) == 0) {
      j = 0;return j | 0;
    }h = c[b >> 2] | 0;b = 0;e = g;do {
      b = (a[h + f >> 0] | 0) >>> (7 - e | 0) & 1 | b << 1;e = e + 1 | 0;c[j >> 2] = e;if ((e | 0) == 8) {
        f = f + 1 | 0;c[j >> 2] = 0;c[i >> 2] = f;e = 0;
      }d = d + -1 | 0;
    } while ((d | 0) != 0);return b | 0;
  }function Sb(b) {
    b = b | 0;var d = 0,
        e = 0,
        f = 0;e = c[b + 8 >> 2] | 0;f = c[b + 12 >> 2] | 0;d = b + 20 | 0;if (((e << 3) + f | 0) >= (c[b + 4 >> 2] | 0)) {
      c[d >> 2] = 1;f = 0;return f | 0;
    }if (c[d >> 2] | 0) {
      f = 0;return f | 0;
    }f = (a[(c[b >> 2] | 0) + e >> 0] | 0) >>> (7 - f | 0) & 1;return f | 0;
  }function Tb(a, b) {
    a = a | 0;b = b | 0;var d = 0,
        e = 0,
        f = 0,
        g = 0;e = a + 8 | 0;f = c[e >> 2] | 0;g = a + 12 | 0;d = (c[g >> 2] | 0) + b | 0;b = a + 20 | 0;if ((d + (f << 3) | 0) <= (c[a + 4 >> 2] | 0) ? (c[b >> 2] | 0) == 0 : 0) {
      c[e >> 2] = (d >> 3) + f;c[g >> 2] = d & 7;return;
    }c[b >> 2] = 1;return;
  }function Ub(a) {
    a = a | 0;if (c[a + 20 >> 2] | 0) {
      a = -1;return a | 0;
    }a = (c[a + 4 >> 2] | 0) - (c[a + 12 >> 2] | 0) + (S(c[a + 8 >> 2] | 0, -8) | 0) | 0;return a | 0;
  }function Vb(a, c, d) {
    a = a | 0;c = c | 0;d = d | 0;var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0;f = b[c >> 1] | 0;g = (d | 0) > 0;if (!(f << 16 >> 16)) {
      if (!g) {
        d = 0;return d | 0;
      }Sd(a | 0, 0, d << 1 | 0) | 0;d = 0;return d | 0;
    }if (g) {
      l = 0;do {
        k = l;l = l + 1 | 0;g = 0 - (b[c + (l << 1) >> 1] << 13) | 0;if ((k | 0) > 0) {
          h = 0;do {
            g = g - (S(b[c + (k - h << 1) >> 1] | 0, b[a + (h << 1) >> 1] | 0) | 0) | 0;h = h + 1 | 0;
          } while ((h | 0) != (k | 0));
        }j = f << 16 >> 16;i = (g + (j + 1 >> 1) | 0) / ((j << 16) + 524288 >> 16 | 0) | 0;b[a + (k << 1) >> 1] = i;f = k >> 1;i = i << 16 >> 16;if ((f | 0) > 0) {
          h = k + -1 | 0;g = 0;do {
            o = a + (g << 1) | 0;n = b[o >> 1] | 0;m = a + (h - g << 1) | 0;b[o >> 1] = (((S(b[m >> 1] | 0, i) | 0) + 4096 | 0) >>> 13) + n;b[m >> 1] = (e[m >> 1] | 0) + (((S(n, i) | 0) + 4096 | 0) >>> 13);g = g + 1 | 0;
          } while ((g | 0) != (f | 0));
        } else f = 0;if (k & 1 | 0) {
          o = a + (f << 1) | 0;n = b[o >> 1] | 0;b[o >> 1] = (((S(n, i) | 0) + 4096 | 0) >>> 13) + n;
        }f = j - ((S((S(j << 3, i) | 0) >> 16, i) | 0) >>> 13) & 65535;
      } while ((l | 0) != (d | 0));
    }o = f << 16 >> 16;return o | 0;
  }function Wb(a, c, d, e) {
    a = a | 0;c = c | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;if ((e | 0) > 0) {
      f = 1;g = 0;do {
        j = b[a + (g << 1) >> 1] | 0;f = ((S(j, j) | 0) >>> 8) + f | 0;g = g + 1 | 0;
      } while ((g | 0) != (e | 0));
    } else f = 1;f = f + e | 0;if ((f | 0) < 1073741824) {
      i = 8;do {
        i = i + -1 | 0;f = f << 1;
      } while ((f | 0) < 1073741824 & (i | 0) != 0);if ((f | 0) < 1073741824) {
        g = 18;do {
          g = g + -1 | 0;f = f << 1;
        } while ((f | 0) < 1073741824 & (g | 0) != 0);
      } else g = 18;
    } else {
      g = 18;i = 8;
    }if ((d | 0) > 0) j = 0;else return;do {
      if ((j | 0) < (e | 0)) {
        f = 0;h = j;do {
          f = ((S(b[a + (h - j << 1) >> 1] | 0, b[a + (h << 1) >> 1] | 0) | 0) >> i) + f | 0;h = h + 1 | 0;
        } while ((h | 0) != (e | 0));
      } else f = 0;b[c + (j << 1) >> 1] = f >> g;j = j + 1 | 0;
    } while ((j | 0) != (d | 0));return;
  }function Xb(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;return ya[c[a + 4 >> 2] & 15](c[a >> 2] | 0, b, d) | 0;
  }function Yb(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;var e = 0,
        f = 0;f = l;l = l + 16 | 0;e = f;switch (b | 0) {case 0:
        {
          b = c[a + 4 >> 2] << 1;break;
        }case 1:
        {
          b = c[d >> 2] | 0;if (b) {
            b = c[a + 24 + (b << 2) >> 2] | 0;if (!b) b = -1;else b = c[b + 52 >> 2] | 0;
          } else b = 4;break;
        }default:
        {
          a = c[517] | 0;c[e >> 2] = 12364;c[e + 4 >> 2] = b;yd(a, 12799, e) | 0;a = -1;l = f;return a | 0;
        }}c[d >> 2] = b;a = 0;l = f;return a | 0;
  }function Zb(a) {
    a = a | 0;var d = 0,
        e = 0,
        f = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;d = c[a >> 2] | 0;i = Gd(224, 1) | 0;if (!i) {
      i = 0;return i | 0;
    }c[i + 64 >> 2] = Gd(32e3, 1) | 0;c[i >> 2] = a;f = c[d >> 2] | 0;c[i + 8 >> 2] = f;k = c[d + 4 >> 2] | 0;h = i + 16 | 0;c[h >> 2] = (f | 0) / (k | 0) | 0;c[i + 12 >> 2] = k;c[i + 20 >> 2] = f + k;f = c[d + 8 >> 2] | 0;e = i + 24 | 0;c[e >> 2] = f;b[i + 56 >> 1] = b[d + 20 >> 1] | 0;b[i + 58 >> 1] = b[d + 22 >> 1] | 0;c[i + 28 >> 2] = c[d + 12 >> 2];a = d + 16 | 0;c[i + 32 >> 2] = c[a >> 2];b[i + 60 >> 1] = b[d + 24 >> 1] | 0;c[i + 204 >> 2] = d + 28;j = c[d + 92 >> 2] | 0;c[i + 212 >> 2] = j;c[i + 208 >> 2] = j;c[i + 40 >> 2] = 1;c[i + 200 >> 2] = 1;c[i + 36 >> 2] = 1024;c[i + 68 >> 2] = Gd(k << 1, 1) | 0;k = Gd(((c[a >> 2] | 0) + (c[d >> 2] | 0) << 1) + 4 | 0, 1) | 0;c[i + 72 >> 2] = k;j = c[a >> 2] | 0;c[i + 76 >> 2] = k + (j << 1) + 4;d = Gd((j + (c[d >> 2] | 0) << 1) + 4 | 0, 1) | 0;c[i + 80 >> 2] = d;c[i + 84 >> 2] = d + (c[a >> 2] << 1) + 4;c[i + 88 >> 2] = 2976;c[i + 92 >> 2] = 2954;f = f << 1;d = Gd(f, 1) | 0;c[i + 96 >> 2] = d;c[i + 100 >> 2] = Gd(f, 1) | 0;c[i + 4 >> 2] = 1;e = c[e >> 2] | 0;if ((e | 0) > 0) {
      f = e + 1 | 0;a = 0;do {
        k = a;a = a + 1 | 0;b[d + (k << 1) >> 1] = ((a << 16 >> 16) * 25736 | 0) / (f | 0) | 0;
      } while ((a | 0) < (e | 0));
    }k = e << 2;c[i + 104 >> 2] = Gd(k, 1) | 0;c[i + 108 >> 2] = Gd(k, 1) | 0;c[i + 112 >> 2] = Gd(k, 1) | 0;c[i + 116 >> 2] = Gd(k, 1) | 0;c[i + 120 >> 2] = Gd(k, 1) | 0;k = c[h >> 2] << 2;c[i + 132 >> 2] = Gd(k, 1) | 0;c[i + 52 >> 2] = Gd(k, 1) | 0;k = Gd(64, 1) | 0;c[i + 140 >> 2] = k;Eb(k);g[i + 144 >> 2] = 8.0;k = i + 152 | 0;c[k >> 2] = 0;c[k + 4 >> 2] = 0;c[k + 8 >> 2] = 0;c[k + 12 >> 2] = 0;c[k + 16 >> 2] = 0;c[k + 20 >> 2] = 0;c[k + 24 >> 2] = 0;c[k + 28 >> 2] = 0;c[i + 196 >> 2] = 2;c[i + 188 >> 2] = 2;c[i + 192 >> 2] = 8e3;c[i + 216 >> 2] = 0;c[i + 220 >> 2] = 1;k = i;return k | 0;
  }function _b(a) {
    a = a | 0;Fd(c[a + 64 >> 2] | 0);Fd(c[a + 68 >> 2] | 0);Fd(c[a + 72 >> 2] | 0);Fd(c[a + 100 >> 2] | 0);Fd(c[a + 80 >> 2] | 0);Fd(c[a + 96 >> 2] | 0);Fd(c[a + 104 >> 2] | 0);Fd(c[a + 108 >> 2] | 0);Fd(c[a + 112 >> 2] | 0);Fd(c[a + 116 >> 2] | 0);Fd(c[a + 120 >> 2] | 0);Fd(c[a + 132 >> 2] | 0);Fd(c[a + 52 >> 2] | 0);Fd(c[a + 140 >> 2] | 0);Fd(a);return;
  }function $b(a, d, f) {
    a = a | 0;d = d | 0;f = f | 0;var h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0,
        n = 0.0,
        o = 0.0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0.0,
        u = 0.0,
        v = 0.0,
        w = 0.0,
        x = 0.0,
        y = 0.0,
        z = 0.0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        F = 0,
        G = 0,
        H = 0,
        I = 0,
        J = 0,
        K = 0,
        L = 0,
        M = 0,
        N = 0,
        O = 0,
        P = 0,
        Q = 0,
        R = 0,
        T = 0,
        U = 0,
        V = 0,
        W = 0,
        X = 0,
        Y = 0,
        Z = 0,
        _ = 0,
        $ = 0,
        aa = 0,
        ba = 0,
        ca = 0,
        da = 0,
        ea = 0,
        fa = 0,
        ga = 0,
        ha = 0,
        ia = 0,
        ja = 0,
        ka = 0,
        la = 0,
        ma = 0,
        na = 0,
        oa = 0,
        pa = 0,
        qa = 0,
        ra = 0,
        sa = 0,
        ta = 0,
        ua = 0,
        va = 0,
        wa = 0,
        xa = 0,
        ya = 0,
        za = 0,
        Ba = 0,
        Ca = 0,
        Da = 0,
        Ea = 0,
        Fa = 0,
        Ia = 0,
        Ja = 0,
        Ka = 0,
        La = 0,
        Ma = 0,
        Na = 0,
        Oa = 0,
        Pa = 0,
        Qa = 0,
        Ra = 0,
        Sa = 0,
        Ua = 0,
        _a = 0,
        cb = 0,
        db = 0;db = l;l = l + 48 | 0;A = db + 16 | 0;B = db;va = c[a + 64 >> 2] | 0;wa = va & 1;Ua = a + 24 | 0;ma = c[Ua >> 2] | 0;h = ma << 1;Ka = va + wa + h | 0;Pa = 0 - h | 0;s = Ka + Pa | 0;na = Ka & 1;Ka = Ka + na + h | 0;Ja = Ka + Pa | 0;oa = Ka & 1;Ka = Ka + oa | 0;cb = Ka + h | 0;La = cb + Pa | 0;pa = cb & 1;cb = cb + pa + h | 0;Ra = cb + Pa | 0;qa = cb & 1;cb = cb + qa + h | 0;Sa = cb + Pa | 0;ra = cb & 1;cb = cb + ra + h | 0;Ma = cb + Pa | 0;sa = cb & 1;cb = cb + sa + h | 0;Na = cb + Pa | 0;ta = cb & 1;cb = cb + ta + h | 0;Oa = cb + Pa | 0;ua = cb & 1;h = cb + ua + h | 0;Pa = h + Pa | 0;cb = c[a + 72 >> 2] | 0;_a = a + 8 | 0;Qa = a + 32 | 0;_d(cb | 0, cb + (c[_a >> 2] << 1) | 0, (c[Qa >> 2] << 1) + 4 | 0) | 0;cb = c[a + 80 >> 2] | 0;_d(cb | 0, cb + (c[_a >> 2] << 1) | 0, (c[Qa >> 2] << 1) + 4 | 0) | 0;if (c[a + 220 >> 2] | 0) Va(d, d, c[_a >> 2] | 0, c[a + 216 >> 2] | 0 ? 2 : 0, a + 124 | 0);xa = h & 1;cb = a + 20 | 0;ya = c[cb >> 2] | 0;p = ya << 1;D = h + xa + p | 0;p = D + (0 - p) | 0;ka = D & 1;la = c[Ua >> 2] | 0;q = la << 1;D = D + ka + (q + 2) | 0;q = D + (-2 - q) | 0;m = c[_a >> 2] | 0;if ((ya | 0) > (m | 0)) {
      i = c[a + 68 >> 2] | 0;j = c[a + 88 >> 2] | 0;k = ya - m | 0;h = 0;do {
        b[p + (h << 1) >> 1] = (S(b[j + (h << 1) >> 1] | 0, b[i + (h << 1) >> 1] | 0) | 0) >>> 14;h = h + 1 | 0;
      } while ((h | 0) < (k | 0));
    } else h = 0;if ((h | 0) < (ya | 0)) {
      i = m - ya | 0;j = c[a + 88 >> 2] | 0;do {
        b[p + (h << 1) >> 1] = (S(b[j + (h << 1) >> 1] | 0, b[d + (i + h << 1) >> 1] | 0) | 0) >>> 14;h = h + 1 | 0;
      } while ((h | 0) != (ya | 0));
    }Wb(p, q, la + 1 | 0, ya);h = b[q >> 1] | 0;h = ((S(b[a + 60 >> 1] | 0, h) | 0) >>> 15) + h | 0;b[q >> 1] = h;i = c[Ua >> 2] | 0;if ((i | 0) >= 0 ? (r = c[a + 92 >> 2] | 0, b[q >> 1] = (S(b[r >> 1] | 0, h << 16 >> 16) | 0) >>> 14, i | 0) : 0) {
      h = 1;while (1) {
        b[q + (h << 1) >> 1] = (S(b[r + (h << 1) >> 1] | 0, b[q + (h << 1) >> 1] | 0) | 0) >>> 14;if ((h | 0) < (i | 0)) h = h + 1 | 0;else break;
      }
    }Vb(s, q, i) | 0;Fa = jb(s, c[Ua >> 2] | 0, Ra, 10, 6553, D) | 0;j = c[Ua >> 2] | 0;if ((Fa | 0) != (j | 0) & (j | 0) > 0) {
      i = c[a + 96 >> 2] | 0;h = 0;do {
        b[Ra + (h << 1) >> 1] = b[i + (h << 1) >> 1] | 0;h = h + 1 | 0;
      } while ((h | 0) < (j | 0));
    }r = (c[cb >> 2] | 0) - (c[_a >> 2] | 0) | 0;Fa = a + 4 | 0;if (c[Fa >> 2] | 0) {
      if ((j | 0) > 0) {
        h = 0;do {
          b[Ma + (h << 1) >> 1] = b[Ra + (h << 1) >> 1] | 0;h = h + 1 | 0;
        } while ((h | 0) < (j | 0));h = j;
      } else h = j;
    } else {
      h = c[a + 16 >> 2] | 0;mb(c[a + 96 >> 2] | 0, Ra, Ma, j, h, h << 1);h = c[Ua >> 2] | 0;
    }lb(Ma, h, 16);kb(Ma, Oa, c[Ua >> 2] | 0, D);Da = a + 204 | 0;Ea = a + 208 | 0;h = c[(c[Da >> 2] | 0) + (c[Ea >> 2] << 2) >> 2] | 0;do {
      if (h) {
        if ((c[a + 188 >> 2] | 0) > 2 ? (c[h + 8 >> 2] | 0) < 3 : 0) {
          Ia = 27;break;
        }if ((((c[h + 4 >> 2] | 0) == 0 ? (c[h >> 2] | 0) == -1 : 0) ? (c[a + 152 >> 2] | 0) == 0 : 0) ? (c[a + 160 >> 2] | 0) == 0 : 0) {
          za = a + 68 | 0;s = 0;ja = 0;Ca = za;h = r << 1;
        } else Ia = 27;
      } else Ia = 27;
    } while (0);if ((Ia | 0) == 27) {
      Ta(b[a + 56 >> 1] | 0, Oa, Ja, c[Ua >> 2] | 0);Ta(b[a + 58 >> 1] | 0, Oa, La, c[Ua >> 2] | 0);k = a + 84 | 0;q = a + 68 | 0;p = r << 1;Zd(c[k >> 2] | 0, c[q >> 2] | 0, p | 0) | 0;Zd((c[k >> 2] | 0) + (r << 1) | 0, d | 0, (c[_a >> 2] | 0) - r << 1 | 0) | 0;m = c[k >> 2] | 0;$a(m, Ja, La, m, c[_a >> 2] | 0, c[Ua >> 2] | 0, c[a + 112 >> 2] | 0, D);ob(c[k >> 2] | 0, c[a + 28 >> 2] | 0, c[Qa >> 2] | 0, c[_a >> 2] | 0, A, B, 6, D);k = b[B >> 1] | 0;m = (k << 16 >> 16) * 27853 >> 15;h = c[A >> 2] | 0;j = 1;do {
        do {
          if ((b[B + (j << 1) >> 1] | 0) > (m | 0)) {
            i = c[A + (j << 2) >> 2] | 0;Ca = (i << 1) - h | 0;if ((((((Ca | 0) < 0 ? 0 - Ca | 0 : Ca) | 0) >= 3 ? (Ca = (i * 3 | 0) - h | 0, (((Ca | 0) < 0 ? 0 - Ca | 0 : Ca) | 0) >= 4) : 0) ? (Ca = (i << 2) - h | 0, (((Ca | 0) < 0 ? 0 - Ca | 0 : Ca) | 0) >= 5) : 0) ? (Ca = (i * 5 | 0) - h | 0, (((Ca | 0) < 0 ? 0 - Ca | 0 : Ca) | 0) >= 6) : 0) break;h = i;
          }
        } while (0);j = j + 1 | 0;
      } while ((j | 0) != 6);s = k;ja = h;Ca = q;h = p;za = q;
    }Ba = a + 76 | 0;Zd(c[Ba >> 2] | 0, c[Ca >> 2] | 0, h | 0) | 0;Zd((c[Ba >> 2] | 0) + (r << 1) | 0, d | 0, (c[_a >> 2] | 0) - r << 1 | 0) | 0;h = c[Ba >> 2] | 0;bb(h, Oa, h, c[_a >> 2] | 0, c[Ua >> 2] | 0, c[a + 116 >> 2] | 0, D);h = Za(c[Ba >> 2] | 0, c[_a >> 2] | 0) | 0;h = h << 16 >> 16;if ((ja | 0) > 0 & (c[Ea >> 2] | 0) != 1) {
      ha = s << 16 >> 16;ha = (S((S(ha << 17, ha) | 0) >> 16, -26214) | 0) + 268435456 | 0;q = ha >>> 0 > 65535;ga = q ? ha >>> 16 : ha;q = q ? 8 : 0;ia = ga >>> 0 > 255;ga = ia ? ga >>> 8 : ga;q = ia ? q | 4 : q;ia = ga >>> 0 > 15;q = (ia ? ga >>> 4 : ga) >>> 0 > 3 | (ia ? q | 2 : q);ia = q << 1;ia = ((q & 65535) << 16 >> 16 > 6 ? ha >> ia + -12 : ha << 12 - ia) << 16 >> 16;ia = ((S(((S((ia * 16816 | 0) + -827523072 >> 16, ia) | 0) >>> 14 << 16) + 1387593728 >> 16, ia) | 0) >>> 14 << 16) + 238157824 >> 16;q = 13 - q | 0;q = S((((q | 0) > 0 ? ia >> q : ia << 0 - q) << 16 >> 16) * 72088 >> 16, h) | 0;
    } else q = h << 14;k = c[a + 140 >> 2] | 0;do {
      if (k) {
        m = a + 152 | 0;if ((c[m >> 2] | 0) == 0 ? (c[a + 160 >> 2] | 0) == 0 : 0) {
          Ia = 79;break;
        }i = c[Ua >> 2] | 0;if ((i | 0) > 0) {
          j = c[a + 96 >> 2] | 0;o = 0.0;h = 0;do {
            ia = (b[j + (h << 1) >> 1] | 0) - (b[Ra + (h << 1) >> 1] | 0) | 0;o = o + +(S(ia, ia) | 0);h = h + 1 | 0;
          } while ((h | 0) < (i | 0));
        } else o = 0.0;z = o * 1.4901161193847656e-08;p = a + 172 | 0;if (c[p >> 2] | 0) {
          o = +g[a + 176 >> 2];if (+g[a + 180 >> 2] * o > 0.0) {
            o = o * -1.0e-05 / (+g[a + 184 >> 2] + 1.0);o = o > .05 ? .05000000074505806 : o;if (o < -.05) o = -.05000000074505806;
          } else o = 0.0;ia = a + 144 | 0;y = o + +g[ia >> 2];y = y > 10.0 ? 10.0 : y;g[ia >> 2] = y < 0.0 ? 0.0 : y;
        }y = +Fb(k, d, c[_a >> 2] | 0, ja, +(s << 16 >> 16) * .015625);g[a + 148 >> 2] = y;if (!(c[m >> 2] | 0)) {
          i = a + 168 | 0;do {
            if (y < 2.0) {
              h = c[i >> 2] | 0;if (!(z > .05 | (h | 0) == 0) ? !((h | 0) > 20 | (c[a + 164 >> 2] | 0) == 0) : 0) {
                c[i >> 2] = h + 1;h = 0;break;
              }c[i >> 2] = 1;h = 1;
            } else {
              c[i >> 2] = 0;h = c[a + 212 >> 2] | 0;
            }
          } while (0);c[Ea >> 2] = h;break;
        }c[A >> 2] = 8;u = +g[a + 144 >> 2];i = ~~+E(+u);j = i + 1 | 0;t = +(j | 0) - u;u = u - +(i | 0);if ((i | 0) == 10) {
          n = +g[100];if (y > n ? (v = y - n, v < 100.0) : 0) {
            n = v;h = 8;
          } else {
            n = 100.0;h = 0;
          }o = +g[89];if (y > o ? (w = y - o, w < n) : 0) {
            n = w;h = 7;
          }o = +g[78];do {
            if (y > o) {
              o = y - o;if (!(o < n)) break;n = o;h = 6;
            }
          } while (0);o = +g[67];do {
            if (y > o) {
              o = y - o;if (!(o < n)) break;n = o;h = 5;
            }
          } while (0);o = +g[56];do {
            if (y > o) {
              o = y - o;if (!(o < n)) break;n = o;h = 4;
            }
          } while (0);o = +g[45];do {
            if (y > o) {
              o = y - o;if (!(o < n)) break;n = o;h = 3;
            }
          } while (0);o = +g[34];do {
            if (y > o) {
              o = y - o;if (!(o < n)) break;n = o;h = 2;
            }
          } while (0);o = +g[23];
        } else {
          o = +g[360 + (i << 2) >> 2] * t + u * +g[360 + (j << 2) >> 2];if (y > o ? (n = y - o, n < 100.0) : 0) h = 8;else {
            n = 100.0;h = 0;
          }o = +g[316 + (i << 2) >> 2] * t + u * +g[316 + (j << 2) >> 2];if (y > o ? (x = y - o, x < n) : 0) {
            n = x;h = 7;
          }o = +g[272 + (i << 2) >> 2] * t + u * +g[272 + (j << 2) >> 2];do {
            if (y > o) {
              o = y - o;if (!(o < n)) break;n = o;h = 6;
            }
          } while (0);o = +g[228 + (i << 2) >> 2] * t + u * +g[228 + (j << 2) >> 2];do {
            if (y > o) {
              o = y - o;if (!(o < n)) break;n = o;h = 5;
            }
          } while (0);o = +g[184 + (i << 2) >> 2] * t + u * +g[184 + (j << 2) >> 2];do {
            if (y > o) {
              o = y - o;if (!(o < n)) break;n = o;h = 4;
            }
          } while (0);o = +g[140 + (i << 2) >> 2] * t + u * +g[140 + (j << 2) >> 2];do {
            if (y > o) {
              o = y - o;if (!(o < n)) break;n = o;h = 3;
            }
          } while (0);o = +g[96 + (i << 2) >> 2] * t + u * +g[96 + (j << 2) >> 2];do {
            if (y > o) {
              o = y - o;if (!(o < n)) break;n = o;h = 2;
            }
          } while (0);o = +g[52 + (i << 2) >> 2] * t + u * +g[52 + (j << 2) >> 2];
        }ia = y > o & y - o < n ? 1 : h;c[A >> 2] = ia;i = a + 168 | 0;do {
          if (!ia) {
            h = c[i >> 2] | 0;if (!(z > .05 | (h | 0) == 0) ? !((h | 0) > 20 | (c[a + 164 >> 2] | 0) == 0) : 0) {
              c[A >> 2] = 0;h = h + 1 | 0;break;
            }c[A >> 2] = 1;h = 1;
          } else h = 0;
        } while (0);c[i >> 2] = h;zb(a, 6, A) | 0;h = a + 156 | 0;if ((c[h >> 2] | 0) > 0 ? (zb(a, 19, B) | 0, C = c[h >> 2] | 0, (c[B >> 2] | 0) > (C | 0)) : 0) {
          c[B >> 2] = C;zb(a, 18, B) | 0;
        }if (c[p >> 2] | 0) {
          zb(a, 19, B) | 0;ha = (c[B >> 2] | 0) - (c[p >> 2] | 0) | 0;ia = a + 176 | 0;g[ia >> 2] = +g[ia >> 2] + +(ha | 0);ia = a + 180 | 0;g[ia >> 2] = +g[ia >> 2] * .95 + +(ha | 0) * .05;ia = a + 184 | 0;g[ia >> 2] = +g[ia >> 2] + 1.0;
        }
      } else Ia = 79;
    } while (0);if ((Ia | 0) == 79) g[a + 148 >> 2] = -1.0;if (c[a + 200 >> 2] | 0) {
      Qb(f, 0, 1);Qb(f, c[Ea >> 2] | 0, 4);
    }j = c[(c[Da >> 2] | 0) + (c[Ea >> 2] << 2) >> 2] | 0;if (!j) {
      h = c[_a >> 2] | 0;if ((h | 0) > 0) {
        k = c[a + 84 >> 2] | 0;j = c[Ba >> 2] | 0;i = 0;do {
          b[k + (i << 1) >> 1] = 0;b[j + (i << 1) >> 1] = 0;i = i + 1 | 0;
        } while ((i | 0) < (h | 0));
      }if ((c[Ua >> 2] | 0) > 0) {
        i = c[a + 108 >> 2] | 0;h = 0;do {
          c[i + (h << 2) >> 2] = 0;h = h + 1 | 0;
        } while ((h | 0) < (c[Ua >> 2] | 0));h = c[_a >> 2] | 0;
      }c[Fa >> 2] = 1;c[a + 40 >> 2] = 1;cb = c[cb >> 2] | 0;Zd(c[Ca >> 2] | 0, d + (h << 1 << 1) + (0 - cb << 1) | 0, cb - h << 1 | 0) | 0;if ((c[Ua >> 2] | 0) <= 0) {
        cb = 0;l = db;return cb | 0;
      }i = c[a + 104 >> 2] | 0;h = 0;do {
        c[i + (h << 2) >> 2] = 0;h = h + 1 | 0;
      } while ((h | 0) < (c[Ua >> 2] | 0));h = 0;l = db;return h | 0;
    }i = c[Ua >> 2] | 0;if ((c[Fa >> 2] | 0) != 0 & (i | 0) > 0) {
      k = c[a + 96 >> 2] | 0;h = 0;do {
        b[k + (h << 1) >> 1] = b[Ra + (h << 1) >> 1] | 0;h = h + 1 | 0;
      } while ((h | 0) < (i | 0));
    }Ha[c[j + 16 >> 2] & 3](Ra, Sa, i, f);h = c[(c[Da >> 2] | 0) + (c[Ea >> 2] << 2) >> 2] | 0;if ((c[h >> 2] | 0) != -1) {
      Qb(f, ja - (c[a + 28 >> 2] | 0) | 0, 7);h = c[(c[Da >> 2] | 0) + (c[Ea >> 2] << 2) >> 2] | 0;
    }if (!(c[h + 4 >> 2] | 0)) ia = s;else {
      ia = (((s << 16 >> 16) * 58982 >> 16) * 15 | 0) + 32 >> 6;ia = (ia | 0) > 0 ? (ia | 0) < 15 ? ia : 15 : 0;Qb(f, ia, 4);ia = (((ia << 22 >> 16) * 2185 | 0) + 16384 | 0) >>> 15 & 65535;
    }j = Ib(q, 1904, 32) | 0;ha = c[1904 + (j << 2) >> 2] | 0;ha = ((ha << 1 >> 16) * 28406 | 0) + (((ha & 32767) * 28406 | 0) >>> 15) | 0;Qb(f, j, 5);j = c[Ua >> 2] | 0;if ((c[Fa >> 2] | 0) != 0 & (j | 0) > 0) {
      i = c[a + 100 >> 2] | 0;h = 0;do {
        b[i + (h << 1) >> 1] = b[Sa + (h << 1) >> 1] | 0;h = h + 1 | 0;
      } while ((h | 0) < (j | 0));
    }q = D & 1;ga = a + 12 | 0;r = c[ga >> 2] | 0;J = r << 1;m = D + q + J | 0;I = 0 - J | 0;B = m + I | 0;h = 0 - m & 3;F = r << 2;m = m + h + F | 0;D = 0 - F | 0;C = m + D | 0;k = 0 - m & 3;F = m + k + F | 0;D = F + D | 0;m = F & 1;F = F + m | 0;K = F + J | 0;G = K + I | 0;p = K & 1;K = K + p + J | 0;H = K + I | 0;J = K + (K & 1) + J | 0;I = J + I | 0;K = j << 2;J = J + (0 - J & 3) + K | 0;K = J + (0 - K) | 0;L = a + 16 | 0;i = c[L >> 2] | 0;a: do {
      if ((i | 0) > 0) {
        M = a + 84 | 0;N = a + 96 | 0;O = a + 100 | 0;P = a + 132 | 0;Q = a + 56 | 0;R = a + 58 | 0;T = a + 120 | 0;U = a + 188 | 0;V = a + 28 | 0;W = a + 40 | 0;X = a + 196 | 0;Y = a + 36 | 0;Z = a + 52 | 0;_ = ha + 8192 >> 14;$ = _ << 16 >> 17;aa = ha << 2 >> 16;ba = ha & 16383;ca = J + (0 - J & 3) | 0;da = a + 136 | 0;ea = a + 104 | 0;fa = a + 108 | 0;A = va + (((ma * 18 | 0) + (r * 12 | 0) + (ya + la << 1) | p) + m + q + ka + xa + ua + ta + sa + ra + qa + pa + oa + na + wa + k + h + 2) | 0;h = 0;q = ja;m = r;while (1) {
          p = S(m, h) | 0;r = (c[Ba >> 2] | 0) + (p << 1) | 0;s = (c[M >> 2] | 0) + (p << 1) | 0;mb(c[N >> 2] | 0, Ra, Ma, j, h, i);mb(c[O >> 2] | 0, Sa, Na, c[Ua >> 2] | 0, h, c[L >> 2] | 0);lb(Ma, c[Ua >> 2] | 0, 16);lb(Na, c[Ua >> 2] | 0, 16);kb(Ma, Oa, c[Ua >> 2] | 0, J);kb(Na, Pa, c[Ua >> 2] | 0, J);k = c[Ua >> 2] | 0;if ((k | 0) > 0) {
            i = 8192;j = 0;do {
              i = (b[Pa + ((j | 1) << 1) >> 1] | 0) + i - (b[Pa + (j << 1) >> 1] | 0) | 0;j = j + 2 | 0;
            } while ((j | 0) < (k | 0));
          } else i = 8192;c[(c[P >> 2] | 0) + (h << 2) >> 2] = i;Ta(b[Q >> 1] | 0, Oa, Ja, c[Ua >> 2] | 0);i = b[R >> 1] | 0;j = c[Ua >> 2] | 0;do {
            if (i << 16 >> 16 > -1) Ta(i, Oa, La, j);else {
              if ((j | 0) <= 0) break;Sd(Ka | 0, 0, j << 1 | 0) | 0;
            }
          } while (0);k = (c[cb >> 2] | 0) - (c[_a >> 2] | 0) | 0;if ((k | 0) != (c[ga >> 2] | 0)) {
            Ia = 112;break;
          }i = (k | 0) > 0;do {
            if (!h) {
              if (!i) break;j = c[za >> 2] | 0;i = 0;do {
                ya = b[j + (i << 1) >> 1] | 0;b[s + (i << 1) >> 1] = ya;b[I + (i << 1) >> 1] = ya;i = i + 1 | 0;
              } while ((i | 0) < (k | 0));
            } else {
              if (!i) break;j = S(k, h + -1 | 0) | 0;i = 0;do {
                ya = b[d + (j + i << 1) >> 1] | 0;b[s + (i << 1) >> 1] = ya;b[I + (i << 1) >> 1] = ya;i = i + 1 | 0;
              } while ((i | 0) < (k | 0));
            }
          } while (0);bb(I, Pa, I, k, c[Ua >> 2] | 0, c[T >> 2] | 0, J);i = m >> ((c[U >> 2] | 0) == 0 & 1);eb(Pa, Ja, La, H, i, c[Ua >> 2] | 0, J);j = c[ga >> 2] | 0;if ((i | 0) < (j | 0)) {
            ya = i << 1;xa = i + 1 | 0;Sd(A + ya | 0, 0, (((j | 0) > (xa | 0) ? j : xa) << 1) - ya | 0) | 0;
          }i = c[Ua >> 2] | 0;if ((i | 0) > 0) {
            k = c[ea >> 2] | 0;j = 0;do {
              c[K + (j << 2) >> 2] = c[k + (j << 2) >> 2] << 1;j = j + 1 | 0;i = c[Ua >> 2] | 0;
            } while ((j | 0) < (i | 0));
          }j = c[ga >> 2] | 0;if ((j | 0) > 0) Sd(F | 0, 0, j << 1 | 0) | 0;ab(G, Pa, G, j, i, K, J);i = c[Ua >> 2] | 0;if ((i | 0) > 0) {
            k = c[fa >> 2] | 0;j = 0;do {
              c[K + (j << 2) >> 2] = c[k + (j << 2) >> 2] << 1;j = j + 1 | 0;i = c[Ua >> 2] | 0;
            } while ((j | 0) < (i | 0));
          }$a(G, Ja, La, G, c[ga >> 2] | 0, i, K, J);i = c[Ua >> 2] | 0;if ((i | 0) > 0) {
            k = c[fa >> 2] | 0;j = 0;do {
              c[K + (j << 2) >> 2] = c[k + (j << 2) >> 2];j = j + 1 | 0;i = c[Ua >> 2] | 0;
            } while ((j | 0) < (i | 0));
          }$a(s, Ja, La, s, c[ga >> 2] | 0, i, K, J);do {
            if (!(c[U >> 2] | 0)) {
              if ((c[Ua >> 2] | 0) <= 0) break;j = c[fa >> 2] | 0;i = 0;do {
                c[j + (i << 2) >> 2] = c[K + (i << 2) >> 2];i = i + 1 | 0;
              } while ((i | 0) < (c[Ua >> 2] | 0));
            }
          } while (0);j = c[ga >> 2] | 0;if ((j | 0) > 0) {
            i = 0;do {
              ya = (b[s + (i << 1) >> 1] | 0) - ((b[G + (i << 1) >> 1] | 0) + 1 >> 1) | 0;b[B + (i << 1) >> 1] = (ya | 0) > 32767 ? 32767 : ((ya | 0) > -32767 ? ya : -32767) & 65535;i = i + 1 | 0;
            } while ((i | 0) < (j | 0));
          }Sd(r | 0, 0, j << 1 | 0) | 0;k = c[(c[Da >> 2] | 0) + (c[Ea >> 2] << 2) >> 2] | 0;m = c[k + 24 >> 2] | 0;if (!m) {
            Ia = 140;break;
          }i = c[k >> 2] | 0;switch (i | 0) {case -1:
              {
                j = c[Qa >> 2] | 0;i = c[V >> 2] | 0;break;
              }case 0:
              {
                j = q;i = q;break;
              }default:
              {
                j = i + -1 + (c[V >> 2] | 0) | 0;q = (q | 0) < (j | 0) ? j : q;j = (c[Qa >> 2] | 0) - i | 0;q = (q | 0) > (j | 0) ? j : q;j = q + i | 0;i = 1 - i + q | 0;
              }}j = Ga[m & 3](B, s, Pa, Ja, La, D, c[k + 32 >> 2] | 0, i, (j | 0) > (p | 0) & (c[W >> 2] | 0) != 0 ? p : j, ia, c[Ua >> 2] | 0, c[ga >> 2] | 0, f, J, r, H, c[U >> 2] | 0, 0, c[X >> 2] | 0, Y) | 0;c[(c[Z >> 2] | 0) + (h << 2) >> 2] = j;Sd(C | 0, 0, c[ga >> 2] << 2 | 0) | 0;j = c[ga >> 2] | 0;if ((j | 0) > 0) {
            i = 0;do {
              ya = I + (i << 1) | 0;b[ya >> 1] = (e[ya >> 1] | 0) - (((c[D + (i << 2) >> 2] | 0) + 4096 | 0) >>> 13);i = i + 1 | 0;
            } while ((i | 0) < (j | 0));
          }i = (((Za(I, j) | 0) << 16 >> 16 << 14) + $ | 0) / (_ | 0) | 0;i = (i | 0) < 32768 ? i & 65535 : 32767;switch (c[(c[(c[Da >> 2] | 0) + (c[Ea >> 2] << 2) >> 2] | 0) + 8 >> 2] | 0) {case 0:
              {
                p = ha;break;
              }case 3:
              {
                i = Hb(i, 2674, 8) | 0;Qb(f, i, 3);i = 2688 + (i << 1) | 0;Ia = 149;break;
              }default:
              {
                i = Hb(i, 2704, 2) | 0;Qb(f, i, 1);i = 2706 + (i << 1) | 0;Ia = 149;
              }}if ((Ia | 0) == 149) {
            Ia = 0;p = b[i >> 1] | 0;p = ((S(p, ba) | 0) >> 14) + (S(p, aa) | 0) | 0;
          }Xa(B, B, p, c[ga >> 2] | 0);i = c[(c[Da >> 2] | 0) + (c[Ea >> 2] << 2) >> 2] | 0;j = c[i + 36 >> 2] | 0;if (!j) {
            Ia = 151;break;
          }Aa[j & 3](B, Pa, Ja, La, c[i + 44 >> 2] | 0, c[Ua >> 2] | 0, c[ga >> 2] | 0, C, H, f, J, c[U >> 2] | 0, c[i + 12 >> 2] | 0);Wa(C, C, p, c[ga >> 2] | 0);i = c[ga >> 2] | 0;if ((i | 0) > 0) {
            j = 0;do {
              ya = (c[C + (j << 2) >> 2] | 0) + 8192 + (c[D + (j << 2) >> 2] << 1) >> 14;b[r + (j << 1) >> 1] = (ya | 0) > 32767 ? 32767 : ((ya | 0) > -32767 ? ya : -32767) & 65535;j = j + 1 | 0;
            } while ((j | 0) < (i | 0));
          }do {
            if (!(c[(c[(c[Da >> 2] | 0) + (c[Ea >> 2] << 2) >> 2] | 0) + 12 >> 2] | 0)) Ia = 155;else {
              k = i << 2;j = ca + k | 0;m = j + (0 - k) | 0;Sd(m | 0, 0, k | 0) | 0;k = c[ga >> 2] | 0;if ((k | 0) > 0) {
                i = 0;do {
                  ya = B + (i << 1) | 0;b[ya >> 1] = (((b[ya >> 1] | 0) * 18022 | 0) + 4096 | 0) >>> 13;i = i + 1 | 0;
                } while ((i | 0) < (k | 0));
              }i = c[(c[Da >> 2] | 0) + (c[Ea >> 2] << 2) >> 2] | 0;Aa[c[i + 36 >> 2] & 3](B, Pa, Ja, La, c[i + 44 >> 2] | 0, c[Ua >> 2] | 0, k, m, H, f, j, c[U >> 2] | 0, 0);Wa(m, m, ((p << 1 >> 16) * 14895 | 0) + (((p & 32767) * 14895 | 0) >>> 15) | 0, c[ga >> 2] | 0);i = c[ga >> 2] | 0;if ((i | 0) > 0) j = 0;else break;do {
                i = C + (j << 2) | 0;c[i >> 2] = (c[m + (j << 2) >> 2] | 0) + (c[i >> 2] | 0);j = j + 1 | 0;i = c[ga >> 2] | 0;
              } while ((j | 0) < (i | 0));Ia = 155;
            }
          } while (0);do {
            if ((Ia | 0) == 155) {
              Ia = 0;if ((i | 0) > 0) j = 0;else break;do {
                ya = (c[C + (j << 2) >> 2] | 0) + 8192 + (c[D + (j << 2) >> 2] << 1) >> 14;b[r + (j << 1) >> 1] = (ya | 0) > 32767 ? 32767 : ((ya | 0) > -32767 ? ya : -32767) & 65535;j = j + 1 | 0;
              } while ((j | 0) < (i | 0));
            }
          } while (0);if (c[da >> 2] | 0) {
            i = Ya(C, i) | 0;b[(c[da >> 2] | 0) + (h << 1) >> 1] = i;i = c[ga >> 2] | 0;
          }ab(r, Pa, s, i, c[Ua >> 2] | 0, c[ea >> 2] | 0, J);if (c[U >> 2] | 0) $a(s, Ja, La, s, c[ga >> 2] | 0, c[Ua >> 2] | 0, c[fa >> 2] | 0, J);h = h + 1 | 0;i = c[L >> 2] | 0;if ((h | 0) >= (i | 0)) break a;m = c[ga >> 2] | 0;j = c[Ua >> 2] | 0;
        }if ((Ia | 0) == 112) ac(12396, 708);else if ((Ia | 0) == 140) ac(12463, 760);else if ((Ia | 0) == 151) ac(12500, 842);
      }
    } while (0);m = c[Ea >> 2] | 0;do {
      if ((m | 0) > 0) {
        k = c[Ua >> 2] | 0;i = (k | 0) > 0;do {
          if (i) {
            j = c[a + 96 >> 2] | 0;h = 0;do {
              b[j + (h << 1) >> 1] = b[Ra + (h << 1) >> 1] | 0;h = h + 1 | 0;
            } while ((h | 0) < (k | 0));if (!i) break;i = c[a + 100 >> 2] | 0;h = 0;do {
              b[i + (h << 1) >> 1] = b[Sa + (h << 1) >> 1] | 0;h = h + 1 | 0;
            } while ((h | 0) != (k | 0));
          }
        } while (0);if ((m | 0) == 1) if (!(c[a + 168 >> 2] | 0)) {
          Qb(f, 0, 4);break;
        } else {
          Qb(f, 15, 4);break;
        }
      }
    } while (0);c[Fa >> 2] = 0;_a = c[_a >> 2] | 0;cb = c[cb >> 2] | 0;Zd(c[Ca >> 2] | 0, d + (_a << 1 << 1) + (0 - cb << 1) | 0, cb - _a << 1 | 0) | 0;cb = c[Ea >> 2] | 0;c[a + 40 >> 2] = ((cb | 0) == 0 ? 1 : (c[(c[(c[Da >> 2] | 0) + (cb << 2) >> 2] | 0) + 36 >> 2] | 0) == 1) & 1;cb = 1;l = db;return cb | 0;
  }function ac(a, b) {
    a = a | 0;b = b | 0;var d = 0,
        e = 0;d = l;l = l + 16 | 0;e = c[517] | 0;c[d >> 2] = 12587;c[d + 4 >> 2] = b;c[d + 8 >> 2] = a;yd(e, 12544, d) | 0;ta(1);
  }function bc(a) {
    a = a | 0;var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;d = c[a >> 2] | 0;e = Gd(496, 1) | 0;if (!e) {
      e = 0;return e | 0;
    }c[e + 44 >> 2] = Gd(16e3, 1) | 0;c[e >> 2] = a;c[e + 112 >> 2] = 1;c[e + 4 >> 2] = 1;g = c[d >> 2] | 0;c[e + 12 >> 2] = g;i = c[d + 4 >> 2] | 0;a = (g | 0) / (i | 0) | 0;c[e + 20 >> 2] = a;c[e + 16 >> 2] = i;f = c[d + 8 >> 2] | 0;c[e + 24 >> 2] = f;c[e + 28 >> 2] = c[d + 12 >> 2];h = c[d + 16 >> 2] | 0;c[e + 32 >> 2] = h;c[e + 116 >> 2] = d + 28;c[e + 120 >> 2] = c[d + 92 >> 2];c[e + 124 >> 2] = 1;j = h << 1;d = Gd((j + g + i << 1) + 24 | 0, 1) | 0;c[e + 48 >> 2] = d;c[e + 52 >> 2] = d + (j << 1) + (i << 1) + 12;Sd(d | 0, 0, h + g << 1 | 0) | 0;d = f << 1;c[e + 60 >> 2] = Gd(d, 1) | 0;c[e + 56 >> 2] = Gd(d, 1) | 0;c[e + 64 >> 2] = Gd(f << 2, 1) | 0;c[e + 76 >> 2] = Gd(a << 2, 1) | 0;c[e + 92 >> 2] = 40;d = e + 98 | 0;b[d >> 1] = 0;b[d + 2 >> 1] = 0;b[d + 4 >> 1] = 0;b[d + 6 >> 1] = 0;b[d + 8 >> 1] = 0;c[e + 108 >> 2] = 1e3;c[e + 36 >> 2] = 8e3;c[e + 452 >> 2] = 14;c[e + 492 >> 2] = 1;return e | 0;
  }function cc(a) {
    a = a | 0;Fd(c[a + 44 >> 2] | 0);Fd(c[a + 48 >> 2] | 0);Fd(c[a + 60 >> 2] | 0);Fd(c[a + 56 >> 2] | 0);Fd(c[a + 64 >> 2] | 0);Fd(c[a + 76 >> 2] | 0);Fd(a);return;
  }function dc(a, d, f) {
    a = a | 0;d = d | 0;f = f | 0;var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        E = 0,
        F = 0,
        G = 0,
        H = 0,
        I = 0,
        J = 0,
        K = 0,
        L = 0,
        M = 0,
        N = 0,
        O = 0,
        P = 0,
        Q = 0,
        R = 0,
        T = 0,
        U = 0,
        V = 0,
        W = 0,
        X = 0,
        Y = 0,
        Z = 0,
        _ = 0,
        $ = 0,
        aa = 0,
        ba = 0,
        ca = 0,
        da = 0,
        ea = 0,
        fa = 0,
        ga = 0,
        ha = 0,
        ia = 0,
        ja = 0,
        ka = 0,
        la = 0,
        ma = 0;la = l;l = l + 32 | 0;m = la + 8 | 0;k = la;W = la + 12 | 0;X = la + 16 | 0;t = c[a + 44 >> 2] | 0;do {
      if (!d) {
        if (!(c[a + 484 >> 2] | 0)) {
          s = a + 8 | 0;g = c[s >> 2] | 0;if ((g | 0) < 10) j = b[2710 + (g << 1) >> 1] | 0;else j = 0;g = b[a + 98 >> 1] | 0;ka = a + 100 | 0;ja = b[ka >> 1] | 0;i = g << 16 >> 16 < ja << 16 >> 16;h = b[a + 102 >> 1] | 0;g = b[((i ? ja << 16 >> 16 < h << 16 >> 16 : h << 16 >> 16 < ja << 16 >> 16) ? ka : a + 98 + (((i ? g << 16 >> 16 < h << 16 >> 16 : h << 16 >> 16 < g << 16 >> 16) ? 2 : 0) << 1) | 0) >> 1] | 0;h = a + 96 | 0;i = b[h >> 1] | 0;if (g << 16 >> 16 < i << 16 >> 16) b[h >> 1] = g;else g = i;q = a + 52 | 0;r = a + 12 | 0;i = Za(c[q >> 2] | 0, c[r >> 2] | 0) | 0;h = j << 16 >> 16 << 1;p = (S(((g << 16 >> 16 < 54 ? g : 54) & 65535) << 25 >> 16, h) | 0) >> 16;k = c[a + 48 >> 2] | 0;o = a + 32 | 0;m = a + 16 | 0;_d(k | 0, k + (c[r >> 2] << 1) | 0, ((c[o >> 2] << 1) + (c[m >> 2] | 0) << 1) + 24 | 0) | 0;k = c[a + 92 >> 2] | 0;ka = c[s >> 2] | 0;n = a + 108 | 0;g = (S(c[n >> 2] | 0, 1664525) | 0) + 1013904223 | 0;c[n >> 2] = g;ka = S(g >> 16, (ka << 16) + 65536 >> 16) | 0;k = (ka + 8192 - (ka >> 3) << 2 >> 30) + k | 0;o = c[o >> 2] | 0;k = (k | 0) > (o | 0) ? o : k;o = c[a + 28 >> 2] | 0;k = (k | 0) < (o | 0) ? o : k;o = c[r >> 2] | 0;if ((o | 0) > 0) {
            h = (S(32767 - ((S(p, p) | 0) >>> 15) << 16 >> 16, h) | 0) >> 16;j = c[q >> 2] | 0;i = (S(i << 16 >> 16 << 1, h) | 0) >> 16;h = 0;do {
              g = (S(g, 1664525) | 0) + 1013904223 | 0;ka = S(g >> 16, i) | 0;b[j + (h << 1) >> 1] = ((ka + 8192 - (ka >> 3) | 0) >>> 14) + ((S(b[j + (h - k << 1) >> 1] | 0, p) | 0) >>> 15);h = h + 1 | 0;
            } while ((h | 0) != (o | 0));c[n >> 2] = g;
          }ka = a + 60 | 0;ja = c[ka >> 2] | 0;g = a + 24 | 0;Ta(32113, ja, ja, c[g >> 2] | 0);ab((c[q >> 2] | 0) + (0 - (c[m >> 2] | 0) << 1) | 0, c[ka >> 2] | 0, f, c[r >> 2] | 0, c[g >> 2] | 0, c[a + 64 >> 2] | 0, t);Va(f, f, c[r >> 2] | 0, 1, a + 68 | 0);c[a + 4 >> 2] = 0;c[s >> 2] = (c[s >> 2] | 0) + 1;g = a + 104 | 0;f = c[g >> 2] | 0;c[g >> 2] = f + 1;b[a + 98 + (f << 1) >> 1] = (p + 256 | 0) >>> 9;if ((c[g >> 2] | 0) <= 2) {
            a = 0;l = la;return a | 0;
          }c[g >> 2] = 0;a = 0;l = la;return a | 0;
        } else {
          g = 0;r = 29;
        }
      } else {
        if (!(c[a + 112 >> 2] | 0)) {
          R = a + 120 | 0;break;
        }if ((Ub(d) | 0) < 5) {
          a = -1;l = la;return a | 0;
        }h = a + 128 | 0;i = a + 452 | 0;j = a + 456 | 0;a: while (1) {
          if (Rb(d, 1) | 0) {
            Tb(d, (c[2032 + ((Rb(d, 3) | 0) << 2) >> 2] | 0) + -4 | 0);if ((Ub(d) | 0) < 5) {
              g = -1;r = 128;break;
            }if (Rb(d, 1) | 0 ? (Tb(d, (c[2032 + ((Rb(d, 3) | 0) << 2) >> 2] | 0) + -4 | 0), Rb(d, 1) | 0) : 0) {
              r = 21;break;
            }
          }if ((Ub(d) | 0) < 4) {
            g = -1;r = 128;break;
          }g = Rb(d, 4) | 0;switch (g | 0) {case 15:
              {
                g = -1;r = 128;break a;
              }case 14:
              {
                g = vc(d, h, a) | 0;if (g | 0) {
                  r = 128;break a;
                }break;
              }case 13:
              {
                g = ya[c[i >> 2] & 15](d, a, c[j >> 2] | 0) | 0;if (g | 0) {
                  r = 128;break a;
                }break;
              }default:
              {
                r = 27;break a;
              }}if ((Ub(d) | 0) < 5) {
            g = -1;r = 128;break;
          }
        }if ((r | 0) == 21) {
          a = c[517] | 0;c[k >> 2] = 12601;yd(a, 12904, k) | 0;a = -2;l = la;return a | 0;
        } else if ((r | 0) == 27) {
          if ((g | 0) <= 8) {
            r = 29;break;
          }a = c[517] | 0;c[m >> 2] = 12748;yd(a, 12904, m) | 0;a = -2;l = la;return a | 0;
        } else if ((r | 0) == 128) {
          l = la;return g | 0;
        }
      }
    } while (0);if ((r | 0) == 29) {
      R = a + 120 | 0;c[R >> 2] = g;
    }T = c[a + 48 >> 2] | 0;fa = a + 12 | 0;Q = a + 32 | 0;ea = a + 16 | 0;_d(T | 0, T + (c[fa >> 2] << 1) | 0, ((c[Q >> 2] << 1) + (c[ea >> 2] | 0) << 1) + 24 | 0) | 0;T = a + 116 | 0;g = c[(c[T >> 2] | 0) + (c[R >> 2] << 2) >> 2] | 0;ha = a + 24 | 0;h = c[ha >> 2] | 0;ia = h << 1;q = t + (t & 1) + ia | 0;ia = q + (0 - ia) | 0;if (!g) {
      Ta(30474, c[a + 60 >> 2] | 0, ia, h);h = a + 52 | 0;g = Za(c[h >> 2] | 0, c[fa >> 2] | 0) | 0;m = c[fa >> 2] | 0;if ((m | 0) > 0) {
        k = a + 108 | 0;j = g << 16 >> 16;g = c[h >> 2] | 0;h = 0;i = c[k >> 2] | 0;do {
          i = (S(i, 1664525) | 0) + 1013904223 | 0;ka = S(i >> 16, j) | 0;b[g + (h << 1) >> 1] = (ka + 8192 - (ka >> 3) | 0) >>> 14;h = h + 1 | 0;
        } while ((h | 0) < (m | 0));c[k >> 2] = i;
      } else g = c[h >> 2] | 0;c[a + 4 >> 2] = 1;ab(g, ia, f, m, c[ha >> 2] | 0, c[a + 64 >> 2] | 0, q);c[a + 8 >> 2] = 0;a = 0;l = la;return a | 0;
    }Ea[c[g + 20 >> 2] & 3](ia, h, d);ga = a + 8 | 0;if (c[ga >> 2] | 0 ? (n = c[ha >> 2] | 0, o = (n | 0) > 0, o) : 0) {
      i = c[a + 56 >> 2] | 0;g = 0;h = 0;do {
        da = (b[i + (h << 1) >> 1] | 0) - (b[ia + (h << 1) >> 1] | 0) | 0;g = ((da | 0) < 0 ? 0 - da | 0 : da) + g | 0;h = h + 1 | 0;
      } while ((h | 0) < (n | 0));if (o) {
        h = 19661 >>> (g >> 15) << 16 >> 16;i = c[a + 64 >> 2] | 0;g = 0;do {
          da = i + (g << 2) | 0;aa = c[da >> 2] | 0;c[da >> 2] = (S(aa << 1 >> 16, h) | 0) + ((S(aa & 32767, h) | 0) >> 15);g = g + 1 | 0;
        } while ((g | 0) < (c[ha >> 2] | 0));
      }
    }da = a + 4 | 0;if (!((c[da >> 2] | 0) == 0 ? !(c[ga >> 2] | 0) : 0)) r = 46;if ((r | 0) == 46 ? (p = c[ha >> 2] | 0, (p | 0) > 0) : 0) {
      h = c[a + 56 >> 2] | 0;g = 0;do {
        b[h + (g << 1) >> 1] = b[ia + (g << 1) >> 1] | 0;g = g + 1 | 0;
      } while ((g | 0) < (p | 0));
    }g = c[(c[T >> 2] | 0) + (c[R >> 2] << 2) >> 2] | 0;if ((c[g >> 2] | 0) == -1) P = 0;else {
      P = c[a + 28 >> 2] | 0;P = (Rb(d, 7) | 0) + P | 0;g = c[(c[T >> 2] | 0) + (c[R >> 2] << 2) >> 2] | 0;
    }if (!(c[g + 4 >> 2] | 0)) N = 0;else N = ((((Rb(d, 4) | 0) << 22 >> 16) * 2185 | 0) + 16384 | 0) >>> 15 & 65535;aa = c[1904 + ((Rb(d, 5) | 0) << 2) >> 2] | 0;aa = ((aa << 1 >> 16) * 28406 | 0) + (((aa & 32767) * 28406 | 0) >>> 15) | 0;V = c[ha >> 2] << 1;g = q + (q & 1) + V | 0;V = g + (0 - V) | 0;O = c[ea >> 2] << 2;g = g + (0 - g & 3) + O | 0;M = 0 - O | 0;L = g + M | 0;O = g + (0 - g & 3) + O | 0;M = O + M | 0;g = c[R >> 2] | 0;if ((g | 0) == 1) {
      c[a + 484 >> 2] = (Rb(d, 4) | 0) == 15 & 1;g = c[R >> 2] | 0;
    }if ((g | 0) > 1) c[a + 484 >> 2] = 0;U = a + 20 | 0;do {
      if ((c[U >> 2] | 0) > 0) {
        t = a + 52 | 0;u = a + 80 | 0;v = a + 28 | 0;w = a + 96 | 0;x = X + 2 | 0;y = X + 4 | 0;z = a + 108 | 0;A = O;B = O + (0 - A & 3) | 0;q = (((((N & 65535) << 16) + -851968 >> 16) * 24576 | 0) + 8192 | 0) >>> 14;q = q & 32768 | 0 ? 0 : q & 65535;C = a + 480 | 0;D = a + 468 | 0;q = (q << 16 >> 16 < 64 ? q : 64) << 16 >> 16;E = (S(q, -28508160) | 0) + 2147418112 >> 16;F = (S(q, 5046272) | 0) >> 16;G = a + 472 | 0;H = a + 476 | 0;J = P << 16 >> 15;I = J >>> 0 > 65535;m = I ? J >>> 16 : J;I = I ? 8 : 0;K = m >>> 0 > 255;m = K ? m >>> 8 : m;I = K ? I | 4 : I;K = m >>> 0 > 15;I = (K ? m >>> 4 : m) >>> 0 > 3 | (K ? I | 2 : I);K = I << 1;K = ((I & 65535) << 16 >> 16 > 6 ? J >> K + -12 : J << 12 - K) << 16 >> 16;K = ((S(((S((K * 16816 | 0) + -827523072 >> 16, K) | 0) >>> 14 << 16) + 1387593728 >> 16, K) | 0) >>> 14 << 16) + 238157824 >> 16;I = 13 - I | 0;J = aa << 2;I = (S((S(J + 32768 >> 16 << 10, q) | 0) + 32768 >> 16, ((I | 0) > 0 ? K >> I : K << 0 - I) << 16 >> 16) | 0) & 65535;J = J >> 16;K = aa & 16383;q = 0;m = 40;n = 0;s = 0;g = c[ea >> 2] | 0;while (1) {
          k = S(g, q) | 0;p = (c[t >> 2] | 0) + (k << 1) | 0;o = c[u >> 2] | 0;o = (o | 0) == 0 ? 0 : o + (k << 1) | 0;Sd(p | 0, 0, g << 1 | 0) | 0;i = c[(c[T >> 2] | 0) + (c[R >> 2] << 2) >> 2] | 0;j = c[i + 28 >> 2] | 0;if (!j) {
            r = 61;break;
          }g = c[i >> 2] | 0;switch (g | 0) {case -1:
              {
                g = c[Q >> 2] | 0;h = c[v >> 2] | 0;break;
              }case 0:
              {
                g = P;h = P;break;
              }default:
              {
                h = P - g + 1 | 0;r = c[v >> 2] | 0;g = g + P | 0;ma = c[Q >> 2] | 0;g = (g | 0) > (ma | 0) ? ma : g;h = (h | 0) < (r | 0) ? r : h;
              }}Ca[j & 3](p, M, h, g, N, c[i + 32 >> 2] | 0, c[ea >> 2] | 0, W, X, d, O, c[ga >> 2] | 0, k, b[w >> 1] | 0, 0);Ua(M, -262144e3, 262144e3, c[ea >> 2] | 0);k = b[x >> 1] | 0;i = k << 16 >> 16;r = b[X >> 1] | 0;ma = r << 16 >> 16;j = b[y >> 1] | 0;h = j << 16 >> 16;h = (r << 16 >> 16 > 0 ? ma : 0 - (ma >>> 1) | 0) + (k << 16 >> 16 < 0 ? 0 - i | 0 : i) + (j << 16 >> 16 > 0 ? h : 0 - (h >>> 1) | 0) | 0;j = h & 65535;h = h << 16 >> 16;s = h + (s & 65535) | 0;i = n << 16 >> 16;k = (h | 0) > (i | 0);if (((k ? (Y = c[W >> 2] | 0, ma = (m << 1) - Y | 0, (((ma | 0) < 0 ? 0 - ma | 0 : ma) | 0) > 2) : 0) ? (ma = (m * 3 | 0) - Y | 0, (((ma | 0) < 0 ? 0 - ma | 0 : ma) | 0) > 3) : 0) ? (ma = (m << 2) - Y | 0, (((ma | 0) < 0 ? 0 - ma | 0 : ma) | 0) > 4) : 0) {
            g = Y;r = 77;
          } else r = 69;do {
            if ((r | 0) == 69) {
              r = 0;if ((h | 0) > (i * 19661 >> 15 | 0)) {
                g = c[W >> 2] | 0;ma = m - (g << 1) | 0;if ((((ma | 0) < 0 ? 0 - ma | 0 : ma) | 0) < 3) {
                  r = 77;break;
                }ma = (S(g, -3) | 0) + m | 0;if ((((ma | 0) < 0 ? 0 - ma | 0 : ma) | 0) < 4) {
                  r = 77;break;
                }ma = m - (g << 2) | 0;if ((((ma | 0) < 0 ? 0 - ma | 0 : ma) | 0) < 5) {
                  r = 77;break;
                }
              }if ((h * 21955 >> 15 | 0) > (i | 0)) {
                g = c[W >> 2] | 0;ma = (m << 1) - g | 0;if (!(((((ma | 0) < 0 ? 0 - ma | 0 : ma) | 0) >= 3 ? (ma = (m * 3 | 0) - g | 0, (((ma | 0) < 0 ? 0 - ma | 0 : ma) | 0) >= 4) : 0) ? (ma = (m << 2) - g | 0, (((ma | 0) < 0 ? 0 - ma | 0 : ma) | 0) >= 5) : 0)) r = 77;
              }
            }
          } while (0);if ((r | 0) == 77) {
            m = g;n = k ? j : n;
          }Sd(L | 0, 0, c[ea >> 2] << 2 | 0) | 0;switch (c[(c[(c[T >> 2] | 0) + (c[R >> 2] << 2) >> 2] | 0) + 8 >> 2] | 0) {case 3:
              {
                i = b[2688 + ((Rb(d, 3) | 0) << 1) >> 1] | 0;i = ((S(i, K) | 0) >> 14) + (S(i, J) | 0) | 0;break;
              }case 1:
              {
                i = b[2706 + ((Rb(d, 1) | 0) << 1) >> 1] | 0;i = ((S(i, K) | 0) >> 14) + (S(i, J) | 0) | 0;break;
              }default:
              i = aa;}g = c[(c[T >> 2] | 0) + (c[R >> 2] << 2) >> 2] | 0;h = c[g + 40 >> 2] | 0;if (!h) {
            r = 82;break;
          }za[h & 3](L, c[g + 44 >> 2] | 0, c[ea >> 2] | 0, d, O, z);Wa(L, L, i, c[ea >> 2] | 0);g = c[ea >> 2] | 0;if (c[(c[(c[T >> 2] | 0) + (c[R >> 2] << 2) >> 2] | 0) + 12 >> 2] | 0) {
            ma = g << 2;g = B + ma | 0;j = g + (0 - ma) | 0;Sd(j | 0, 0, ma | 0) | 0;ma = c[(c[T >> 2] | 0) + (c[R >> 2] << 2) >> 2] | 0;za[c[ma + 40 >> 2] & 3](j, c[ma + 44 >> 2] | 0, c[ea >> 2] | 0, d, g, z);Wa(j, j, ((i << 1 >> 16) * 14895 | 0) + (((i & 32767) * 14895 | 0) >>> 15) | 0, c[ea >> 2] | 0);g = c[ea >> 2] | 0;if ((g | 0) > 0) {
              h = 0;do {
                g = L + (h << 2) | 0;c[g >> 2] = (c[j + (h << 2) >> 2] | 0) + (c[g >> 2] | 0);h = h + 1 | 0;g = c[ea >> 2] | 0;
              } while ((h | 0) < (g | 0));r = 84;
            } else {
              i = 0;r = 88;
            }
          } else r = 84;if ((r | 0) == 84) {
            r = 0;i = (g | 0) > 0;if (i) {
              h = 0;do {
                ma = (c[L + (h << 2) >> 2] | 0) + 8192 + (c[M + (h << 2) >> 2] << 1) >> 14;b[p + (h << 1) >> 1] = (ma | 0) > 32767 ? 32767 : ((ma | 0) > -32767 ? ma : -32767) & 65535;h = h + 1 | 0;
              } while ((h | 0) < (g | 0));r = 88;
            }
          }if ((r | 0) == 88) if ((o | 0) != 0 & i) {
            h = 0;do {
              b[o + (h << 1) >> 1] = ((c[L + (h << 2) >> 2] | 0) + 8192 | 0) >>> 14;h = h + 1 | 0;
            } while ((h | 0) != (g | 0));
          }if ((c[R >> 2] | 0) == 1) {
            Sd(p | 0, 0, g << 1 | 0) | 0;g = c[C >> 2] | 0;i = c[ea >> 2] | 0;if ((g | 0) < (i | 0)) {
              do {
                if ((g | 0) > -1) b[p + (g << 1) >> 1] = I;g = g + P | 0;
              } while ((g | 0) < (i | 0));c[C >> 2] = g;
            }c[C >> 2] = g - i;if ((i | 0) > 0) {
              g = 0;h = c[G >> 2] | 0;do {
                ma = p + (g << 1) | 0;r = b[ma >> 1] | 0;o = h;h = c[L + (g << 2) >> 2] | 0;b[ma >> 1] = ((S((h << 2) + 32768 >> 16, E) | 0) >>> 15) + ((((r << 16 >> 16) * 45876 & -65536) + ((b[D >> 1] | 0) * 19660 | 0) | 0) >>> 16) - ((S((o << 2) + 32768 >> 16, F) | 0) >>> 15);b[D >> 1] = r;c[G >> 2] = h;r = (((b[H >> 1] | 0) * 26214 | 0) + 16384 + ((b[ma >> 1] | 0) * 6554 | 0) | 0) >>> 15;b[H >> 1] = r;b[ma >> 1] = (e[ma >> 1] | 0) - r;g = g + 1 | 0;
              } while ((g | 0) != (i | 0));g = i;
            } else g = i;
          }q = q + 1 | 0;if ((q | 0) >= (c[U >> 2] | 0)) {
            r = 100;break;
          }
        }if ((r | 0) == 61) ac(12663, 1321);else if ((r | 0) == 82) ac(12702, 1397);else if ((r | 0) == 100) {
          ja = m;ka = ((s << 16 >> 16) + 2 | 0) >>> 2 & 65535;Z = A;break;
        }
      } else {
        ja = 40;ka = 0;Z = O;
      }
    } while (0);g = c[ha >> 2] | 0;r = g << 1;q = O + (Z & 1) + r | 0;r = q + (0 - r) | 0;if (((c[a + 124 >> 2] | 0) != 0 ? (_ = b[(c[(c[T >> 2] | 0) + (c[R >> 2] << 2) >> 2] | 0) + 48 >> 1] | 0, _ << 16 >> 16 > 0) : 0) ? (c[ga >> 2] | 0) == 0 : 0) {
      Y = a + 52 | 0;ma = c[ea >> 2] | 0;Z = a + 60 | 0;ib((c[Y >> 2] | 0) + (0 - ma << 1) | 0, f, c[Z >> 2] | 0, g, ma << 1, ja, 40, _, q);_ = c[ea >> 2] | 0;ma = _ << 1;ib((c[Y >> 2] | 0) + (_ << 1) | 0, f + (ma << 1) | 0, c[Z >> 2] | 0, c[ha >> 2] | 0, ma, ja, 40, b[(c[(c[T >> 2] | 0) + (c[R >> 2] << 2) >> 2] | 0) + 48 >> 1] | 0, q);
    } else Zd(f | 0, (c[a + 52 >> 2] | 0) + (0 - (c[ea >> 2] | 0) << 1) | 0, c[fa >> 2] << 1 | 0) | 0;if (c[ga >> 2] | 0 ? (ba = a + 52 | 0, $ = (((Za(c[ba >> 2] | 0, c[fa >> 2] | 0) | 0) & 65535) << 16) + 65536 | 0, $ = (($ >> 17) + aa | 0) / ($ >> 16 | 0) | 0, ca = c[fa >> 2] | 0, (ca | 0) > 0) : 0) {
      j = (($ | 0) < 32767 ? $ : 32767) << 16 >> 16;h = c[ba >> 2] | 0;i = c[ea >> 2] | 0;g = 0;do {
        ma = h + (g << 1) | 0;b[ma >> 1] = (S(b[ma >> 1] | 0, j) | 0) >>> 14;b[f + (g << 1) >> 1] = b[h + (g - i << 1) >> 1] | 0;g = g + 1 | 0;
      } while ((g | 0) < (ca | 0));
    }g = c[U >> 2] | 0;if ((g | 0) > 0) {
      m = a + 56 | 0;n = a + 76 | 0;o = a + 60 | 0;p = a + 64 | 0;k = 0;i = c[ha >> 2] | 0;do {
        j = f + ((S(c[ea >> 2] | 0, k) | 0) << 1) | 0;mb(c[m >> 2] | 0, ia, r, i, k, g);lb(r, c[ha >> 2] | 0, 16);kb(r, V, c[ha >> 2] | 0, q);i = c[ha >> 2] | 0;if ((i | 0) > 0) {
          g = 8192;h = 0;do {
            g = (b[V + ((h | 1) << 1) >> 1] | 0) + g - (b[V + (h << 1) >> 1] | 0) | 0;h = h + 2 | 0;
          } while ((h | 0) < (i | 0));
        } else g = 8192;c[(c[n >> 2] | 0) + (k << 2) >> 2] = g;ab(j, c[o >> 2] | 0, j, c[ea >> 2] | 0, c[ha >> 2] | 0, c[p >> 2] | 0, q);i = c[ha >> 2] | 0;if ((i | 0) > 0) {
          h = c[o >> 2] | 0;g = 0;do {
            b[h + (g << 1) >> 1] = b[V + (g << 1) >> 1] | 0;g = g + 1 | 0;
          } while ((g | 0) < (i | 0));
        }k = k + 1 | 0;g = c[U >> 2] | 0;
      } while ((k | 0) < (g | 0));
    }if (c[a + 492 >> 2] | 0) Va(f, f, c[fa >> 2] | 0, c[a + 488 >> 2] | 0 ? 3 : 1, a + 68 | 0);ea = ((aa + 8192 | 0) >>> 14) + 1 | 0;g = ea & 65535;b[a + 84 >> 1] = g;h = a + 86 | 0;f = (b[h >> 1] | 0) * 32440 >> 15;ma = ea << 16 >> 16;ma = ((f | 0) > (ma | 0) ? f : ma) & 65535;b[h >> 1] = ma;f = a + 88 | 0;fa = (((b[f >> 1] | 0) * 66192 | 0) >>> 16) + 1 | 0;g = (fa << 16 | 0) < (ea << 16 | 0) ? fa & 65535 : g;b[f >> 1] = g;if (ma << 16 >> 16 <= g << 16 >> 16) b[h >> 1] = (g & 65535) + 1;h = c[ha >> 2] | 0;if ((h | 0) > 0) {
      i = c[a + 56 >> 2] | 0;g = 0;do {
        b[i + (g << 1) >> 1] = b[ia + (g << 1) >> 1] | 0;g = g + 1 | 0;
      } while ((g | 0) < (h | 0));
    }c[da >> 2] = 0;c[ga >> 2] = 0;c[a + 92 >> 2] = ja;b[a + 96 >> 1] = ka;g = a + 104 | 0;ma = c[g >> 2] | 0;c[g >> 2] = ma + 1;b[a + 98 + (ma << 1) >> 1] = ka;if ((c[g >> 2] | 0) > 2) c[g >> 2] = 0;b[a + 40 >> 1] = aa;ma = 0;l = la;return ma | 0;
  }function ec(a, d, e) {
    a = a | 0;d = d | 0;e = e | 0;var f = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0;m = l;l = l + 32 | 0;f = m;i = m + 16 | 0;j = m + 12 | 0;k = m + 8 | 0;do {
      switch (d | 0) {case 3:
          {
            c[e >> 2] = c[a + 8 >> 2];a = 0;l = m;return a | 0;
          }case 6:case 8:
          {
            e = c[e >> 2] | 0;c[a + 208 >> 2] = e;c[a + 212 >> 2] = e;a = 0;l = m;return a | 0;
          }case 7:case 9:
          {
            c[e >> 2] = c[a + 208 >> 2];a = 0;l = m;return a | 0;
          }case 12:
          {
            c[a + 152 >> 2] = c[e >> 2];a = 0;l = m;return a | 0;
          }case 13:
          {
            c[e >> 2] = c[a + 152 >> 2];a = 0;l = m;return a | 0;
          }case 30:
          {
            c[a + 160 >> 2] = c[e >> 2];a = 0;l = m;return a | 0;
          }case 31:
          {
            c[e >> 2] = c[a + 160 >> 2];a = 0;l = m;return a | 0;
          }case 34:
          {
            c[a + 164 >> 2] = c[e >> 2];a = 0;l = m;return a | 0;
          }case 35:
          {
            c[e >> 2] = c[a + 164 >> 2];a = 0;l = m;return a | 0;
          }case 32:
          {
            h = c[e >> 2] | 0;c[a + 172 >> 2] = h;h = (h | 0) != 0;c[a + 152 >> 2] = h & 1;if (!h) {
              a = 0;l = m;return a | 0;
            }c[i >> 2] = 10;f = c[e >> 2] | 0;while (1) {
              zb(a, 4, i) | 0;zb(a, 19, j) | 0;d = c[i >> 2] | 0;if ((c[j >> 2] | 0) <= (f | 0)) break;h = d + -1 | 0;c[i >> 2] = h;if ((d | 0) <= 0) {
                d = h;break;
              }
            }g[k >> 2] = (d | 0) < 0 ? 0.0 : +(d | 0);zb(a, 14, k) | 0;g[a + 184 >> 2] = 0.0;g[a + 176 >> 2] = 0.0;g[a + 180 >> 2] = 0.0;a = 0;l = m;return a | 0;
          }case 33:
          {
            c[e >> 2] = c[a + 172 >> 2];a = 0;l = m;return a | 0;
          }case 14:
          {
            c[a + 144 >> 2] = c[e >> 2];a = 0;l = m;return a | 0;
          }case 15:
          {
            c[e >> 2] = c[a + 144 >> 2];a = 0;l = m;return a | 0;
          }case 4:
          {
            e = c[e >> 2] | 0;e = (e | 0) > 0 ? e : 0;e = c[(c[c[a >> 2] >> 2] | 0) + 96 + (((e | 0) < 10 ? e : 10) << 2) >> 2] | 0;c[a + 208 >> 2] = e;c[a + 212 >> 2] = e;a = 0;l = m;return a | 0;
          }case 16:
          {
            e = c[e >> 2] | 0;c[a + 188 >> 2] = (e | 0) > 0 ? e : 0;a = 0;l = m;return a | 0;
          }case 17:
          {
            c[e >> 2] = c[a + 188 >> 2];a = 0;l = m;return a | 0;
          }case 18:
          {
            c[i >> 2] = 10;d = c[e >> 2] | 0;do {
              zb(a, 4, i) | 0;zb(a, 19, j) | 0;if ((c[j >> 2] | 0) <= (d | 0)) break;e = c[i >> 2] | 0;c[i >> 2] = e + -1;
            } while ((e | 0) > 0);a = 0;l = m;return a | 0;
          }case 19:
          {
            d = c[(c[a + 204 >> 2] | 0) + (c[a + 208 >> 2] << 2) >> 2] | 0;if (!d) d = 5;else d = c[d + 52 >> 2] | 0;c[e >> 2] = (S(d, c[a + 192 >> 2] | 0) | 0) / (c[a + 8 >> 2] | 0) | 0;a = 0;l = m;return a | 0;
          }case 24:
          {
            c[a + 192 >> 2] = c[e >> 2];a = 0;l = m;return a | 0;
          }case 25:
          {
            c[e >> 2] = c[a + 192 >> 2];a = 0;l = m;return a | 0;
          }case 26:
          {
            c[a + 40 >> 2] = 1;c[a + 4 >> 2] = 1;k = a + 24 | 0;f = c[k >> 2] | 0;h = (f | 0) > 0;if (h) {
              i = c[a + 96 >> 2] | 0;j = f + 1 | 0;d = 0;do {
                e = d;d = d + 1 | 0;b[i + (e << 1) >> 1] = ((d << 16 >> 16) * 25736 | 0) / (j | 0) | 0;
              } while ((d | 0) < (f | 0));if (h) {
                f = c[a + 116 >> 2] | 0;h = c[a + 104 >> 2] | 0;i = c[a + 112 >> 2] | 0;j = c[a + 108 >> 2] | 0;d = 0;do {
                  c[f + (d << 2) >> 2] = 0;c[h + (d << 2) >> 2] = 0;c[i + (d << 2) >> 2] = 0;c[j + (d << 2) >> 2] = 0;d = d + 1 | 0;
                } while ((d | 0) < (c[k >> 2] | 0));
              }
            }j = c[a + 8 >> 2] | 0;f = (c[a + 32 >> 2] | 0) + j | 0;if ((f | 0) >= 0) {
              h = c[a + 80 >> 2] | 0;i = c[a + 72 >> 2] | 0;d = 0;while (1) {
                b[h + (d << 1) >> 1] = 0;b[i + (d << 1) >> 1] = 0;if ((d | 0) < (f | 0)) d = d + 1 | 0;else break;
              }
            }d = c[a + 20 >> 2] | 0;if ((d | 0) <= (j | 0)) {
              a = 0;l = m;return a | 0;
            }e = d - j | 0;Sd(c[a + 68 >> 2] | 0, 0, ((e | 0) > 1 ? e : 1) << 1 | 0) | 0;a = 0;l = m;return a | 0;
          }case 36:
          {
            c[a + 200 >> 2] = c[e >> 2];a = 0;l = m;return a | 0;
          }case 37:
          {
            c[e >> 2] = c[a + 200 >> 2];a = 0;l = m;return a | 0;
          }case 39:
          {
            c[e >> 2] = (c[a + 20 >> 2] | 0) - (c[a + 8 >> 2] | 0);a = 0;l = m;return a | 0;
          }case 40:
          {
            e = c[e >> 2] | 0;c[a + 196 >> 2] = (e | 0) < 100 ? e : 100;l = m;return 0;
          }case 41:
          {
            c[e >> 2] = c[a + 196 >> 2];a = 0;l = m;return a | 0;
          }case 42:
          {
            c[a + 156 >> 2] = c[e >> 2];a = 0;l = m;return a | 0;
          }case 43:
          {
            c[e >> 2] = c[a + 156 >> 2];a = 0;l = m;return a | 0;
          }case 44:
          {
            c[a + 220 >> 2] = c[e >> 2];a = 0;l = m;return a | 0;
          }case 45:
          {
            c[e >> 2] = c[a + 220 >> 2];a = 0;l = m;return a | 0;
          }case 100:
          {
            h = a + 16 | 0;if ((c[h >> 2] | 0) <= 0) {
              a = 0;l = m;return a | 0;
            }f = c[a + 132 >> 2] | 0;d = 0;do {
              c[e + (d << 2) >> 2] = c[f + (d << 2) >> 2];d = d + 1 | 0;
            } while ((d | 0) < (c[h >> 2] | 0));d = 0;l = m;return d | 0;
          }case 101:
          {
            h = a + 16 | 0;if ((c[h >> 2] | 0) <= 0) {
              a = 0;l = m;return a | 0;
            }i = a + 76 | 0;f = a + 12 | 0;d = 0;do {
              a = c[f >> 2] | 0;b[e + (d << 1) >> 1] = Za((c[i >> 2] | 0) + ((S(a, d) | 0) << 1) | 0, a) | 0;d = d + 1 | 0;
            } while ((d | 0) < (c[h >> 2] | 0));d = 0;l = m;return d | 0;
          }case 29:
          {
            c[e >> 2] = c[a + 148 >> 2];a = 0;l = m;return a | 0;
          }case 104:
          {
            c[a + 136 >> 2] = e;a = 0;l = m;return a | 0;
          }case 105:
          {
            c[a + 216 >> 2] = c[e >> 2];a = 0;l = m;return a | 0;
          }case 106:
          {
            c[e >> 2] = c[a + 64 >> 2];a = 0;l = m;return a | 0;
          }default:
          {
            a = c[517] | 0;c[f >> 2] = 12815;c[f + 4 >> 2] = d;yd(a, 12799, f) | 0;a = -1;l = m;return a | 0;
          }}
    } while (0);return 0;
  }function fc(a, d, e) {
    a = a | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0.0;i = l;l = l + 16 | 0;f = i;do {
      switch (d | 0) {case 6:case 8:
          {
            c[a + 120 >> 2] = c[e >> 2];d = 0;break;
          }case 7:case 9:
          {
            c[e >> 2] = c[a + 120 >> 2];d = 0;break;
          }case 0:
          {
            c[a + 124 >> 2] = c[e >> 2];d = 0;break;
          }case 1:
          {
            c[e >> 2] = c[a + 124 >> 2];d = 0;break;
          }case 3:
          {
            c[e >> 2] = c[a + 12 >> 2];d = 0;break;
          }case 19:
          {
            d = c[(c[a + 116 >> 2] | 0) + (c[a + 120 >> 2] << 2) >> 2] | 0;if (!d) d = 5;else d = c[d + 52 >> 2] | 0;c[e >> 2] = (S(d, c[a + 36 >> 2] | 0) | 0) / (c[a + 12 >> 2] | 0) | 0;d = 0;break;
          }case 24:
          {
            c[a + 36 >> 2] = c[e >> 2];d = 0;break;
          }case 25:
          {
            c[e >> 2] = c[a + 36 >> 2];d = 0;break;
          }case 20:
          {
            a = a + 128 | 0;d = c[e >> 2] | 0;c[a + (d * 20 | 0) + 4 >> 2] = c[e + 4 >> 2];c[a + (d * 20 | 0) + 8 >> 2] = c[e + 8 >> 2];c[a + (d * 20 | 0) >> 2] = d;d = 0;break;
          }case 22:
          {
            c[a + 452 >> 2] = c[e + 4 >> 2];c[a + 456 >> 2] = c[e + 8 >> 2];c[a + 448 >> 2] = c[e >> 2];d = 0;break;
          }case 26:
          {
            g = a + 24 | 0;if ((c[g >> 2] | 0) > 0) {
              f = c[a + 64 >> 2] | 0;d = 0;do {
                c[f + (d << 2) >> 2] = 0;d = d + 1 | 0;
              } while ((d | 0) < (c[g >> 2] | 0));
            }d = (c[a + 32 >> 2] | 0) + (c[a + 12 >> 2] | 0) | 0;if ((d | 0) < 0) d = 0;else {
              Sd(c[a + 48 >> 2] | 0, 0, (d << 1) + 2 | 0) | 0;d = 0;
            }break;
          }case 36:
          {
            c[a + 112 >> 2] = c[e >> 2];d = 0;break;
          }case 37:
          {
            c[e >> 2] = c[a + 112 >> 2];d = 0;break;
          }case 39:
          {
            c[e >> 2] = c[a + 16 >> 2];d = 0;break;
          }case 44:
          {
            c[a + 492 >> 2] = c[e >> 2];d = 0;break;
          }case 45:
          {
            c[e >> 2] = c[a + 492 >> 2];d = 0;break;
          }case 47:
          {
            d = b[a + 88 >> 1] | 0;j = +Q(+ +((b[a + 84 >> 1] | 0) / (d | 0) | 0 | 0));j = j / +Q(+ +((b[a + 86 >> 1] | 0) / (d | 0) | 0 | 0));j = j > 1.0 ? 1.0 : j;c[e >> 2] = ~~((j > 0.0 ? j : 0.0) * 100.0);d = 0;break;
          }case 100:
          {
            g = a + 20 | 0;if ((c[g >> 2] | 0) > 0) {
              f = c[a + 76 >> 2] | 0;d = 0;do {
                c[e + (d << 2) >> 2] = c[f + (d << 2) >> 2];d = d + 1 | 0;
              } while ((d | 0) < (c[g >> 2] | 0));d = 0;
            } else d = 0;break;
          }case 101:
          {
            g = a + 20 | 0;if ((c[g >> 2] | 0) > 0) {
              h = a + 52 | 0;f = a + 16 | 0;d = 0;do {
                a = c[f >> 2] | 0;b[e + (d << 1) >> 1] = Za((c[h >> 2] | 0) + ((S(a, d) | 0) << 1) | 0, a) | 0;d = d + 1 | 0;
              } while ((d | 0) < (c[g >> 2] | 0));d = 0;
            } else d = 0;break;
          }case 103:
          {
            c[e >> 2] = c[a + 484 >> 2];d = 0;break;
          }case 104:
          {
            c[a + 80 >> 2] = e;d = 0;break;
          }case 105:
          {
            c[a + 488 >> 2] = c[e >> 2];d = 0;break;
          }case 106:
          {
            c[e >> 2] = c[a + 44 >> 2];d = 0;break;
          }default:
          {
            e = c[517] | 0;c[f >> 2] = 12815;c[f + 4 >> 2] = d;yd(e, 12799, f) | 0;d = -1;
          }}
    } while (0);l = i;return d | 0;
  }function gc(c, d, f, g) {
    c = c | 0;d = d | 0;f = f | 0;g = g | 0;var h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        E = 0,
        F = 0,
        G = 0,
        H = 0,
        I = 0,
        J = 0;J = l;l = l + 32 | 0;C = J;I = (f | 0) > 0;if (I) {
      h = 0;do {
        b[d + (h << 1) >> 1] = b[c + (h << 1) >> 1] | 0;h = h + 1 | 0;
      } while ((h | 0) != (f | 0));if (I) {
        m = f + -1 | 0;k = 0;do {
          h = b[d + (k << 1) >> 1] | 0;n = h << 16 >> 16;if (k) h = n - (e[d + (k + -1 << 1) >> 1] | 0) & 65535;i = k;k = k + 1 | 0;if ((i | 0) == (m | 0)) j = 25736;else j = e[d + (k << 1) >> 1] | 0;H = j - n | 0;b[C + (i << 1) >> 1] = 81920 / (((((H << 16 >> 16 | 0) < (h << 16 >> 16 | 0) ? H & 65535 : h) & 65535) << 16) + 19660800 >> 16 | 0) | 0;
        } while ((k | 0) != (f | 0));if (I) {
          h = 0;do {
            H = d + (h << 1) | 0;h = h + 1 | 0;b[H >> 1] = (e[H >> 1] | 0) - (h << 11);
          } while ((h | 0) != (f | 0));if (I) {
            j = 10408;o = 0;k = 2147483647;m = 0;while (1) {
              n = 0;h = 0;i = j;while (1) {
                H = (e[d + (h << 1) >> 1] | 0) - (a[i >> 0] << 5) << 16 >> 16;n = (S(H, H) | 0) + n | 0;h = h + 1 | 0;if ((h | 0) == (f | 0)) break;else i = i + 1 | 0;
              }h = (n | 0) < (k | 0);o = h ? m : o;m = m + 1 | 0;if ((m | 0) == 64) break;else {
                j = j + f | 0;k = h ? n : k;
              }
            }i = S(o, f) | 0;h = 0;do {
              H = d + (h << 1) | 0;b[H >> 1] = (e[H >> 1] | 0) - (a[10408 + (h + i) >> 0] << 5);h = h + 1 | 0;
            } while ((h | 0) != (f | 0));Qb(g, o, 6);if (I) {
              h = 0;do {
                H = d + (h << 1) | 0;b[H >> 1] = b[H >> 1] << 1;h = h + 1 | 0;
              } while ((h | 0) != (f | 0));
            }
          } else p = 18;
        } else p = 18;
      } else p = 18;
    } else p = 18;if ((p | 0) == 18) Qb(g, 0, 6);u = d + 2 | 0;v = d + 4 | 0;w = d + 6 | 0;x = d + 8 | 0;o = e[d >> 1] | 0;p = b[C >> 1] | 0;q = e[u >> 1] | 0;y = b[C + 2 >> 1] | 0;r = e[v >> 1] | 0;z = b[C + 4 >> 1] | 0;s = e[w >> 1] | 0;A = b[C + 6 >> 1] | 0;t = e[x >> 1] | 0;B = b[C + 8 >> 1] | 0;h = 11048;i = 0;j = 2147483647;k = 0;while (1) {
      m = o - (a[h >> 0] << 5) << 16 >> 16;m = S(m, m) | 0;m = ((S(m & 32767, p) | 0) >> 15) + (S(m << 1 >> 16, p) | 0) | 0;n = q - (a[h + 1 >> 0] << 5) << 16 >> 16;n = S(n, n) | 0;n = ((S(n & 32767, y) | 0) >> 15) + m + (S(n << 1 >> 16, y) | 0) | 0;m = r - (a[h + 2 >> 0] << 5) << 16 >> 16;m = S(m, m) | 0;m = ((S(m & 32767, z) | 0) >> 15) + n + (S(m << 1 >> 16, z) | 0) | 0;n = s - (a[h + 3 >> 0] << 5) << 16 >> 16;n = S(n, n) | 0;n = ((S(n & 32767, A) | 0) >> 15) + m + (S(n << 1 >> 16, A) | 0) | 0;m = t - (a[h + 4 >> 0] << 5) << 16 >> 16;m = S(m, m) | 0;m = ((S(m & 32767, B) | 0) >> 15) + n + (S(m << 1 >> 16, B) | 0) | 0;n = (m | 0) < (j | 0);i = n ? k : i;k = k + 1 | 0;if ((k | 0) == 64) break;else {
        h = h + 5 | 0;j = n ? m : j;
      }
    }h = i * 5 | 0;b[d >> 1] = (e[d >> 1] | 0) - (a[11048 + h >> 0] << 5);b[u >> 1] = (e[u >> 1] | 0) - (a[11048 + (h + 1) >> 0] << 5);b[v >> 1] = (e[v >> 1] | 0) - (a[11048 + (h + 2) >> 0] << 5);b[w >> 1] = (e[w >> 1] | 0) - (a[11048 + (h + 3) >> 0] << 5);b[x >> 1] = (e[x >> 1] | 0) - (a[11048 + (h + 4) >> 0] << 5);Qb(g, i, 6);h = b[d >> 1] << 1 & 65535;b[d >> 1] = h;p = b[u >> 1] << 1;b[u >> 1] = p;q = b[v >> 1] << 1;b[v >> 1] = q;r = b[w >> 1] << 1;b[w >> 1] = r;s = b[x >> 1] << 1;b[x >> 1] = s;t = b[C >> 1] | 0;n = 11368;j = 0;o = 2147483647;i = 0;while (1) {
      k = (h & 65535) - (a[n >> 0] << 5) << 16 >> 16;k = S(k, k) | 0;k = ((S(k & 32767, t) | 0) >> 15) + (S(k << 1 >> 16, t) | 0) | 0;m = p - (a[n + 1 >> 0] << 5) << 16 >> 16;m = S(m, m) | 0;m = ((S(m & 32764, y) | 0) >> 15) + k + (S(m << 1 >> 16, y) | 0) | 0;k = q - (a[n + 2 >> 0] << 5) << 16 >> 16;k = S(k, k) | 0;k = ((S(k & 32764, z) | 0) >> 15) + m + (S(k << 1 >> 16, z) | 0) | 0;m = r - (a[n + 3 >> 0] << 5) << 16 >> 16;m = S(m, m) | 0;m = ((S(m & 32764, A) | 0) >> 15) + k + (S(m << 1 >> 16, A) | 0) | 0;k = s - (a[n + 4 >> 0] << 5) << 16 >> 16;k = S(k, k) | 0;k = ((S(k & 32764, B) | 0) >> 15) + m + (S(k << 1 >> 16, B) | 0) | 0;m = (k | 0) < (o | 0);h = m ? i : j;i = i + 1 | 0;if ((i | 0) == 64) break;n = n + 5 | 0;j = h;o = m ? k : o;h = b[d >> 1] | 0;
    }H = h * 5 | 0;b[d >> 1] = (e[d >> 1] | 0) - (a[11368 + H >> 0] << 5);b[u >> 1] = p - (a[11368 + (H + 1) >> 0] << 5);b[v >> 1] = q - (a[11368 + (H + 2) >> 0] << 5);b[w >> 1] = r - (a[11368 + (H + 3) >> 0] << 5);b[x >> 1] = s - (a[11368 + (H + 4) >> 0] << 5);Qb(g, h, 6);H = d + 10 | 0;y = C + 10 | 0;D = d + 12 | 0;z = C + 12 | 0;E = d + 14 | 0;A = C + 14 | 0;F = d + 16 | 0;B = C + 16 | 0;G = d + 18 | 0;C = C + 18 | 0;m = e[H >> 1] | 0;n = b[y >> 1] | 0;o = e[D >> 1] | 0;p = b[z >> 1] | 0;q = e[E >> 1] | 0;r = b[A >> 1] | 0;s = e[F >> 1] | 0;t = b[B >> 1] | 0;u = e[G >> 1] | 0;v = b[C >> 1] | 0;h = 11688;i = 0;j = 2147483647;k = 0;while (1) {
      w = m - (a[h >> 0] << 5) << 16 >> 16;w = S(w, w) | 0;w = ((S(w & 32767, n) | 0) >> 15) + (S(w << 1 >> 16, n) | 0) | 0;x = o - (a[h + 1 >> 0] << 5) << 16 >> 16;x = S(x, x) | 0;x = ((S(x & 32767, p) | 0) >> 15) + w + (S(x << 1 >> 16, p) | 0) | 0;w = q - (a[h + 2 >> 0] << 5) << 16 >> 16;w = S(w, w) | 0;w = ((S(w & 32767, r) | 0) >> 15) + x + (S(w << 1 >> 16, r) | 0) | 0;x = s - (a[h + 3 >> 0] << 5) << 16 >> 16;x = S(x, x) | 0;x = ((S(x & 32767, t) | 0) >> 15) + w + (S(x << 1 >> 16, t) | 0) | 0;w = u - (a[h + 4 >> 0] << 5) << 16 >> 16;w = S(w, w) | 0;w = ((S(w & 32767, v) | 0) >> 15) + x + (S(w << 1 >> 16, v) | 0) | 0;x = (w | 0) < (j | 0);i = x ? k : i;k = k + 1 | 0;if ((k | 0) == 64) break;else {
        h = h + 5 | 0;j = x ? w : j;
      }
    }h = i * 5 | 0;b[H >> 1] = (e[H >> 1] | 0) - (a[11688 + h >> 0] << 5);b[D >> 1] = (e[D >> 1] | 0) - (a[11688 + (h + 1) >> 0] << 5);b[E >> 1] = (e[E >> 1] | 0) - (a[11688 + (h + 2) >> 0] << 5);b[F >> 1] = (e[F >> 1] | 0) - (a[11688 + (h + 3) >> 0] << 5);b[G >> 1] = (e[G >> 1] | 0) - (a[11688 + (h + 4) >> 0] << 5);Qb(g, i, 6);h = b[H >> 1] << 1 & 65535;b[H >> 1] = h;t = d + 12 | 0;u = b[t >> 1] << 1;b[t >> 1] = u;t = d + 14 | 0;v = b[t >> 1] << 1;b[t >> 1] = v;t = d + 16 | 0;w = b[t >> 1] << 1;b[t >> 1] = w;t = d + 18 | 0;x = b[t >> 1] << 1;b[t >> 1] = x;t = b[y >> 1] | 0;s = b[z >> 1] | 0;r = b[A >> 1] | 0;q = b[B >> 1] | 0;p = b[C >> 1] | 0;n = 12008;j = 0;o = 2147483647;i = 0;while (1) {
      k = (h & 65535) - (a[n >> 0] << 5) << 16 >> 16;k = S(k, k) | 0;k = ((S(k & 32767, t) | 0) >> 15) + (S(k << 1 >> 16, t) | 0) | 0;m = u - (a[n + 1 >> 0] << 5) << 16 >> 16;m = S(m, m) | 0;m = ((S(m & 32764, s) | 0) >> 15) + k + (S(m << 1 >> 16, s) | 0) | 0;k = v - (a[n + 2 >> 0] << 5) << 16 >> 16;k = S(k, k) | 0;k = ((S(k & 32764, r) | 0) >> 15) + m + (S(k << 1 >> 16, r) | 0) | 0;m = w - (a[n + 3 >> 0] << 5) << 16 >> 16;m = S(m, m) | 0;m = ((S(m & 32764, q) | 0) >> 15) + k + (S(m << 1 >> 16, q) | 0) | 0;k = x - (a[n + 4 >> 0] << 5) << 16 >> 16;k = S(k, k) | 0;k = ((S(k & 32764, p) | 0) >> 15) + m + (S(k << 1 >> 16, p) | 0) | 0;m = (k | 0) < (o | 0);h = m ? i : j;i = i + 1 | 0;if ((i | 0) == 64) break;n = n + 5 | 0;j = h;o = m ? k : o;h = b[H >> 1] | 0;
    }C = h * 5 | 0;b[H >> 1] = (e[H >> 1] | 0) - (a[12008 + C >> 0] << 5);b[D >> 1] = (e[D >> 1] | 0) - (a[12008 + (C + 1) >> 0] << 5);b[E >> 1] = (e[E >> 1] | 0) - (a[12008 + (C + 2) >> 0] << 5);b[F >> 1] = (e[F >> 1] | 0) - (a[12008 + (C + 3) >> 0] << 5);b[G >> 1] = (e[G >> 1] | 0) - (a[12008 + (C + 4) >> 0] << 5);Qb(g, h, 6);if (I) h = 0;else {
      l = J;return;
    }do {
      g = d + (h << 1) | 0;b[g >> 1] = ((b[g >> 1] | 0) + 2 | 0) >>> 2;h = h + 1 | 0;
    } while ((h | 0) != (f | 0));if (I) h = 0;else {
      l = J;return;
    }do {
      I = d + (h << 1) | 0;b[I >> 1] = (e[c + (h << 1) >> 1] | 0) - (e[I >> 1] | 0);h = h + 1 | 0;
    } while ((h | 0) != (f | 0));l = J;return;
  }function hc(c, d, f) {
    c = c | 0;d = d | 0;f = f | 0;var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0;if ((d | 0) > 0) {
      g = 0;do {
        h = g;g = g + 1 | 0;b[c + (h << 1) >> 1] = g << 11;
      } while ((g | 0) != (d | 0));
    }l = (Rb(f, 6) | 0) * 10 | 0;b[c >> 1] = (a[10408 + l >> 0] << 5) + (e[c >> 1] | 0);o = c + 2 | 0;b[o >> 1] = (a[10408 + (l | 1) >> 0] << 5) + (e[o >> 1] | 0);n = c + 4 | 0;b[n >> 1] = (a[10408 + (l + 2) >> 0] << 5) + (e[n >> 1] | 0);m = c + 6 | 0;b[m >> 1] = (a[10408 + (l + 3) >> 0] << 5) + (e[m >> 1] | 0);k = c + 8 | 0;b[k >> 1] = (a[10408 + (l + 4) >> 0] << 5) + (e[k >> 1] | 0);j = c + 10 | 0;b[j >> 1] = (a[10408 + (l + 5) >> 0] << 5) + (e[j >> 1] | 0);i = c + 12 | 0;b[i >> 1] = (a[10408 + (l + 6) >> 0] << 5) + (e[i >> 1] | 0);g = c + 14 | 0;b[g >> 1] = (a[10408 + (l + 7) >> 0] << 5) + (e[g >> 1] | 0);d = c + 16 | 0;b[d >> 1] = (a[10408 + (l + 8) >> 0] << 5) + (e[d >> 1] | 0);h = c + 18 | 0;b[h >> 1] = (a[10408 + (l + 9) >> 0] << 5) + (e[h >> 1] | 0);l = (Rb(f, 6) | 0) * 5 | 0;b[c >> 1] = (a[11048 + l >> 0] << 4) + (e[c >> 1] | 0);b[o >> 1] = (a[11048 + (l + 1) >> 0] << 4) + (e[o >> 1] | 0);b[n >> 1] = (a[11048 + (l + 2) >> 0] << 4) + (e[n >> 1] | 0);b[m >> 1] = (a[11048 + (l + 3) >> 0] << 4) + (e[m >> 1] | 0);b[k >> 1] = (a[11048 + (l + 4) >> 0] << 4) + (e[k >> 1] | 0);l = (Rb(f, 6) | 0) * 5 | 0;b[c >> 1] = (a[11368 + l >> 0] << 3) + (e[c >> 1] | 0);b[o >> 1] = (a[11368 + (l + 1) >> 0] << 3) + (e[o >> 1] | 0);b[n >> 1] = (a[11368 + (l + 2) >> 0] << 3) + (e[n >> 1] | 0);b[m >> 1] = (a[11368 + (l + 3) >> 0] << 3) + (e[m >> 1] | 0);b[k >> 1] = (a[11368 + (l + 4) >> 0] << 3) + (e[k >> 1] | 0);c = (Rb(f, 6) | 0) * 5 | 0;b[j >> 1] = (a[11688 + c >> 0] << 4) + (e[j >> 1] | 0);b[i >> 1] = (a[11688 + (c + 1) >> 0] << 4) + (e[i >> 1] | 0);b[g >> 1] = (a[11688 + (c + 2) >> 0] << 4) + (e[g >> 1] | 0);b[d >> 1] = (a[11688 + (c + 3) >> 0] << 4) + (e[d >> 1] | 0);b[h >> 1] = (a[11688 + (c + 4) >> 0] << 4) + (e[h >> 1] | 0);f = (Rb(f, 6) | 0) * 5 | 0;b[j >> 1] = (a[12008 + f >> 0] << 3) + (e[j >> 1] | 0);b[i >> 1] = (a[12008 + (f + 1) >> 0] << 3) + (e[i >> 1] | 0);b[g >> 1] = (a[12008 + (f + 2) >> 0] << 3) + (e[g >> 1] | 0);b[d >> 1] = (a[12008 + (f + 3) >> 0] << 3) + (e[d >> 1] | 0);b[h >> 1] = (a[12008 + (f + 4) >> 0] << 3) + (e[h >> 1] | 0);return;
  }function ic(c, d, f, g) {
    c = c | 0;d = d | 0;f = f | 0;g = g | 0;var h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        E = 0,
        F = 0;F = l;l = l + 32 | 0;D = F;E = (f | 0) > 0;if (E) {
      h = 0;do {
        b[d + (h << 1) >> 1] = b[c + (h << 1) >> 1] | 0;h = h + 1 | 0;
      } while ((h | 0) != (f | 0));if (E) {
        m = f + -1 | 0;k = 0;do {
          h = b[d + (k << 1) >> 1] | 0;n = h << 16 >> 16;if (k) h = n - (e[d + (k + -1 << 1) >> 1] | 0) & 65535;i = k;k = k + 1 | 0;if ((i | 0) == (m | 0)) j = 25736;else j = e[d + (k << 1) >> 1] | 0;C = j - n | 0;b[D + (i << 1) >> 1] = 81920 / (((((C << 16 >> 16 | 0) < (h << 16 >> 16 | 0) ? C & 65535 : h) & 65535) << 16) + 19660800 >> 16 | 0) | 0;
        } while ((k | 0) != (f | 0));if (E) {
          h = 0;do {
            C = d + (h << 1) | 0;h = h + 1 | 0;b[C >> 1] = (e[C >> 1] | 0) - (h << 11);
          } while ((h | 0) != (f | 0));if (E) {
            j = 10408;o = 0;k = 2147483647;m = 0;while (1) {
              n = 0;h = 0;i = j;while (1) {
                C = (e[d + (h << 1) >> 1] | 0) - (a[i >> 0] << 5) << 16 >> 16;n = (S(C, C) | 0) + n | 0;h = h + 1 | 0;if ((h | 0) == (f | 0)) break;else i = i + 1 | 0;
              }h = (n | 0) < (k | 0);o = h ? m : o;m = m + 1 | 0;if ((m | 0) == 64) break;else {
                j = j + f | 0;k = h ? n : k;
              }
            }i = S(o, f) | 0;h = 0;do {
              C = d + (h << 1) | 0;b[C >> 1] = (e[C >> 1] | 0) - (a[10408 + (h + i) >> 0] << 5);h = h + 1 | 0;
            } while ((h | 0) != (f | 0));Qb(g, o, 6);if (E) {
              h = 0;do {
                C = d + (h << 1) | 0;b[C >> 1] = b[C >> 1] << 1;h = h + 1 | 0;
              } while ((h | 0) != (f | 0));
            }
          } else p = 18;
        } else p = 18;
      } else p = 18;
    } else p = 18;if ((p | 0) == 18) Qb(g, 0, 6);m = d + 2 | 0;n = d + 4 | 0;o = d + 6 | 0;p = d + 8 | 0;s = e[d >> 1] | 0;t = b[D >> 1] | 0;u = e[m >> 1] | 0;v = b[D + 2 >> 1] | 0;w = e[n >> 1] | 0;x = b[D + 4 >> 1] | 0;y = e[o >> 1] | 0;z = b[D + 6 >> 1] | 0;A = e[p >> 1] | 0;B = b[D + 8 >> 1] | 0;h = 11048;i = 0;j = 2147483647;k = 0;while (1) {
      q = s - (a[h >> 0] << 5) << 16 >> 16;q = S(q, q) | 0;q = ((S(q & 32767, t) | 0) >> 15) + (S(q << 1 >> 16, t) | 0) | 0;r = u - (a[h + 1 >> 0] << 5) << 16 >> 16;r = S(r, r) | 0;r = ((S(r & 32767, v) | 0) >> 15) + q + (S(r << 1 >> 16, v) | 0) | 0;q = w - (a[h + 2 >> 0] << 5) << 16 >> 16;q = S(q, q) | 0;q = ((S(q & 32767, x) | 0) >> 15) + r + (S(q << 1 >> 16, x) | 0) | 0;r = y - (a[h + 3 >> 0] << 5) << 16 >> 16;r = S(r, r) | 0;r = ((S(r & 32767, z) | 0) >> 15) + q + (S(r << 1 >> 16, z) | 0) | 0;q = A - (a[h + 4 >> 0] << 5) << 16 >> 16;q = S(q, q) | 0;q = ((S(q & 32767, B) | 0) >> 15) + r + (S(q << 1 >> 16, B) | 0) | 0;r = (q | 0) < (j | 0);i = r ? k : i;k = k + 1 | 0;if ((k | 0) == 64) break;else {
        h = h + 5 | 0;j = r ? q : j;
      }
    }t = i * 5 | 0;b[d >> 1] = (e[d >> 1] | 0) - (a[11048 + t >> 0] << 5);b[m >> 1] = (e[m >> 1] | 0) - (a[11048 + (t + 1) >> 0] << 5);b[n >> 1] = (e[n >> 1] | 0) - (a[11048 + (t + 2) >> 0] << 5);b[o >> 1] = (e[o >> 1] | 0) - (a[11048 + (t + 3) >> 0] << 5);b[p >> 1] = (e[p >> 1] | 0) - (a[11048 + (t + 4) >> 0] << 5);Qb(g, i, 6);t = d + 10 | 0;p = d + 12 | 0;q = d + 14 | 0;r = d + 16 | 0;s = d + 18 | 0;u = e[t >> 1] | 0;v = b[D + 10 >> 1] | 0;w = e[p >> 1] | 0;x = b[D + 12 >> 1] | 0;y = e[q >> 1] | 0;z = b[D + 14 >> 1] | 0;A = e[r >> 1] | 0;B = b[D + 16 >> 1] | 0;C = e[s >> 1] | 0;m = b[D + 18 >> 1] | 0;h = 11688;i = 0;j = 2147483647;k = 0;while (1) {
      n = u - (a[h >> 0] << 5) << 16 >> 16;n = S(n, n) | 0;n = ((S(n & 32767, v) | 0) >> 15) + (S(n << 1 >> 16, v) | 0) | 0;o = w - (a[h + 1 >> 0] << 5) << 16 >> 16;o = S(o, o) | 0;o = ((S(o & 32767, x) | 0) >> 15) + n + (S(o << 1 >> 16, x) | 0) | 0;n = y - (a[h + 2 >> 0] << 5) << 16 >> 16;n = S(n, n) | 0;n = ((S(n & 32767, z) | 0) >> 15) + o + (S(n << 1 >> 16, z) | 0) | 0;o = A - (a[h + 3 >> 0] << 5) << 16 >> 16;o = S(o, o) | 0;o = ((S(o & 32767, B) | 0) >> 15) + n + (S(o << 1 >> 16, B) | 0) | 0;n = C - (a[h + 4 >> 0] << 5) << 16 >> 16;n = S(n, n) | 0;n = ((S(n & 32767, m) | 0) >> 15) + o + (S(n << 1 >> 16, m) | 0) | 0;o = (n | 0) < (j | 0);i = o ? k : i;k = k + 1 | 0;if ((k | 0) == 64) break;else {
        h = h + 5 | 0;j = o ? n : j;
      }
    }D = i * 5 | 0;b[t >> 1] = (e[t >> 1] | 0) - (a[11688 + D >> 0] << 5);b[p >> 1] = (e[p >> 1] | 0) - (a[11688 + (D + 1) >> 0] << 5);b[q >> 1] = (e[q >> 1] | 0) - (a[11688 + (D + 2) >> 0] << 5);b[r >> 1] = (e[r >> 1] | 0) - (a[11688 + (D + 3) >> 0] << 5);b[s >> 1] = (e[s >> 1] | 0) - (a[11688 + (D + 4) >> 0] << 5);Qb(g, i, 6);if (E) h = 0;else {
      l = F;return;
    }do {
      g = d + (h << 1) | 0;b[g >> 1] = ((b[g >> 1] | 0) + 1 | 0) >>> 1;h = h + 1 | 0;
    } while ((h | 0) != (f | 0));if (E) h = 0;else {
      l = F;return;
    }do {
      E = d + (h << 1) | 0;b[E >> 1] = (e[c + (h << 1) >> 1] | 0) - (e[E >> 1] | 0);h = h + 1 | 0;
    } while ((h | 0) != (f | 0));l = F;return;
  }function jc(c, d, f) {
    c = c | 0;d = d | 0;f = f | 0;var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0;if ((d | 0) > 0) {
      g = 0;do {
        h = g;g = g + 1 | 0;b[c + (h << 1) >> 1] = g << 11;
      } while ((g | 0) != (d | 0));
    }l = (Rb(f, 6) | 0) * 10 | 0;b[c >> 1] = (e[c >> 1] | 0) + (a[10408 + l >> 0] << 5);o = c + 2 | 0;b[o >> 1] = (e[o >> 1] | 0) + (a[10408 + (l | 1) >> 0] << 5);n = c + 4 | 0;b[n >> 1] = (e[n >> 1] | 0) + (a[10408 + (l + 2) >> 0] << 5);m = c + 6 | 0;b[m >> 1] = (e[m >> 1] | 0) + (a[10408 + (l + 3) >> 0] << 5);k = c + 8 | 0;b[k >> 1] = (e[k >> 1] | 0) + (a[10408 + (l + 4) >> 0] << 5);j = c + 10 | 0;b[j >> 1] = (e[j >> 1] | 0) + (a[10408 + (l + 5) >> 0] << 5);i = c + 12 | 0;b[i >> 1] = (e[i >> 1] | 0) + (a[10408 + (l + 6) >> 0] << 5);g = c + 14 | 0;b[g >> 1] = (e[g >> 1] | 0) + (a[10408 + (l + 7) >> 0] << 5);d = c + 16 | 0;b[d >> 1] = (e[d >> 1] | 0) + (a[10408 + (l + 8) >> 0] << 5);h = c + 18 | 0;b[h >> 1] = (e[h >> 1] | 0) + (a[10408 + (l + 9) >> 0] << 5);l = (Rb(f, 6) | 0) * 5 | 0;b[c >> 1] = (e[c >> 1] | 0) + (a[11048 + l >> 0] << 4);b[o >> 1] = (e[o >> 1] | 0) + (a[11048 + (l + 1) >> 0] << 4);b[n >> 1] = (e[n >> 1] | 0) + (a[11048 + (l + 2) >> 0] << 4);b[m >> 1] = (e[m >> 1] | 0) + (a[11048 + (l + 3) >> 0] << 4);b[k >> 1] = (e[k >> 1] | 0) + (a[11048 + (l + 4) >> 0] << 4);f = (Rb(f, 6) | 0) * 5 | 0;b[j >> 1] = (e[j >> 1] | 0) + (a[11688 + f >> 0] << 4);b[i >> 1] = (e[i >> 1] | 0) + (a[11688 + (f + 1) >> 0] << 4);b[g >> 1] = (e[g >> 1] | 0) + (a[11688 + (f + 2) >> 0] << 4);b[d >> 1] = (e[d >> 1] | 0) + (a[11688 + (f + 3) >> 0] << 4);b[h >> 1] = (e[h >> 1] | 0) + (a[11688 + (f + 4) >> 0] << 4);return;
  }function kc(c, d, f, g) {
    c = c | 0;d = d | 0;f = f | 0;g = g | 0;var h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0;s = l;l = l + 32 | 0;q = s;r = (f | 0) > 0;if (r) {
      h = 0;do {
        b[d + (h << 1) >> 1] = b[c + (h << 1) >> 1] | 0;h = h + 1 | 0;
      } while ((h | 0) != (f | 0));if (r) {
        m = f + -1 | 0;k = 0;do {
          h = b[d + (k << 1) >> 1] | 0;n = h << 16 >> 16;if (k) h = n - (e[d + (k + -1 << 1) >> 1] | 0) & 65535;i = k;k = k + 1 | 0;if ((i | 0) == (m | 0)) j = 25736;else j = e[d + (k << 1) >> 1] | 0;o = j - n | 0;b[q + (i << 1) >> 1] = 81920 / (((((o << 16 >> 16 | 0) < (h << 16 >> 16 | 0) ? o & 65535 : h) & 65535) << 16) + 19660800 >> 16 | 0) | 0;
        } while ((k | 0) != (f | 0));if (r) {
          h = 0;do {
            o = d + (h << 1) | 0;b[o >> 1] = (e[o >> 1] | 0) - (((S(h << 16 >> 16, 167772160) | 0) + 402653184 | 0) >>> 16);h = h + 1 | 0;
          } while ((h | 0) != (f | 0));if (r) {
            j = 6256;o = 0;k = 2147483647;m = 0;while (1) {
              n = 0;h = 0;i = j;while (1) {
                t = (e[d + (h << 1) >> 1] | 0) - (a[i >> 0] << 5) << 16 >> 16;n = (S(t, t) | 0) + n | 0;h = h + 1 | 0;if ((h | 0) == (f | 0)) break;else i = i + 1 | 0;
              }h = (n | 0) < (k | 0);o = h ? m : o;m = m + 1 | 0;if ((m | 0) == 64) break;else {
                j = j + f | 0;k = h ? n : k;
              }
            }i = S(o, f) | 0;h = 0;do {
              t = d + (h << 1) | 0;b[t >> 1] = (e[t >> 1] | 0) - (a[6256 + (h + i) >> 0] << 5);h = h + 1 | 0;
            } while ((h | 0) != (f | 0));Qb(g, o, 6);if (r) {
              h = 0;do {
                t = d + (h << 1) | 0;b[t >> 1] = b[t >> 1] << 1;h = h + 1 | 0;
              } while ((h | 0) != (f | 0));if (r) {
                j = 6768;o = 0;k = 2147483647;m = 0;while (1) {
                  n = 0;h = 0;i = j;while (1) {
                    t = b[q + (h << 1) >> 1] | 0;p = (e[d + (h << 1) >> 1] | 0) - (a[i >> 0] << 5) << 16 >> 16;p = S(p, p) | 0;n = ((S(p & 32767, t) | 0) >> 15) + n + (S(p << 1 >> 16, t) | 0) | 0;h = h + 1 | 0;if ((h | 0) == (f | 0)) break;else i = i + 1 | 0;
                  }h = (n | 0) < (k | 0);o = h ? m : o;m = m + 1 | 0;if ((m | 0) == 64) break;else {
                    j = j + f | 0;k = h ? n : k;
                  }
                }i = S(o, f) | 0;h = 0;do {
                  t = d + (h << 1) | 0;b[t >> 1] = (e[t >> 1] | 0) - (a[6768 + (h + i) >> 0] << 5);h = h + 1 | 0;
                } while ((h | 0) != (f | 0));Qb(g, o, 6);if (r) h = 0;else {
                  l = s;return;
                }do {
                  t = d + (h << 1) | 0;b[t >> 1] = ((b[t >> 1] | 0) + 1 | 0) >>> 1;h = h + 1 | 0;
                } while ((h | 0) != (f | 0));if (r) h = 0;else {
                  l = s;return;
                }do {
                  t = d + (h << 1) | 0;b[t >> 1] = (e[c + (h << 1) >> 1] | 0) - (e[t >> 1] | 0);h = h + 1 | 0;
                } while ((h | 0) != (f | 0));l = s;return;
              }
            }
          } else p = 18;
        } else p = 18;
      } else p = 18;
    } else p = 18;if ((p | 0) == 18) Qb(g, 0, 6);Qb(g, 0, 6);l = s;return;
  }function lc(c, d, f) {
    c = c | 0;d = d | 0;f = f | 0;var g = 0,
        h = 0,
        i = 0,
        j = 0;i = (d | 0) > 0;if (i) {
      g = 0;do {
        b[c + (g << 1) >> 1] = ((S(g << 16 >> 16, 167772160) | 0) >>> 16) + 6144;g = g + 1 | 0;
      } while ((g | 0) != (d | 0));g = Rb(f, 6) | 0;if (i) {
        h = S(g, d) | 0;g = 0;do {
          j = c + (g << 1) | 0;b[j >> 1] = (e[j >> 1] | 0) + (a[6256 + (g + h) >> 0] << 5);g = g + 1 | 0;
        } while ((g | 0) != (d | 0));g = Rb(f, 6) | 0;if (!i) return;h = S(g, d) | 0;g = 0;do {
          j = c + (g << 1) | 0;b[j >> 1] = (e[j >> 1] | 0) + (a[6768 + (g + h) >> 0] << 4);g = g + 1 | 0;
        } while ((g | 0) != (d | 0));return;
      }
    } else Rb(f, 6) | 0;Rb(f, 6) | 0;return;
  }function mc(a) {
    a = a | 0;var d = 0,
        e = 0,
        f = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0,
        n = 0;j = l;l = l + 16 | 0;d = j;i = Gd(168, 1) | 0;if (!i) {
      i = 0;l = j;return i | 0;
    }c[i >> 2] = a;m = c[a >> 2] | 0;a = tb(c[m >> 2] | 0) | 0;h = i + 4 | 0;c[h >> 2] = a;zb(a, 106, i + 44 | 0) | 0;a = c[m + 4 >> 2] | 0;c[i + 8 >> 2] = a << 1;e = i + 12 | 0;c[e >> 2] = a;n = c[m + 8 >> 2] | 0;c[i + 16 >> 2] = n;f = i + 20 | 0;c[f >> 2] = (a | 0) / (n | 0) | 0;k = i + 24 | 0;c[k >> 2] = n + a;a = i + 28 | 0;c[a >> 2] = c[m + 12 >> 2];c[i + 144 >> 2] = 1;c[i + 148 >> 2] = m + 24;n = c[m + 56 >> 2] | 0;c[i + 152 >> 2] = n;c[i + 156 >> 2] = n;c[d >> 2] = 9;zb(c[h >> 2] | 0, 4, d) | 0;c[d >> 2] = 1;zb(c[h >> 2] | 0, 105, d) | 0;b[i + 36 >> 1] = b[m + 20 >> 1] | 0;b[i + 38 >> 1] = b[m + 16 >> 1] | 0;b[i + 40 >> 1] = b[m + 18 >> 1] | 0;c[i + 32 >> 2] = 1;c[i + 48 >> 2] = Gd((c[k >> 2] | 0) - (c[e >> 2] | 0) << 1, 1) | 0;c[i + 52 >> 2] = Gd(128, 1) | 0;c[i + 56 >> 2] = Gd(128, 1) | 0;c[i + 60 >> 2] = 2976;c[i + 64 >> 2] = 2954;d = c[a >> 2] | 0;a = d << 1;e = Gd(a, 1) | 0;c[i + 68 >> 2] = e;c[i + 72 >> 2] = Gd(a, 1) | 0;c[i + 76 >> 2] = Gd(a, 1) | 0;f = c[f >> 2] | 0;c[i + 92 >> 2] = Gd(f << 2, 1) | 0;c[i + 96 >> 2] = Gd(f << 1, 1) | 0;c[i + 100 >> 2] = 0;f = d << 2;c[i + 80 >> 2] = Gd(f, 1) | 0;c[i + 84 >> 2] = Gd(f, 1) | 0;c[i + 88 >> 2] = Gd(f, 1) | 0;if ((d | 0) > 0) {
      f = d + 1 | 0;a = 0;do {
        n = a;a = a + 1 | 0;b[e + (n << 1) >> 1] = ((a << 16 >> 16) * 25736 | 0) / (f | 0) | 0;
      } while ((a | 0) < (d | 0));
    }g[i + 104 >> 2] = 8.0;c[i + 108 >> 2] = 0;c[i + 112 >> 2] = 0;c[i + 116 >> 2] = 2e4;c[i + 136 >> 2] = 0;c[i + 120 >> 2] = 0;g[i + 140 >> 2] = 0.0;c[i + 160 >> 2] = 2;n = i + 164 | 0;zb(c[h >> 2] | 0, 25, n) | 0;c[n >> 2] = c[n >> 2] << 1;n = i;l = j;return n | 0;
  }function nc(a) {
    a = a | 0;vb(c[a + 4 >> 2] | 0);Fd(c[a + 48 >> 2] | 0);Fd(c[a + 52 >> 2] | 0);Fd(c[a + 56 >> 2] | 0);Fd(c[a + 68 >> 2] | 0);Fd(c[a + 72 >> 2] | 0);Fd(c[a + 76 >> 2] | 0);Fd(c[a + 92 >> 2] | 0);Fd(c[a + 96 >> 2] | 0);Fd(c[a + 80 >> 2] | 0);Fd(c[a + 84 >> 2] | 0);Fd(c[a + 88 >> 2] | 0);Fd(a);return;
  }
  function oc(a, d, f) {
    a = a | 0;d = d | 0;f = f | 0;var h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0.0,
        n = 0.0,
        o = 0,
        p = 0,
        q = 0,
        r = 0.0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        F = 0,
        G = 0,
        H = 0,
        I = 0,
        J = 0,
        K = 0,
        L = 0,
        M = 0,
        N = 0,
        O = 0,
        P = 0,
        R = 0,
        T = 0,
        U = 0,
        V = 0,
        W = 0,
        X = 0,
        Y = 0,
        Z = 0,
        _ = 0,
        $ = 0,
        aa = 0,
        ba = 0,
        ca = 0,
        da = 0,
        ea = 0,
        fa = 0,
        ga = 0,
        ha = 0;ga = l;l = l + 16 | 0;J = ga + 8 | 0;A = ga + 4 | 0;B = ga;h = c[a + 44 >> 2] | 0;y = c[c[a >> 2] >> 2] | 0;I = a + 12 | 0;G = c[I >> 2] | 0;i = d + (G << 1) | 0;z = a + 8 | 0;fb(d, 2730, d, i, c[z >> 2] | 0, 64, c[a + 52 >> 2] | 0, h);x = a + 108 | 0;if ((c[x >> 2] | 0) == 0 ? (c[a + 136 >> 2] | 0) == 0 : 0) {
      u = 0;v = 0;
    } else {
      u = Za(d, c[I >> 2] | 0) | 0;v = Za(i, c[I >> 2] | 0) | 0;
    }$ = a + 20 | 0;_ = c[$ >> 2] << 1;K = h + (h & 1) + _ | 0;_ = K + (0 - _) | 0;w = a + 4 | 0;zb(c[w >> 2] | 0, 104, _) | 0;xb(c[w >> 2] | 0, d, f) | 0;j = a + 24 | 0;D = c[j >> 2] | 0;F = c[I >> 2] | 0;V = D - F | 0;fa = i + (0 - V << 1) | 0;U = a + 48 | 0;Zd(fa | 0, c[U >> 2] | 0, V << 1 | 0) | 0;V = c[I >> 2] | 0;Zd(c[U >> 2] | 0, fa + (V << 1) | 0, (c[j >> 2] | 0) - V << 1 | 0) | 0;V = c[$ >> 2] | 0;U = V << 2;K = K + (0 - K & 3) + U | 0;U = K + (0 - U) | 0;V = V << 1;K = K + (K & 1) + V | 0;V = K + (0 - V) | 0;zb(c[w >> 2] | 0, 100, U) | 0;zb(c[w >> 2] | 0, 101, V) | 0;zb(c[w >> 2] | 0, 9, J) | 0;c[J >> 2] = (c[J >> 2] | 0) == 0 & 1;da = a + 28 | 0;o = c[da >> 2] | 0;p = o << 1;K = K + (K & 1) + p | 0;R = 0 - p | 0;q = K + R | 0;K = K + (K & 1) + p | 0;W = K + R | 0;K = K + (K & 1) + p | 0;X = K + R | 0;K = K + (K & 1) + p | 0;Y = K + R | 0;K = K + (K & 1) + p | 0;ca = K + R | 0;K = K + (K & 1) + p | 0;ea = K + R | 0;K = K + (K & 1) + p | 0;P = K + R | 0;K = K + (K & 1) + p | 0;R = K + R | 0;K = K + (K & 1) + (p + 2) | 0;p = K + (-2 - p) | 0;j = c[j >> 2] | 0;k = j << 1;K = K + (K & 1) + k | 0;k = K + (0 - k) | 0;T = a + 16 | 0;h = (j | 0) > 0;if ((c[T >> 2] | 0) == 80) {
      if (h) {
        i = c[a + 60 >> 2] | 0;h = 0;do {
          b[k + (h << 1) >> 1] = (S(b[i + (h >> 1 << 1) >> 1] | 0, b[fa + (h << 1) >> 1] | 0) | 0) >>> 14;h = h + 1 | 0;
        } while ((h | 0) != (j | 0));
      }
    } else if (h) {
      i = c[a + 60 >> 2] | 0;h = 0;do {
        b[k + (h << 1) >> 1] = (S(b[i + (h << 1) >> 1] | 0, b[fa + (h << 1) >> 1] | 0) | 0) >>> 14;h = h + 1 | 0;
      } while ((h | 0) < (j | 0));
    }Wb(k, p, o + 1 | 0, j);h = b[p >> 1] | 0;h = ((S(b[a + 36 >> 1] | 0, h) | 0) >>> 15) + h | 0;b[p >> 1] = h;i = c[da >> 2] | 0;if ((i | 0) >= 0 ? (s = c[a + 64 >> 2] | 0, b[p >> 1] = (S(b[s >> 1] | 0, h << 16 >> 16) | 0) >>> 14, i | 0) : 0) {
      h = 1;while (1) {
        b[p + (h << 1) >> 1] = (S(b[s + (h << 1) >> 1] | 0, b[p + (h << 1) >> 1] | 0) | 0) >>> 14;if ((h | 0) < (i | 0)) h = h + 1 | 0;else break;
      }
    }Vb(q, p, i) | 0;O = jb(q, c[da >> 2] | 0, ca, 10, 6553, K) | 0;h = c[da >> 2] | 0;if ((O | 0) != (h | 0) ? (O = jb(q, h, ca, 10, 1638, K) | 0, t = c[da >> 2] | 0, (O | 0) != (t | 0) & (t | 0) > 0) : 0) {
      i = c[a + 68 >> 2] | 0;h = 0;do {
        b[ca + (h << 1) >> 1] = b[i + (h << 1) >> 1] | 0;h = h + 1 | 0;
      } while ((h | 0) < (t | 0));
    }if (!(c[x >> 2] | 0)) {
      if (!((c[a + 136 >> 2] | 0) == 0 | (c[J >> 2] | 0) != 0)) Z = 21;
    } else if (!(c[J >> 2] | 0)) Z = 21;do {
      if ((Z | 0) == 21) {
        s = a + 120 | 0;if (c[s >> 2] | 0) {
          m = +g[a + 124 >> 2];if (+g[a + 128 >> 2] * m > 0.0) {
            m = m * -1.0e-05 / (+g[a + 132 >> 2] + 1.0);m = m > .1 ? .10000000149011612 : m;if (m < -.1) m = -.10000000149011612;
          } else m = 0.0;O = a + 104 | 0;r = m + +g[O >> 2];r = r > 10.0 ? 10.0 : r;g[O >> 2] = r < 0.0 ? 0.0 : r;
        }m = +Q(+((+(v << 16 >> 16) + 1.0) / (+(u << 16 >> 16) + 1.0))) * 2.0;i = a + 140 | 0;zb(c[w >> 2] | 0, 29, i) | 0;m = m < -4.0 ? -4.0 : m;if (!(c[x >> 2] | 0)) {
          if (+g[i >> 2] < 2.0) h = 1;else h = c[a + 156 >> 2] | 0;c[a + 152 >> 2] = h;break;
        }h = (c[y + 152 >> 2] | 0) + -1 | 0;c[A >> 2] = h;r = (m > 2.0 ? 2.0 : m) + 2.0 + +g[i >> 2];r = r < -1.0 ? -1.0 : r;g[i >> 2] = r;a: do {
          if (h | 0) {
            q = a + 164 | 0;n = +g[a + 104 >> 2];j = ~~+E(+n);k = c[y + 148 >> 2] | 0;o = a + 148 | 0;p = a + 116 | 0;m = n - +(j | 0);i = j + 1 | 0;n = +(i | 0) - n;if ((j | 0) == 10) do {
              if (r >= +g[k + (h * 44 | 0) + 40 >> 2] ? (O = S(c[(c[(c[o >> 2] | 0) + (h << 2) >> 2] | 0) + 52 >> 2] | 0, c[q >> 2] | 0) | 0, ((O | 0) / (c[z >> 2] | 0) | 0 | 0) <= (c[p >> 2] | 0)) : 0) break a;h = h + -1 | 0;c[A >> 2] = h;
            } while ((h | 0) != 0);else do {
              if (r >= m * +g[k + (h * 44 | 0) + (i << 2) >> 2] + n * +g[k + (h * 44 | 0) + (j << 2) >> 2] ? (O = S(c[(c[(c[o >> 2] | 0) + (h << 2) >> 2] | 0) + 52 >> 2] | 0, c[q >> 2] | 0) | 0, ((O | 0) / (c[z >> 2] | 0) | 0 | 0) <= (c[p >> 2] | 0)) : 0) break a;h = h + -1 | 0;c[A >> 2] = h;
            } while ((h | 0) != 0);
          }
        } while (0);zb(a, 10, A) | 0;if (c[s >> 2] | 0) {
          zb(a, 19, B) | 0;N = (c[B >> 2] | 0) - (c[s >> 2] | 0) | 0;O = a + 124 | 0;g[O >> 2] = +g[O >> 2] + +(N | 0);O = a + 128 | 0;g[O >> 2] = +g[O >> 2] * .95 + +(N | 0) * .05;O = a + 132 | 0;g[O >> 2] = +g[O >> 2] + 1.0;
        }
      }
    } while (0);do {
      if (c[a + 144 >> 2] | 0) {
        Qb(f, 1, 1);if (!(c[J >> 2] | 0)) {
          Qb(f, c[a + 152 >> 2] | 0, 3);break;
        } else {
          Qb(f, 0, 3);break;
        }
      }
    } while (0);if ((c[J >> 2] | 0) == 0 ? (aa = a + 148 | 0, ba = a + 152 | 0, C = c[(c[aa >> 2] | 0) + (c[ba >> 2] << 2) >> 2] | 0, C | 0) : 0) {
      Ha[c[C + 16 >> 2] & 3](ca, ea, c[da >> 2] | 0, f);O = a + 32 | 0;k = c[da >> 2] | 0;if (c[O >> 2] | 0 ? (H = (k | 0) > 0, H) : 0) {
        i = c[a + 68 >> 2] | 0;h = 0;do {
          b[i + (h << 1) >> 1] = b[ca + (h << 1) >> 1] | 0;h = h + 1 | 0;
        } while ((h | 0) < (k | 0));if (H) {
          i = c[a + 72 >> 2] | 0;h = 0;do {
            b[i + (h << 1) >> 1] = b[ea + (h << 1) >> 1] | 0;h = h + 1 | 0;
          } while ((h | 0) != (k | 0));
        }
      }y = k << 2;o = K + (0 - K & 3) + y | 0;y = o + (0 - y) | 0;j = c[T >> 2] | 0;i = j << 1;o = o + (o & 1) + i | 0;B = 0 - i | 0;z = o + B | 0;A = j << 2;o = o + (0 - o & 3) + A | 0;A = o + (0 - A) | 0;i = o + (o & 1) + i | 0;B = i + B | 0;o = c[$ >> 2] | 0;if ((o | 0) > 0) {
        C = a + 68 | 0;D = a + 72 | 0;F = a + 76 | 0;d = a + 38 | 0;G = a + 40 | 0;H = a + 92 | 0;I = a + 84 | 0;J = a + 100 | 0;K = a + 96 | 0;L = a + 80 | 0;M = a + 88 | 0;N = a + 160 | 0;h = 0;while (1) {
          x = fa + ((S(j, h) | 0) << 1) | 0;q = j << 1;t = i + (i & 1) + q | 0;w = 0 - q | 0;v = t + w | 0;t = t + (t & 1) | 0;i = t + q | 0;u = i + w | 0;i = i + (i & 1) + q | 0;w = i + w | 0;mb(c[C >> 2] | 0, ca, P, k, h, o);mb(c[D >> 2] | 0, ea, R, c[da >> 2] | 0, h, c[$ >> 2] | 0);lb(P, c[da >> 2] | 0, 410);lb(R, c[da >> 2] | 0, 410);kb(P, W, c[da >> 2] | 0, i);kb(R, c[F >> 2] | 0, c[da >> 2] | 0, i);Ta(b[d >> 1] | 0, W, X, c[da >> 2] | 0);Ta(b[G >> 1] | 0, W, Y, c[da >> 2] | 0);q = (c[H >> 2] | 0) + (h << 2) | 0;c[q >> 2] = 8192;j = c[da >> 2] | 0;s = c[F >> 2] | 0;if ((j | 0) > 0) {
            k = 8192;o = 0;p = 8192;do {
              j = b[s + ((o | 1) << 1) >> 1] | 0;ha = b[s + (o << 1) >> 1] | 0;k = j + k - ha | 0;p = ha + j + p | 0;c[q >> 2] = p;o = o + 2 | 0;j = c[da >> 2] | 0;
            } while ((o | 0) < (j | 0));
          } else k = 8192;p = k + 82 | 0;p = ((p << 16 >> 17) + 10496 + (c[U + (h << 2) >> 2] << 7) | 0) / (p | 0) | 0;bb(x, s, v, c[T >> 2] | 0, j, c[I >> 2] | 0, i);j = Za(v, c[T >> 2] | 0) | 0;p = (p | 0) > 32767 ? 2147418112 : ((p | 0) > -32767 ? p : -32767) << 16;k = p >> 16;o = j << 16 >> 16;if (!(c[(c[(c[aa >> 2] | 0) + (c[ba >> 2] << 2) >> 2] | 0) + 36 >> 2] | 0)) {
            ha = (e[_ + (h << 1) >> 1] << 16) + 65536 | 0;k = Hb((((ha >> 17) + (S(o, k) | 0) | 0) / (ha >> 16 | 0) | 0) & 65535, 2858, 32) | 0;k = (k | 0) > 0 ? k : 0;Qb(f, (k | 0) < 31 ? k : 31, 5);k = c[J >> 2] | 0;if (k) b[k + (h << 1) >> 1] = j;
          } else {
            s = (e[V + (h << 1) >> 1] << 16) + 65536 | 0;q = s >> 16;s = ((s >> 17) + (S((o << 16) + 65536 >> 16, k) | 0) | 0) / (q | 0) | 0;s = Hb(((c[T >> 2] | 0) == 80 ? (((s << 16 >> 16) * 23171 | 0) + 16384 | 0) >>> 15 : s) & 65535, 2922, 16) | 0;Qb(f, s, 4);s = ((b[2922 + (s << 1) >> 1] | 0) * 28626 | 0) >>> 15;j = c[T >> 2] | 0;q = S((((((j | 0) == 80 ? (((s << 16 >> 16) * 23170 | 0) + 8192 | 0) >>> 14 : s) << 16 >> 8) + (p >> 17) | 0) / (k | 0) | 0) << 16 >> 16, q) | 0;s = q << 6;eb(c[F >> 2] | 0, X, Y, z, j, c[da >> 2] | 0, i);j = c[T >> 2] | 0;if ((j | 0) > 0) Sd(t | 0, 0, j << 1 | 0) | 0;j = c[da >> 2] | 0;if ((j | 0) > 0) {
              o = c[L >> 2] | 0;k = 0;do {
                c[y + (k << 2) >> 2] = c[o + (k << 2) >> 2];k = k + 1 | 0;j = c[da >> 2] | 0;
              } while ((k | 0) < (j | 0));
            }ab(u, c[F >> 2] | 0, u, c[T >> 2] | 0, j, y, i);j = c[da >> 2] | 0;if ((j | 0) > 0) {
              o = c[M >> 2] | 0;k = 0;do {
                c[y + (k << 2) >> 2] = c[o + (k << 2) >> 2];k = k + 1 | 0;j = c[da >> 2] | 0;
              } while ((k | 0) < (j | 0));
            }$a(u, X, Y, u, c[T >> 2] | 0, j, y, i);j = c[da >> 2] | 0;if ((j | 0) > 0) {
              o = c[M >> 2] | 0;k = 0;do {
                c[y + (k << 2) >> 2] = c[o + (k << 2) >> 2];k = k + 1 | 0;j = c[da >> 2] | 0;
              } while ((k | 0) < (j | 0));
            }$a(x, X, Y, w, c[T >> 2] | 0, j, y, i);k = c[T >> 2] | 0;if ((k | 0) > 0) {
              j = 0;do {
                b[B + (j << 1) >> 1] = (e[w + (j << 1) >> 1] | 0) - (e[u + (j << 1) >> 1] | 0);j = j + 1 | 0;
              } while ((j | 0) < (k | 0));
            }Xa(B, B, s, k);Sd(A | 0, 0, c[T >> 2] << 2 | 0) | 0;ha = c[(c[aa >> 2] | 0) + (c[ba >> 2] << 2) >> 2] | 0;Aa[c[ha + 36 >> 2] & 3](B, c[F >> 2] | 0, X, Y, c[ha + 44 >> 2] | 0, c[da >> 2] | 0, c[T >> 2] | 0, A, z, f, i, c[N >> 2] | 0, c[ha + 12 >> 2] | 0);Wa(A, A, s, c[T >> 2] | 0);do {
              if (!(c[(c[(c[aa >> 2] | 0) + (c[ba >> 2] << 2) >> 2] | 0) + 12 >> 2] | 0)) {
                j = c[T >> 2] | 0;Z = 85;
              } else {
                o = c[T >> 2] << 2;k = i + (0 - i & 3) + o | 0;p = k + (0 - o) | 0;Sd(p | 0, 0, o | 0) | 0;o = c[T >> 2] | 0;if ((o | 0) > 0) {
                  j = 0;do {
                    ha = B + (j << 1) | 0;b[ha >> 1] = (((b[ha >> 1] | 0) * 20480 | 0) + 4096 | 0) >>> 13;j = j + 1 | 0;
                  } while ((j | 0) < (o | 0));
                }j = c[(c[aa >> 2] | 0) + (c[ba >> 2] << 2) >> 2] | 0;Aa[c[j + 36 >> 2] & 3](B, c[F >> 2] | 0, X, Y, c[j + 44 >> 2] | 0, c[da >> 2] | 0, o, p, z, f, k, c[N >> 2] | 0, 0);Wa(p, p, ((((s & 32704) * 13107 | 0) + 16384 | 0) >>> 15) + ((q << 7 >> 16) * 13107 | 0) | 0, c[T >> 2] | 0);j = c[T >> 2] | 0;if ((j | 0) > 0) k = 0;else break;do {
                  j = A + (k << 2) | 0;c[j >> 2] = (c[p + (k << 2) >> 2] | 0) + (c[j >> 2] | 0);k = k + 1 | 0;j = c[T >> 2] | 0;
                } while ((k | 0) < (j | 0));Z = 85;
              }
            } while (0);do {
              if ((Z | 0) == 85) {
                Z = 0;if ((j | 0) > 0) k = 0;else break;do {
                  b[v + (k << 1) >> 1] = ((c[A + (k << 2) >> 2] | 0) + 8192 | 0) >>> 14;k = k + 1 | 0;
                } while ((k | 0) < (j | 0));
              }
            } while (0);if (c[J >> 2] | 0) {
              j = (((Ya(A, j) | 0) << 16 >> 16) * 23171 | 0) >>> 15 & 65535;b[(c[J >> 2] | 0) + (h << 1) >> 1] = j;j = c[T >> 2] | 0;
            }j = Za(v, j) | 0;
          }b[(c[K >> 2] | 0) + (h << 1) >> 1] = j;j = c[da >> 2] | 0;o = c[L >> 2] | 0;if ((j | 0) > 0) {
            k = 0;do {
              c[y + (k << 2) >> 2] = c[o + (k << 2) >> 2];k = k + 1 | 0;j = c[da >> 2] | 0;
            } while ((k | 0) < (j | 0));
          }ab(v, c[F >> 2] | 0, x, c[T >> 2] | 0, j, o, i);$a(x, X, Y, w, c[T >> 2] | 0, c[da >> 2] | 0, c[M >> 2] | 0, i);h = h + 1 | 0;o = c[$ >> 2] | 0;if ((h | 0) >= (o | 0)) break;j = c[T >> 2] | 0;k = c[da >> 2] | 0;
        }k = c[da >> 2] | 0;
      }i = (k | 0) > 0;if (i) {
        j = c[a + 68 >> 2] | 0;h = 0;do {
          b[j + (h << 1) >> 1] = b[ca + (h << 1) >> 1] | 0;h = h + 1 | 0;
        } while ((h | 0) < (k | 0));if (i) {
          i = c[a + 72 >> 2] | 0;h = 0;do {
            b[i + (h << 1) >> 1] = b[ea + (h << 1) >> 1] | 0;h = h + 1 | 0;
          } while ((h | 0) != (k | 0));
        }
      }c[O >> 2] = 0;ha = 1;l = ga;return ha | 0;
    }h = c[I >> 2] | 0;if ((h | 0) > 0) Sd(d + (F + G - D << 1) | 0, 0, h << 1 | 0) | 0;h = c[da >> 2] | 0;if ((h | 0) > 0) {
      j = c[a + 88 >> 2] | 0;i = 0;do {
        c[j + (i << 2) >> 2] = 0;i = i + 1 | 0;h = c[da >> 2] | 0;
      } while ((i | 0) < (h | 0));
    }c[a + 32 >> 2] = 1;ab(fa, c[a + 76 >> 2] | 0, fa, c[I >> 2] | 0, h, c[a + 80 >> 2] | 0, K);ha = (c[J >> 2] | 0) == 0 & 1;l = ga;return ha | 0;
  }function pc(a) {
    a = a | 0;var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;e = l;l = l + 16 | 0;b = e;d = Gd(100, 1) | 0;if (!d) {
      d = 0;l = e;return d | 0;
    }c[d >> 2] = a;h = c[a >> 2] | 0;c[d + 88 >> 2] = 1;j = ub(c[h >> 2] | 0) | 0;i = d + 4 | 0;c[i >> 2] = j;Cb(j, 106, d + 40 | 0) | 0;j = c[h + 4 >> 2] | 0;c[d + 8 >> 2] = j << 1;c[d + 12 >> 2] = j;f = c[h + 8 >> 2] | 0;g = d + 16 | 0;c[g >> 2] = f;a = d + 20 | 0;c[a >> 2] = (j | 0) / (f | 0) | 0;f = d + 24 | 0;c[f >> 2] = c[h + 12 >> 2];j = d + 32 | 0;Cb(c[i >> 2] | 0, 25, j) | 0;c[j >> 2] = c[j >> 2] << 1;c[b >> 2] = 1;Cb(c[i >> 2] | 0, 105, b) | 0;c[d + 92 >> 2] = h + 24;c[d + 96 >> 2] = c[h + 56 >> 2];c[d + 28 >> 2] = 1;c[d + 44 >> 2] = Gd(128, 1) | 0;c[d + 48 >> 2] = Gd(128, 1) | 0;c[d + 52 >> 2] = Gd(c[g >> 2] << 1, 1) | 0;b = c[f >> 2] | 0;f = b << 1;c[d + 56 >> 2] = Gd(f, 1) | 0;c[d + 60 >> 2] = Gd(f, 1) | 0;a = c[a >> 2] | 0;c[d + 68 >> 2] = Gd(a << 2, 1) | 0;c[d + 72 >> 2] = Gd(a << 1, 1) | 0;c[d + 64 >> 2] = Gd(b << 3, 1) | 0;c[d + 76 >> 2] = 0;c[d + 36 >> 2] = 0;c[d + 84 >> 2] = 1e3;l = e;return d | 0;
  }function qc(a) {
    a = a | 0;wb(c[a + 4 >> 2] | 0);Fd(c[a + 44 >> 2] | 0);Fd(c[a + 48 >> 2] | 0);Fd(c[a + 52 >> 2] | 0);Fd(c[a + 56 >> 2] | 0);Fd(c[a + 60 >> 2] | 0);Fd(c[a + 68 >> 2] | 0);Fd(c[a + 72 >> 2] | 0);Fd(c[a + 64 >> 2] | 0);Fd(a);return;
  }function rc(a, d, e) {
    a = a | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        E = 0,
        F = 0,
        G = 0,
        H = 0,
        I = 0,
        J = 0,
        K = 0,
        L = 0,
        M = 0,
        N = 0,
        O = 0,
        P = 0,
        Q = 0;O = l;l = l + 16 | 0;h = O;i = O + 4 | 0;k = c[a + 40 >> 2] | 0;m = c[c[a >> 2] >> 2] | 0;N = a + 12 | 0;L = e + (c[N >> 2] << 1) | 0;j = a + 4 | 0;Cb(c[j >> 2] | 0, 104, L) | 0;f = yb(c[j >> 2] | 0, d, e) | 0;Cb(c[j >> 2] | 0, 103, i) | 0;if (f | 0) {
      a = f;l = O;return a | 0;
    }if (!d) {
      sc(a, e, c[i >> 2] | 0, k);a = 0;l = O;return a | 0;
    }do {
      if (!(c[a + 88 >> 2] | 0)) {
        f = a + 96 | 0;I = f;f = c[f >> 2] | 0;
      } else {
        if ((Ub(d) | 0) > 0 ? Sb(d) | 0 : 0) {
          Rb(d, 1) | 0;g = Rb(d, 3) | 0;f = a + 96 | 0;c[f >> 2] = g;if (!g) {
            I = f;f = 0;break;
          }if (c[(c[a + 92 >> 2] | 0) + (g << 2) >> 2] | 0) {
            I = f;f = g;break;
          }a = c[517] | 0;c[h >> 2] = 12748;yd(a, 12904, h) | 0;a = -2;l = O;return a | 0;
        }I = a + 96 | 0;c[I >> 2] = 0;f = 0;
      }
    } while (0);H = a + 92 | 0;if (!(c[(c[H >> 2] | 0) + (f << 2) >> 2] | 0)) {
      if (c[i >> 2] | 0) {
        sc(a, e, 1, k);a = 0;l = O;return a | 0;
      }g = c[N >> 2] | 0;if ((g | 0) > 0) {
        f = 0;do {
          b[e + (g + f << 1) >> 1] = 0;f = f + 1 | 0;
        } while ((f | 0) < (g | 0));
      }c[a + 28 >> 2] = 1;M = e + (g << 1) | 0;ab(M, c[a + 60 >> 2] | 0, M, g, c[a + 24 >> 2] | 0, c[a + 64 >> 2] | 0, k);gb(e, e + (c[N >> 2] << 1) | 0, 2730, e, c[a + 8 >> 2] | 0, 64, c[a + 44 >> 2] | 0, c[a + 48 >> 2] | 0, k);a = 0;l = O;return a | 0;
    }F = a + 20 | 0;E = c[F >> 2] | 0;D = E << 2;g = k + (0 - k & 3) + D | 0;D = g + (0 - D) | 0;E = E << 1;g = g + (g & 1) + E | 0;E = g + (0 - E) | 0;Cb(c[j >> 2] | 0, 100, D) | 0;Cb(c[j >> 2] | 0, 101, E) | 0;G = a + 24 | 0;J = c[G >> 2] | 0;i = J << 1;g = g + (g & 1) + i | 0;C = 0 - i | 0;K = g + C | 0;i = g + (g & 1) + i | 0;C = i + C | 0;Ea[c[(c[(c[H >> 2] | 0) + (c[I >> 2] << 2) >> 2] | 0) + 20 >> 2] & 3](K, J, d);J = a + 28 | 0;g = c[G >> 2] | 0;if ((c[J >> 2] | 0) != 0 & (g | 0) > 0) {
      h = c[a + 56 >> 2] | 0;f = 0;do {
        b[h + (f << 1) >> 1] = b[K + (f << 1) >> 1] | 0;f = f + 1 | 0;
      } while ((f | 0) < (g | 0));
    }x = g << 1;g = i + (i & 1) + x | 0;x = g + (0 - x) | 0;h = c[F >> 2] | 0;if ((h | 0) > 0) {
      y = a + 16 | 0;z = a + 76 | 0;A = a + 56 | 0;B = a + 68 | 0;r = m + 22 | 0;s = a + 52 | 0;t = a + 60 | 0;u = a + 64 | 0;v = a + 72 | 0;w = a + 84 | 0;q = 0;f = 0;do {
        j = c[y >> 2] | 0;m = S(j, q) | 0;o = e + (c[N >> 2] << 1) + (m << 1) | 0;j = j << 2;g = g + (0 - g & 3) + j | 0;p = g + (0 - j) | 0;n = c[z >> 2] | 0;i = n + (m << 1 << 1) | 0;if (!n) n = 0;else {
          Sd(i | 0, 0, j | 0) | 0;n = i;h = c[F >> 2] | 0;
        }mb(c[A >> 2] | 0, K, C, c[G >> 2] | 0, q, h);lb(C, c[G >> 2] | 0, 410);kb(C, x, c[G >> 2] | 0, g);j = (c[B >> 2] | 0) + (q << 2) | 0;c[j >> 2] = 8192;if ((c[G >> 2] | 0) > 0) {
          h = 8192;i = 0;k = 8192;do {
            P = b[x + ((i | 1) << 1) >> 1] | 0;Q = b[x + (i << 1) >> 1] | 0;h = P + h - Q | 0;k = Q + P + k | 0;c[j >> 2] = k;i = i + 2 | 0;
          } while ((i | 0) < (c[G >> 2] | 0));
        } else h = 8192;j = h + 82 | 0;j = ((j << 16 >> 17) + 10496 + (c[D + (q << 2) >> 2] << 7) | 0) / (j | 0) | 0;j = (j | 0) > 32767 ? 32767 : (j | 0) > -32767 ? j : -32767;Sd(p | 0, 0, c[y >> 2] << 2 | 0) | 0;if (!(c[(c[(c[H >> 2] | 0) + (c[I >> 2] << 2) >> 2] | 0) + 40 >> 2] | 0)) {
          i = ((Rb(d, 5) | 0) << 16) + 16121856 | 0;h = i >>> 8 & 65535;i = i << 8 >> 16;if (h << 16 >> 16 <= 21290) {
            if (h << 16 >> 16 >= -21290) {
              i = (i * 23637 | 0) + 8192 | 0;h = i >>> 14;i = i << 2 >> 27;if ((i | 0) <= 14) {
                if ((i | 0) < -15) h = 0;else {
                  Q = h - (i << 11) << 19 >> 16;h = -2 - i | 0;Q = ((S(((S((Q * 5204 | 0) + 244187136 >> 16, Q) | 0) >>> 14 << 16) + 744226816 >> 16, Q) | 0) >>> 14 << 16) + 1073741824 >> 16;h = (h | 0) > 0 ? Q >> h : Q << 0 - h;
                }
              } else h = 2147483647;
            } else h = 0;
          } else h = 2147483647;Q = j << 16;h = (h + (Q >> 17) | 0) / (Q >> 16 | 0) | 0;if ((c[y >> 2] | 0) > 0) {
            j = b[r >> 1] << 1;k = h << 7 >> 16;i = h << 6 & 32704;h = 0;do {
              Q = h + m | 0;P = (S(j, b[L + (Q << 1) >> 1] | 0) | 0) >> 16;c[p + (h << 2) >> 2] = ((S(P, i) | 0) + 16384 >> 15) + (S(P, k) | 0) << 14;Q = (S(j, b[L + (Q + 1 << 1) >> 1] | 0) | 0) >> 16;c[p + ((h | 1) << 2) >> 2] = 0 - (((S(Q, i) | 0) + 16384 >> 15) + (S(Q, k) | 0) << 14);h = h + 2 | 0;
            } while ((h | 0) < (c[y >> 2] | 0));
          }
        } else {
          i = Rb(d, 4) | 0;i = ((b[2922 + (i << 1) >> 1] | 0) * 28626 | 0) >>> 15;Q = c[y >> 2] | 0;h = j << 16;h = ((S(b[E + (q << 1) >> 1] << 3, ((Q | 0) == 80 ? (((i << 16 >> 16) * 23170 | 0) + 8192 | 0) >>> 14 : i) << 16 >> 16) | 0) + (h >> 17) | 0) / (h >> 16 | 0) | 0;i = h << 11;P = c[(c[H >> 2] | 0) + (c[I >> 2] << 2) >> 2] | 0;za[c[P + 40 >> 2] & 3](p, c[P + 44 >> 2] | 0, Q, d, g, w);Wa(p, p, i, c[y >> 2] | 0);if (c[(c[(c[H >> 2] | 0) + (c[I >> 2] << 2) >> 2] | 0) + 12 >> 2] | 0 ? (P = c[y >> 2] << 2, Q = g + (0 - g & 3) + P | 0, M = Q + (0 - P) | 0, Sd(M | 0, 0, P | 0) | 0, P = c[(c[H >> 2] | 0) + (c[I >> 2] << 2) >> 2] | 0, za[c[P + 40 >> 2] & 3](M, c[P + 44 >> 2] | 0, c[y >> 2] | 0, d, Q, w), Wa(M, M, ((((i & 30720) * 13107 | 0) + 16384 | 0) >>> 15) + ((h << 12 >> 16) * 13107 | 0) | 0, c[y >> 2] | 0), (c[y >> 2] | 0) > 0) : 0) {
            h = 0;do {
              Q = p + (h << 2) | 0;c[Q >> 2] = (c[M + (h << 2) >> 2] | 0) + (c[Q >> 2] | 0);h = h + 1 | 0;
            } while ((h | 0) < (c[y >> 2] | 0));
          }
        }i = c[y >> 2] | 0;if ((c[z >> 2] | 0) != 0 & (i | 0) > 0) {
          h = 0;do {
            b[n + (h << 1 << 1) >> 1] = ((c[p + (h << 2) >> 2] | 0) + 8192 | 0) >>> 14;h = h + 1 | 0;
          } while ((h | 0) < (i | 0));
        }ab(c[s >> 2] | 0, c[t >> 2] | 0, o, i, c[G >> 2] | 0, c[u >> 2] | 0, g);k = c[y >> 2] | 0;if ((k | 0) > 0) {
          i = c[s >> 2] | 0;h = 0;do {
            b[i + (h << 1) >> 1] = ((c[p + (h << 2) >> 2] | 0) + 8192 | 0) >>> 14;h = h + 1 | 0;
          } while ((h | 0) < (k | 0));
        }i = c[G >> 2] | 0;if ((i | 0) > 0) {
          j = c[t >> 2] | 0;h = 0;do {
            b[j + (h << 1) >> 1] = b[x + (h << 1) >> 1] | 0;h = h + 1 | 0;
          } while ((h | 0) < (i | 0));
        }Q = Za(c[s >> 2] | 0, k) | 0;b[(c[v >> 2] | 0) + (q << 1) >> 1] = Q;Q = Q << 16 >> 16;Q = S(Q, Q) | 0;h = c[F >> 2] | 0;f = ((Q | 0) / (h | 0) | 0) + f | 0;q = q + 1 | 0;
      } while ((q | 0) < (h | 0));
    } else f = 0;h = f >>> 0 > 65535;P = h ? f >>> 16 : f;h = h ? 8 : 0;Q = P >>> 0 > 255;P = Q ? P >>> 8 : P;h = Q ? h | 4 : h;Q = P >>> 0 > 15;h = (Q ? P >>> 4 : P) >>> 0 > 3 | (Q ? h | 2 : h);Q = h << 1;Q = ((h & 65535) << 16 >> 16 > 6 ? f >> Q + -12 : f << 12 - Q) << 16 >> 16;Q = ((S(((S((Q * 16816 | 0) + -827523072 >> 16, Q) | 0) >>> 14 << 16) + 1387593728 >> 16, Q) | 0) >>> 14 << 16) + 238157824 >> 16;h = 13 - h | 0;b[a + 80 >> 1] = (h | 0) > 0 ? Q >> h : Q << 0 - h;gb(e, e + (c[N >> 2] << 1) | 0, 2730, e, c[a + 8 >> 2] | 0, 64, c[a + 44 >> 2] | 0, c[a + 48 >> 2] | 0, g);h = c[G >> 2] | 0;if ((h | 0) > 0) {
      g = c[a + 56 >> 2] | 0;f = 0;do {
        b[g + (f << 1) >> 1] = b[K + (f << 1) >> 1] | 0;f = f + 1 | 0;
      } while ((f | 0) < (h | 0));
    }c[J >> 2] = 0;Q = 0;l = O;return Q | 0;
  }function sc(a, d, e, f) {
    a = a | 0;d = d | 0;e = e | 0;f = f | 0;var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0;m = (e | 0) != 0;if (m) {
      l = a + 96 | 0;g = c[l >> 2] | 0;c[l >> 2] = 1;
    } else {
      g = c[a + 60 >> 2] | 0;Ta(32440, g, g, c[a + 24 >> 2] | 0);g = a + 80 | 0;b[g >> 1] = ((b[g >> 1] | 0) * 29491 | 0) >>> 15;g = 0;
    }c[a + 28 >> 2] = 1;h = a + 12 | 0;i = c[h >> 2] | 0;if ((i | 0) > 0) {
      j = a + 80 | 0;k = a + 84 | 0;e = 0;l = c[k >> 2] | 0;do {
        l = (S(l, 1664525) | 0) + 1013904223 | 0;n = S(l >> 16, b[j >> 1] | 0) | 0;b[d + (i + e << 1) >> 1] = (n + 8192 - (n >> 3) | 0) >>> 14;e = e + 1 | 0;
      } while ((e | 0) < (i | 0));c[k >> 2] = l;
    }n = d + (i << 1) | 0;ab(n, c[a + 60 >> 2] | 0, n, i, c[a + 24 >> 2] | 0, c[a + 64 >> 2] | 0, f);gb(d, d + (c[h >> 2] << 1) | 0, 2730, d, c[a + 8 >> 2] | 0, 64, c[a + 44 >> 2] | 0, c[a + 48 >> 2] | 0, f);if (!m) return;c[a + 96 >> 2] = g;return;
  }function tc(a, d, e) {
    a = a | 0;d = d | 0;e = e | 0;var f = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0,
        n = 0.0,
        o = 0.0;m = l;l = l + 32 | 0;f = m;k = m + 16 | 0;i = m + 12 | 0;j = m + 8 | 0;do {
      switch (d | 0) {case 3:
          {
            c[e >> 2] = c[a + 8 >> 2];a = 0;l = m;return a | 0;
          }case 10:
          {
            e = c[e >> 2] | 0;c[a + 152 >> 2] = e;c[a + 156 >> 2] = e;a = 0;l = m;return a | 0;
          }case 8:
          {
            zb(c[a + 4 >> 2] | 0, 8, e) | 0;a = 0;l = m;return a | 0;
          }case 34:
          {
            zb(c[a + 4 >> 2] | 0, 34, e) | 0;a = 0;l = m;return a | 0;
          }case 35:
          {
            zb(c[a + 4 >> 2] | 0, 35, e) | 0;a = 0;l = m;return a | 0;
          }case 9:
          {
            zb(c[a + 4 >> 2] | 0, 9, e) | 0;a = 0;l = m;return a | 0;
          }case 6:
          {
            zb(a, 4, e) | 0;a = 0;l = m;return a | 0;
          }case 12:
          {
            c[a + 108 >> 2] = c[e >> 2];zb(c[a + 4 >> 2] | 0, 12, e) | 0;a = 0;l = m;return a | 0;
          }case 13:
          {
            c[e >> 2] = c[a + 108 >> 2];a = 0;l = m;return a | 0;
          }case 30:
          {
            c[a + 136 >> 2] = c[e >> 2];zb(c[a + 4 >> 2] | 0, 30, e) | 0;a = 0;l = m;return a | 0;
          }case 31:
          {
            c[e >> 2] = c[a + 136 >> 2];a = 0;l = m;return a | 0;
          }case 14:
          {
            o = +g[e >> 2];n = o + .6;g[i >> 2] = n;g[a + 104 >> 2] = o;if (n > 10.0) g[i >> 2] = 10.0;e = ~~+E(+(+g[e >> 2] + .5));c[k >> 2] = (e | 0) < 10 ? e : 10;zb(c[a + 4 >> 2] | 0, 14, i) | 0;zb(a, 4, k) | 0;a = 0;l = m;return a | 0;
          }case 15:
          {
            c[e >> 2] = c[a + 104 >> 2];a = 0;l = m;return a | 0;
          }case 32:
          {
            f = c[e >> 2] | 0;c[a + 120 >> 2] = f;h = a + 108 | 0;c[h >> 2] = (f | 0) != 0 & 1;zb(c[a + 4 >> 2] | 0, 12, h) | 0;if (!(c[h >> 2] | 0)) {
              a = 0;l = m;return a | 0;
            }c[k >> 2] = 10;f = c[e >> 2] | 0;while (1) {
              zb(a, 4, k) | 0;zb(a, 19, i) | 0;d = c[k >> 2] | 0;if ((c[i >> 2] | 0) <= (f | 0)) break;h = d + -1 | 0;c[k >> 2] = h;if ((d | 0) <= 0) {
                d = h;break;
              }
            }g[j >> 2] = (d | 0) < 0 ? 0.0 : +(d | 0);zb(a, 14, j) | 0;g[a + 132 >> 2] = 0.0;g[a + 124 >> 2] = 0.0;g[a + 128 >> 2] = 0.0;a = 0;l = m;return a | 0;
          }case 33:
          {
            c[e >> 2] = c[a + 120 >> 2];a = 0;l = m;return a | 0;
          }case 4:
          {
            e = c[e >> 2] | 0;e = (e | 0) > 0 ? e : 0;e = (e | 0) < 10 ? e : 10;j = c[c[a >> 2] >> 2] | 0;i = c[j + 104 + (e << 2) >> 2] | 0;c[a + 152 >> 2] = i;c[a + 156 >> 2] = i;c[k >> 2] = c[j + 60 + (e << 2) >> 2];zb(c[a + 4 >> 2] | 0, 6, k) | 0;a = 0;l = m;return a | 0;
          }case 16:
          {
            zb(c[a + 4 >> 2] | 0, 16, e) | 0;e = c[e >> 2] | 0;c[a + 160 >> 2] = (e | 0) > 1 ? e : 1;l = m;return 0;
          }case 17:
          {
            c[e >> 2] = c[a + 160 >> 2];a = 0;l = m;return a | 0;
          }case 18:
          {
            c[k >> 2] = 10;d = c[e >> 2] | 0;do {
              zb(a, 4, k) | 0;zb(a, 19, i) | 0;if ((c[i >> 2] | 0) <= (d | 0)) break;e = c[k >> 2] | 0;c[k >> 2] = e + -1;
            } while ((e | 0) > 0);a = 0;l = m;return a | 0;
          }case 19:
          {
            zb(c[a + 4 >> 2] | 0, 19, e) | 0;d = c[(c[a + 148 >> 2] | 0) + (c[a + 152 >> 2] << 2) >> 2] | 0;f = c[a + 164 >> 2] | 0;if (!d) d = f << 2;else d = S(c[d + 52 >> 2] | 0, f) | 0;c[e >> 2] = (c[e >> 2] | 0) + ((d | 0) / (c[a + 8 >> 2] | 0) | 0);a = 0;l = m;return a | 0;
          }case 24:
          {
            e = c[e >> 2] | 0;c[a + 164 >> 2] = e;c[k >> 2] = e >> 1;zb(c[a + 4 >> 2] | 0, 24, k) | 0;a = 0;l = m;return a | 0;
          }case 25:
          {
            c[e >> 2] = c[a + 164 >> 2];a = 0;l = m;return a | 0;
          }case 26:
          {
            c[a + 32 >> 2] = 1;k = a + 28 | 0;f = c[k >> 2] | 0;h = (f | 0) > 0;if (h) {
              i = c[a + 68 >> 2] | 0;j = f + 1 | 0;d = 0;do {
                e = d;d = d + 1 | 0;b[i + (e << 1) >> 1] = ((d << 16 >> 16) * 25736 | 0) / (j | 0) | 0;
              } while ((d | 0) < (f | 0));if (h) {
                f = c[a + 84 >> 2] | 0;h = c[a + 80 >> 2] | 0;i = c[a + 88 >> 2] | 0;d = 0;do {
                  c[f + (d << 2) >> 2] = 0;c[h + (d << 2) >> 2] = 0;c[i + (d << 2) >> 2] = 0;d = d + 1 | 0;
                } while ((d | 0) < (c[k >> 2] | 0));
              }
            }h = c[a + 56 >> 2] | 0;f = c[a + 52 >> 2] | 0;d = 0;do {
              b[h + (d << 1) >> 1] = 0;b[f + (d << 1) >> 1] = 0;d = d + 1 | 0;
            } while ((d | 0) != 64);d = 0;l = m;return d | 0;
          }case 36:
          {
            c[a + 144 >> 2] = c[e >> 2];zb(c[a + 4 >> 2] | 0, 36, e) | 0;a = 0;l = m;return a | 0;
          }case 37:
          {
            c[e >> 2] = c[a + 144 >> 2];a = 0;l = m;return a | 0;
          }case 39:
          {
            zb(c[a + 4 >> 2] | 0, 39, e) | 0;c[e >> 2] = (c[e >> 2] << 1) + 63;a = 0;l = m;return a | 0;
          }case 40:
          {
            zb(c[a + 4 >> 2] | 0, 40, e) | 0;a = 0;l = m;return a | 0;
          }case 41:
          {
            zb(c[a + 4 >> 2] | 0, 41, e) | 0;a = 0;l = m;return a | 0;
          }case 42:
          {
            f = c[e >> 2] | 0;c[a + 112 >> 2] = f;do {
              if ((f | 0) <= 42199) {
                if ((f | 0) > 27799) {
                  c[a + 116 >> 2] = 9600;d = 9600;break;
                } else {
                  d = (f | 0) > 20600 ? 5600 : 1800;c[a + 116 >> 2] = d;break;
                }
              } else {
                c[a + 116 >> 2] = 17600;d = 17600;
              }
            } while (0);if ((c[a + 16 >> 2] | 0) == 80) {
              c[a + 116 >> 2] = 1800;d = 1800;
            }c[k >> 2] = f - d;zb(c[a + 4 >> 2] | 0, 42, k) | 0;a = 0;l = m;return a | 0;
          }case 43:
          {
            c[e >> 2] = c[a + 112 >> 2];a = 0;l = m;return a | 0;
          }case 44:
          {
            zb(c[a + 4 >> 2] | 0, 44, e) | 0;a = 0;l = m;return a | 0;
          }case 45:
          {
            zb(c[a + 4 >> 2] | 0, 45, e) | 0;a = 0;l = m;return a | 0;
          }case 100:
          {
            h = a + 20 | 0;if ((c[h >> 2] | 0) <= 0) {
              a = 0;l = m;return a | 0;
            }f = c[a + 92 >> 2] | 0;d = 0;do {
              c[e + (d << 2) >> 2] = c[f + (d << 2) >> 2];d = d + 1 | 0;
            } while ((d | 0) < (c[h >> 2] | 0));d = 0;l = m;return d | 0;
          }case 101:
          {
            h = c[a + 20 >> 2] | 0;if ((h | 0) <= 0) {
              a = 0;l = m;return a | 0;
            }f = c[a + 96 >> 2] | 0;d = 0;do {
              b[e + (d << 1) >> 1] = b[f + (d << 1) >> 1] | 0;d = d + 1 | 0;
            } while ((d | 0) < (h | 0));d = 0;l = m;return d | 0;
          }case 29:
          {
            c[e >> 2] = c[a + 140 >> 2];a = 0;l = m;return a | 0;
          }case 104:
          {
            c[a + 100 >> 2] = e;a = 0;l = m;return a | 0;
          }case 105:
          {
            zb(c[a + 4 >> 2] | 0, 105, e) | 0;a = 0;l = m;return a | 0;
          }case 106:
          {
            c[e >> 2] = c[a + 44 >> 2];a = 0;l = m;return a | 0;
          }default:
          {
            a = c[517] | 0;c[f >> 2] = 12815;c[f + 4 >> 2] = d;yd(a, 12799, f) | 0;a = -1;l = m;return a | 0;
          }}
    } while (0);return 0;
  }function uc(a, d, e) {
    a = a | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0;h = l;l = l + 16 | 0;g = h;f = h + 8 | 0;do {
      switch (d | 0) {case 10:
          {
            c[a + 96 >> 2] = c[e >> 2];d = 0;break;
          }case 8:
          {
            Cb(c[a + 4 >> 2] | 0, 8, e) | 0;d = 0;break;
          }case 9:
          {
            Cb(c[a + 4 >> 2] | 0, 9, e) | 0;d = 0;break;
          }case 3:
          {
            c[e >> 2] = c[a + 8 >> 2];d = 0;break;
          }case 0:
          {
            Cb(c[a + 4 >> 2] | 0, 0, e) | 0;c[a + 36 >> 2] = c[e >> 2];d = 0;break;
          }case 1:
          {
            c[e >> 2] = c[a + 36 >> 2];d = 0;break;
          }case 4:case 6:
          {
            d = c[e >> 2] | 0;d = (d | 0) > 0 ? d : 0;d = (d | 0) < 10 ? d : 10;e = c[c[a >> 2] >> 2] | 0;c[a + 96 >> 2] = c[e + 104 + (d << 2) >> 2];c[f >> 2] = c[e + 60 + (d << 2) >> 2];Cb(c[a + 4 >> 2] | 0, 6, f) | 0;d = 0;break;
          }case 19:
          {
            Cb(c[a + 4 >> 2] | 0, 19, e) | 0;d = c[(c[a + 92 >> 2] | 0) + (c[a + 96 >> 2] << 2) >> 2] | 0;f = c[a + 32 >> 2] | 0;if (!d) d = f << 2;else d = S(c[d + 52 >> 2] | 0, f) | 0;c[e >> 2] = (c[e >> 2] | 0) + ((d | 0) / (c[a + 8 >> 2] | 0) | 0);d = 0;break;
          }case 24:
          {
            d = c[e >> 2] | 0;c[a + 32 >> 2] = d;c[f >> 2] = d >> 1;Cb(c[a + 4 >> 2] | 0, 24, f) | 0;d = 0;break;
          }case 25:
          {
            c[e >> 2] = c[a + 32 >> 2];d = 0;break;
          }case 20:
          {
            Cb(c[a + 4 >> 2] | 0, 20, e) | 0;d = 0;break;
          }case 22:
          {
            Cb(c[a + 4 >> 2] | 0, 22, e) | 0;d = 0;break;
          }case 26:
          {
            g = a + 24 | 0;if ((c[g >> 2] | 0) > 0) {
              f = c[a + 64 >> 2] | 0;d = 0;do {
                c[f + (d << 2) >> 2] = 0;d = d + 1 | 0;
              } while ((d | 0) < (c[g >> 2] << 1 | 0));
            }f = c[a + 48 >> 2] | 0;g = c[a + 44 >> 2] | 0;d = 0;do {
              b[f + (d << 1) >> 1] = 0;b[g + (d << 1) >> 1] = 0;d = d + 1 | 0;
            } while ((d | 0) != 64);b[a + 80 >> 1] = 0;d = 0;break;
          }case 36:
          {
            c[a + 88 >> 2] = c[e >> 2];Cb(c[a + 4 >> 2] | 0, 36, e) | 0;d = 0;break;
          }case 37:
          {
            c[e >> 2] = c[a + 88 >> 2];d = 0;break;
          }case 39:
          {
            Cb(c[a + 4 >> 2] | 0, 39, e) | 0;c[e >> 2] = c[e >> 2] << 1;d = 0;break;
          }case 44:
          {
            Cb(c[a + 4 >> 2] | 0, 44, e) | 0;d = 0;break;
          }case 45:
          {
            Cb(c[a + 4 >> 2] | 0, 45, e) | 0;d = 0;break;
          }case 47:
          {
            Cb(c[a + 4 >> 2] | 0, 47, e) | 0;d = 0;break;
          }case 100:
          {
            g = a + 20 | 0;if ((c[g >> 2] | 0) > 0) {
              f = c[a + 68 >> 2] | 0;d = 0;do {
                c[e + (d << 2) >> 2] = c[f + (d << 2) >> 2];d = d + 1 | 0;
              } while ((d | 0) < (c[g >> 2] | 0));d = 0;
            } else d = 0;break;
          }case 101:
          {
            g = c[a + 20 >> 2] | 0;if ((g | 0) > 0) {
              f = c[a + 72 >> 2] | 0;d = 0;do {
                b[e + (d << 1) >> 1] = b[f + (d << 1) >> 1] | 0;d = d + 1 | 0;
              } while ((d | 0) < (g | 0));d = 0;
            } else d = 0;break;
          }case 103:
          {
            Cb(c[a + 4 >> 2] | 0, 103, e) | 0;d = 0;break;
          }case 104:
          {
            c[a + 76 >> 2] = e;d = 0;break;
          }case 105:
          {
            Cb(c[a + 4 >> 2] | 0, 105, e) | 0;d = 0;break;
          }case 106:
          {
            c[e >> 2] = c[a + 40 >> 2];d = 0;break;
          }default:
          {
            a = c[517] | 0;c[g >> 2] = 12815;c[g + 4 >> 2] = d;yd(a, 12799, g) | 0;d = -1;
          }}
    } while (0);l = h;return d | 0;
  }function vc(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;var e = 0,
        f = 0;e = Rb(a, 4) | 0;f = c[b + (e * 20 | 0) + 4 >> 2] | 0;if (f | 0) {
      a = ya[f & 15](a, d, c[b + (e * 20 | 0) + 8 >> 2] | 0) | 0;return a | 0;
    }if ((e | 0) >= 2) {
      if ((e | 0) >= 8) {
        if ((e | 0) < 10) b = 8;else b = (e | 0) < 12 ? 16 : (e | 0) < 14 ? 32 : 64;
      } else b = 4;
    } else b = 1;Tb(a, b);a = 0;return a | 0;
  }function wc(a, b, c) {
    a = a | 0;b = b | 0;c = c | 0;Tb(a, (Rb(a, 4) | 0) << 3 | 5);return 0;
  }function xc(b, d, e, f) {
    b = b | 0;d = d | 0;e = e | 0;f = f | 0;var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;i = l;l = l + 16 | 0;g = i;h = b;j = h;a[j >> 0] = 83;a[j + 1 >> 0] = 112;a[j + 2 >> 0] = 101;a[j + 3 >> 0] = 101;h = h + 4 | 0;a[h >> 0] = 120;a[h + 1 >> 0] = 32;a[h + 2 >> 0] = 32;a[h + 3 >> 0] = 32;h = b + 8 | 0;j = 12840;k = h + 14 | 0;do {
      a[h >> 0] = a[j >> 0] | 0;h = h + 1 | 0;j = j + 1 | 0;
    } while ((h | 0) < (k | 0));k = b + 22 | 0;a[k >> 0] = 0;a[k + 1 >> 0] = 0;a[k + 2 >> 0] = 0;a[k + 3 >> 0] = 0;a[k + 4 >> 0] = 0;a[k + 5 >> 0] = 0;c[b + 28 >> 2] = 1;c[b + 32 >> 2] = 80;c[b + 36 >> 2] = d;k = c[f + 12 >> 2] | 0;c[b + 40 >> 2] = k;c[b + 44 >> 2] = c[f + 16 >> 2];if ((k | 0) < 0) {
      k = c[517] | 0;c[g >> 2] = 12868;yd(k, 12855, g) | 0;
    }c[b + 48 >> 2] = e;c[b + 52 >> 2] = -1;Xb(f, 0, b + 56 | 0) | 0;k = b + 60 | 0;c[k >> 2] = 0;c[k + 4 >> 2] = 0;c[k + 8 >> 2] = 0;c[k + 12 >> 2] = 0;c[k + 16 >> 2] = 0;l = i;return;
  }function yc(a, b) {
    a = a | 0;b = b | 0;var d = 0,
        e = 0,
        f = 0;e = Gd(80, 1) | 0;f = e;d = f + 80 | 0;do {
      c[f >> 2] = c[a >> 2];f = f + 4 | 0;a = a + 4 | 0;
    } while ((f | 0) < (d | 0));c[b >> 2] = 80;return e | 0;
  }function zc(b, d) {
    b = b | 0;d = d | 0;var e = 0,
        f = 0,
        g = 0,
        h = 0;h = l;l = l + 16 | 0;f = h + 8 | 0;e = h;if ((((((((a[b >> 0] | 0) == 83 ? (a[b + 1 >> 0] | 0) == 112 : 0) ? (a[b + 2 >> 0] | 0) == 101 : 0) ? (a[b + 3 >> 0] | 0) == 101 : 0) ? (a[b + 4 >> 0] | 0) == 120 : 0) ? (a[b + 5 >> 0] | 0) == 32 : 0) ? (a[b + 6 >> 0] | 0) == 32 : 0) ? (a[b + 7 >> 0] | 0) == 32 : 0) if ((d | 0) < 80) {
      b = c[517] | 0;c[f >> 2] = 12958;yd(b, 12904, f) | 0;b = 0;l = h;return b | 0;
    } else {
      f = Gd(80, 1) | 0;g = f;d = b;e = g + 80 | 0;do {
        c[g >> 2] = c[d >> 2];g = g + 4 | 0;d = d + 4 | 0;
      } while ((g | 0) < (e | 0));b = f;l = h;return b | 0;
    }b = c[517] | 0;c[e >> 2] = 12922;yd(b, 12904, e) | 0;b = 0;l = h;return b | 0;
  }function Ac(a, b, d, e, f) {
    a = a | 0;b = b | 0;d = d | 0;e = e | 0;f = f | 0;var g = 0,
        h = 0,
        i = 0,
        j = 0;j = l;l = l + 96 | 0;g = j + 88 | 0;h = j + 8 | 0;i = j;c[g >> 2] = a;if (e) {
      a = f + 36 | 0;c[a >> 2] = tb(624) | 0;xc(h, 8e3, 1, 624);
    } else {
      a = f + 36 | 0;c[a >> 2] = tb(1432) | 0;xc(h, 16e3, 1, 1432);
    }zb(c[a >> 2] | 0, 4, g) | 0;Lb(f);h = yc(h, i) | 0;i = c[i >> 2] | 0;Zd(b | 0, h | 0, ((i | 0) > (d | 0) ? d : i) | 0) | 0;l = j;return i | 0;
  }function Bc(a, d, e) {
    a = a | 0;d = d | 0;e = e | 0;Mb(e);Ab(c[e + 36 >> 2] | 0, a, e) | 0;e = Pb(e, d + 2 | 0, 200) | 0;b[d >> 1] = zd(e & 65535) | 0;return e | 0;
  }function Cc(a, c, d, e, f, h) {
    a = a | 0;c = c | 0;d = d | 0;e = e | 0;f = f | 0;h = h | 0;var i = 0,
        j = 0;j = l;i = l;l = l + ((1 * (f << 2) | 0) + 15 & -16) | 0;Ob(c, d, h);a = Bb(a, c, i) | 0;if ((a | 0) < 0) {
      i = a;l = j;return i | 0;
    }if ((f | 0) > 0) a = 0;else {
      i = 0;l = j;return i | 0;
    }do {
      b[e + (a << 1) >> 1] = ~~+g[i + (a << 2) >> 2];a = a + 1 | 0;
    } while ((a | 0) != (f | 0));a = 0;l = j;return a | 0;
  }function Dc(b, e, f, g) {
    b = b | 0;e = e | 0;f = f | 0;g = g | 0;var h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0;y = l;l = l + 128 | 0;x = y + 88 | 0;h = y + 8 | 0;m = y;c[g >> 2] = 0;if (e >>> 0 < 80) {
      Dd(12981) | 0;x = 0;l = y;return x | 0;
    }i = h;j = b;k = i + 80 | 0;do {
      a[i >> 0] = a[j >> 0] | 0;i = i + 1 | 0;j = j + 1 | 0;
    } while ((i | 0) < (k | 0));o = b + 80 | 0;p = e + -80 | 0;if (Pc(13043, h, 8) | 0) {
      Dd(13052) | 0;x = 0;l = y;return x | 0;
    }b = zc(h, 80) | 0;i = h;j = b;k = i + 80 | 0;do {
      c[i >> 2] = c[j >> 2];i = i + 4 | 0;j = j + 4 | 0;
    } while ((i | 0) < (k | 0));Fd(b);b = c[h + 40 >> 2] | 0;a: do {
      if ((b | 0) < 1) switch (b | 0) {case 0:
          {
            u = 160;b = 0;h = 624;break;
          }default:
          n = 6;} else {
        if ((b | 0) < 16777216) switch (b | 0) {case 1:
            break;default:
            {
              n = 6;break a;
            }} else switch (b | 0) {case 16777216:
            break;default:
            {
              n = 6;break a;
            }}u = 320;b = 1;h = 1432;
      }
    } while (0);if ((n | 0) == 6) {
      Dd(13091) | 0;u = 0;b = 0;h = 624;
    }v = ub(h) | 0;w = oa() | 0;t = l;l = l + ((1 * (u << 1) | 0) + 15 & -16) | 0;c[m >> 2] = 1;Cb(v, 0, m) | 0;Lb(x);s = l;l = l + ((1 * (c[516] | 0) | 0) + 15 & -16) | 0;q = e * 10 | 0;c[f >> 2] = Ld(q) | 0;b: do {
      if (p) {
        r = u << 1;h = 0;e = q;n = p;while (1) {
          j = o + 2 | 0;i = n + -2 | 0;k = (Bd(d[o >> 0] | d[o + 1 >> 0] << 8) | 0) & 65535;if ((k | 0) > (c[516] | 0)) {
            n = 11;break;
          }if (i >>> 0 < k >>> 0) {
            n = 13;break;
          }Zd(s | 0, j | 0, k | 0) | 0;o = j + k | 0;n = i - k | 0;if ((Cc(v, x, s, t, u, k) | 0) == 1) {
            n = 16;break;
          }m = h + u | 0;i = c[f >> 2] | 0;if (m >>> 0 > e >>> 0) {
            j = e;while (1) {
              j = j + q | 0;k = Ld(j) | 0;Zd(k | 0, i | 0, h | 0) | 0;if (i | 0) Nd(i);c[f >> 2] = k;if (m >>> 0 > j >>> 0) i = k;else {
                i = k;break;
              }
            }
          } else j = e;Zd(i + h | 0, t | 0, r | 0) | 0;h = h + r | 0;if (!n) {
            n = 21;break b;
          } else e = j;
        }if ((n | 0) == 11) {
          Dd(13186) | 0;Nb(x);wb(v);b = 0;break;
        } else if ((n | 0) == 13) {
          Dd(13246) | 0;Nb(x);wb(v);b = 0;break;
        } else if ((n | 0) == 16) {
          Nb(x);wb(v);b = 0;break;
        }
      } else {
        h = 0;n = 21;
      }
    } while (0);if ((n | 0) == 21) {
      c[g >> 2] = h;Nb(x);wb(v);
    }ua(w | 0);x = b;l = y;return x | 0;
  }function Ec() {
    return 15704;
  }function Fc(a) {
    a = a | 0;var b = 0,
        d = 0;b = l;l = l + 16 | 0;d = b;c[d >> 2] = Mc(c[a + 60 >> 2] | 0) | 0;a = Ic(ja(6, d | 0) | 0) | 0;l = b;return a | 0;
  }function Gc(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;var e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0;n = l;l = l + 48 | 0;k = n + 16 | 0;g = n;f = n + 32 | 0;i = a + 28 | 0;e = c[i >> 2] | 0;c[f >> 2] = e;j = a + 20 | 0;e = (c[j >> 2] | 0) - e | 0;c[f + 4 >> 2] = e;c[f + 8 >> 2] = b;c[f + 12 >> 2] = d;e = e + d | 0;h = a + 60 | 0;c[g >> 2] = c[h >> 2];c[g + 4 >> 2] = f;c[g + 8 >> 2] = 2;g = Ic(wa(146, g | 0) | 0) | 0;a: do {
      if ((e | 0) != (g | 0)) {
        b = 2;while (1) {
          if ((g | 0) < 0) break;e = e - g | 0;p = c[f + 4 >> 2] | 0;o = g >>> 0 > p >>> 0;f = o ? f + 8 | 0 : f;b = (o << 31 >> 31) + b | 0;p = g - (o ? p : 0) | 0;c[f >> 2] = (c[f >> 2] | 0) + p;o = f + 4 | 0;c[o >> 2] = (c[o >> 2] | 0) - p;c[k >> 2] = c[h >> 2];c[k + 4 >> 2] = f;c[k + 8 >> 2] = b;g = Ic(wa(146, k | 0) | 0) | 0;if ((e | 0) == (g | 0)) {
            m = 3;break a;
          }
        }c[a + 16 >> 2] = 0;c[i >> 2] = 0;c[j >> 2] = 0;c[a >> 2] = c[a >> 2] | 32;if ((b | 0) == 2) d = 0;else d = d - (c[f + 4 >> 2] | 0) | 0;
      } else m = 3;
    } while (0);if ((m | 0) == 3) {
      p = c[a + 44 >> 2] | 0;c[a + 16 >> 2] = p + (c[a + 48 >> 2] | 0);c[i >> 2] = p;c[j >> 2] = p;
    }l = n;return d | 0;
  }function Hc(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;var e = 0,
        f = 0,
        g = 0;f = l;l = l + 32 | 0;g = f;e = f + 20 | 0;c[g >> 2] = c[a + 60 >> 2];c[g + 4 >> 2] = 0;c[g + 8 >> 2] = b;c[g + 12 >> 2] = e;c[g + 16 >> 2] = d;if ((Ic(pa(140, g | 0) | 0) | 0) < 0) {
      c[e >> 2] = -1;a = -1;
    } else a = c[e >> 2] | 0;l = f;return a | 0;
  }function Ic(a) {
    a = a | 0;if (a >>> 0 > 4294963200) {
      c[(Jc() | 0) >> 2] = 0 - a;a = -1;
    }return a | 0;
  }function Jc() {
    return (Kc() | 0) + 64 | 0;
  }function Kc() {
    return Lc() | 0;
  }function Lc() {
    return 2196;
  }function Mc(a) {
    a = a | 0;return a | 0;
  }function Nc(b, d, e) {
    b = b | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0;g = l;l = l + 32 | 0;f = g;c[b + 36 >> 2] = 11;if ((c[b >> 2] & 64 | 0) == 0 ? (c[f >> 2] = c[b + 60 >> 2], c[f + 4 >> 2] = 21523, c[f + 8 >> 2] = g + 16, ra(54, f | 0) | 0) : 0) a[b + 75 >> 0] = -1;f = Gc(b, d, e) | 0;l = g;return f | 0;
  }function Oc(b, c) {
    b = b | 0;c = c | 0;var d = 0,
        e = 0;d = a[b >> 0] | 0;e = a[c >> 0] | 0;if (d << 24 >> 24 == 0 ? 1 : d << 24 >> 24 != e << 24 >> 24) b = e;else {
      do {
        b = b + 1 | 0;c = c + 1 | 0;d = a[b >> 0] | 0;e = a[c >> 0] | 0;
      } while (!(d << 24 >> 24 == 0 ? 1 : d << 24 >> 24 != e << 24 >> 24));b = e;
    }return (d & 255) - (b & 255) | 0;
  }function Pc(b, c, d) {
    b = b | 0;c = c | 0;d = d | 0;var e = 0,
        f = 0,
        g = 0,
        h = 0;if (!d) e = 0;else {
      h = a[b >> 0] | 0;e = h & 255;g = a[c >> 0] | 0;f = g & 255;a: do {
        if (h << 24 >> 24) do {
          d = d + -1 | 0;if (!(h << 24 >> 24 == g << 24 >> 24 & ((d | 0) != 0 & g << 24 >> 24 != 0))) break a;b = b + 1 | 0;c = c + 1 | 0;h = a[b >> 0] | 0;e = h & 255;g = a[c >> 0] | 0;f = g & 255;
        } while (h << 24 >> 24 != 0);
      } while (0);e = e - f | 0;
    }return e | 0;
  }function Qc(b, d, e) {
    b = b | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0;s = l;l = l + 224 | 0;n = s + 120 | 0;o = s + 80 | 0;q = s;r = s + 136 | 0;f = o;g = f + 40 | 0;do {
      c[f >> 2] = 0;f = f + 4 | 0;
    } while ((f | 0) < (g | 0));c[n >> 2] = c[e >> 2];if ((Rc(0, d, n, q, o) | 0) < 0) e = -1;else {
      if ((c[b + 76 >> 2] | 0) > -1) p = Sc(b) | 0;else p = 0;e = c[b >> 2] | 0;m = e & 32;if ((a[b + 74 >> 0] | 0) < 1) c[b >> 2] = e & -33;f = b + 48 | 0;if (!(c[f >> 2] | 0)) {
        g = b + 44 | 0;h = c[g >> 2] | 0;c[g >> 2] = r;i = b + 28 | 0;c[i >> 2] = r;j = b + 20 | 0;c[j >> 2] = r;c[f >> 2] = 80;k = b + 16 | 0;c[k >> 2] = r + 80;e = Rc(b, d, n, q, o) | 0;if (h) {
          ya[c[b + 36 >> 2] & 15](b, 0, 0) | 0;e = (c[j >> 2] | 0) == 0 ? -1 : e;c[g >> 2] = h;c[f >> 2] = 0;c[k >> 2] = 0;c[i >> 2] = 0;c[j >> 2] = 0;
        }
      } else e = Rc(b, d, n, q, o) | 0;f = c[b >> 2] | 0;c[b >> 2] = f | m;if (p | 0) Tc(b);e = (f & 32 | 0) == 0 ? e : -1;
    }l = s;return e | 0;
  }function Rc(d, e, f, g, i) {
    d = d | 0;e = e | 0;f = f | 0;g = g | 0;i = i | 0;var j = 0,
        k = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        E = 0,
        F = 0,
        G = 0,
        H = 0;H = l;l = l + 64 | 0;C = H + 16 | 0;E = H;A = H + 24 | 0;F = H + 8 | 0;G = H + 20 | 0;c[C >> 2] = e;x = (d | 0) != 0;y = A + 40 | 0;z = y;A = A + 39 | 0;B = F + 4 | 0;k = 0;j = 0;p = 0;a: while (1) {
      do {
        if ((j | 0) > -1) if ((k | 0) > (2147483647 - j | 0)) {
          c[(Jc() | 0) >> 2] = 75;j = -1;break;
        } else {
          j = k + j | 0;break;
        }
      } while (0);k = a[e >> 0] | 0;if (!(k << 24 >> 24)) {
        w = 87;break;
      } else m = e;b: while (1) {
        switch (k << 24 >> 24) {case 37:
            {
              k = m;w = 9;break b;
            }case 0:
            {
              k = m;break b;
            }default:
            {}}v = m + 1 | 0;c[C >> 2] = v;k = a[v >> 0] | 0;m = v;
      }c: do {
        if ((w | 0) == 9) while (1) {
          w = 0;if ((a[m + 1 >> 0] | 0) != 37) break c;k = k + 1 | 0;m = m + 2 | 0;c[C >> 2] = m;if ((a[m >> 0] | 0) == 37) w = 9;else break;
        }
      } while (0);k = k - e | 0;if (x) Uc(d, e, k);if (k | 0) {
        e = m;continue;
      }n = m + 1 | 0;k = (a[n >> 0] | 0) + -48 | 0;if (k >>> 0 < 10) {
        v = (a[m + 2 >> 0] | 0) == 36;u = v ? k : -1;p = v ? 1 : p;n = v ? m + 3 | 0 : n;
      } else u = -1;c[C >> 2] = n;k = a[n >> 0] | 0;m = (k << 24 >> 24) + -32 | 0;d: do {
        if (m >>> 0 < 32) {
          o = 0;q = k;while (1) {
            k = 1 << m;if (!(k & 75913)) {
              k = q;break d;
            }o = k | o;n = n + 1 | 0;c[C >> 2] = n;k = a[n >> 0] | 0;m = (k << 24 >> 24) + -32 | 0;if (m >>> 0 >= 32) break;else q = k;
          }
        } else o = 0;
      } while (0);if (k << 24 >> 24 == 42) {
        m = n + 1 | 0;k = (a[m >> 0] | 0) + -48 | 0;if (k >>> 0 < 10 ? (a[n + 2 >> 0] | 0) == 36 : 0) {
          c[i + (k << 2) >> 2] = 10;k = c[g + ((a[m >> 0] | 0) + -48 << 3) >> 2] | 0;p = 1;n = n + 3 | 0;
        } else {
          if (p | 0) {
            j = -1;break;
          }if (x) {
            p = (c[f >> 2] | 0) + (4 - 1) & ~(4 - 1);k = c[p >> 2] | 0;c[f >> 2] = p + 4;p = 0;n = m;
          } else {
            k = 0;p = 0;n = m;
          }
        }c[C >> 2] = n;v = (k | 0) < 0;k = v ? 0 - k | 0 : k;o = v ? o | 8192 : o;
      } else {
        k = Vc(C) | 0;if ((k | 0) < 0) {
          j = -1;break;
        }n = c[C >> 2] | 0;
      }do {
        if ((a[n >> 0] | 0) == 46) {
          if ((a[n + 1 >> 0] | 0) != 42) {
            c[C >> 2] = n + 1;m = Vc(C) | 0;n = c[C >> 2] | 0;break;
          }q = n + 2 | 0;m = (a[q >> 0] | 0) + -48 | 0;if (m >>> 0 < 10 ? (a[n + 3 >> 0] | 0) == 36 : 0) {
            c[i + (m << 2) >> 2] = 10;m = c[g + ((a[q >> 0] | 0) + -48 << 3) >> 2] | 0;n = n + 4 | 0;c[C >> 2] = n;break;
          }if (p | 0) {
            j = -1;break a;
          }if (x) {
            v = (c[f >> 2] | 0) + (4 - 1) & ~(4 - 1);m = c[v >> 2] | 0;c[f >> 2] = v + 4;
          } else m = 0;c[C >> 2] = q;n = q;
        } else m = -1;
      } while (0);t = 0;while (1) {
        if (((a[n >> 0] | 0) + -65 | 0) >>> 0 > 57) {
          j = -1;break a;
        }v = n + 1 | 0;c[C >> 2] = v;q = a[(a[n >> 0] | 0) + -65 + (13276 + (t * 58 | 0)) >> 0] | 0;r = q & 255;if ((r + -1 | 0) >>> 0 < 8) {
          t = r;n = v;
        } else break;
      }if (!(q << 24 >> 24)) {
        j = -1;break;
      }s = (u | 0) > -1;do {
        if (q << 24 >> 24 == 19) {
          if (s) {
            j = -1;break a;
          } else w = 49;
        } else {
          if (s) {
            c[i + (u << 2) >> 2] = r;s = g + (u << 3) | 0;u = c[s + 4 >> 2] | 0;w = E;c[w >> 2] = c[s >> 2];c[w + 4 >> 2] = u;w = 49;break;
          }if (!x) {
            j = 0;break a;
          }Wc(E, r, f);
        }
      } while (0);if ((w | 0) == 49 ? (w = 0, !x) : 0) {
        k = 0;e = v;continue;
      }n = a[n >> 0] | 0;n = (t | 0) != 0 & (n & 15 | 0) == 3 ? n & -33 : n;s = o & -65537;u = (o & 8192 | 0) == 0 ? o : s;e: do {
        switch (n | 0) {case 110:
            switch ((t & 255) << 24 >> 24) {case 0:
                {
                  c[c[E >> 2] >> 2] = j;k = 0;e = v;continue a;
                }case 1:
                {
                  c[c[E >> 2] >> 2] = j;k = 0;e = v;continue a;
                }case 2:
                {
                  k = c[E >> 2] | 0;c[k >> 2] = j;c[k + 4 >> 2] = ((j | 0) < 0) << 31 >> 31;k = 0;e = v;continue a;
                }case 3:
                {
                  b[c[E >> 2] >> 1] = j;k = 0;e = v;continue a;
                }case 4:
                {
                  a[c[E >> 2] >> 0] = j;k = 0;e = v;continue a;
                }case 6:
                {
                  c[c[E >> 2] >> 2] = j;k = 0;e = v;continue a;
                }case 7:
                {
                  k = c[E >> 2] | 0;c[k >> 2] = j;c[k + 4 >> 2] = ((j | 0) < 0) << 31 >> 31;k = 0;e = v;continue a;
                }default:
                {
                  k = 0;e = v;continue a;
                }}case 112:
            {
              n = 120;m = m >>> 0 > 8 ? m : 8;e = u | 8;w = 61;break;
            }case 88:case 120:
            {
              e = u;w = 61;break;
            }case 111:
            {
              n = E;e = c[n >> 2] | 0;n = c[n + 4 >> 2] | 0;r = Yc(e, n, y) | 0;s = z - r | 0;o = 0;q = 13740;m = (u & 8 | 0) == 0 | (m | 0) > (s | 0) ? m : s + 1 | 0;s = u;w = 67;break;
            }case 105:case 100:
            {
              n = E;e = c[n >> 2] | 0;n = c[n + 4 >> 2] | 0;if ((n | 0) < 0) {
                e = Qd(0, 0, e | 0, n | 0) | 0;n = D;o = E;c[o >> 2] = e;c[o + 4 >> 2] = n;o = 1;q = 13740;w = 66;break e;
              } else {
                o = (u & 2049 | 0) != 0 & 1;q = (u & 2048 | 0) == 0 ? (u & 1 | 0) == 0 ? 13740 : 13742 : 13741;w = 66;break e;
              }
            }case 117:
            {
              n = E;o = 0;q = 13740;e = c[n >> 2] | 0;n = c[n + 4 >> 2] | 0;w = 66;break;
            }case 99:
            {
              a[A >> 0] = c[E >> 2];e = A;o = 0;q = 13740;r = y;n = 1;m = s;break;
            }case 109:
            {
              n = _c(c[(Jc() | 0) >> 2] | 0) | 0;w = 71;break;
            }case 115:
            {
              n = c[E >> 2] | 0;n = n | 0 ? n : 13750;w = 71;break;
            }case 67:
            {
              c[F >> 2] = c[E >> 2];c[B >> 2] = 0;c[E >> 2] = F;r = -1;n = F;w = 75;break;
            }case 83:
            {
              e = c[E >> 2] | 0;if (!m) {
                ad(d, 32, k, 0, u);e = 0;w = 84;
              } else {
                r = m;n = e;w = 75;
              }break;
            }case 65:case 71:case 70:case 69:case 97:case 103:case 102:case 101:
            {
              k = cd(d, +h[E >> 3], k, m, u, n) | 0;e = v;continue a;
            }default:
            {
              o = 0;q = 13740;r = y;n = m;m = u;
            }}
      } while (0);f: do {
        if ((w | 0) == 61) {
          u = E;t = c[u >> 2] | 0;u = c[u + 4 >> 2] | 0;r = Xc(t, u, y, n & 32) | 0;q = (e & 8 | 0) == 0 | (t | 0) == 0 & (u | 0) == 0;o = q ? 0 : 2;q = q ? 13740 : 13740 + (n >> 4) | 0;s = e;e = t;n = u;w = 67;
        } else if ((w | 0) == 66) {
          r = Zc(e, n, y) | 0;s = u;w = 67;
        } else if ((w | 0) == 71) {
          w = 0;u = $c(n, 0, m) | 0;t = (u | 0) == 0;e = n;o = 0;q = 13740;r = t ? n + m | 0 : u;n = t ? m : u - n | 0;m = s;
        } else if ((w | 0) == 75) {
          w = 0;q = n;e = 0;m = 0;while (1) {
            o = c[q >> 2] | 0;if (!o) break;m = bd(G, o) | 0;if ((m | 0) < 0 | m >>> 0 > (r - e | 0) >>> 0) break;e = m + e | 0;if (r >>> 0 > e >>> 0) q = q + 4 | 0;else break;
          }if ((m | 0) < 0) {
            j = -1;break a;
          }ad(d, 32, k, e, u);if (!e) {
            e = 0;w = 84;
          } else {
            o = 0;while (1) {
              m = c[n >> 2] | 0;if (!m) {
                w = 84;break f;
              }m = bd(G, m) | 0;o = m + o | 0;if ((o | 0) > (e | 0)) {
                w = 84;break f;
              }Uc(d, G, m);if (o >>> 0 >= e >>> 0) {
                w = 84;break;
              } else n = n + 4 | 0;
            }
          }
        }
      } while (0);if ((w | 0) == 67) {
        w = 0;n = (e | 0) != 0 | (n | 0) != 0;u = (m | 0) != 0 | n;n = ((n ^ 1) & 1) + (z - r) | 0;e = u ? r : y;r = y;n = u ? (m | 0) > (n | 0) ? m : n : m;m = (m | 0) > -1 ? s & -65537 : s;
      } else if ((w | 0) == 84) {
        w = 0;ad(d, 32, k, e, u ^ 8192);k = (k | 0) > (e | 0) ? k : e;e = v;continue;
      }t = r - e | 0;s = (n | 0) < (t | 0) ? t : n;u = s + o | 0;k = (k | 0) < (u | 0) ? u : k;ad(d, 32, k, u, m);Uc(d, q, o);ad(d, 48, k, u, m ^ 65536);ad(d, 48, s, t, 0);Uc(d, e, t);ad(d, 32, k, u, m ^ 8192);e = v;
    }g: do {
      if ((w | 0) == 87) if (!d) if (!p) j = 0;else {
        j = 1;while (1) {
          e = c[i + (j << 2) >> 2] | 0;if (!e) break;Wc(g + (j << 3) | 0, e, f);j = j + 1 | 0;if ((j | 0) >= 10) {
            j = 1;break g;
          }
        }while (1) {
          if (c[i + (j << 2) >> 2] | 0) {
            j = -1;break g;
          }j = j + 1 | 0;if ((j | 0) >= 10) {
            j = 1;break;
          }
        }
      }
    } while (0);l = H;return j | 0;
  }function Sc(a) {
    a = a | 0;return 0;
  }function Tc(a) {
    a = a | 0;return;
  }function Uc(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;if (!(c[a >> 2] & 32)) od(b, d, a) | 0;return;
  }function Vc(b) {
    b = b | 0;var d = 0,
        e = 0,
        f = 0;e = c[b >> 2] | 0;f = (a[e >> 0] | 0) + -48 | 0;if (f >>> 0 < 10) {
      d = 0;do {
        d = f + (d * 10 | 0) | 0;e = e + 1 | 0;c[b >> 2] = e;f = (a[e >> 0] | 0) + -48 | 0;
      } while (f >>> 0 < 10);
    } else d = 0;return d | 0;
  }function Wc(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;var e = 0,
        f = 0,
        g = 0.0;a: do {
      if (b >>> 0 <= 20) do {
        switch (b | 0) {case 9:
            {
              e = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);b = c[e >> 2] | 0;c[d >> 2] = e + 4;c[a >> 2] = b;break a;
            }case 10:
            {
              e = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);b = c[e >> 2] | 0;c[d >> 2] = e + 4;e = a;c[e >> 2] = b;c[e + 4 >> 2] = ((b | 0) < 0) << 31 >> 31;break a;
            }case 11:
            {
              e = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);b = c[e >> 2] | 0;c[d >> 2] = e + 4;e = a;c[e >> 2] = b;c[e + 4 >> 2] = 0;break a;
            }case 12:
            {
              e = (c[d >> 2] | 0) + (8 - 1) & ~(8 - 1);b = e;f = c[b >> 2] | 0;b = c[b + 4 >> 2] | 0;c[d >> 2] = e + 8;e = a;c[e >> 2] = f;c[e + 4 >> 2] = b;break a;
            }case 13:
            {
              f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);e = c[f >> 2] | 0;c[d >> 2] = f + 4;e = (e & 65535) << 16 >> 16;f = a;c[f >> 2] = e;c[f + 4 >> 2] = ((e | 0) < 0) << 31 >> 31;break a;
            }case 14:
            {
              f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);e = c[f >> 2] | 0;c[d >> 2] = f + 4;f = a;c[f >> 2] = e & 65535;c[f + 4 >> 2] = 0;break a;
            }case 15:
            {
              f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);e = c[f >> 2] | 0;c[d >> 2] = f + 4;e = (e & 255) << 24 >> 24;f = a;c[f >> 2] = e;c[f + 4 >> 2] = ((e | 0) < 0) << 31 >> 31;break a;
            }case 16:
            {
              f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);e = c[f >> 2] | 0;c[d >> 2] = f + 4;f = a;c[f >> 2] = e & 255;c[f + 4 >> 2] = 0;break a;
            }case 17:
            {
              f = (c[d >> 2] | 0) + (8 - 1) & ~(8 - 1);g = +h[f >> 3];c[d >> 2] = f + 8;h[a >> 3] = g;break a;
            }case 18:
            {
              f = (c[d >> 2] | 0) + (8 - 1) & ~(8 - 1);g = +h[f >> 3];c[d >> 2] = f + 8;h[a >> 3] = g;break a;
            }default:
            break a;}
      } while (0);
    } while (0);return;
  }function Xc(b, c, e, f) {
    b = b | 0;c = c | 0;e = e | 0;f = f | 0;if (!((b | 0) == 0 & (c | 0) == 0)) do {
      e = e + -1 | 0;a[e >> 0] = d[13792 + (b & 15) >> 0] | 0 | f;b = Td(b | 0, c | 0, 4) | 0;c = D;
    } while (!((b | 0) == 0 & (c | 0) == 0));return e | 0;
  }function Yc(b, c, d) {
    b = b | 0;c = c | 0;d = d | 0;if (!((b | 0) == 0 & (c | 0) == 0)) do {
      d = d + -1 | 0;a[d >> 0] = b & 7 | 48;b = Td(b | 0, c | 0, 3) | 0;c = D;
    } while (!((b | 0) == 0 & (c | 0) == 0));return d | 0;
  }function Zc(b, c, d) {
    b = b | 0;c = c | 0;d = d | 0;var e = 0;if (c >>> 0 > 0 | (c | 0) == 0 & b >>> 0 > 4294967295) {
      while (1) {
        e = $d(b | 0, c | 0, 10, 0) | 0;d = d + -1 | 0;a[d >> 0] = e & 255 | 48;e = b;b = Xd(b | 0, c | 0, 10, 0) | 0;if (!(c >>> 0 > 9 | (c | 0) == 9 & e >>> 0 > 4294967295)) break;else c = D;
      }c = b;
    } else c = b;if (c) while (1) {
      d = d + -1 | 0;a[d >> 0] = (c >>> 0) % 10 | 0 | 48;if (c >>> 0 < 10) break;else c = (c >>> 0) / 10 | 0;
    }return d | 0;
  }function _c(a) {
    a = a | 0;return jd(a, c[(id() | 0) + 188 >> 2] | 0) | 0;
  }function $c(b, d, e) {
    b = b | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0,
        i = 0;h = d & 255;f = (e | 0) != 0;a: do {
      if (f & (b & 3 | 0) != 0) {
        g = d & 255;while (1) {
          if ((a[b >> 0] | 0) == g << 24 >> 24) {
            i = 6;break a;
          }b = b + 1 | 0;e = e + -1 | 0;f = (e | 0) != 0;if (!(f & (b & 3 | 0) != 0)) {
            i = 5;break;
          }
        }
      } else i = 5;
    } while (0);if ((i | 0) == 5) if (f) i = 6;else e = 0;b: do {
      if ((i | 0) == 6) {
        g = d & 255;if ((a[b >> 0] | 0) != g << 24 >> 24) {
          f = S(h, 16843009) | 0;c: do {
            if (e >>> 0 > 3) while (1) {
              h = c[b >> 2] ^ f;if ((h & -2139062144 ^ -2139062144) & h + -16843009 | 0) break;b = b + 4 | 0;e = e + -4 | 0;if (e >>> 0 <= 3) {
                i = 11;break c;
              }
            } else i = 11;
          } while (0);if ((i | 0) == 11) if (!e) {
            e = 0;break;
          }while (1) {
            if ((a[b >> 0] | 0) == g << 24 >> 24) break b;b = b + 1 | 0;e = e + -1 | 0;if (!e) {
              e = 0;break;
            }
          }
        }
      }
    } while (0);return (e | 0 ? b : 0) | 0;
  }function ad(a, b, c, d, e) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0;g = l;l = l + 256 | 0;f = g;if ((c | 0) > (d | 0) & (e & 73728 | 0) == 0) {
      e = c - d | 0;Sd(f | 0, b | 0, (e >>> 0 < 256 ? e : 256) | 0) | 0;if (e >>> 0 > 255) {
        b = c - d | 0;do {
          Uc(a, f, 256);e = e + -256 | 0;
        } while (e >>> 0 > 255);e = b & 255;
      }Uc(a, f, e);
    }l = g;return;
  }function bd(a, b) {
    a = a | 0;b = b | 0;if (!a) a = 0;else a = gd(a, b, 0) | 0;return a | 0;
  }function cd(b, e, f, g, h, i) {
    b = b | 0;e = +e;f = f | 0;g = g | 0;h = h | 0;i = i | 0;var j = 0,
        k = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0.0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        E = 0,
        F = 0,
        G = 0,
        H = 0;H = l;l = l + 560 | 0;m = H + 8 | 0;u = H;G = H + 524 | 0;F = G;n = H + 512 | 0;c[u >> 2] = 0;E = n + 12 | 0;dd(e) | 0;if ((D | 0) < 0) {
      e = -e;B = 1;A = 13757;
    } else {
      B = (h & 2049 | 0) != 0 & 1;A = (h & 2048 | 0) == 0 ? (h & 1 | 0) == 0 ? 13758 : 13763 : 13760;
    }dd(e) | 0;C = D & 2146435072;do {
      if (C >>> 0 < 2146435072 | (C | 0) == 2146435072 & 0 < 0) {
        r = +ed(e, u) * 2.0;j = r != 0.0;if (j) c[u >> 2] = (c[u >> 2] | 0) + -1;w = i | 32;if ((w | 0) == 97) {
          s = i & 32;q = (s | 0) == 0 ? A : A + 9 | 0;p = B | 2;j = 12 - g | 0;do {
            if (!(g >>> 0 > 11 | (j | 0) == 0)) {
              e = 8.0;do {
                j = j + -1 | 0;e = e * 16.0;
              } while ((j | 0) != 0);if ((a[q >> 0] | 0) == 45) {
                e = -(e + (-r - e));break;
              } else {
                e = r + e - e;break;
              }
            } else e = r;
          } while (0);k = c[u >> 2] | 0;j = (k | 0) < 0 ? 0 - k | 0 : k;j = Zc(j, ((j | 0) < 0) << 31 >> 31, E) | 0;if ((j | 0) == (E | 0)) {
            j = n + 11 | 0;a[j >> 0] = 48;
          }a[j + -1 >> 0] = (k >> 31 & 2) + 43;o = j + -2 | 0;a[o >> 0] = i + 15;n = (g | 0) < 1;m = (h & 8 | 0) == 0;j = G;do {
            C = ~~e;k = j + 1 | 0;a[j >> 0] = d[13792 + C >> 0] | s;e = (e - +(C | 0)) * 16.0;if ((k - F | 0) == 1 ? !(m & (n & e == 0.0)) : 0) {
              a[k >> 0] = 46;j = j + 2 | 0;
            } else j = k;
          } while (e != 0.0);C = j - F | 0;F = E - o | 0;E = (g | 0) != 0 & (C + -2 | 0) < (g | 0) ? g + 2 | 0 : C;j = F + p + E | 0;ad(b, 32, f, j, h);Uc(b, q, p);ad(b, 48, f, j, h ^ 65536);Uc(b, G, C);ad(b, 48, E - C | 0, 0, 0);Uc(b, o, F);ad(b, 32, f, j, h ^ 8192);break;
        }k = (g | 0) < 0 ? 6 : g;if (j) {
          j = (c[u >> 2] | 0) + -28 | 0;c[u >> 2] = j;e = r * 268435456.0;
        } else {
          e = r;j = c[u >> 2] | 0;
        }C = (j | 0) < 0 ? m : m + 288 | 0;m = C;do {
          y = ~~e >>> 0;c[m >> 2] = y;m = m + 4 | 0;e = (e - +(y >>> 0)) * 1.0e9;
        } while (e != 0.0);if ((j | 0) > 0) {
          n = C;p = m;while (1) {
            o = (j | 0) < 29 ? j : 29;j = p + -4 | 0;if (j >>> 0 >= n >>> 0) {
              m = 0;do {
                x = Ud(c[j >> 2] | 0, 0, o | 0) | 0;x = Rd(x | 0, D | 0, m | 0, 0) | 0;y = D;v = $d(x | 0, y | 0, 1e9, 0) | 0;c[j >> 2] = v;m = Xd(x | 0, y | 0, 1e9, 0) | 0;j = j + -4 | 0;
              } while (j >>> 0 >= n >>> 0);if (m) {
                n = n + -4 | 0;c[n >> 2] = m;
              }
            }m = p;while (1) {
              if (m >>> 0 <= n >>> 0) break;j = m + -4 | 0;if (!(c[j >> 2] | 0)) m = j;else break;
            }j = (c[u >> 2] | 0) - o | 0;c[u >> 2] = j;if ((j | 0) > 0) p = m;else break;
          }
        } else n = C;if ((j | 0) < 0) {
          g = ((k + 25 | 0) / 9 | 0) + 1 | 0;t = (w | 0) == 102;do {
            s = 0 - j | 0;s = (s | 0) < 9 ? s : 9;if (n >>> 0 < m >>> 0) {
              o = (1 << s) + -1 | 0;p = 1e9 >>> s;q = 0;j = n;do {
                y = c[j >> 2] | 0;c[j >> 2] = (y >>> s) + q;q = S(y & o, p) | 0;j = j + 4 | 0;
              } while (j >>> 0 < m >>> 0);j = (c[n >> 2] | 0) == 0 ? n + 4 | 0 : n;if (!q) {
                n = j;j = m;
              } else {
                c[m >> 2] = q;n = j;j = m + 4 | 0;
              }
            } else {
              n = (c[n >> 2] | 0) == 0 ? n + 4 | 0 : n;j = m;
            }m = t ? C : n;m = (j - m >> 2 | 0) > (g | 0) ? m + (g << 2) | 0 : j;j = (c[u >> 2] | 0) + s | 0;c[u >> 2] = j;
          } while ((j | 0) < 0);j = n;g = m;
        } else {
          j = n;g = m;
        }y = C;if (j >>> 0 < g >>> 0) {
          m = (y - j >> 2) * 9 | 0;o = c[j >> 2] | 0;if (o >>> 0 >= 10) {
            n = 10;do {
              n = n * 10 | 0;m = m + 1 | 0;
            } while (o >>> 0 >= n >>> 0);
          }
        } else m = 0;t = (w | 0) == 103;v = (k | 0) != 0;n = k - ((w | 0) != 102 ? m : 0) + ((v & t) << 31 >> 31) | 0;if ((n | 0) < (((g - y >> 2) * 9 | 0) + -9 | 0)) {
          n = n + 9216 | 0;s = C + 4 + (((n | 0) / 9 | 0) + -1024 << 2) | 0;n = ((n | 0) % 9 | 0) + 1 | 0;if ((n | 0) < 9) {
            o = 10;do {
              o = o * 10 | 0;n = n + 1 | 0;
            } while ((n | 0) != 9);
          } else o = 10;p = c[s >> 2] | 0;q = (p >>> 0) % (o >>> 0) | 0;n = (s + 4 | 0) == (g | 0);if (!(n & (q | 0) == 0)) {
            r = (((p >>> 0) / (o >>> 0) | 0) & 1 | 0) == 0 ? 9007199254740992.0 : 9007199254740994.0;x = (o | 0) / 2 | 0;e = q >>> 0 < x >>> 0 ? .5 : n & (q | 0) == (x | 0) ? 1.0 : 1.5;if (B) {
              x = (a[A >> 0] | 0) == 45;e = x ? -e : e;r = x ? -r : r;
            }n = p - q | 0;c[s >> 2] = n;if (r + e != r) {
              x = n + o | 0;c[s >> 2] = x;if (x >>> 0 > 999999999) {
                m = s;while (1) {
                  n = m + -4 | 0;c[m >> 2] = 0;if (n >>> 0 < j >>> 0) {
                    j = j + -4 | 0;c[j >> 2] = 0;
                  }x = (c[n >> 2] | 0) + 1 | 0;c[n >> 2] = x;if (x >>> 0 > 999999999) m = n;else break;
                }
              } else n = s;m = (y - j >> 2) * 9 | 0;p = c[j >> 2] | 0;if (p >>> 0 >= 10) {
                o = 10;do {
                  o = o * 10 | 0;m = m + 1 | 0;
                } while (p >>> 0 >= o >>> 0);
              }
            } else n = s;
          } else n = s;n = n + 4 | 0;n = g >>> 0 > n >>> 0 ? n : g;x = j;
        } else {
          n = g;x = j;
        }w = n;while (1) {
          if (w >>> 0 <= x >>> 0) {
            u = 0;break;
          }j = w + -4 | 0;if (!(c[j >> 2] | 0)) w = j;else {
            u = 1;break;
          }
        }g = 0 - m | 0;do {
          if (t) {
            j = ((v ^ 1) & 1) + k | 0;if ((j | 0) > (m | 0) & (m | 0) > -5) {
              o = i + -1 | 0;k = j + -1 - m | 0;
            } else {
              o = i + -2 | 0;k = j + -1 | 0;
            }j = h & 8;if (!j) {
              if (u ? (z = c[w + -4 >> 2] | 0, (z | 0) != 0) : 0) {
                if (!((z >>> 0) % 10 | 0)) {
                  n = 0;j = 10;do {
                    j = j * 10 | 0;n = n + 1 | 0;
                  } while (!((z >>> 0) % (j >>> 0) | 0 | 0));
                } else n = 0;
              } else n = 9;j = ((w - y >> 2) * 9 | 0) + -9 | 0;if ((o | 32 | 0) == 102) {
                s = j - n | 0;s = (s | 0) > 0 ? s : 0;k = (k | 0) < (s | 0) ? k : s;s = 0;break;
              } else {
                s = j + m - n | 0;s = (s | 0) > 0 ? s : 0;k = (k | 0) < (s | 0) ? k : s;s = 0;break;
              }
            } else s = j;
          } else {
            o = i;s = h & 8;
          }
        } while (0);t = k | s;p = (t | 0) != 0 & 1;q = (o | 32 | 0) == 102;if (q) {
          v = 0;j = (m | 0) > 0 ? m : 0;
        } else {
          j = (m | 0) < 0 ? g : m;j = Zc(j, ((j | 0) < 0) << 31 >> 31, E) | 0;n = E;if ((n - j | 0) < 2) do {
            j = j + -1 | 0;a[j >> 0] = 48;
          } while ((n - j | 0) < 2);a[j + -1 >> 0] = (m >> 31 & 2) + 43;j = j + -2 | 0;a[j >> 0] = o;v = j;j = n - j | 0;
        }j = B + 1 + k + p + j | 0;ad(b, 32, f, j, h);Uc(b, A, B);ad(b, 48, f, j, h ^ 65536);if (q) {
          o = x >>> 0 > C >>> 0 ? C : x;s = G + 9 | 0;p = s;q = G + 8 | 0;n = o;do {
            m = Zc(c[n >> 2] | 0, 0, s) | 0;if ((n | 0) == (o | 0)) {
              if ((m | 0) == (s | 0)) {
                a[q >> 0] = 48;m = q;
              }
            } else if (m >>> 0 > G >>> 0) {
              Sd(G | 0, 48, m - F | 0) | 0;do {
                m = m + -1 | 0;
              } while (m >>> 0 > G >>> 0);
            }Uc(b, m, p - m | 0);n = n + 4 | 0;
          } while (n >>> 0 <= C >>> 0);if (t | 0) Uc(b, 13808, 1);if (n >>> 0 < w >>> 0 & (k | 0) > 0) while (1) {
            m = Zc(c[n >> 2] | 0, 0, s) | 0;if (m >>> 0 > G >>> 0) {
              Sd(G | 0, 48, m - F | 0) | 0;do {
                m = m + -1 | 0;
              } while (m >>> 0 > G >>> 0);
            }Uc(b, m, (k | 0) < 9 ? k : 9);n = n + 4 | 0;m = k + -9 | 0;if (!(n >>> 0 < w >>> 0 & (k | 0) > 9)) {
              k = m;break;
            } else k = m;
          }ad(b, 48, k + 9 | 0, 9, 0);
        } else {
          t = u ? w : x + 4 | 0;if ((k | 0) > -1) {
            u = G + 9 | 0;s = (s | 0) == 0;g = u;p = 0 - F | 0;q = G + 8 | 0;o = x;do {
              m = Zc(c[o >> 2] | 0, 0, u) | 0;if ((m | 0) == (u | 0)) {
                a[q >> 0] = 48;m = q;
              }do {
                if ((o | 0) == (x | 0)) {
                  n = m + 1 | 0;Uc(b, m, 1);if (s & (k | 0) < 1) {
                    m = n;break;
                  }Uc(b, 13808, 1);m = n;
                } else {
                  if (m >>> 0 <= G >>> 0) break;Sd(G | 0, 48, m + p | 0) | 0;do {
                    m = m + -1 | 0;
                  } while (m >>> 0 > G >>> 0);
                }
              } while (0);F = g - m | 0;Uc(b, m, (k | 0) > (F | 0) ? F : k);k = k - F | 0;o = o + 4 | 0;
            } while (o >>> 0 < t >>> 0 & (k | 0) > -1);
          }ad(b, 48, k + 18 | 0, 18, 0);Uc(b, v, E - v | 0);
        }ad(b, 32, f, j, h ^ 8192);
      } else {
        G = (i & 32 | 0) != 0;j = B + 3 | 0;ad(b, 32, f, j, h & -65537);Uc(b, A, B);Uc(b, e != e | 0.0 != 0.0 ? G ? 13784 : 13788 : G ? 13776 : 13780, 3);ad(b, 32, f, j, h ^ 8192);
      }
    } while (0);l = H;return ((j | 0) < (f | 0) ? f : j) | 0;
  }function dd(a) {
    a = +a;var b = 0;h[j >> 3] = a;b = c[j >> 2] | 0;D = c[j + 4 >> 2] | 0;return b | 0;
  }function ed(a, b) {
    a = +a;b = b | 0;return + +fd(a, b);
  }function fd(a, b) {
    a = +a;b = b | 0;var d = 0,
        e = 0,
        f = 0;h[j >> 3] = a;d = c[j >> 2] | 0;e = c[j + 4 >> 2] | 0;f = Td(d | 0, e | 0, 52) | 0;switch (f & 2047) {case 0:
        {
          if (a != 0.0) {
            a = +fd(a * 18446744073709551616.0, b);d = (c[b >> 2] | 0) + -64 | 0;
          } else d = 0;c[b >> 2] = d;break;
        }case 2047:
        break;default:
        {
          c[b >> 2] = (f & 2047) + -1022;c[j >> 2] = d;c[j + 4 >> 2] = e & -2146435073 | 1071644672;a = +h[j >> 3];
        }}return +a;
  }function gd(b, d, e) {
    b = b | 0;d = d | 0;e = e | 0;do {
      if (b) {
        if (d >>> 0 < 128) {
          a[b >> 0] = d;b = 1;break;
        }if (!(c[c[(hd() | 0) + 188 >> 2] >> 2] | 0)) if ((d & -128 | 0) == 57216) {
          a[b >> 0] = d;b = 1;break;
        } else {
          c[(Jc() | 0) >> 2] = 84;b = -1;break;
        }if (d >>> 0 < 2048) {
          a[b >> 0] = d >>> 6 | 192;a[b + 1 >> 0] = d & 63 | 128;b = 2;break;
        }if (d >>> 0 < 55296 | (d & -8192 | 0) == 57344) {
          a[b >> 0] = d >>> 12 | 224;a[b + 1 >> 0] = d >>> 6 & 63 | 128;a[b + 2 >> 0] = d & 63 | 128;b = 3;break;
        }if ((d + -65536 | 0) >>> 0 < 1048576) {
          a[b >> 0] = d >>> 18 | 240;a[b + 1 >> 0] = d >>> 12 & 63 | 128;a[b + 2 >> 0] = d >>> 6 & 63 | 128;a[b + 3 >> 0] = d & 63 | 128;b = 4;break;
        } else {
          c[(Jc() | 0) >> 2] = 84;b = -1;break;
        }
      } else b = 1;
    } while (0);return b | 0;
  }function hd() {
    return Lc() | 0;
  }function id() {
    return Lc() | 0;
  }function jd(b, e) {
    b = b | 0;e = e | 0;var f = 0,
        g = 0;g = 0;while (1) {
      if ((d[13810 + g >> 0] | 0) == (b | 0)) {
        b = 2;break;
      }f = g + 1 | 0;if ((f | 0) == 87) {
        f = 13898;g = 87;b = 5;break;
      } else g = f;
    }if ((b | 0) == 2) if (!g) f = 13898;else {
      f = 13898;b = 5;
    }if ((b | 0) == 5) while (1) {
      do {
        b = f;f = f + 1 | 0;
      } while ((a[b >> 0] | 0) != 0);g = g + -1 | 0;if (!g) break;else b = 5;
    }return kd(f, c[e + 20 >> 2] | 0) | 0;
  }function kd(a, b) {
    a = a | 0;b = b | 0;return ld(a, b) | 0;
  }function ld(a, b) {
    a = a | 0;b = b | 0;if (!b) b = 0;else b = md(c[b >> 2] | 0, c[b + 4 >> 2] | 0, a) | 0;return (b | 0 ? b : a) | 0;
  }function md(b, d, e) {
    b = b | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0;o = (c[b >> 2] | 0) + 1794895138 | 0;h = nd(c[b + 8 >> 2] | 0, o) | 0;f = nd(c[b + 12 >> 2] | 0, o) | 0;g = nd(c[b + 16 >> 2] | 0, o) | 0;a: do {
      if ((h >>> 0 < d >>> 2 >>> 0 ? (n = d - (h << 2) | 0, f >>> 0 < n >>> 0 & g >>> 0 < n >>> 0) : 0) ? ((g | f) & 3 | 0) == 0 : 0) {
        n = f >>> 2;m = g >>> 2;l = 0;while (1) {
          j = h >>> 1;k = l + j | 0;i = k << 1;g = i + n | 0;f = nd(c[b + (g << 2) >> 2] | 0, o) | 0;g = nd(c[b + (g + 1 << 2) >> 2] | 0, o) | 0;if (!(g >>> 0 < d >>> 0 & f >>> 0 < (d - g | 0) >>> 0)) {
            f = 0;break a;
          }if (a[b + (g + f) >> 0] | 0) {
            f = 0;break a;
          }f = Oc(e, b + g | 0) | 0;if (!f) break;f = (f | 0) < 0;if ((h | 0) == 1) {
            f = 0;break a;
          } else {
            l = f ? l : k;h = f ? j : h - j | 0;
          }
        }f = i + m | 0;g = nd(c[b + (f << 2) >> 2] | 0, o) | 0;f = nd(c[b + (f + 1 << 2) >> 2] | 0, o) | 0;if (f >>> 0 < d >>> 0 & g >>> 0 < (d - f | 0) >>> 0) f = (a[b + (f + g) >> 0] | 0) == 0 ? b + f | 0 : 0;else f = 0;
      } else f = 0;
    } while (0);return f | 0;
  }function nd(a, b) {
    a = a | 0;b = b | 0;var c = 0;c = be(a | 0) | 0;return ((b | 0) == 0 ? a : c) | 0;
  }function od(b, d, e) {
    b = b | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;f = e + 16 | 0;g = c[f >> 2] | 0;if (!g) {
      if (!(pd(e) | 0)) {
        g = c[f >> 2] | 0;h = 5;
      } else f = 0;
    } else h = 5;a: do {
      if ((h | 0) == 5) {
        j = e + 20 | 0;i = c[j >> 2] | 0;f = i;if ((g - i | 0) >>> 0 < d >>> 0) {
          f = ya[c[e + 36 >> 2] & 15](e, b, d) | 0;break;
        }b: do {
          if ((a[e + 75 >> 0] | 0) > -1) {
            i = d;while (1) {
              if (!i) {
                h = 0;g = b;break b;
              }g = i + -1 | 0;if ((a[b + g >> 0] | 0) == 10) break;else i = g;
            }f = ya[c[e + 36 >> 2] & 15](e, b, i) | 0;if (f >>> 0 < i >>> 0) break a;h = i;g = b + i | 0;d = d - i | 0;f = c[j >> 2] | 0;
          } else {
            h = 0;g = b;
          }
        } while (0);Zd(f | 0, g | 0, d | 0) | 0;c[j >> 2] = (c[j >> 2] | 0) + d;f = h + d | 0;
      }
    } while (0);return f | 0;
  }function pd(b) {
    b = b | 0;var d = 0,
        e = 0;d = b + 74 | 0;e = a[d >> 0] | 0;a[d >> 0] = e + 255 | e;d = c[b >> 2] | 0;if (!(d & 8)) {
      c[b + 8 >> 2] = 0;c[b + 4 >> 2] = 0;e = c[b + 44 >> 2] | 0;c[b + 28 >> 2] = e;c[b + 20 >> 2] = e;c[b + 16 >> 2] = e + (c[b + 48 >> 2] | 0);b = 0;
    } else {
      c[b >> 2] = d | 32;b = -1;
    }return b | 0;
  }function qd(b) {
    b = b | 0;var d = 0,
        e = 0,
        f = 0;f = b;a: do {
      if (!(f & 3)) e = 4;else {
        d = f;while (1) {
          if (!(a[b >> 0] | 0)) {
            b = d;break a;
          }b = b + 1 | 0;d = b;if (!(d & 3)) {
            e = 4;break;
          }
        }
      }
    } while (0);if ((e | 0) == 4) {
      while (1) {
        d = c[b >> 2] | 0;if (!((d & -2139062144 ^ -2139062144) & d + -16843009)) b = b + 4 | 0;else break;
      }if ((d & 255) << 24 >> 24) do {
        b = b + 1 | 0;
      } while ((a[b >> 0] | 0) != 0);
    }return b - f | 0;
  }function rd(a, b) {
    a = a | 0;b = b | 0;var c = 0;c = qd(a) | 0;return ((sd(a, 1, c, b) | 0) != (c | 0)) << 31 >> 31 | 0;
  }function sd(a, b, d, e) {
    a = a | 0;b = b | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0;f = S(d, b) | 0;d = (b | 0) == 0 ? 0 : d;if ((c[e + 76 >> 2] | 0) > -1) {
      g = (Sc(e) | 0) == 0;a = od(a, f, e) | 0;if (!g) Tc(e);
    } else a = od(a, f, e) | 0;if ((a | 0) != (f | 0)) d = (a >>> 0) / (b >>> 0) | 0;return d | 0;
  }function td(b, e) {
    b = b | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0;m = l;l = l + 16 | 0;j = m;k = e & 255;a[j >> 0] = k;g = b + 16 | 0;h = c[g >> 2] | 0;if (!h) {
      if (!(pd(b) | 0)) {
        h = c[g >> 2] | 0;i = 4;
      } else f = -1;
    } else i = 4;do {
      if ((i | 0) == 4) {
        i = b + 20 | 0;g = c[i >> 2] | 0;if (g >>> 0 < h >>> 0 ? (f = e & 255, (f | 0) != (a[b + 75 >> 0] | 0)) : 0) {
          c[i >> 2] = g + 1;a[g >> 0] = k;break;
        }if ((ya[c[b + 36 >> 2] & 15](b, j, 1) | 0) == 1) f = d[j >> 0] | 0;else f = -1;
      }
    } while (0);l = m;return f | 0;
  }function ud() {
    la(15768);return 15776;
  }function vd() {
    sa(15768);return;
  }function wd(a) {
    a = a | 0;var b = 0,
        d = 0;do {
      if (a) {
        if ((c[a + 76 >> 2] | 0) <= -1) {
          b = xd(a) | 0;break;
        }d = (Sc(a) | 0) == 0;b = xd(a) | 0;if (!d) Tc(a);
      } else {
        if (!(c[642] | 0)) b = 0;else b = wd(c[642] | 0) | 0;a = c[(ud() | 0) >> 2] | 0;if (a) do {
          if ((c[a + 76 >> 2] | 0) > -1) d = Sc(a) | 0;else d = 0;if ((c[a + 20 >> 2] | 0) >>> 0 > (c[a + 28 >> 2] | 0) >>> 0) b = xd(a) | 0 | b;if (d | 0) Tc(a);a = c[a + 56 >> 2] | 0;
        } while ((a | 0) != 0);vd();
      }
    } while (0);return b | 0;
  }function xd(a) {
    a = a | 0;var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;b = a + 20 | 0;h = a + 28 | 0;if ((c[b >> 2] | 0) >>> 0 > (c[h >> 2] | 0) >>> 0 ? (ya[c[a + 36 >> 2] & 15](a, 0, 0) | 0, (c[b >> 2] | 0) == 0) : 0) a = -1;else {
      d = a + 4 | 0;e = c[d >> 2] | 0;f = a + 8 | 0;g = c[f >> 2] | 0;if (e >>> 0 < g >>> 0) ya[c[a + 40 >> 2] & 15](a, e - g | 0, 1) | 0;c[a + 16 >> 2] = 0;c[h >> 2] = 0;c[b >> 2] = 0;c[f >> 2] = 0;c[d >> 2] = 0;a = 0;
    }return a | 0;
  }function yd(a, b, d) {
    a = a | 0;b = b | 0;d = d | 0;var e = 0,
        f = 0;e = l;l = l + 16 | 0;f = e;c[f >> 2] = d;d = Qc(a, b, f) | 0;l = e;return d | 0;
  }function zd(a) {
    a = a | 0;return Ad(a) | 0;
  }function Ad(a) {
    a = a | 0;return ae(a | 0) | 0;
  }function Bd(a) {
    a = a | 0;return Cd(a) | 0;
  }function Cd(a) {
    a = a | 0;return ae(a | 0) | 0;
  }function Dd(b) {
    b = b | 0;var d = 0,
        e = 0,
        f = 0,
        g = 0;f = c[610] | 0;if ((c[f + 76 >> 2] | 0) > -1) g = Sc(f) | 0;else g = 0;do {
      if ((rd(b, f) | 0) < 0) b = 1;else {
        if ((a[f + 75 >> 0] | 0) != 10 ? (d = f + 20 | 0, e = c[d >> 2] | 0, e >>> 0 < (c[f + 16 >> 2] | 0) >>> 0) : 0) {
          c[d >> 2] = e + 1;a[e >> 0] = 10;b = 0;break;
        }b = (td(f, 10) | 0) < 0;
      }
    } while (0);if (g | 0) Tc(f);return b << 31 >> 31 | 0;
  }function Ed(a) {
    a = a | 0;var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        E = 0,
        F = 0,
        G = 0,
        H = 0,
        I = 0,
        J = 0,
        K = 0;K = l;l = l + 16 | 0;o = K;do {
      if (a >>> 0 < 245) {
        p = a >>> 0 < 11 ? 16 : a + 11 & -8;a = p >>> 3;t = c[3945] | 0;d = t >>> a;if (d & 3 | 0) {
          a = (d & 1 ^ 1) + a | 0;d = 15820 + (a << 1 << 2) | 0;e = d + 8 | 0;f = c[e >> 2] | 0;g = f + 8 | 0;h = c[g >> 2] | 0;do {
            if ((d | 0) != (h | 0)) {
              if (h >>> 0 < (c[3949] | 0) >>> 0) ma();b = h + 12 | 0;if ((c[b >> 2] | 0) == (f | 0)) {
                c[b >> 2] = d;c[e >> 2] = h;break;
              } else ma();
            } else c[3945] = t & ~(1 << a);
          } while (0);J = a << 3;c[f + 4 >> 2] = J | 3;J = f + J + 4 | 0;c[J >> 2] = c[J >> 2] | 1;J = g;l = K;return J | 0;
        }s = c[3947] | 0;if (p >>> 0 > s >>> 0) {
          if (d | 0) {
            i = 2 << a;a = d << a & (i | 0 - i);a = (a & 0 - a) + -1 | 0;i = a >>> 12 & 16;a = a >>> i;e = a >>> 5 & 8;a = a >>> e;g = a >>> 2 & 4;a = a >>> g;d = a >>> 1 & 2;a = a >>> d;b = a >>> 1 & 1;b = (e | i | g | d | b) + (a >>> b) | 0;a = 15820 + (b << 1 << 2) | 0;d = a + 8 | 0;g = c[d >> 2] | 0;i = g + 8 | 0;e = c[i >> 2] | 0;do {
              if ((a | 0) != (e | 0)) {
                if (e >>> 0 < (c[3949] | 0) >>> 0) ma();f = e + 12 | 0;if ((c[f >> 2] | 0) == (g | 0)) {
                  c[f >> 2] = a;c[d >> 2] = e;j = t;break;
                } else ma();
              } else {
                j = t & ~(1 << b);c[3945] = j;
              }
            } while (0);h = (b << 3) - p | 0;c[g + 4 >> 2] = p | 3;e = g + p | 0;c[e + 4 >> 2] = h | 1;c[e + h >> 2] = h;if (s | 0) {
              f = c[3950] | 0;b = s >>> 3;d = 15820 + (b << 1 << 2) | 0;b = 1 << b;if (j & b) {
                b = d + 8 | 0;a = c[b >> 2] | 0;if (a >>> 0 < (c[3949] | 0) >>> 0) ma();else {
                  k = a;m = b;
                }
              } else {
                c[3945] = j | b;k = d;m = d + 8 | 0;
              }c[m >> 2] = f;c[k + 12 >> 2] = f;c[f + 8 >> 2] = k;c[f + 12 >> 2] = d;
            }c[3947] = h;c[3950] = e;J = i;l = K;return J | 0;
          }k = c[3946] | 0;if (k) {
            a = (k & 0 - k) + -1 | 0;I = a >>> 12 & 16;a = a >>> I;H = a >>> 5 & 8;a = a >>> H;J = a >>> 2 & 4;a = a >>> J;d = a >>> 1 & 2;a = a >>> d;b = a >>> 1 & 1;b = c[16084 + ((H | I | J | d | b) + (a >>> b) << 2) >> 2] | 0;a = (c[b + 4 >> 2] & -8) - p | 0;d = c[b + 16 + (((c[b + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0;if (!d) {
              j = b;h = a;
            } else {
              do {
                I = (c[d + 4 >> 2] & -8) - p | 0;J = I >>> 0 < a >>> 0;a = J ? I : a;b = J ? d : b;d = c[d + 16 + (((c[d + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0;
              } while ((d | 0) != 0);j = b;h = a;
            }f = c[3949] | 0;if (j >>> 0 < f >>> 0) ma();i = j + p | 0;if (j >>> 0 >= i >>> 0) ma();g = c[j + 24 >> 2] | 0;d = c[j + 12 >> 2] | 0;do {
              if ((d | 0) == (j | 0)) {
                a = j + 20 | 0;b = c[a >> 2] | 0;if (!b) {
                  a = j + 16 | 0;b = c[a >> 2] | 0;if (!b) {
                    n = 0;break;
                  }
                }while (1) {
                  d = b + 20 | 0;e = c[d >> 2] | 0;if (e | 0) {
                    b = e;a = d;continue;
                  }d = b + 16 | 0;e = c[d >> 2] | 0;if (!e) break;else {
                    b = e;a = d;
                  }
                }if (a >>> 0 < f >>> 0) ma();else {
                  c[a >> 2] = 0;n = b;break;
                }
              } else {
                e = c[j + 8 >> 2] | 0;if (e >>> 0 < f >>> 0) ma();b = e + 12 | 0;if ((c[b >> 2] | 0) != (j | 0)) ma();a = d + 8 | 0;if ((c[a >> 2] | 0) == (j | 0)) {
                  c[b >> 2] = d;c[a >> 2] = e;n = d;break;
                } else ma();
              }
            } while (0);a: do {
              if (g | 0) {
                b = c[j + 28 >> 2] | 0;a = 16084 + (b << 2) | 0;do {
                  if ((j | 0) == (c[a >> 2] | 0)) {
                    c[a >> 2] = n;if (!n) {
                      c[3946] = k & ~(1 << b);break a;
                    }
                  } else if (g >>> 0 >= (c[3949] | 0) >>> 0) {
                    c[g + 16 + (((c[g + 16 >> 2] | 0) != (j | 0) & 1) << 2) >> 2] = n;if (!n) break a;else break;
                  } else ma();
                } while (0);a = c[3949] | 0;if (n >>> 0 < a >>> 0) ma();c[n + 24 >> 2] = g;b = c[j + 16 >> 2] | 0;do {
                  if (b | 0) if (b >>> 0 < a >>> 0) ma();else {
                    c[n + 16 >> 2] = b;c[b + 24 >> 2] = n;break;
                  }
                } while (0);b = c[j + 20 >> 2] | 0;if (b | 0) if (b >>> 0 < (c[3949] | 0) >>> 0) ma();else {
                  c[n + 20 >> 2] = b;c[b + 24 >> 2] = n;break;
                }
              }
            } while (0);if (h >>> 0 < 16) {
              J = h + p | 0;c[j + 4 >> 2] = J | 3;J = j + J + 4 | 0;c[J >> 2] = c[J >> 2] | 1;
            } else {
              c[j + 4 >> 2] = p | 3;c[i + 4 >> 2] = h | 1;c[i + h >> 2] = h;if (s | 0) {
                e = c[3950] | 0;b = s >>> 3;d = 15820 + (b << 1 << 2) | 0;b = 1 << b;if (t & b) {
                  b = d + 8 | 0;a = c[b >> 2] | 0;if (a >>> 0 < (c[3949] | 0) >>> 0) ma();else {
                    q = a;r = b;
                  }
                } else {
                  c[3945] = t | b;q = d;r = d + 8 | 0;
                }c[r >> 2] = e;c[q + 12 >> 2] = e;c[e + 8 >> 2] = q;c[e + 12 >> 2] = d;
              }c[3947] = h;c[3950] = i;
            }J = j + 8 | 0;l = K;return J | 0;
          }
        }
      } else if (a >>> 0 <= 4294967231) {
        a = a + 11 | 0;p = a & -8;k = c[3946] | 0;if (k) {
          e = 0 - p | 0;a = a >>> 8;if (a) {
            if (p >>> 0 > 16777215) i = 31;else {
              r = (a + 1048320 | 0) >>> 16 & 8;C = a << r;q = (C + 520192 | 0) >>> 16 & 4;C = C << q;i = (C + 245760 | 0) >>> 16 & 2;i = 14 - (q | r | i) + (C << i >>> 15) | 0;i = p >>> (i + 7 | 0) & 1 | i << 1;
            }
          } else i = 0;d = c[16084 + (i << 2) >> 2] | 0;b: do {
            if (!d) {
              d = 0;a = 0;C = 81;
            } else {
              a = 0;h = p << ((i | 0) == 31 ? 0 : 25 - (i >>> 1) | 0);g = 0;while (1) {
                f = (c[d + 4 >> 2] & -8) - p | 0;if (f >>> 0 < e >>> 0) if (!f) {
                  a = d;e = 0;f = d;C = 85;break b;
                } else {
                  a = d;e = f;
                }f = c[d + 20 >> 2] | 0;d = c[d + 16 + (h >>> 31 << 2) >> 2] | 0;g = (f | 0) == 0 | (f | 0) == (d | 0) ? g : f;f = (d | 0) == 0;if (f) {
                  d = g;C = 81;break;
                } else h = h << ((f ^ 1) & 1);
              }
            }
          } while (0);if ((C | 0) == 81) {
            if ((d | 0) == 0 & (a | 0) == 0) {
              a = 2 << i;a = k & (a | 0 - a);if (!a) break;r = (a & 0 - a) + -1 | 0;m = r >>> 12 & 16;r = r >>> m;j = r >>> 5 & 8;r = r >>> j;n = r >>> 2 & 4;r = r >>> n;q = r >>> 1 & 2;r = r >>> q;d = r >>> 1 & 1;a = 0;d = c[16084 + ((j | m | n | q | d) + (r >>> d) << 2) >> 2] | 0;
            }if (!d) {
              j = a;i = e;
            } else {
              f = d;C = 85;
            }
          }if ((C | 0) == 85) while (1) {
            C = 0;d = (c[f + 4 >> 2] & -8) - p | 0;r = d >>> 0 < e >>> 0;d = r ? d : e;a = r ? f : a;f = c[f + 16 + (((c[f + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0;if (!f) {
              j = a;i = d;break;
            } else {
              e = d;C = 85;
            }
          }if ((j | 0) != 0 ? i >>> 0 < ((c[3947] | 0) - p | 0) >>> 0 : 0) {
            f = c[3949] | 0;if (j >>> 0 < f >>> 0) ma();h = j + p | 0;if (j >>> 0 >= h >>> 0) ma();g = c[j + 24 >> 2] | 0;d = c[j + 12 >> 2] | 0;do {
              if ((d | 0) == (j | 0)) {
                a = j + 20 | 0;b = c[a >> 2] | 0;if (!b) {
                  a = j + 16 | 0;b = c[a >> 2] | 0;if (!b) {
                    s = 0;break;
                  }
                }while (1) {
                  d = b + 20 | 0;e = c[d >> 2] | 0;if (e | 0) {
                    b = e;a = d;continue;
                  }d = b + 16 | 0;e = c[d >> 2] | 0;if (!e) break;else {
                    b = e;a = d;
                  }
                }if (a >>> 0 < f >>> 0) ma();else {
                  c[a >> 2] = 0;s = b;break;
                }
              } else {
                e = c[j + 8 >> 2] | 0;if (e >>> 0 < f >>> 0) ma();b = e + 12 | 0;if ((c[b >> 2] | 0) != (j | 0)) ma();a = d + 8 | 0;if ((c[a >> 2] | 0) == (j | 0)) {
                  c[b >> 2] = d;c[a >> 2] = e;s = d;break;
                } else ma();
              }
            } while (0);c: do {
              if (g) {
                b = c[j + 28 >> 2] | 0;a = 16084 + (b << 2) | 0;do {
                  if ((j | 0) == (c[a >> 2] | 0)) {
                    c[a >> 2] = s;if (!s) {
                      t = k & ~(1 << b);c[3946] = t;break c;
                    }
                  } else if (g >>> 0 >= (c[3949] | 0) >>> 0) {
                    c[g + 16 + (((c[g + 16 >> 2] | 0) != (j | 0) & 1) << 2) >> 2] = s;if (!s) {
                      t = k;break c;
                    } else break;
                  } else ma();
                } while (0);a = c[3949] | 0;if (s >>> 0 < a >>> 0) ma();c[s + 24 >> 2] = g;b = c[j + 16 >> 2] | 0;do {
                  if (b | 0) if (b >>> 0 < a >>> 0) ma();else {
                    c[s + 16 >> 2] = b;c[b + 24 >> 2] = s;break;
                  }
                } while (0);b = c[j + 20 >> 2] | 0;if (b) {
                  if (b >>> 0 < (c[3949] | 0) >>> 0) ma();else {
                    c[s + 20 >> 2] = b;c[b + 24 >> 2] = s;t = k;break;
                  }
                } else t = k;
              } else t = k;
            } while (0);do {
              if (i >>> 0 >= 16) {
                c[j + 4 >> 2] = p | 3;c[h + 4 >> 2] = i | 1;c[h + i >> 2] = i;b = i >>> 3;if (i >>> 0 < 256) {
                  d = 15820 + (b << 1 << 2) | 0;a = c[3945] | 0;b = 1 << b;if (a & b) {
                    b = d + 8 | 0;a = c[b >> 2] | 0;if (a >>> 0 < (c[3949] | 0) >>> 0) ma();else {
                      x = a;y = b;
                    }
                  } else {
                    c[3945] = a | b;x = d;y = d + 8 | 0;
                  }c[y >> 2] = h;c[x + 12 >> 2] = h;c[h + 8 >> 2] = x;c[h + 12 >> 2] = d;break;
                }b = i >>> 8;if (b) {
                  if (i >>> 0 > 16777215) b = 31;else {
                    I = (b + 1048320 | 0) >>> 16 & 8;J = b << I;H = (J + 520192 | 0) >>> 16 & 4;J = J << H;b = (J + 245760 | 0) >>> 16 & 2;b = 14 - (H | I | b) + (J << b >>> 15) | 0;b = i >>> (b + 7 | 0) & 1 | b << 1;
                  }
                } else b = 0;d = 16084 + (b << 2) | 0;c[h + 28 >> 2] = b;a = h + 16 | 0;c[a + 4 >> 2] = 0;c[a >> 2] = 0;a = 1 << b;if (!(t & a)) {
                  c[3946] = t | a;c[d >> 2] = h;c[h + 24 >> 2] = d;c[h + 12 >> 2] = h;c[h + 8 >> 2] = h;break;
                }a = i << ((b | 0) == 31 ? 0 : 25 - (b >>> 1) | 0);e = c[d >> 2] | 0;while (1) {
                  if ((c[e + 4 >> 2] & -8 | 0) == (i | 0)) {
                    C = 139;break;
                  }d = e + 16 + (a >>> 31 << 2) | 0;b = c[d >> 2] | 0;if (!b) {
                    C = 136;break;
                  } else {
                    a = a << 1;e = b;
                  }
                }if ((C | 0) == 136) {
                  if (d >>> 0 < (c[3949] | 0) >>> 0) ma();else {
                    c[d >> 2] = h;c[h + 24 >> 2] = e;c[h + 12 >> 2] = h;c[h + 8 >> 2] = h;break;
                  }
                } else if ((C | 0) == 139) {
                  b = e + 8 | 0;a = c[b >> 2] | 0;J = c[3949] | 0;if (a >>> 0 >= J >>> 0 & e >>> 0 >= J >>> 0) {
                    c[a + 12 >> 2] = h;c[b >> 2] = h;c[h + 8 >> 2] = a;c[h + 12 >> 2] = e;c[h + 24 >> 2] = 0;break;
                  } else ma();
                }
              } else {
                J = i + p | 0;c[j + 4 >> 2] = J | 3;J = j + J + 4 | 0;c[J >> 2] = c[J >> 2] | 1;
              }
            } while (0);J = j + 8 | 0;l = K;return J | 0;
          }
        }
      } else p = -1;
    } while (0);d = c[3947] | 0;if (d >>> 0 >= p >>> 0) {
      b = d - p | 0;a = c[3950] | 0;if (b >>> 0 > 15) {
        J = a + p | 0;c[3950] = J;c[3947] = b;c[J + 4 >> 2] = b | 1;c[J + b >> 2] = b;c[a + 4 >> 2] = p | 3;
      } else {
        c[3947] = 0;c[3950] = 0;c[a + 4 >> 2] = d | 3;J = a + d + 4 | 0;c[J >> 2] = c[J >> 2] | 1;
      }J = a + 8 | 0;l = K;return J | 0;
    }h = c[3948] | 0;if (h >>> 0 > p >>> 0) {
      H = h - p | 0;c[3948] = H;J = c[3951] | 0;I = J + p | 0;c[3951] = I;c[I + 4 >> 2] = H | 1;c[J + 4 >> 2] = p | 3;J = J + 8 | 0;l = K;return J | 0;
    }if (!(c[4063] | 0)) {
      c[4065] = 4096;c[4064] = 4096;c[4066] = -1;c[4067] = -1;c[4068] = 0;c[4056] = 0;a = o & -16 ^ 1431655768;c[o >> 2] = a;c[4063] = a;a = 4096;
    } else a = c[4065] | 0;i = p + 48 | 0;j = p + 47 | 0;g = a + j | 0;f = 0 - a | 0;k = g & f;if (k >>> 0 <= p >>> 0) {
      J = 0;l = K;return J | 0;
    }a = c[4055] | 0;if (a | 0 ? (x = c[4053] | 0, y = x + k | 0, y >>> 0 <= x >>> 0 | y >>> 0 > a >>> 0) : 0) {
      J = 0;l = K;return J | 0;
    }d: do {
      if (!(c[4056] & 4)) {
        d = c[3951] | 0;e: do {
          if (d) {
            e = 16228;while (1) {
              a = c[e >> 2] | 0;if (a >>> 0 <= d >>> 0 ? (w = e + 4 | 0, (a + (c[w >> 2] | 0) | 0) >>> 0 > d >>> 0) : 0) break;a = c[e + 8 >> 2] | 0;if (!a) {
                C = 163;break e;
              } else e = a;
            }b = g - h & f;if (b >>> 0 < 2147483647) {
              a = Yd(b | 0) | 0;if ((a | 0) == ((c[e >> 2] | 0) + (c[w >> 2] | 0) | 0)) {
                if ((a | 0) != (-1 | 0)) {
                  h = b;g = a;C = 180;break d;
                }
              } else {
                e = a;C = 171;
              }
            } else b = 0;
          } else C = 163;
        } while (0);do {
          if ((C | 0) == 163) {
            d = Yd(0) | 0;if ((d | 0) != (-1 | 0) ? (b = d, u = c[4064] | 0, v = u + -1 | 0, b = ((v & b | 0) == 0 ? 0 : (v + b & 0 - u) - b | 0) + k | 0, u = c[4053] | 0, v = b + u | 0, b >>> 0 > p >>> 0 & b >>> 0 < 2147483647) : 0) {
              y = c[4055] | 0;if (y | 0 ? v >>> 0 <= u >>> 0 | v >>> 0 > y >>> 0 : 0) {
                b = 0;break;
              }a = Yd(b | 0) | 0;if ((a | 0) == (d | 0)) {
                h = b;g = d;C = 180;break d;
              } else {
                e = a;C = 171;
              }
            } else b = 0;
          }
        } while (0);do {
          if ((C | 0) == 171) {
            d = 0 - b | 0;if (!(i >>> 0 > b >>> 0 & (b >>> 0 < 2147483647 & (e | 0) != (-1 | 0)))) if ((e | 0) == (-1 | 0)) {
              b = 0;break;
            } else {
              h = b;g = e;C = 180;break d;
            }a = c[4065] | 0;a = j - b + a & 0 - a;if (a >>> 0 >= 2147483647) {
              h = b;g = e;C = 180;break d;
            }if ((Yd(a | 0) | 0) == (-1 | 0)) {
              Yd(d | 0) | 0;b = 0;break;
            } else {
              h = a + b | 0;g = e;C = 180;break d;
            }
          }
        } while (0);c[4056] = c[4056] | 4;C = 178;
      } else {
        b = 0;C = 178;
      }
    } while (0);if (((C | 0) == 178 ? k >>> 0 < 2147483647 : 0) ? (B = Yd(k | 0) | 0, y = Yd(0) | 0, z = y - B | 0, A = z >>> 0 > (p + 40 | 0) >>> 0, !((B | 0) == (-1 | 0) | A ^ 1 | B >>> 0 < y >>> 0 & ((B | 0) != (-1 | 0) & (y | 0) != (-1 | 0)) ^ 1)) : 0) {
      h = A ? z : b;g = B;C = 180;
    }if ((C | 0) == 180) {
      b = (c[4053] | 0) + h | 0;c[4053] = b;if (b >>> 0 > (c[4054] | 0) >>> 0) c[4054] = b;k = c[3951] | 0;do {
        if (k) {
          b = 16228;while (1) {
            a = c[b >> 2] | 0;d = b + 4 | 0;e = c[d >> 2] | 0;if ((g | 0) == (a + e | 0)) {
              C = 190;break;
            }f = c[b + 8 >> 2] | 0;if (!f) break;else b = f;
          }if (((C | 0) == 190 ? (c[b + 12 >> 2] & 8 | 0) == 0 : 0) ? k >>> 0 < g >>> 0 & k >>> 0 >= a >>> 0 : 0) {
            c[d >> 2] = e + h;J = k + 8 | 0;J = (J & 7 | 0) == 0 ? 0 : 0 - J & 7;I = k + J | 0;J = (c[3948] | 0) + (h - J) | 0;c[3951] = I;c[3948] = J;c[I + 4 >> 2] = J | 1;c[I + J + 4 >> 2] = 40;c[3952] = c[4067];break;
          }b = c[3949] | 0;if (g >>> 0 < b >>> 0) {
            c[3949] = g;i = g;
          } else i = b;d = g + h | 0;b = 16228;while (1) {
            if ((c[b >> 2] | 0) == (d | 0)) {
              C = 198;break;
            }a = c[b + 8 >> 2] | 0;if (!a) break;else b = a;
          }if ((C | 0) == 198 ? (c[b + 12 >> 2] & 8 | 0) == 0 : 0) {
            c[b >> 2] = g;n = b + 4 | 0;c[n >> 2] = (c[n >> 2] | 0) + h;n = g + 8 | 0;n = g + ((n & 7 | 0) == 0 ? 0 : 0 - n & 7) | 0;b = d + 8 | 0;b = d + ((b & 7 | 0) == 0 ? 0 : 0 - b & 7) | 0;m = n + p | 0;j = b - n - p | 0;c[n + 4 >> 2] = p | 3;do {
              if ((b | 0) != (k | 0)) {
                if ((b | 0) == (c[3950] | 0)) {
                  J = (c[3947] | 0) + j | 0;c[3947] = J;c[3950] = m;c[m + 4 >> 2] = J | 1;c[m + J >> 2] = J;break;
                }a = c[b + 4 >> 2] | 0;if ((a & 3 | 0) == 1) {
                  h = a & -8;f = a >>> 3;f: do {
                    if (a >>> 0 >= 256) {
                      g = c[b + 24 >> 2] | 0;e = c[b + 12 >> 2] | 0;do {
                        if ((e | 0) == (b | 0)) {
                          e = b + 16 | 0;d = e + 4 | 0;a = c[d >> 2] | 0;if (!a) {
                            a = c[e >> 2] | 0;if (!a) {
                              H = 0;break;
                            } else d = e;
                          }while (1) {
                            e = a + 20 | 0;f = c[e >> 2] | 0;if (f | 0) {
                              a = f;d = e;continue;
                            }e = a + 16 | 0;f = c[e >> 2] | 0;if (!f) break;else {
                              a = f;d = e;
                            }
                          }if (d >>> 0 < i >>> 0) ma();else {
                            c[d >> 2] = 0;H = a;break;
                          }
                        } else {
                          f = c[b + 8 >> 2] | 0;if (f >>> 0 < i >>> 0) ma();a = f + 12 | 0;if ((c[a >> 2] | 0) != (b | 0)) ma();d = e + 8 | 0;if ((c[d >> 2] | 0) == (b | 0)) {
                            c[a >> 2] = e;c[d >> 2] = f;H = e;break;
                          } else ma();
                        }
                      } while (0);if (!g) break;a = c[b + 28 >> 2] | 0;d = 16084 + (a << 2) | 0;do {
                        if ((b | 0) != (c[d >> 2] | 0)) {
                          if (g >>> 0 >= (c[3949] | 0) >>> 0) {
                            c[g + 16 + (((c[g + 16 >> 2] | 0) != (b | 0) & 1) << 2) >> 2] = H;if (!H) break f;else break;
                          } else ma();
                        } else {
                          c[d >> 2] = H;if (H | 0) break;c[3946] = c[3946] & ~(1 << a);break f;
                        }
                      } while (0);e = c[3949] | 0;if (H >>> 0 < e >>> 0) ma();c[H + 24 >> 2] = g;a = b + 16 | 0;d = c[a >> 2] | 0;do {
                        if (d | 0) if (d >>> 0 < e >>> 0) ma();else {
                          c[H + 16 >> 2] = d;c[d + 24 >> 2] = H;break;
                        }
                      } while (0);a = c[a + 4 >> 2] | 0;if (!a) break;if (a >>> 0 < (c[3949] | 0) >>> 0) ma();else {
                        c[H + 20 >> 2] = a;c[a + 24 >> 2] = H;break;
                      }
                    } else {
                      d = c[b + 8 >> 2] | 0;e = c[b + 12 >> 2] | 0;a = 15820 + (f << 1 << 2) | 0;do {
                        if ((d | 0) != (a | 0)) {
                          if (d >>> 0 < i >>> 0) ma();if ((c[d + 12 >> 2] | 0) == (b | 0)) break;ma();
                        }
                      } while (0);if ((e | 0) == (d | 0)) {
                        c[3945] = c[3945] & ~(1 << f);break;
                      }do {
                        if ((e | 0) == (a | 0)) E = e + 8 | 0;else {
                          if (e >>> 0 < i >>> 0) ma();a = e + 8 | 0;if ((c[a >> 2] | 0) == (b | 0)) {
                            E = a;break;
                          }ma();
                        }
                      } while (0);c[d + 12 >> 2] = e;c[E >> 2] = d;
                    }
                  } while (0);b = b + h | 0;f = h + j | 0;
                } else f = j;b = b + 4 | 0;c[b >> 2] = c[b >> 2] & -2;c[m + 4 >> 2] = f | 1;c[m + f >> 2] = f;b = f >>> 3;if (f >>> 0 < 256) {
                  d = 15820 + (b << 1 << 2) | 0;a = c[3945] | 0;b = 1 << b;do {
                    if (!(a & b)) {
                      c[3945] = a | b;I = d;J = d + 8 | 0;
                    } else {
                      b = d + 8 | 0;a = c[b >> 2] | 0;if (a >>> 0 >= (c[3949] | 0) >>> 0) {
                        I = a;J = b;break;
                      }ma();
                    }
                  } while (0);c[J >> 2] = m;c[I + 12 >> 2] = m;c[m + 8 >> 2] = I;c[m + 12 >> 2] = d;break;
                }b = f >>> 8;do {
                  if (!b) b = 0;else {
                    if (f >>> 0 > 16777215) {
                      b = 31;break;
                    }I = (b + 1048320 | 0) >>> 16 & 8;J = b << I;H = (J + 520192 | 0) >>> 16 & 4;J = J << H;b = (J + 245760 | 0) >>> 16 & 2;b = 14 - (H | I | b) + (J << b >>> 15) | 0;b = f >>> (b + 7 | 0) & 1 | b << 1;
                  }
                } while (0);e = 16084 + (b << 2) | 0;c[m + 28 >> 2] = b;a = m + 16 | 0;c[a + 4 >> 2] = 0;c[a >> 2] = 0;a = c[3946] | 0;d = 1 << b;if (!(a & d)) {
                  c[3946] = a | d;c[e >> 2] = m;c[m + 24 >> 2] = e;c[m + 12 >> 2] = m;c[m + 8 >> 2] = m;break;
                }a = f << ((b | 0) == 31 ? 0 : 25 - (b >>> 1) | 0);e = c[e >> 2] | 0;while (1) {
                  if ((c[e + 4 >> 2] & -8 | 0) == (f | 0)) {
                    C = 265;break;
                  }d = e + 16 + (a >>> 31 << 2) | 0;b = c[d >> 2] | 0;if (!b) {
                    C = 262;break;
                  } else {
                    a = a << 1;e = b;
                  }
                }if ((C | 0) == 262) {
                  if (d >>> 0 < (c[3949] | 0) >>> 0) ma();else {
                    c[d >> 2] = m;c[m + 24 >> 2] = e;c[m + 12 >> 2] = m;c[m + 8 >> 2] = m;break;
                  }
                } else if ((C | 0) == 265) {
                  b = e + 8 | 0;a = c[b >> 2] | 0;J = c[3949] | 0;if (a >>> 0 >= J >>> 0 & e >>> 0 >= J >>> 0) {
                    c[a + 12 >> 2] = m;c[b >> 2] = m;c[m + 8 >> 2] = a;c[m + 12 >> 2] = e;c[m + 24 >> 2] = 0;break;
                  } else ma();
                }
              } else {
                J = (c[3948] | 0) + j | 0;c[3948] = J;c[3951] = m;c[m + 4 >> 2] = J | 1;
              }
            } while (0);J = n + 8 | 0;l = K;return J | 0;
          }b = 16228;while (1) {
            a = c[b >> 2] | 0;if (a >>> 0 <= k >>> 0 ? (D = a + (c[b + 4 >> 2] | 0) | 0, D >>> 0 > k >>> 0) : 0) break;b = c[b + 8 >> 2] | 0;
          }f = D + -47 | 0;a = f + 8 | 0;a = f + ((a & 7 | 0) == 0 ? 0 : 0 - a & 7) | 0;f = k + 16 | 0;a = a >>> 0 < f >>> 0 ? k : a;b = a + 8 | 0;d = g + 8 | 0;d = (d & 7 | 0) == 0 ? 0 : 0 - d & 7;J = g + d | 0;d = h + -40 - d | 0;c[3951] = J;c[3948] = d;c[J + 4 >> 2] = d | 1;c[J + d + 4 >> 2] = 40;c[3952] = c[4067];d = a + 4 | 0;c[d >> 2] = 27;c[b >> 2] = c[4057];c[b + 4 >> 2] = c[4058];c[b + 8 >> 2] = c[4059];c[b + 12 >> 2] = c[4060];c[4057] = g;c[4058] = h;c[4060] = 0;c[4059] = b;b = a + 24 | 0;do {
            J = b;b = b + 4 | 0;c[b >> 2] = 7;
          } while ((J + 8 | 0) >>> 0 < D >>> 0);if ((a | 0) != (k | 0)) {
            g = a - k | 0;c[d >> 2] = c[d >> 2] & -2;c[k + 4 >> 2] = g | 1;c[a >> 2] = g;b = g >>> 3;if (g >>> 0 < 256) {
              d = 15820 + (b << 1 << 2) | 0;a = c[3945] | 0;b = 1 << b;if (a & b) {
                b = d + 8 | 0;a = c[b >> 2] | 0;if (a >>> 0 < (c[3949] | 0) >>> 0) ma();else {
                  F = a;G = b;
                }
              } else {
                c[3945] = a | b;F = d;G = d + 8 | 0;
              }c[G >> 2] = k;c[F + 12 >> 2] = k;c[k + 8 >> 2] = F;c[k + 12 >> 2] = d;break;
            }b = g >>> 8;if (b) {
              if (g >>> 0 > 16777215) d = 31;else {
                I = (b + 1048320 | 0) >>> 16 & 8;J = b << I;H = (J + 520192 | 0) >>> 16 & 4;J = J << H;d = (J + 245760 | 0) >>> 16 & 2;d = 14 - (H | I | d) + (J << d >>> 15) | 0;d = g >>> (d + 7 | 0) & 1 | d << 1;
              }
            } else d = 0;e = 16084 + (d << 2) | 0;c[k + 28 >> 2] = d;c[k + 20 >> 2] = 0;c[f >> 2] = 0;b = c[3946] | 0;a = 1 << d;if (!(b & a)) {
              c[3946] = b | a;c[e >> 2] = k;c[k + 24 >> 2] = e;c[k + 12 >> 2] = k;c[k + 8 >> 2] = k;break;
            }a = g << ((d | 0) == 31 ? 0 : 25 - (d >>> 1) | 0);e = c[e >> 2] | 0;while (1) {
              if ((c[e + 4 >> 2] & -8 | 0) == (g | 0)) {
                C = 292;break;
              }d = e + 16 + (a >>> 31 << 2) | 0;b = c[d >> 2] | 0;if (!b) {
                C = 289;break;
              } else {
                a = a << 1;e = b;
              }
            }if ((C | 0) == 289) {
              if (d >>> 0 < (c[3949] | 0) >>> 0) ma();else {
                c[d >> 2] = k;c[k + 24 >> 2] = e;c[k + 12 >> 2] = k;c[k + 8 >> 2] = k;break;
              }
            } else if ((C | 0) == 292) {
              b = e + 8 | 0;a = c[b >> 2] | 0;J = c[3949] | 0;if (a >>> 0 >= J >>> 0 & e >>> 0 >= J >>> 0) {
                c[a + 12 >> 2] = k;c[b >> 2] = k;c[k + 8 >> 2] = a;c[k + 12 >> 2] = e;c[k + 24 >> 2] = 0;break;
              } else ma();
            }
          }
        } else {
          J = c[3949] | 0;if ((J | 0) == 0 | g >>> 0 < J >>> 0) c[3949] = g;c[4057] = g;c[4058] = h;c[4060] = 0;c[3954] = c[4063];c[3953] = -1;b = 0;do {
            J = 15820 + (b << 1 << 2) | 0;c[J + 12 >> 2] = J;c[J + 8 >> 2] = J;b = b + 1 | 0;
          } while ((b | 0) != 32);J = g + 8 | 0;J = (J & 7 | 0) == 0 ? 0 : 0 - J & 7;I = g + J | 0;J = h + -40 - J | 0;c[3951] = I;c[3948] = J;c[I + 4 >> 2] = J | 1;c[I + J + 4 >> 2] = 40;c[3952] = c[4067];
        }
      } while (0);b = c[3948] | 0;if (b >>> 0 > p >>> 0) {
        H = b - p | 0;c[3948] = H;J = c[3951] | 0;I = J + p | 0;c[3951] = I;c[I + 4 >> 2] = H | 1;c[J + 4 >> 2] = p | 3;J = J + 8 | 0;l = K;return J | 0;
      }
    }c[(Jc() | 0) >> 2] = 12;J = 0;l = K;return J | 0;
  }function Fd(a) {
    a = a | 0;var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0;if (!a) return;d = a + -8 | 0;h = c[3949] | 0;if (d >>> 0 < h >>> 0) ma();a = c[a + -4 >> 2] | 0;b = a & 3;if ((b | 0) == 1) ma();e = a & -8;o = d + e | 0;a: do {
      if (!(a & 1)) {
        a = c[d >> 2] | 0;if (!b) return;k = d + (0 - a) | 0;j = a + e | 0;if (k >>> 0 < h >>> 0) ma();if ((k | 0) == (c[3950] | 0)) {
          a = o + 4 | 0;b = c[a >> 2] | 0;if ((b & 3 | 0) != 3) {
            r = k;f = j;m = k;break;
          }c[3947] = j;c[a >> 2] = b & -2;c[k + 4 >> 2] = j | 1;c[k + j >> 2] = j;return;
        }e = a >>> 3;if (a >>> 0 < 256) {
          b = c[k + 8 >> 2] | 0;d = c[k + 12 >> 2] | 0;a = 15820 + (e << 1 << 2) | 0;if ((b | 0) != (a | 0)) {
            if (b >>> 0 < h >>> 0) ma();if ((c[b + 12 >> 2] | 0) != (k | 0)) ma();
          }if ((d | 0) == (b | 0)) {
            c[3945] = c[3945] & ~(1 << e);r = k;f = j;m = k;break;
          }if ((d | 0) != (a | 0)) {
            if (d >>> 0 < h >>> 0) ma();a = d + 8 | 0;if ((c[a >> 2] | 0) == (k | 0)) g = a;else ma();
          } else g = d + 8 | 0;c[b + 12 >> 2] = d;c[g >> 2] = b;r = k;f = j;m = k;break;
        }g = c[k + 24 >> 2] | 0;d = c[k + 12 >> 2] | 0;do {
          if ((d | 0) == (k | 0)) {
            d = k + 16 | 0;b = d + 4 | 0;a = c[b >> 2] | 0;if (!a) {
              a = c[d >> 2] | 0;if (!a) {
                i = 0;break;
              } else b = d;
            }while (1) {
              d = a + 20 | 0;e = c[d >> 2] | 0;if (e | 0) {
                a = e;b = d;continue;
              }d = a + 16 | 0;e = c[d >> 2] | 0;if (!e) break;else {
                a = e;b = d;
              }
            }if (b >>> 0 < h >>> 0) ma();else {
              c[b >> 2] = 0;i = a;break;
            }
          } else {
            e = c[k + 8 >> 2] | 0;if (e >>> 0 < h >>> 0) ma();a = e + 12 | 0;if ((c[a >> 2] | 0) != (k | 0)) ma();b = d + 8 | 0;if ((c[b >> 2] | 0) == (k | 0)) {
              c[a >> 2] = d;c[b >> 2] = e;i = d;break;
            } else ma();
          }
        } while (0);if (g) {
          a = c[k + 28 >> 2] | 0;b = 16084 + (a << 2) | 0;do {
            if ((k | 0) == (c[b >> 2] | 0)) {
              c[b >> 2] = i;if (!i) {
                c[3946] = c[3946] & ~(1 << a);r = k;f = j;m = k;break a;
              }
            } else if (g >>> 0 >= (c[3949] | 0) >>> 0) {
              c[g + 16 + (((c[g + 16 >> 2] | 0) != (k | 0) & 1) << 2) >> 2] = i;if (!i) {
                r = k;f = j;m = k;break a;
              } else break;
            } else ma();
          } while (0);d = c[3949] | 0;if (i >>> 0 < d >>> 0) ma();c[i + 24 >> 2] = g;a = k + 16 | 0;b = c[a >> 2] | 0;do {
            if (b | 0) if (b >>> 0 < d >>> 0) ma();else {
              c[i + 16 >> 2] = b;c[b + 24 >> 2] = i;break;
            }
          } while (0);a = c[a + 4 >> 2] | 0;if (a) {
            if (a >>> 0 < (c[3949] | 0) >>> 0) ma();else {
              c[i + 20 >> 2] = a;c[a + 24 >> 2] = i;r = k;f = j;m = k;break;
            }
          } else {
            r = k;f = j;m = k;
          }
        } else {
          r = k;f = j;m = k;
        }
      } else {
        r = d;f = e;m = d;
      }
    } while (0);if (m >>> 0 >= o >>> 0) ma();a = o + 4 | 0;b = c[a >> 2] | 0;if (!(b & 1)) ma();if (!(b & 2)) {
      a = c[3950] | 0;if ((o | 0) == (c[3951] | 0)) {
        q = (c[3948] | 0) + f | 0;c[3948] = q;c[3951] = r;c[r + 4 >> 2] = q | 1;if ((r | 0) != (a | 0)) return;c[3950] = 0;c[3947] = 0;return;
      }if ((o | 0) == (a | 0)) {
        q = (c[3947] | 0) + f | 0;c[3947] = q;c[3950] = m;c[r + 4 >> 2] = q | 1;c[m + q >> 2] = q;return;
      }f = (b & -8) + f | 0;e = b >>> 3;b: do {
        if (b >>> 0 >= 256) {
          g = c[o + 24 >> 2] | 0;a = c[o + 12 >> 2] | 0;do {
            if ((a | 0) == (o | 0)) {
              d = o + 16 | 0;b = d + 4 | 0;a = c[b >> 2] | 0;if (!a) {
                a = c[d >> 2] | 0;if (!a) {
                  n = 0;break;
                } else b = d;
              }while (1) {
                d = a + 20 | 0;e = c[d >> 2] | 0;if (e | 0) {
                  a = e;b = d;continue;
                }d = a + 16 | 0;e = c[d >> 2] | 0;if (!e) break;else {
                  a = e;b = d;
                }
              }if (b >>> 0 < (c[3949] | 0) >>> 0) ma();else {
                c[b >> 2] = 0;n = a;break;
              }
            } else {
              b = c[o + 8 >> 2] | 0;if (b >>> 0 < (c[3949] | 0) >>> 0) ma();d = b + 12 | 0;if ((c[d >> 2] | 0) != (o | 0)) ma();e = a + 8 | 0;if ((c[e >> 2] | 0) == (o | 0)) {
                c[d >> 2] = a;c[e >> 2] = b;n = a;break;
              } else ma();
            }
          } while (0);if (g | 0) {
            a = c[o + 28 >> 2] | 0;b = 16084 + (a << 2) | 0;do {
              if ((o | 0) == (c[b >> 2] | 0)) {
                c[b >> 2] = n;if (!n) {
                  c[3946] = c[3946] & ~(1 << a);break b;
                }
              } else if (g >>> 0 >= (c[3949] | 0) >>> 0) {
                c[g + 16 + (((c[g + 16 >> 2] | 0) != (o | 0) & 1) << 2) >> 2] = n;if (!n) break b;else break;
              } else ma();
            } while (0);d = c[3949] | 0;if (n >>> 0 < d >>> 0) ma();c[n + 24 >> 2] = g;a = o + 16 | 0;b = c[a >> 2] | 0;do {
              if (b | 0) if (b >>> 0 < d >>> 0) ma();else {
                c[n + 16 >> 2] = b;c[b + 24 >> 2] = n;break;
              }
            } while (0);a = c[a + 4 >> 2] | 0;if (a | 0) if (a >>> 0 < (c[3949] | 0) >>> 0) ma();else {
              c[n + 20 >> 2] = a;c[a + 24 >> 2] = n;break;
            }
          }
        } else {
          b = c[o + 8 >> 2] | 0;d = c[o + 12 >> 2] | 0;a = 15820 + (e << 1 << 2) | 0;if ((b | 0) != (a | 0)) {
            if (b >>> 0 < (c[3949] | 0) >>> 0) ma();if ((c[b + 12 >> 2] | 0) != (o | 0)) ma();
          }if ((d | 0) == (b | 0)) {
            c[3945] = c[3945] & ~(1 << e);break;
          }if ((d | 0) != (a | 0)) {
            if (d >>> 0 < (c[3949] | 0) >>> 0) ma();a = d + 8 | 0;if ((c[a >> 2] | 0) == (o | 0)) l = a;else ma();
          } else l = d + 8 | 0;c[b + 12 >> 2] = d;c[l >> 2] = b;
        }
      } while (0);c[r + 4 >> 2] = f | 1;c[m + f >> 2] = f;if ((r | 0) == (c[3950] | 0)) {
        c[3947] = f;return;
      }
    } else {
      c[a >> 2] = b & -2;c[r + 4 >> 2] = f | 1;c[m + f >> 2] = f;
    }a = f >>> 3;if (f >>> 0 < 256) {
      d = 15820 + (a << 1 << 2) | 0;b = c[3945] | 0;a = 1 << a;if (b & a) {
        a = d + 8 | 0;b = c[a >> 2] | 0;if (b >>> 0 < (c[3949] | 0) >>> 0) ma();else {
          p = b;q = a;
        }
      } else {
        c[3945] = b | a;p = d;q = d + 8 | 0;
      }c[q >> 2] = r;c[p + 12 >> 2] = r;c[r + 8 >> 2] = p;c[r + 12 >> 2] = d;return;
    }a = f >>> 8;if (a) {
      if (f >>> 0 > 16777215) a = 31;else {
        p = (a + 1048320 | 0) >>> 16 & 8;q = a << p;o = (q + 520192 | 0) >>> 16 & 4;q = q << o;a = (q + 245760 | 0) >>> 16 & 2;a = 14 - (o | p | a) + (q << a >>> 15) | 0;a = f >>> (a + 7 | 0) & 1 | a << 1;
      }
    } else a = 0;e = 16084 + (a << 2) | 0;c[r + 28 >> 2] = a;c[r + 20 >> 2] = 0;c[r + 16 >> 2] = 0;b = c[3946] | 0;d = 1 << a;do {
      if (b & d) {
        b = f << ((a | 0) == 31 ? 0 : 25 - (a >>> 1) | 0);e = c[e >> 2] | 0;while (1) {
          if ((c[e + 4 >> 2] & -8 | 0) == (f | 0)) {
            a = 124;break;
          }d = e + 16 + (b >>> 31 << 2) | 0;a = c[d >> 2] | 0;if (!a) {
            a = 121;break;
          } else {
            b = b << 1;e = a;
          }
        }if ((a | 0) == 121) {
          if (d >>> 0 < (c[3949] | 0) >>> 0) ma();else {
            c[d >> 2] = r;c[r + 24 >> 2] = e;c[r + 12 >> 2] = r;c[r + 8 >> 2] = r;break;
          }
        } else if ((a | 0) == 124) {
          a = e + 8 | 0;b = c[a >> 2] | 0;q = c[3949] | 0;if (b >>> 0 >= q >>> 0 & e >>> 0 >= q >>> 0) {
            c[b + 12 >> 2] = r;c[a >> 2] = r;c[r + 8 >> 2] = b;c[r + 12 >> 2] = e;c[r + 24 >> 2] = 0;break;
          } else ma();
        }
      } else {
        c[3946] = b | d;c[e >> 2] = r;c[r + 24 >> 2] = e;c[r + 12 >> 2] = r;c[r + 8 >> 2] = r;
      }
    } while (0);r = (c[3953] | 0) + -1 | 0;c[3953] = r;if (!r) a = 16236;else return;while (1) {
      a = c[a >> 2] | 0;if (!a) break;else a = a + 8 | 0;
    }c[3953] = -1;return;
  }function Gd(a, b) {
    a = a | 0;b = b | 0;var d = 0;if (a) {
      d = S(b, a) | 0;if ((b | a) >>> 0 > 65535) d = ((d >>> 0) / (a >>> 0) | 0 | 0) == (b | 0) ? d : -1;
    } else d = 0;a = Ed(d) | 0;if (!a) return a | 0;if (!(c[a + -4 >> 2] & 3)) return a | 0;Sd(a | 0, 0, d | 0) | 0;return a | 0;
  }function Hd(a, b) {
    a = a | 0;b = b | 0;var d = 0,
        e = 0;if (!a) {
      b = Ed(b) | 0;return b | 0;
    }if (b >>> 0 > 4294967231) {
      c[(Jc() | 0) >> 2] = 12;b = 0;return b | 0;
    }d = Id(a + -8 | 0, b >>> 0 < 11 ? 16 : b + 11 & -8) | 0;if (d | 0) {
      b = d + 8 | 0;return b | 0;
    }d = Ed(b) | 0;if (!d) {
      b = 0;return b | 0;
    }e = c[a + -4 >> 2] | 0;e = (e & -8) - ((e & 3 | 0) == 0 ? 8 : 4) | 0;Zd(d | 0, a | 0, (e >>> 0 < b >>> 0 ? e : b) | 0) | 0;Fd(a);b = d;return b | 0;
  }function Id(a, b) {
    a = a | 0;b = b | 0;var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0;o = a + 4 | 0;n = c[o >> 2] | 0;d = n & -8;k = a + d | 0;i = c[3949] | 0;e = n & 3;if (!((e | 0) != 1 & a >>> 0 >= i >>> 0 & a >>> 0 < k >>> 0)) ma();f = c[k + 4 >> 2] | 0;if (!(f & 1)) ma();if (!e) {
      if (b >>> 0 < 256) {
        a = 0;return a | 0;
      }if (d >>> 0 >= (b + 4 | 0) >>> 0 ? (d - b | 0) >>> 0 <= c[4065] << 1 >>> 0 : 0) return a | 0;a = 0;return a | 0;
    }if (d >>> 0 >= b >>> 0) {
      d = d - b | 0;if (d >>> 0 <= 15) return a | 0;m = a + b | 0;c[o >> 2] = n & 1 | b | 2;c[m + 4 >> 2] = d | 3;o = m + d + 4 | 0;c[o >> 2] = c[o >> 2] | 1;Jd(m, d);return a | 0;
    }if ((k | 0) == (c[3951] | 0)) {
      m = (c[3948] | 0) + d | 0;d = m - b | 0;e = a + b | 0;if (m >>> 0 <= b >>> 0) {
        a = 0;return a | 0;
      }c[o >> 2] = n & 1 | b | 2;c[e + 4 >> 2] = d | 1;c[3951] = e;c[3948] = d;return a | 0;
    }if ((k | 0) == (c[3950] | 0)) {
      f = (c[3947] | 0) + d | 0;if (f >>> 0 < b >>> 0) {
        a = 0;return a | 0;
      }d = f - b | 0;e = n & 1;if (d >>> 0 > 15) {
        n = a + b | 0;m = n + d | 0;c[o >> 2] = e | b | 2;c[n + 4 >> 2] = d | 1;c[m >> 2] = d;e = m + 4 | 0;c[e >> 2] = c[e >> 2] & -2;e = n;
      } else {
        c[o >> 2] = e | f | 2;e = a + f + 4 | 0;c[e >> 2] = c[e >> 2] | 1;e = 0;d = 0;
      }c[3947] = d;c[3950] = e;return a | 0;
    }if (f & 2 | 0) {
      a = 0;return a | 0;
    }l = (f & -8) + d | 0;if (l >>> 0 < b >>> 0) {
      a = 0;return a | 0;
    }m = l - b | 0;g = f >>> 3;a: do {
      if (f >>> 0 >= 256) {
        h = c[k + 24 >> 2] | 0;f = c[k + 12 >> 2] | 0;do {
          if ((f | 0) == (k | 0)) {
            f = k + 16 | 0;e = f + 4 | 0;d = c[e >> 2] | 0;if (!d) {
              d = c[f >> 2] | 0;if (!d) {
                j = 0;break;
              } else e = f;
            }while (1) {
              f = d + 20 | 0;g = c[f >> 2] | 0;if (g | 0) {
                d = g;e = f;continue;
              }f = d + 16 | 0;g = c[f >> 2] | 0;if (!g) break;else {
                d = g;e = f;
              }
            }if (e >>> 0 < i >>> 0) ma();else {
              c[e >> 2] = 0;j = d;break;
            }
          } else {
            g = c[k + 8 >> 2] | 0;if (g >>> 0 < i >>> 0) ma();d = g + 12 | 0;if ((c[d >> 2] | 0) != (k | 0)) ma();e = f + 8 | 0;if ((c[e >> 2] | 0) == (k | 0)) {
              c[d >> 2] = f;c[e >> 2] = g;j = f;break;
            } else ma();
          }
        } while (0);if (h | 0) {
          d = c[k + 28 >> 2] | 0;e = 16084 + (d << 2) | 0;do {
            if ((k | 0) == (c[e >> 2] | 0)) {
              c[e >> 2] = j;if (!j) {
                c[3946] = c[3946] & ~(1 << d);break a;
              }
            } else if (h >>> 0 >= (c[3949] | 0) >>> 0) {
              c[h + 16 + (((c[h + 16 >> 2] | 0) != (k | 0) & 1) << 2) >> 2] = j;if (!j) break a;else break;
            } else ma();
          } while (0);f = c[3949] | 0;if (j >>> 0 < f >>> 0) ma();c[j + 24 >> 2] = h;d = k + 16 | 0;e = c[d >> 2] | 0;do {
            if (e | 0) if (e >>> 0 < f >>> 0) ma();else {
              c[j + 16 >> 2] = e;c[e + 24 >> 2] = j;break;
            }
          } while (0);d = c[d + 4 >> 2] | 0;if (d | 0) if (d >>> 0 < (c[3949] | 0) >>> 0) ma();else {
            c[j + 20 >> 2] = d;c[d + 24 >> 2] = j;break;
          }
        }
      } else {
        e = c[k + 8 >> 2] | 0;f = c[k + 12 >> 2] | 0;d = 15820 + (g << 1 << 2) | 0;if ((e | 0) != (d | 0)) {
          if (e >>> 0 < i >>> 0) ma();if ((c[e + 12 >> 2] | 0) != (k | 0)) ma();
        }if ((f | 0) == (e | 0)) {
          c[3945] = c[3945] & ~(1 << g);break;
        }if ((f | 0) != (d | 0)) {
          if (f >>> 0 < i >>> 0) ma();d = f + 8 | 0;if ((c[d >> 2] | 0) == (k | 0)) h = d;else ma();
        } else h = f + 8 | 0;c[e + 12 >> 2] = f;c[h >> 2] = e;
      }
    } while (0);d = n & 1;if (m >>> 0 < 16) {
      c[o >> 2] = l | d | 2;o = a + l + 4 | 0;c[o >> 2] = c[o >> 2] | 1;return a | 0;
    } else {
      n = a + b | 0;c[o >> 2] = d | b | 2;c[n + 4 >> 2] = m | 3;o = n + m + 4 | 0;c[o >> 2] = c[o >> 2] | 1;Jd(n, m);return a | 0;
    }return 0;
  }function Jd(a, b) {
    a = a | 0;b = b | 0;var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0;o = a + b | 0;d = c[a + 4 >> 2] | 0;a: do {
      if (!(d & 1)) {
        g = c[a >> 2] | 0;if (!(d & 3)) return;l = a + (0 - g) | 0;k = g + b | 0;i = c[3949] | 0;if (l >>> 0 < i >>> 0) ma();if ((l | 0) == (c[3950] | 0)) {
          a = o + 4 | 0;d = c[a >> 2] | 0;if ((d & 3 | 0) != 3) {
            r = l;f = k;break;
          }c[3947] = k;c[a >> 2] = d & -2;c[l + 4 >> 2] = k | 1;c[l + k >> 2] = k;return;
        }e = g >>> 3;if (g >>> 0 < 256) {
          d = c[l + 8 >> 2] | 0;b = c[l + 12 >> 2] | 0;a = 15820 + (e << 1 << 2) | 0;if ((d | 0) != (a | 0)) {
            if (d >>> 0 < i >>> 0) ma();if ((c[d + 12 >> 2] | 0) != (l | 0)) ma();
          }if ((b | 0) == (d | 0)) {
            c[3945] = c[3945] & ~(1 << e);r = l;f = k;break;
          }if ((b | 0) != (a | 0)) {
            if (b >>> 0 < i >>> 0) ma();a = b + 8 | 0;if ((c[a >> 2] | 0) == (l | 0)) h = a;else ma();
          } else h = b + 8 | 0;c[d + 12 >> 2] = b;c[h >> 2] = d;r = l;f = k;break;
        }g = c[l + 24 >> 2] | 0;b = c[l + 12 >> 2] | 0;do {
          if ((b | 0) == (l | 0)) {
            b = l + 16 | 0;d = b + 4 | 0;a = c[d >> 2] | 0;if (!a) {
              a = c[b >> 2] | 0;if (!a) {
                j = 0;break;
              } else d = b;
            }while (1) {
              b = a + 20 | 0;e = c[b >> 2] | 0;if (e | 0) {
                a = e;d = b;continue;
              }b = a + 16 | 0;e = c[b >> 2] | 0;if (!e) break;else {
                a = e;d = b;
              }
            }if (d >>> 0 < i >>> 0) ma();else {
              c[d >> 2] = 0;j = a;break;
            }
          } else {
            e = c[l + 8 >> 2] | 0;if (e >>> 0 < i >>> 0) ma();a = e + 12 | 0;if ((c[a >> 2] | 0) != (l | 0)) ma();d = b + 8 | 0;if ((c[d >> 2] | 0) == (l | 0)) {
              c[a >> 2] = b;c[d >> 2] = e;j = b;break;
            } else ma();
          }
        } while (0);if (g) {
          a = c[l + 28 >> 2] | 0;d = 16084 + (a << 2) | 0;do {
            if ((l | 0) == (c[d >> 2] | 0)) {
              c[d >> 2] = j;if (!j) {
                c[3946] = c[3946] & ~(1 << a);r = l;f = k;break a;
              }
            } else if (g >>> 0 >= (c[3949] | 0) >>> 0) {
              c[g + 16 + (((c[g + 16 >> 2] | 0) != (l | 0) & 1) << 2) >> 2] = j;if (!j) {
                r = l;f = k;break a;
              } else break;
            } else ma();
          } while (0);b = c[3949] | 0;if (j >>> 0 < b >>> 0) ma();c[j + 24 >> 2] = g;a = l + 16 | 0;d = c[a >> 2] | 0;do {
            if (d | 0) if (d >>> 0 < b >>> 0) ma();else {
              c[j + 16 >> 2] = d;c[d + 24 >> 2] = j;break;
            }
          } while (0);a = c[a + 4 >> 2] | 0;if (a) {
            if (a >>> 0 < (c[3949] | 0) >>> 0) ma();else {
              c[j + 20 >> 2] = a;c[a + 24 >> 2] = j;r = l;f = k;break;
            }
          } else {
            r = l;f = k;
          }
        } else {
          r = l;f = k;
        }
      } else {
        r = a;f = b;
      }
    } while (0);h = c[3949] | 0;if (o >>> 0 < h >>> 0) ma();a = o + 4 | 0;d = c[a >> 2] | 0;if (!(d & 2)) {
      a = c[3950] | 0;if ((o | 0) == (c[3951] | 0)) {
        q = (c[3948] | 0) + f | 0;c[3948] = q;c[3951] = r;c[r + 4 >> 2] = q | 1;if ((r | 0) != (a | 0)) return;c[3950] = 0;c[3947] = 0;return;
      }if ((o | 0) == (a | 0)) {
        q = (c[3947] | 0) + f | 0;c[3947] = q;c[3950] = r;c[r + 4 >> 2] = q | 1;c[r + q >> 2] = q;return;
      }f = (d & -8) + f | 0;e = d >>> 3;b: do {
        if (d >>> 0 >= 256) {
          g = c[o + 24 >> 2] | 0;b = c[o + 12 >> 2] | 0;do {
            if ((b | 0) == (o | 0)) {
              b = o + 16 | 0;d = b + 4 | 0;a = c[d >> 2] | 0;if (!a) {
                a = c[b >> 2] | 0;if (!a) {
                  n = 0;break;
                } else d = b;
              }while (1) {
                b = a + 20 | 0;e = c[b >> 2] | 0;if (e | 0) {
                  a = e;d = b;continue;
                }b = a + 16 | 0;e = c[b >> 2] | 0;if (!e) break;else {
                  a = e;d = b;
                }
              }if (d >>> 0 < h >>> 0) ma();else {
                c[d >> 2] = 0;n = a;break;
              }
            } else {
              e = c[o + 8 >> 2] | 0;if (e >>> 0 < h >>> 0) ma();a = e + 12 | 0;if ((c[a >> 2] | 0) != (o | 0)) ma();d = b + 8 | 0;if ((c[d >> 2] | 0) == (o | 0)) {
                c[a >> 2] = b;c[d >> 2] = e;n = b;break;
              } else ma();
            }
          } while (0);if (g | 0) {
            a = c[o + 28 >> 2] | 0;d = 16084 + (a << 2) | 0;do {
              if ((o | 0) == (c[d >> 2] | 0)) {
                c[d >> 2] = n;if (!n) {
                  c[3946] = c[3946] & ~(1 << a);break b;
                }
              } else if (g >>> 0 >= (c[3949] | 0) >>> 0) {
                c[g + 16 + (((c[g + 16 >> 2] | 0) != (o | 0) & 1) << 2) >> 2] = n;if (!n) break b;else break;
              } else ma();
            } while (0);b = c[3949] | 0;if (n >>> 0 < b >>> 0) ma();c[n + 24 >> 2] = g;a = o + 16 | 0;d = c[a >> 2] | 0;do {
              if (d | 0) if (d >>> 0 < b >>> 0) ma();else {
                c[n + 16 >> 2] = d;c[d + 24 >> 2] = n;break;
              }
            } while (0);a = c[a + 4 >> 2] | 0;if (a | 0) if (a >>> 0 < (c[3949] | 0) >>> 0) ma();else {
              c[n + 20 >> 2] = a;c[a + 24 >> 2] = n;break;
            }
          }
        } else {
          d = c[o + 8 >> 2] | 0;b = c[o + 12 >> 2] | 0;a = 15820 + (e << 1 << 2) | 0;if ((d | 0) != (a | 0)) {
            if (d >>> 0 < h >>> 0) ma();if ((c[d + 12 >> 2] | 0) != (o | 0)) ma();
          }if ((b | 0) == (d | 0)) {
            c[3945] = c[3945] & ~(1 << e);break;
          }if ((b | 0) != (a | 0)) {
            if (b >>> 0 < h >>> 0) ma();a = b + 8 | 0;if ((c[a >> 2] | 0) == (o | 0)) m = a;else ma();
          } else m = b + 8 | 0;c[d + 12 >> 2] = b;c[m >> 2] = d;
        }
      } while (0);c[r + 4 >> 2] = f | 1;c[r + f >> 2] = f;if ((r | 0) == (c[3950] | 0)) {
        c[3947] = f;return;
      }
    } else {
      c[a >> 2] = d & -2;c[r + 4 >> 2] = f | 1;c[r + f >> 2] = f;
    }a = f >>> 3;if (f >>> 0 < 256) {
      b = 15820 + (a << 1 << 2) | 0;d = c[3945] | 0;a = 1 << a;if (d & a) {
        a = b + 8 | 0;d = c[a >> 2] | 0;if (d >>> 0 < (c[3949] | 0) >>> 0) ma();else {
          p = d;q = a;
        }
      } else {
        c[3945] = d | a;p = b;q = b + 8 | 0;
      }c[q >> 2] = r;c[p + 12 >> 2] = r;c[r + 8 >> 2] = p;c[r + 12 >> 2] = b;return;
    }a = f >>> 8;if (a) {
      if (f >>> 0 > 16777215) a = 31;else {
        p = (a + 1048320 | 0) >>> 16 & 8;q = a << p;o = (q + 520192 | 0) >>> 16 & 4;q = q << o;a = (q + 245760 | 0) >>> 16 & 2;a = 14 - (o | p | a) + (q << a >>> 15) | 0;a = f >>> (a + 7 | 0) & 1 | a << 1;
      }
    } else a = 0;e = 16084 + (a << 2) | 0;c[r + 28 >> 2] = a;c[r + 20 >> 2] = 0;c[r + 16 >> 2] = 0;d = c[3946] | 0;b = 1 << a;if (!(d & b)) {
      c[3946] = d | b;c[e >> 2] = r;c[r + 24 >> 2] = e;c[r + 12 >> 2] = r;c[r + 8 >> 2] = r;return;
    }d = f << ((a | 0) == 31 ? 0 : 25 - (a >>> 1) | 0);e = c[e >> 2] | 0;while (1) {
      if ((c[e + 4 >> 2] & -8 | 0) == (f | 0)) {
        a = 121;break;
      }b = e + 16 + (d >>> 31 << 2) | 0;a = c[b >> 2] | 0;if (!a) {
        a = 118;break;
      } else {
        d = d << 1;e = a;
      }
    }if ((a | 0) == 118) {
      if (b >>> 0 < (c[3949] | 0) >>> 0) ma();c[b >> 2] = r;c[r + 24 >> 2] = e;c[r + 12 >> 2] = r;c[r + 8 >> 2] = r;return;
    } else if ((a | 0) == 121) {
      a = e + 8 | 0;d = c[a >> 2] | 0;q = c[3949] | 0;if (!(d >>> 0 >= q >>> 0 & e >>> 0 >= q >>> 0)) ma();c[d + 12 >> 2] = r;c[a >> 2] = r;c[r + 8 >> 2] = d;c[r + 12 >> 2] = e;c[r + 24 >> 2] = 0;return;
    }
  }function Kd(a) {
    a = a | 0;var b = 0;b = (a | 0) == 0 ? 1 : a;while (1) {
      a = Ed(b) | 0;if (a | 0) break;a = Od() | 0;if (!a) {
        a = 0;break;
      }Fa[a & 0]();
    }return a | 0;
  }function Ld(a) {
    a = a | 0;return Kd(a) | 0;
  }function Md(a) {
    a = a | 0;Fd(a);return;
  }function Nd(a) {
    a = a | 0;Md(a);return;
  }function Od() {
    var a = 0;a = c[4069] | 0;c[4069] = a + 0;return a | 0;
  }function Pd() {}function Qd(a, b, c, d) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;d = b - d - (c >>> 0 > a >>> 0 | 0) >>> 0;return (D = d, a - c >>> 0 | 0) | 0;
  }function Rd(a, b, c, d) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;c = a + c >>> 0;return (D = b + d + (c >>> 0 < a >>> 0 | 0) >>> 0, c | 0) | 0;
  }function Sd(b, d, e) {
    b = b | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0,
        i = 0;h = b + e | 0;d = d & 255;if ((e | 0) >= 67) {
      while (b & 3) {
        a[b >> 0] = d;b = b + 1 | 0;
      }f = h & -4 | 0;g = f - 64 | 0;i = d | d << 8 | d << 16 | d << 24;while ((b | 0) <= (g | 0)) {
        c[b >> 2] = i;c[b + 4 >> 2] = i;c[b + 8 >> 2] = i;c[b + 12 >> 2] = i;c[b + 16 >> 2] = i;c[b + 20 >> 2] = i;c[b + 24 >> 2] = i;c[b + 28 >> 2] = i;c[b + 32 >> 2] = i;c[b + 36 >> 2] = i;c[b + 40 >> 2] = i;c[b + 44 >> 2] = i;c[b + 48 >> 2] = i;c[b + 52 >> 2] = i;c[b + 56 >> 2] = i;c[b + 60 >> 2] = i;b = b + 64 | 0;
      }while ((b | 0) < (f | 0)) {
        c[b >> 2] = i;b = b + 4 | 0;
      }
    }while ((b | 0) < (h | 0)) {
      a[b >> 0] = d;b = b + 1 | 0;
    }return h - e | 0;
  }function Td(a, b, c) {
    a = a | 0;b = b | 0;c = c | 0;if ((c | 0) < 32) {
      D = b >>> c;return a >>> c | (b & (1 << c) - 1) << 32 - c;
    }D = 0;return b >>> c - 32 | 0;
  }function Ud(a, b, c) {
    a = a | 0;b = b | 0;c = c | 0;if ((c | 0) < 32) {
      D = b << c | (a & (1 << c) - 1 << 32 - c) >>> 32 - c;return a << c;
    }D = a << c - 32;return 0;
  }function Vd(b) {
    b = b | 0;var c = 0;c = a[n + (b & 255) >> 0] | 0;if ((c | 0) < 8) return c | 0;c = a[n + (b >> 8 & 255) >> 0] | 0;if ((c | 0) < 8) return c + 8 | 0;c = a[n + (b >> 16 & 255) >> 0] | 0;if ((c | 0) < 8) return c + 16 | 0;return (a[n + (b >>> 24) >> 0] | 0) + 24 | 0;
  }function Wd(a, b, d, e, f) {
    a = a | 0;b = b | 0;d = d | 0;e = e | 0;f = f | 0;var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0;l = a;j = b;k = j;h = d;n = e;i = n;if (!k) {
      g = (f | 0) != 0;if (!i) {
        if (g) {
          c[f >> 2] = (l >>> 0) % (h >>> 0);c[f + 4 >> 2] = 0;
        }n = 0;f = (l >>> 0) / (h >>> 0) >>> 0;return (D = n, f) | 0;
      } else {
        if (!g) {
          n = 0;f = 0;return (D = n, f) | 0;
        }c[f >> 2] = a | 0;c[f + 4 >> 2] = b & 0;n = 0;f = 0;return (D = n, f) | 0;
      }
    }g = (i | 0) == 0;do {
      if (h) {
        if (!g) {
          g = (V(i | 0) | 0) - (V(k | 0) | 0) | 0;if (g >>> 0 <= 31) {
            m = g + 1 | 0;i = 31 - g | 0;b = g - 31 >> 31;h = m;a = l >>> (m >>> 0) & b | k << i;b = k >>> (m >>> 0) & b;g = 0;i = l << i;break;
          }if (!f) {
            n = 0;f = 0;return (D = n, f) | 0;
          }c[f >> 2] = a | 0;c[f + 4 >> 2] = j | b & 0;n = 0;f = 0;return (D = n, f) | 0;
        }g = h - 1 | 0;if (g & h | 0) {
          i = (V(h | 0) | 0) + 33 - (V(k | 0) | 0) | 0;p = 64 - i | 0;m = 32 - i | 0;j = m >> 31;o = i - 32 | 0;b = o >> 31;h = i;a = m - 1 >> 31 & k >>> (o >>> 0) | (k << m | l >>> (i >>> 0)) & b;b = b & k >>> (i >>> 0);g = l << p & j;i = (k << p | l >>> (o >>> 0)) & j | l << m & i - 33 >> 31;break;
        }if (f | 0) {
          c[f >> 2] = g & l;c[f + 4 >> 2] = 0;
        }if ((h | 0) == 1) {
          o = j | b & 0;p = a | 0 | 0;return (D = o, p) | 0;
        } else {
          p = Vd(h | 0) | 0;o = k >>> (p >>> 0) | 0;p = k << 32 - p | l >>> (p >>> 0) | 0;return (D = o, p) | 0;
        }
      } else {
        if (g) {
          if (f | 0) {
            c[f >> 2] = (k >>> 0) % (h >>> 0);c[f + 4 >> 2] = 0;
          }o = 0;p = (k >>> 0) / (h >>> 0) >>> 0;return (D = o, p) | 0;
        }if (!l) {
          if (f | 0) {
            c[f >> 2] = 0;c[f + 4 >> 2] = (k >>> 0) % (i >>> 0);
          }o = 0;p = (k >>> 0) / (i >>> 0) >>> 0;return (D = o, p) | 0;
        }g = i - 1 | 0;if (!(g & i)) {
          if (f | 0) {
            c[f >> 2] = a | 0;c[f + 4 >> 2] = g & k | b & 0;
          }o = 0;p = k >>> ((Vd(i | 0) | 0) >>> 0);return (D = o, p) | 0;
        }g = (V(i | 0) | 0) - (V(k | 0) | 0) | 0;if (g >>> 0 <= 30) {
          b = g + 1 | 0;i = 31 - g | 0;h = b;a = k << i | l >>> (b >>> 0);b = k >>> (b >>> 0);g = 0;i = l << i;break;
        }if (!f) {
          o = 0;p = 0;return (D = o, p) | 0;
        }c[f >> 2] = a | 0;c[f + 4 >> 2] = j | b & 0;o = 0;p = 0;return (D = o, p) | 0;
      }
    } while (0);if (!h) {
      k = i;j = 0;i = 0;
    } else {
      m = d | 0 | 0;l = n | e & 0;k = Rd(m | 0, l | 0, -1, -1) | 0;d = D;j = i;i = 0;do {
        e = j;j = g >>> 31 | j << 1;g = i | g << 1;e = a << 1 | e >>> 31 | 0;n = a >>> 31 | b << 1 | 0;Qd(k | 0, d | 0, e | 0, n | 0) | 0;p = D;o = p >> 31 | ((p | 0) < 0 ? -1 : 0) << 1;i = o & 1;a = Qd(e | 0, n | 0, o & m | 0, (((p | 0) < 0 ? -1 : 0) >> 31 | ((p | 0) < 0 ? -1 : 0) << 1) & l | 0) | 0;b = D;h = h - 1 | 0;
      } while ((h | 0) != 0);k = j;j = 0;
    }h = 0;if (f | 0) {
      c[f >> 2] = a;c[f + 4 >> 2] = b;
    }o = (g | 0) >>> 31 | (k | h) << 1 | (h << 1 | g >>> 31) & 0 | j;p = (g << 1 | 0 >>> 31) & -2 | i;return (D = o, p) | 0;
  }function Xd(a, b, c, d) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;return Wd(a, b, c, d, 0) | 0;
  }function Yd(a) {
    a = a | 0;var b = 0,
        d = 0;d = a + 15 & -16 | 0;b = c[i >> 2] | 0;a = b + d | 0;if ((d | 0) > 0 & (a | 0) < (b | 0) | (a | 0) < 0) {
      _() | 0;na(12);return -1;
    }c[i >> 2] = a;if ((a | 0) > (Z() | 0) ? (Y() | 0) == 0 : 0) {
      na(12);c[i >> 2] = b;return -1;
    }return b | 0;
  }function Zd(b, d, e) {
    b = b | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0,
        h = 0;if ((e | 0) >= 8192) return qa(b | 0, d | 0, e | 0) | 0;h = b | 0;g = b + e | 0;if ((b & 3) == (d & 3)) {
      while (b & 3) {
        if (!e) return h | 0;a[b >> 0] = a[d >> 0] | 0;b = b + 1 | 0;d = d + 1 | 0;e = e - 1 | 0;
      }e = g & -4 | 0;f = e - 64 | 0;while ((b | 0) <= (f | 0)) {
        c[b >> 2] = c[d >> 2];c[b + 4 >> 2] = c[d + 4 >> 2];c[b + 8 >> 2] = c[d + 8 >> 2];c[b + 12 >> 2] = c[d + 12 >> 2];c[b + 16 >> 2] = c[d + 16 >> 2];c[b + 20 >> 2] = c[d + 20 >> 2];c[b + 24 >> 2] = c[d + 24 >> 2];c[b + 28 >> 2] = c[d + 28 >> 2];c[b + 32 >> 2] = c[d + 32 >> 2];c[b + 36 >> 2] = c[d + 36 >> 2];c[b + 40 >> 2] = c[d + 40 >> 2];c[b + 44 >> 2] = c[d + 44 >> 2];c[b + 48 >> 2] = c[d + 48 >> 2];c[b + 52 >> 2] = c[d + 52 >> 2];c[b + 56 >> 2] = c[d + 56 >> 2];c[b + 60 >> 2] = c[d + 60 >> 2];b = b + 64 | 0;d = d + 64 | 0;
      }while ((b | 0) < (e | 0)) {
        c[b >> 2] = c[d >> 2];b = b + 4 | 0;d = d + 4 | 0;
      }
    } else {
      e = g - 4 | 0;while ((b | 0) < (e | 0)) {
        a[b >> 0] = a[d >> 0] | 0;a[b + 1 >> 0] = a[d + 1 >> 0] | 0;a[b + 2 >> 0] = a[d + 2 >> 0] | 0;a[b + 3 >> 0] = a[d + 3 >> 0] | 0;b = b + 4 | 0;d = d + 4 | 0;
      }
    }while ((b | 0) < (g | 0)) {
      a[b >> 0] = a[d >> 0] | 0;b = b + 1 | 0;d = d + 1 | 0;
    }return h | 0;
  }function _d(b, c, d) {
    b = b | 0;c = c | 0;d = d | 0;var e = 0;if ((c | 0) < (b | 0) & (b | 0) < (c + d | 0)) {
      e = b;c = c + d | 0;b = b + d | 0;while ((d | 0) > 0) {
        b = b - 1 | 0;c = c - 1 | 0;d = d - 1 | 0;a[b >> 0] = a[c >> 0] | 0;
      }b = e;
    } else Zd(b, c, d) | 0;return b | 0;
  }function $d(a, b, d, e) {
    a = a | 0;b = b | 0;d = d | 0;e = e | 0;var f = 0,
        g = 0;g = l;l = l + 16 | 0;f = g | 0;Wd(a, b, d, e, f) | 0;l = g;return (D = c[f + 4 >> 2] | 0, c[f >> 2] | 0) | 0;
  }function ae(a) {
    a = a | 0;return (a & 255) << 8 | a >> 8 & 255 | 0;
  }function be(a) {
    a = a | 0;return (a & 255) << 24 | (a >> 8 & 255) << 16 | (a >> 16 & 255) << 8 | a >>> 24 | 0;
  }function ce(a, b, c, d) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;return ya[a & 15](b | 0, c | 0, d | 0) | 0;
  }function de(a, b, c, d, e, f, g) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;za[a & 3](b | 0, c | 0, d | 0, e | 0, f | 0, g | 0);
  }function ee(a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;l = l | 0;m = m | 0;n = n | 0;Aa[a & 3](b | 0, c | 0, d | 0, e | 0, f | 0, g | 0, h | 0, i | 0, j | 0, k | 0, l | 0, m | 0, n | 0);
  }function fe(a, b) {
    a = a | 0;b = b | 0;Ba[a & 7](b | 0);
  }function ge(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;l = l | 0;m = m | 0;n = n | 0;o = o | 0;p = p | 0;Ca[a & 3](b | 0, c | 0, d | 0, e | 0, f | 0, g | 0, h | 0, i | 0, j | 0, k | 0, l | 0, m | 0, n | 0, o | 0, p | 0);
  }function he(a, b) {
    a = a | 0;b = b | 0;return Da[a & 7](b | 0) | 0;
  }function ie(a, b, c, d) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;Ea[a & 3](b | 0, c | 0, d | 0);
  }function je(a) {
    a = a | 0;Fa[a & 0]();
  }function ke(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;l = l | 0;m = m | 0;n = n | 0;o = o | 0;p = p | 0;q = q | 0;r = r | 0;s = s | 0;t = t | 0;u = u | 0;return Ga[a & 3](b | 0, c | 0, d | 0, e | 0, f | 0, g | 0, h | 0, i | 0, j | 0, k | 0, l | 0, m | 0, n | 0, o | 0, p | 0, q | 0, r | 0, s | 0, t | 0, u | 0) | 0;
  }function le(a, b, c, d, e) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;e = e | 0;Ha[a & 3](b | 0, c | 0, d | 0, e | 0);
  }function me(a, b, c) {
    a = a | 0;b = b | 0;c = c | 0;W(0);return 0;
  }function ne(a, b, c, d, e, f) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;e = e | 0;f = f | 0;W(1);
  }function oe(a, b, c, d, e, f, g, h, i, j, k, l, m) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;l = l | 0;m = m | 0;W(2);
  }function pe(a) {
    a = a | 0;W(3);
  }function qe(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;l = l | 0;m = m | 0;n = n | 0;o = o | 0;W(4);
  }function re(a) {
    a = a | 0;W(5);return 0;
  }function se(a, b, c) {
    a = a | 0;b = b | 0;c = c | 0;W(6);
  }function te() {
    W(7);
  }function ue(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;e = e | 0;f = f | 0;g = g | 0;h = h | 0;i = i | 0;j = j | 0;k = k | 0;l = l | 0;m = m | 0;n = n | 0;o = o | 0;p = p | 0;q = q | 0;r = r | 0;s = s | 0;t = t | 0;W(8);return 0;
  }function ve(a, b, c, d) {
    a = a | 0;b = b | 0;c = c | 0;d = d | 0;W(9);
  }

  // EMSCRIPTEN_END_FUNCS
  var ya = [me, Db, $b, dc, ec, fc, Yb, oc, rc, tc, uc, Gc, Hc, Nc, wc, me];var za = [ne, Sa, Qa, ne];var Aa = [oe, Ra, Pa, oe];var Ba = [pe, _b, cc, nc, qc, pe, pe, pe];var Ca = [qe, sb, qb, qe];var Da = [re, Zb, bc, mc, pc, Fc, re, re];var Ea = [se, jc, hc, lc];var Fa = [te];var Ga = [ue, rb, pb, ue];var Ha = [ve, ic, gc, kc];return _ref = { _SH_speex_init: Ac, _bitshift64Lshr: Td, _bitshift64Shl: Ud, _fflush: wd, _memset: Sd, _sbrk: Yd, _memcpy: Zd, ___errno_location: Jc, ___uremdi3: $d, _llvm_cttz_i32: Vd, _i64Subtract: Qd, ___udivmoddi4: Wd, _i64Add: Rd, _SH_speex_speex_to_raw: Dc, _llvm_bswap_i16: ae, _emscripten_get_global_libc: Ec, ___udivdi3: Xd, _llvm_bswap_i32: be, _SH_speex_encode_frame: Bc, _free: Fd, _memmove: _d, _malloc: Ed, runPostSets: Pd, stackAlloc: Ia, stackSave: Ja, stackRestore: Ka, establishStackSpace: La, setTempRet0: Na, getTempRet0: Oa, setThrew: Ma }, _defineProperty(_ref, "stackAlloc", Ia), _defineProperty(_ref, "stackSave", Ja), _defineProperty(_ref, "stackRestore", Ka), _defineProperty(_ref, "establishStackSpace", La), _defineProperty(_ref, "setThrew", Ma), _defineProperty(_ref, "setTempRet0", Na), _defineProperty(_ref, "getTempRet0", Oa), _defineProperty(_ref, "dynCall_iiii", ce), _defineProperty(_ref, "dynCall_viiiiii", de), _defineProperty(_ref, "dynCall_viiiiiiiiiiiii", ee), _defineProperty(_ref, "dynCall_vi", fe), _defineProperty(_ref, "dynCall_viiiiiiiiiiiiiii", ge), _defineProperty(_ref, "dynCall_ii", he), _defineProperty(_ref, "dynCall_viii", ie), _defineProperty(_ref, "dynCall_v", je), _defineProperty(_ref, "dynCall_iiiiiiiiiiiiiiiiiiiii", ke), _defineProperty(_ref, "dynCall_viiii", le), _ref;
}(

// EMSCRIPTEN_END_ASM
Module.asmGlobalArg, Module.asmLibraryArg, buffer);var stackSave = Module["stackSave"] = asm["stackSave"];var getTempRet0 = Module["getTempRet0"] = asm["getTempRet0"];var _memset = Module["_memset"] = asm["_memset"];var setThrew = Module["setThrew"] = asm["setThrew"];var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];var _fflush = Module["_fflush"] = asm["_fflush"];var _llvm_cttz_i32 = Module["_llvm_cttz_i32"] = asm["_llvm_cttz_i32"];var _sbrk = Module["_sbrk"] = asm["_sbrk"];var _memcpy = Module["_memcpy"] = asm["_memcpy"];var ___errno_location = Module["___errno_location"] = asm["___errno_location"];var ___uremdi3 = Module["___uremdi3"] = asm["___uremdi3"];var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"];var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];var ___udivmoddi4 = Module["___udivmoddi4"] = asm["___udivmoddi4"];var setTempRet0 = Module["setTempRet0"] = asm["setTempRet0"];var _i64Add = Module["_i64Add"] = asm["_i64Add"];var _SH_speex_speex_to_raw = Module["_SH_speex_speex_to_raw"] = asm["_SH_speex_speex_to_raw"];var _llvm_bswap_i16 = Module["_llvm_bswap_i16"] = asm["_llvm_bswap_i16"];var _emscripten_get_global_libc = Module["_emscripten_get_global_libc"] = asm["_emscripten_get_global_libc"];var ___udivdi3 = Module["___udivdi3"] = asm["___udivdi3"];var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = asm["_llvm_bswap_i32"];var _SH_speex_init = Module["_SH_speex_init"] = asm["_SH_speex_init"];var _SH_speex_encode_frame = Module["_SH_speex_encode_frame"] = asm["_SH_speex_encode_frame"];var _free = Module["_free"] = asm["_free"];var runPostSets = Module["runPostSets"] = asm["runPostSets"];var establishStackSpace = Module["establishStackSpace"] = asm["establishStackSpace"];var _memmove = Module["_memmove"] = asm["_memmove"];var stackRestore = Module["stackRestore"] = asm["stackRestore"];var _malloc = Module["_malloc"] = asm["_malloc"];var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];var dynCall_viiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiii"] = asm["dynCall_viiiiiiiiiiiii"];var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];var dynCall_viiiiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiiiii"] = asm["dynCall_viiiiiiiiiiiiiii"];var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];var dynCall_iiiiiiiiiiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiiiiiiiiiii"] = asm["dynCall_iiiiiiiiiiiiiiiiiiiii"];var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];Runtime.stackAlloc = Module["stackAlloc"];Runtime.stackSave = Module["stackSave"];Runtime.stackRestore = Module["stackRestore"];Runtime.establishStackSpace = Module["establishStackSpace"];Runtime.setTempRet0 = Module["setTempRet0"];Runtime.getTempRet0 = Module["getTempRet0"];Module["asm"] = asm;function ExitStatus(status) {
  this.name = "ExitStatus";this.message = "Program terminated with exit(" + status + ")";this.status = status;
}ExitStatus.prototype = new Error();Object.defineProperty(ExitStatus.prototype, 'constructor', ExitStatus);var initialStackTop;var preloadStartTime = null;var calledMain = false;dependenciesFulfilled = function runCaller() {
  if (!Module["calledRun"]) run();if (!Module["calledRun"]) dependenciesFulfilled = runCaller;
};Module["callMain"] = Module.callMain = function callMain(args) {
  args = args || [];ensureInitRuntime();var argc = args.length + 1;function pad() {
    for (var i = 0; i < 4 - 1; i++) {
      argv.push(0);
    }
  }var argv = [allocate(intArrayFromString(Module["thisProgram"]), "i8", ALLOC_NORMAL)];pad();for (var i = 0; i < argc - 1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), "i8", ALLOC_NORMAL));pad();
  }argv.push(0);argv = allocate(argv, "i32", ALLOC_NORMAL);try {
    var ret = Module["_main"](argc, argv, 0);exit(ret, true);
  } catch (e) {
    if (e instanceof ExitStatus) {
      return;
    } else if (e == "SimulateInfiniteLoop") {
      Module["noExitRuntime"] = true;return;
    } else {
      var toLog = e;if (e && typeof e === "object" && e.stack) {
        toLog = [e, e.stack];
      }Module.printErr("exception thrown: " + toLog);Module["quit"](1, e);
    }
  } finally {
    calledMain = true;
  }
};function run(args) {
  args = args || Module["arguments"];if (preloadStartTime === null) preloadStartTime = Date.now();if (runDependencies > 0) {
    return;
  }preRun();if (runDependencies > 0) return;if (Module["calledRun"]) return;function doRun() {
    if (Module["calledRun"]) return;Module["calledRun"] = true;if (ABORT) return;ensureInitRuntime();preMain();if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();if (Module["_main"] && shouldRunNow) Module["callMain"](args);postRun();
  }if (Module["setStatus"]) {
    Module["setStatus"]("Running...");setTimeout(function () {
      setTimeout(function () {
        Module["setStatus"]("");
      }, 1);doRun();
    }, 1);
  } else {
    doRun();
  }
}Module["run"] = Module.run = run;function exit(status, implicit) {
  if (implicit && Module["noExitRuntime"]) {
    return;
  }if (Module["noExitRuntime"]) {} else {
    ABORT = true;EXITSTATUS = status;STACKTOP = initialStackTop;exitRuntime();if (Module["onExit"]) Module["onExit"](status);
  }if (ENVIRONMENT_IS_NODE) {
    process["exit"](status);
  }Module["quit"](status, new ExitStatus(status));
}Module["exit"] = Module.exit = exit;var abortDecorators = [];function abort(what) {
  if (what !== undefined) {
    Module.print(what);Module.printErr(what);what = JSON.stringify(what);
  } else {
    what = "";
  }ABORT = true;EXITSTATUS = 1;var extra = "\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";var output = "abort(" + what + ") at " + stackTrace() + extra;if (abortDecorators) {
    abortDecorators.forEach(function (decorator) {
      output = decorator(output, what);
    });
  }throw output;
}Module["abort"] = Module.abort = abort;if (Module["preInit"]) {
  if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];while (Module["preInit"].length > 0) {
    Module["preInit"].pop()();
  }
}var shouldRunNow = true;if (Module["noInitialRun"]) {
  shouldRunNow = false;
}run();

/*** EXPORTS FROM exports-loader ***/
module.exports = Module;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Module = __webpack_require__(3);

var init = Module.cwrap('SH_speex_init', 'number', ['number', 'number', 'number', 'number', 'number']);
var _encodeFrame = Module.cwrap('SH_speex_encode_frame', 'number', ['number', 'number', 'number']);
var speexToRaw = Module.cwrap('SH_speex_speex_to_raw', 'boolean', ['number', 'number', 'number', 'number']);

var headerSize = 80;
var headerPtrNB = Module._malloc(headerSize);
var headerPtrWB = Module._malloc(headerSize);
var headerBufferNB = new Uint8Array(Module.HEAPU8.buffer, headerPtrNB, headerSize);
var headerBufferWB = new Uint8Array(Module.HEAPU8.buffer, headerPtrWB, headerSize);

var speexSize = 40;
var speexPtrNB = Module._malloc(speexSize);
var speexPtrWB = Module._malloc(speexSize);

init(10, headerPtrNB, headerSize, 1, speexPtrNB);
init(10, headerPtrWB, headerSize, 0, speexPtrWB);

module.exports = {

  encodeFrame: function encodeFrame(framePtr, outBytesPtr, isNB) {
    return _encodeFrame(framePtr, outBytesPtr, isNB ? speexPtrNB : speexPtrWB);
  },
  decodeSpeex: function decodeSpeex(inputBufferPtr, inputSize, outputBufferPtr, outputSizePtr) {
    return speexToRaw(inputBufferPtr, inputSize, outputBufferPtr, outputSizePtr);
  },
  headerNB: headerBufferNB,
  headerWB: headerBufferWB

};

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StateEventDispatcher = function () {
  function StateEventDispatcher(state) {
    _classCallCheck(this, StateEventDispatcher);

    this.events = {};
    this.state = state;
  }

  _createClass(StateEventDispatcher, [{
    key: "on",
    value: function on(state, listener) {
      if (!this.events[state]) {
        this.events[state] = [];
      }

      var idx = this.getListeners(state).indexOf(listener);
      if (idx === -1) {
        this.events[state] = this.getListeners(state);
        this.events[state].push(listener);
      }

      return this;
    }
  }, {
    key: "getListeners",
    value: function getListeners(state) {
      return this.events[state] || [];
    }
  }, {
    key: "off",
    value: function off(state, listener) {
      var idx = this.getListeners(state).indexOf(listener);
      if (idx > -1) {
        this.events[state].splice(idx, 1);
      }

      return this;
    }
  }, {
    key: "setState",
    value: function setState(state, data) {
      this.state = state;
      this.fire(state, data);
    }
  }, {
    key: "setStateSilent",
    value: function setStateSilent(state) {
      this.state = state;
    }
  }, {
    key: "fire",
    value: function fire(evt, data) {
      var _this = this;

      var listeners = this.events[evt];
      if (listeners) {
        listeners.forEach(function (listener) {
          try {
            listener.call(_this, data);
          } catch (e) {
            console.log("Error in \'" + evt + "\' handler: " + e);
            if (e.stack) {
              console.log(e.stack);
            }
          }
        });
      }
    }
  }, {
    key: "isState",
    value: function isState(state) {
      return this.state == state;
    }
  }]);

  return StateEventDispatcher;
}();

module.exports = StateEventDispatcher;

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_6__;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JSONbig = __webpack_require__(2);

var config = __webpack_require__(1);

var Response = function () {
  function Response(body) {
    _classCallCheck(this, Response);

    var _json = JSONbig.parse(body);
    for (var key in _json) {
      this[key] = _json[key];
    }
  }

  _createClass(Response, [{
    key: 'stringify',
    value: function stringify(replacer, space) {
      return JSONbig.stringify(this, replacer, space);
    }
  }, {
    key: 'getConversationStates',
    value: function getConversationStates() {
      if (!this["AllResults"]) return [];

      return this.AllResults.map(function (result) {
        var obj = {};

        obj.CommandKind = result.CommandKind;

        if (!!result.ConversationState) {
          obj.Default = result.ConversationState;
        }

        for (var key in result) {
          if (!!result[key].ConversationState) {
            obj[key] = result[key].ConversationState;
          }
        }

        return obj;
      });
    }
  }]);

  return Response;
}();

module.exports = Response;

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_8__;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var config = __webpack_require__(1);

module.exports = {

  version: config.version,

  TextRequest: __webpack_require__(11),

  VoiceRequest: __webpack_require__(18),

  AudioRecorder: __webpack_require__(25),

  decodeAudioData: __webpack_require__(0).decodeAudioData,

  decodeSpeex: __webpack_require__(0).decodeSpeex,

  decodeBase64: __webpack_require__(0).decodeBase64,

  generateAuthenticationHeaders: __webpack_require__(0).generateAuthenticationHeaders,

  setDebug: __webpack_require__(0).setDebug

};

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = {"name":"houndify","version":"3.1.1","description":"The Houndify JavaScript SDK allows you to make voice and text queries to the Houndify API from your browser or Node.js script.","main":"index.js","scripts":{"start":"grunt build","build":"grunt dist","test":"jest --runInBand; rm -rf example","test:build":"node pullExamples","posttest:build":"grunt distTest"},"devDependencies":{"babel-core":"^6.26.0","babel-loader":"^7.1.2","babel-preset-env":"^1.6.1","exports-loader":"^0.6.4","fs-extra":"^4.0.2","grunt":"^1.0.1","grunt-contrib-clean":"^1.0.0","grunt-contrib-copy":"^1.0.0","grunt-contrib-watch":"^1.0.0","grunt-shell":"^1.3.1","grunt-webpack":"^3.0.2","jest":"^21.2.1","node-libs-browser":"^2.1.0","selenium-webdriver":"^3.6.0","uglifyjs-webpack-plugin":"^1.2.4","webpack":"^3.11.0","webpack-dev-server":"^2.11.1"},"license":"MIT","dependencies":{"axios":"^0.19.0","create-hmac":"^1.1.6","cross-fetch":"^2.1.0","express":"^4.17.0","express-ws":"^4.0.0","https-proxy-agent":"^2.1.0","json-bigint":"^0.2.3","pako":"^1.0.5","uuid":"^3.1.0","wav":"^1.0.2","ws":"^7.0.0"},"author":{"name":"Asif Amirguliyev <aamirgul@soundhound.com>"}}

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var uuid = __webpack_require__(6);
var JSONbig = __webpack_require__(2);

var Response = __webpack_require__(7);
var utils = __webpack_require__(0);
var request = utils.request;
var config = __webpack_require__(1);

var TextRequest = function TextRequest(opts) {
  _classCallCheck(this, TextRequest);

  if (opts["clientId"]) {
    this.clientId = opts["clientId"];
  } else {
    throw new Error("TextRequest requires Houndify Client ID 'clientId'.");
  }

  if (opts["clientKey"]) {
    this.clientKey = opts["clientKey"];
  } else if (opts["authURL"]) {
    this.authURL = opts["authURL"];
  } else {
    throw new Error("TextRequest requires either 'clientKey' or 'authURL' for authentication.");
  }

  if (opts["query"]) {
    this.query = opts["query"];
  } else {
    throw new Error("TextRequest requires 'query'.");
  }

  this.onResponse = utils.wrapListener(opts["onResponse"], "onResponse");
  this.onError = utils.wrapListener(opts["onError"], "onError");

  this.requestInfo = utils.cloneObject(opts["requestInfo"]);
  this.conversationState = opts["conversationState"];

  this.proxy = utils.cloneObject(opts["proxy"] || {});
  this.endpoint = opts["endpoint"] || config.TEXT_ENDPOINT;

  _runQuery.apply(this);
};

function _runQuery() {
  var _this = this;

  //Set SDK fields
  this.requestInfo["ClientID"] = this.clientId;
  this.requestInfo["SDK"] = "web";
  this.requestInfo["SDKVersion"] = config.version;

  //Set Conversation State
  if (this.conversationState && this.conversationState) {
    this.requestInfo["ConversationState"] = this.conversationState;
    this.requestInfo["ConversationStateTime"] = this.conversationState.ConversationStateTime;
  }

  //Create Search Info object
  var searchInfo = {
    type: "text",
    startTime: new Date(),
    endTime: -1,
    requestInfo: this.requestInfo,
    getTotalDuration: function getTotalDuration() {
      return this["endTime"] - this["startTime"];
    }
  };

  //onError wrapper
  var _onError = function _onError(errorObj) {
    searchInfo["error"] = errorObj;
    searchInfo["endTime"] = new Date();
    _this.onError(errorObj, searchInfo);
  };

  var requestInfoString = JSONbig.stringify(this.requestInfo);
  var requestInfoHeader = utils.escapeUnicode(requestInfoString);

  var endpoint = this.endpoint;
  var method = "GET";
  var headers = {};
  var proxyHeaderExclusiveList = [];

  if (this.proxy && this.proxy.url) {
    method = this.proxy.method || method;
    if (this.proxy.headers) {
      for (var headerName in this.proxy.headers) {
        proxyHeaderExclusiveList.push(headerName);
        headers[headerName] = this.proxy.headers[headerName];
      }
    }

    if (this.proxy.url.indexOf('http') !== 0 && window) {
      if (!window.location.origin) {
        window.location.origin = window.location.protocol + "//" + window.location.hostname;
        if (window.location.port) window.location.origin += ':' + window.location.port;
      }
      this.proxy.url = window.location.origin + this.proxy.url;
    }
  }

  headers["Content-Type"] = "text/plain";

  if (method === 'GET') headers["Hound-Request-Info"] = requestInfoHeader;

  if (this.requestInfo["InputLanguageEnglishName"]) headers["Hound-Input-Language-English-Name"] = this.requestInfo["InputLanguageEnglishName"];
  if (this.requestInfo["InputLanguageIETFTag"]) headers["Hound-Input-Language-IETF-Tag"] = this.requestInfo["InputLanguageIETFTag"];

  generateAuthHeaders(this, function (err, authHeaders) {
    if (err) {
      return _onError({ type: "AUTHENTICATION", exception: err });
    }

    headers["Hound-Request-Authentication"] = authHeaders["Hound-Request-Authentication"];
    headers["Hound-Client-Authentication"] = authHeaders["Hound-Client-Authentication"];

    var opts = {
      method: method,
      uri: endpoint,
      qs: { query: _this.query },
      headers: headers,
      body: requestInfoHeader
    };

    if (_this.proxy && _this.proxy.url) {
      opts.proxy = _this.proxy.url;
      opts.proxyHeaderExclusiveList = proxyHeaderExclusiveList;
    }

    request(opts, function (error, response, body) {
      if (error) {
        return _onError({ type: "CONNECTION", exception: error });
      }

      if (response.statusCode === 403) {
        return _onError({ type: "AUTHENTICATION", exception: body });
      }

      if (response.statusCode === 400) {
        return _onError({ type: "BAD_REQUEST", exception: body });
      }

      var parsedResponse = null;
      try {
        parsedResponse = new Response(body);
      } catch (e) {
        return _onError({ type: "PROXY", exception: body });
      }

      if ("Format" in parsedResponse && parsedResponse["Status"] !== "Error") {
        searchInfo["endTime"] = new Date();
        searchInfo["contentBody"] = body;

        _this.onResponse(parsedResponse, searchInfo);
      } else {
        return _onError({ type: "SERVER", exception: parsedResponse });
      }
    });
  });
}

function generateAuthHeaders(textRequest, callback) {
  var clientId = textRequest.clientId;
  var userId = textRequest.requestInfo["UserID"] || uuid.v1();
  var requestId = textRequest.requestInfo["RequestID"] || uuid.v1();
  var timeStamp = textRequest.requestInfo["TimeStamp"] || Math.floor(Date.now() / 1000);

  var requestData = userId + ';' + requestId;
  var token = requestData + timeStamp;
  var headers = {
    'Hound-Request-Authentication': requestData
  };

  utils.signToken(token, textRequest, function (err, encodedData) {
    headers['Hound-Client-Authentication'] = clientId + ';' + timeStamp + ';' + encodedData;
    callback(err, headers);
  });
};

module.exports = TextRequest;

/***/ }),
/* 12 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_12__;

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fetchNode = __webpack_require__(14);
var fetch = fetchNode.fetch.bind({});

fetch.polyfill = true;

if (!global.fetch) {
  global.fetch = fetch;
  global.Response = fetchNode.Response;
  global.Headers = fetchNode.Headers;
  global.Request = fetchNode.Request;
}

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var nodeFetch = __webpack_require__(15);
var realFetch = nodeFetch.default || nodeFetch;

var fetch = function fetch(url, options) {
  // Support schemaless URIs on the server for parity with the browser.
  // Ex: //github.com/ -> https://github.com/
  if (/^\/\//.test(url)) {
    url = 'https:' + url;
  }
  return realFetch.call(this, url, options);
};

fetch.polyfill = false;

module.exports = exports = fetch;
exports.fetch = fetch;
exports.Headers = nodeFetch.Headers;
exports.Request = nodeFetch.Request;
exports.Response = nodeFetch.Response;

// Needed for TypeScript consumers without esModuleInterop.
exports.default = fetch;

/***/ }),
/* 15 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_15__;

/***/ }),
/* 16 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 17 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var pako = __webpack_require__(8);
var JSONbig = __webpack_require__(2);

var config = __webpack_require__(1);
var utils = __webpack_require__(0);
var speex = __webpack_require__(4);
var HoundWebsocket = __webpack_require__(19);
var Processor = __webpack_require__(23);
var Response = __webpack_require__(7);

var state = {
  READY: "ready",
  STREAMING: "streaming",
  DONE: "done",
  ERROR: "error"
};

var VoiceRequest = function () {
  function VoiceRequest(opts) {
    var _this = this;

    _classCallCheck(this, VoiceRequest);

    this.state = state.READY;

    if (opts["clientId"]) {
      this.clientId = opts["clientId"];
    } else {
      throw new Error("VoiceRequest requires Houndify Client ID 'clientId'.");
    }

    if (opts["clientKey"]) {
      this.clientKey = opts["clientKey"];
    } else if (opts["authURL"]) {
      this.authURL = opts["authURL"];
    } else {
      throw new Error("VoiceRequest requires either 'clientKey' or 'authURL' for authentication.");
    }

    this.onResponse = utils.wrapListener(opts["onResponse"], "onResponse");
    this.onError = utils.wrapListener(opts["onError"], "onError");
    this.onTranscriptionUpdate = utils.wrapListener(opts["onTranscriptionUpdate"], "onTranscriptionUpdate");
    this.onAbort = utils.wrapListener(opts["onAbort"], "onAbort");

    this.requestInfo = utils.cloneObject(opts["requestInfo"]);
    this.conversationState = opts["conversationState"];

    this.convertAudioToSpeex = opts["convertAudioToSpeex"] || opts["convertAudioToSpeex"] === undefined ? true : false;
    this.sampleRate = opts["sampleRate"] || 16000;
    this.enableVAD = opts["enableVAD"] || opts["enableVAD"] === undefined ? true : false;

    this.endpoint = opts["endpoint"] || config.VOICE_ENDPOINT_WS;
    this.proxy = utils.cloneObject(opts["proxy"] || {});

    if (this.convertAudioToSpeex) {
      this.processor = new Processor(this.sampleRate);
      this.processor.on('frame', function (frame) {
        _this.connection.send(frame);
      }).on("error", function (err) {
        _onError.call(_this, err);
      });
    }

    // Set up houndify connection
    this.connection = new HoundWebsocket(this);
    this.connection.on("message", function (messageBody) {
      //new message from houndify (partial transcript (with VAD flag) or final result)
      try {
        var message = new Response(messageBody);
      } catch (e) {
        utils.log("voice_request: unable to parse messageBody", messageBody);
        _onError.call(_this, { type: "UNEXPECTED_MESSAGE", exception: messageBody });
      }

      // sic spelling! PartialTranscript = ParialTranscript
      if ("Format" in message && (message.Format == 'SoundHoundVoiceSearchParialTranscript' || message.Format == 'HoundVoiceQueryPartialTranscript')) {
        _onTranscript.call(_this, message);
      } else if ("Format" in message && (message.Format == 'SoundHoundVoiceSearchResult' || message.Format == 'HoundQueryResult')) {
        _onResponse.call(_this, message, messageBody);
      } else {
        utils.log("voice_request: unexpected message", message);
        _onError.call(_this, { type: "UNEXPECTED_MESSAGE", exception: message });

        _this.connection.done();
        _this.end();
      }
    }).on("error", function (err) {
      _onError.call(_this, err);
    });

    _startStreaming.apply(this);
  }

  _createClass(VoiceRequest, [{
    key: 'write',
    value: function write(audioData) {
      if (this.state !== state.STREAMING) return;

      if (this.convertAudioToSpeex) {
        this.processor.process(audioData);
      } else {
        this.connection.send(audioData);
      }
    }
  }, {
    key: 'end',
    value: function end() {
      if (this.state !== state.STREAMING) return;
      this.state = state.DONE;

      this.searchInfo["recordingEndTime"] = new Date();

      if (this.convertAudioToSpeex) {
        this.processor.free();
      }
      this.connection.endOfAudio();
    }
  }, {
    key: 'abort',
    value: function abort() {
      if (this.state !== state.STREAMING) return;
      this.state = state.DONE;

      this.searchInfo["endTime"] = new Date();

      if (this.convertAudioToSpeex) {
        this.processor.free();
      }
      this.connection.close();

      this.onAbort(this.searchInfo);
    }
  }, {
    key: 'isStreaming',
    value: function isStreaming() {
      return this.state === state.STREAMING;
    }
  }]);

  return VoiceRequest;
}();

function _startStreaming() {
  if (this.state !== state.READY) return;
  this.state = state.STREAMING;

  utils.log("voice_request: initialized");

  this.requestInfo["ClientID"] = this.clientId;
  this.requestInfo["ObjectByteCountPrefix"] = true; //always true for websocket voice search
  this.requestInfo["PartialTranscriptsDesired"] = true; //always true for websocket voice search
  this.requestInfo["SDK"] = "web";
  this.requestInfo["SDKVersion"] = config.version;

  if (this.conversationState && this.conversationState) {
    this.requestInfo["ConversationState"] = this.conversationState;
    this.requestInfo["ConversationStateTime"] = this.conversationState.ConversationStateTime;
  }

  //Set up search info json
  this.searchInfo = {
    type: "voice",
    startTime: new Date(),
    endTime: -1,
    vadEnabled: this.enableVAD,
    requestInfo: this.requestInfo,
    partialTranscriptLatencies: [],
    getTotalDuration: function getTotalDuration() {
      return this["endTime"] - this["startTime"];
    }
  };

  this.connection.connect(this.requestInfo);

  //Sending request info
  var compressedRequestInfo = pako.gzip(JSONbig.stringify(this.requestInfo));
  this.connection.send(compressedRequestInfo);

  if (this.convertAudioToSpeex) {
    //Sending speex headers
    this.connection.send(this.sampleRate < 16000 ? speex.headerNB : speex.headerWB);
  }
}

function _onError(error) {
  this.state = state.ERROR;

  this.searchInfo["error"] = error;
  this.searchInfo["endTime"] = new Date();

  this.connection && this.connection.close();

  this.onError(error, this.searchInfo);
}

function _onTranscript(message) {
  utils.log("voice_request: partial transcript", message);
  this.onTranscriptionUpdate(message);

  //calculate transcript latency
  this.searchInfo["partialTranscriptLatencies"].push(new Date() - this.searchInfo["startTime"] - message["DurationMS"]);

  //Server-side VAD
  if (message.SafeToStopAudio && this.enableVAD) {
    utils.log("voice_request: safe to stop audio");
    this.end();
  }

  if (message.Done) {
    utils.log("voice_request: done with transcripts. waiting for final response...");
    this.connection.done();
  }
}

function _onResponse(message, messageBody) {
  utils.log("voice_request: final result", message);

  this.connection.done();
  this.end();

  if (message.Status == 'Error') {
    return _onError.call(this, { type: "SERVER", exception: message });
  }

  this.searchInfo["contentBody"] = messageBody;
  this.searchInfo["endTime"] = new Date();

  this.onResponse(message, this.searchInfo);
}

module.exports = VoiceRequest;

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var pako = __webpack_require__(8);
var WebSocket = __webpack_require__(20);
var HttpsProxyAgent = __webpack_require__(21);
var url = __webpack_require__(22);

var config = __webpack_require__(1);
var StateEventDispatcher = __webpack_require__(5);
var utils = __webpack_require__(0);

var state = {
    CLOSED: "closed",
    CLOSING: "closing",
    CONNECTING: "connecting",
    CHECKING_VERSION: "version",
    STREAMING: "streaming",
    AUTHENTICATING: "authenticating",
    DONE: "done"
};

function isInBrowser() {
    if (typeof window === "undefined") {
        return false;
    } else {
        return true;
    }
}

function isBrowserWebSocketSupported() {
    if (window && typeof window.WebSocket !== "undefined") return true;
    return false;
}

// states: closed, connecting, version, authentication, ready

var HoundWebsocket = function (_StateEventDispatcher) {
    _inherits(HoundWebsocket, _StateEventDispatcher);

    function HoundWebsocket(voiceRequest) {
        _classCallCheck(this, HoundWebsocket);

        var _this = _possibleConstructorReturn(this, (HoundWebsocket.__proto__ || Object.getPrototypeOf(HoundWebsocket)).call(this, state.CLOSED));

        _this.voiceRequest = voiceRequest;
        _this.websocket = null;
        _this.buffer = [];
        _this.numBlobsInProgress = 0;
        _this.proxy = voiceRequest.proxy;
        return _this;
    }

    _createClass(HoundWebsocket, [{
        key: "connect",
        value: function connect(requestInfo) {
            var _this2 = this;

            this.setState(state.CONNECTING);

            this.close();

            this.buffer = [];
            this.endOfAudioSent = false;
            if (this.proxy && this.proxy.url) {
                // If you are running this in the browser, and the browser supports websocket,
                // use the browser implementation.
                if (isInBrowser() && isBrowserWebSocketSupported()) {
                    this.websocket = new window.WebSocket(this.voiceRequest.endpoint, {
                        agent: new HttpsProxyAgent(url.parse(this.proxy.url))
                    });
                }
                // otherwise use the nodejs websocket implementation.
                else {
                        this.websocket = new WebSocket(this.voiceRequest.endpoint, {
                            agent: new HttpsProxyAgent(url.parse(this.proxy.url))
                        });
                    }
            } else {
                // same cases as above, except `this.proxy` is not defined.
                if (isInBrowser() && isBrowserWebSocketSupported()) {
                    this.websocket = new window.WebSocket(this.voiceRequest.endpoint);
                } else {
                    this.websocket = new WebSocket(this.voiceRequest.endpoint);
                }
            }

            var websocket = this.websocket;

            websocket.onopen = function (evt) {
                websocket.send(JSON.stringify({ version: "1.0" }));

                utils.log("hound_websocket: connected, sending version 1.0...");
                _this2.setState(state.CHECKING_VERSION);
            };

            websocket.onclose = function (evt) {
                utils.log("hound_websocket: disconnected");

                if (_this2.isState(state.STREAMING) && _this2.numBlobsInProgress) {
                    var _checkIfDone = function _checkIfDone() {
                        if (self.numBlobsInProgress != 0) return;
                        if (self.isState(state.STREAMING)) {
                            self.fire("error", {
                                type: "CONNECTION",
                                exception: "Connection terminated."
                            });
                            self.setState(state.CLOSED);
                        }

                        self.off("message", _checkIfDone);
                    };

                    var self = _this2;


                    self.on("message", _checkIfDone);
                } else if (_this2.isState(state.CHECKING_VERSION)) {
                    _this2.fire("error", {
                        type: "PROTOCOL",
                        exception: "Version error."
                    });
                } else if (_this2.isState(state.AUTHENTICATING)) {
                    _this2.fire("error", {
                        type: "AUTHENTICATION",
                        exception: "Signed token rejected."
                    });
                } else if (_this2.isState(state.STREAMING)) {
                    _this2.fire("error", {
                        type: "CONNECTION",
                        exception: "Connection terminated."
                    });
                }

                _this2.setState(state.CLOSED);
            };

            websocket.onerror = function (err) {
                utils.log("hound_websocket: websocket error", err);
                _this2.fire("error", { type: "CONNECTION", exception: err });
            };

            websocket.onmessage = function (evt) {
                if (_this2.isState(state.CHECKING_VERSION)) {
                    var msgObject = JSON.parse(evt.data);
                    utils.log("hound_websocket: accepted message", evt.data);

                    if (msgObject["status"] !== "ok") {
                        _this2.fire("error", {
                            type: "PROTOCOL",
                            exception: "Version error."
                        });
                        _this2.close();
                        return;
                    }

                    if (!msgObject.hasOwnProperty("nonce")) {
                        _this2.fire("error", {
                            type: "PROTOCOL",
                            exception: "Missing nonce."
                        });
                        _this2.close();
                        return;
                    }

                    //Sign nonce and send it to backend for authentication
                    utils.signToken(msgObject["nonce"], _this2.voiceRequest, function (err, signature) {
                        if (err) {
                            _this2.fire("error", {
                                type: "AUTHENTICATION",
                                exception: err
                            });
                            _this2.close();
                            return;
                        }

                        var signedTokenMessage = {
                            access_id: _this2.voiceRequest.clientId,
                            signature: signature
                        };

                        if (requestInfo["InputLanguageEnglishName"]) signedTokenMessage["language_english_name"] = requestInfo["InputLanguageEnglishName"];
                        if (requestInfo["InputLanguageIETFTag"]) signedTokenMessage["language_ietf_tag"] = requestInfo["InputLanguageIETFTag"];

                        websocket.send(JSON.stringify(signedTokenMessage));
                        utils.log("hound_websocket: sending message", signedTokenMessage);
                    });

                    utils.log("hound_websocket: version ok, authenticating...");
                    _this2.setState(state.AUTHENTICATING);
                } else if (_this2.isState(state.AUTHENTICATING)) {
                    var msgObject = JSON.parse(evt.data);
                    utils.log("hound_websocket: accepted message", evt.data);

                    if (msgObject["status"] !== "ok") {
                        _this2.fire("error", {
                            type: "AUTHENTICATION",
                            exception: "Signed token rejected."
                        });
                        _this2.close();
                        return;
                    }

                    utils.log("hound_websocket: authentication ok, sending buffer...");
                    for (var bufIdx in _this2.buffer) {
                        websocket.send(_this2.buffer[bufIdx]);
                    }

                    utils.log("hound_websocket: buffer sent, streaming...");
                    _this2.setState(state.STREAMING);
                } else {
                    try {
                        if (utils.isString(evt.data)) {
                            var msgObject = JSON.parse(evt.data);
                            _this2.fire("error", {
                                type: "BAD_REQUEST",
                                exception: msgObject
                            });
                            _this2.close();
                        } else if (utils.isBlob(evt.data)) {
                            new Response(evt.data).arrayBuffer().then(function (result) {
                                var uncompressed = pako.ungzip(result, {
                                    to: "string"
                                });
                                _this2.fire("message", uncompressed);
                                _this2.numBlobsInProgress -= 1;
                            });

                            _this2.numBlobsInProgress += 1;
                        } else {
                            var uncompressed = pako.ungzip(evt.data.toString("binary"), { to: "string" });
                            _this2.fire("message", uncompressed);
                        }
                    } catch (e) {
                        utils.log("hound_websocket", e);
                        _this2.fire("error", {
                            type: "UNEXPECTED_MESSAGE",
                            exception: evt.data
                        });
                        _this2.close();
                    }
                }
            };
        }
    }, {
        key: "send",
        value: function send(data) {
            if (this.isState(state.CLOSED)) {
                utils.log("hound_websocket: can't send data, connection closed.");
            } else if (!this.isState(state.STREAMING)) {
                this.buffer.push(data);
            } else if (this.isState(state.STREAMING)) {
                this.websocket.send(data);
            }
        }
    }, {
        key: "endOfAudio",
        value: function endOfAudio() {
            if (!this.endOfAudioSent) {
                utils.log("hound_websocket: sending endOfAudio");
                this.send(JSON.stringify({ endOfAudio: true }));
                this.endOfAudioSent = true;
            }
        }
    }, {
        key: "done",
        value: function done() {
            utils.log("hound_websocket: done");
            //websocket is expected to close now
            this.setState(state.DONE);
        }
    }, {
        key: "close",
        value: function close() {
            if (this.isState(state.CLOSED)) return;
            if (this.websocket) {
                utils.log("hound_websocket: close");
                this.websocket.close();
                //todo: check if we can use same state for DONE and CLOSING
                this.setState(state.CLOSING);
            }
        }
    }]);

    return HoundWebsocket;
}(StateEventDispatcher);

module.exports = HoundWebsocket;

/***/ }),
/* 20 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_20__;

/***/ }),
/* 21 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_21__;

/***/ }),
/* 22 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_22__;

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var config = __webpack_require__(1);
var StateEventDispatcher = __webpack_require__(5);
var speex = __webpack_require__(4);

var Module = __webpack_require__(3);
var xaudio = __webpack_require__(24);

//constants
var OUTBUFSIZE = 202; // Each Speex frame is a maximum of 200 bytes + 2 bytes for the size prefix
var FRAMESIZE_NB = 160;
var FRAMESIZE_WB = 320;

var Processor = function (_StateEventDispatcher) {
  _inherits(Processor, _StateEventDispatcher);

  function Processor(sampleRate) {
    _classCallCheck(this, Processor);

    var _this = _possibleConstructorReturn(this, (Processor.__proto__ || Object.getPrototypeOf(Processor)).call(this, "ready"));

    _this.framePtr = 0;
    _this.sampleRate = sampleRate || 16000;
    _this.framesize = _this.sampleRate < 16000 ? FRAMESIZE_NB : FRAMESIZE_WB;

    // Allocate the memory buffers for the incoming frames and the output bytes
    _this.frameHeapPtr = new Int16Array(Module.HEAP16.buffer, Module._malloc(_this.framesize * 2), _this.framesize);
    _this.outBytesHeapPtr = new Uint8Array(Module.HEAPU8.buffer, Module._malloc(OUTBUFSIZE), OUTBUFSIZE);
    return _this;
  }

  _createClass(Processor, [{
    key: 'process',
    value: function process(buffer) {
      var isNarrowband = this.sampleRate < 16000;

      var resampleControl = new xaudio.Resampler(this.sampleRate, isNarrowband ? 8000 : 16000, 1, buffer.length, true);

      var resampleLength = resampleControl.resampler(buffer);
      var result = resampleControl.outputBuffer;

      for (var i = 0; i < resampleLength; i++) {
        // wait until we have FRAMESIZE samples and the process (encode) the data
        if (this.framePtr == this.framesize) {
          //reset framePtr
          this.framePtr = 0;

          // Encode FRAMESIZE samples into a single Speex frame and then send it in a Websocket message.
          var nbytes = speex.encodeFrame(this.frameHeapPtr.byteOffset, this.outBytesHeapPtr.byteOffset, isNarrowband);
          var sliceStart = this.outBytesHeapPtr.byteOffset;
          var sliceEnd = this.outBytesHeapPtr.byteOffset + nbytes + 2;
          var newBuffer = this.outBytesHeapPtr.buffer.slice(sliceStart, sliceEnd);
          var frame = new Uint8Array(newBuffer);

          this.fire("frame", frame);
        }

        var isFloat32 = buffer.BYTES_PER_ELEMENT === 4;
        this.frameHeapPtr[this.framePtr++] = isFloat32 ? result[i] * 0x8000 : result[i]; // convert Float32 to Int16 
      }
    }
  }, {
    key: 'free',
    value: function free() {
      if (this.frameHeapPtr && this.outBytesHeapPtr) {
        Module._free(this.frameHeapPtr.byteOffset);
        Module._free(this.outBytesHeapPtr.byteOffset);
      }
    }
  }]);

  return Processor;
}(StateEventDispatcher);

module.exports = Processor;

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


//JavaScript Audio Resampler (c) 2011 - Grant Galitz
function Resampler(fromSampleRate, toSampleRate, channels, outputBufferSize, noReturn) {
	this.fromSampleRate = fromSampleRate;
	this.toSampleRate = toSampleRate;
	this.channels = channels | 0;
	this.outputBufferSize = outputBufferSize;
	this.noReturn = !!noReturn;
	this.initialize();
}
Resampler.prototype.initialize = function () {
	//Perform some checks:
	if (this.fromSampleRate > 0 && this.toSampleRate > 0 && this.channels > 0) {
		if (this.fromSampleRate == this.toSampleRate) {
			//Setup a resampler bypass:
			this.resampler = this.bypassResampler; //Resampler just returns what was passed through.
			this.ratioWeight = 1;
		} else {
			//Setup the interpolation resampler:
			this.compileInterpolationFunction();
			this.resampler = this.interpolate; //Resampler is a custom quality interpolation algorithm.
			this.ratioWeight = this.fromSampleRate / this.toSampleRate;
			this.tailExists = false;
			this.lastWeight = 0;
			this.initializeBuffers();
		}
	} else {
		throw new Error("Invalid settings specified for the resampler.");
	}
};
Resampler.prototype.compileInterpolationFunction = function () {
	var toCompile = "var bufferLength = Math.min(buffer.length, this.outputBufferSize);\
	if ((bufferLength % " + this.channels + ") == 0) {\
		if (bufferLength > 0) {\
			var ratioWeight = this.ratioWeight;\
			var weight = 0;";
	for (var channel = 0; channel < this.channels; ++channel) {
		toCompile += "var output" + channel + " = 0;";
	}
	toCompile += "var actualPosition = 0;\
			var amountToNext = 0;\
			var alreadyProcessedTail = !this.tailExists;\
			this.tailExists = false;\
			var outputBuffer = this.outputBuffer;\
			var outputOffset = 0;\
			var currentPosition = 0;\
			do {\
				if (alreadyProcessedTail) {\
					weight = ratioWeight;";
	for (channel = 0; channel < this.channels; ++channel) {
		toCompile += "output" + channel + " = 0;";
	}
	toCompile += "}\
				else {\
					weight = this.lastWeight;";
	for (channel = 0; channel < this.channels; ++channel) {
		toCompile += "output" + channel + " = this.lastOutput[" + channel + "];";
	}
	toCompile += "alreadyProcessedTail = true;\
				}\
				while (weight > 0 && actualPosition < bufferLength) {\
					amountToNext = 1 + actualPosition - currentPosition;\
					if (weight >= amountToNext) {";
	for (channel = 0; channel < this.channels; ++channel) {
		toCompile += "output" + channel + " += buffer[actualPosition++] * amountToNext;";
	}
	toCompile += "currentPosition = actualPosition;\
						weight -= amountToNext;\
					}\
					else {";
	for (channel = 0; channel < this.channels; ++channel) {
		toCompile += "output" + channel + " += buffer[actualPosition" + (channel > 0 ? " + " + channel : "") + "] * weight;";
	}
	toCompile += "currentPosition += weight;\
						weight = 0;\
						break;\
					}\
				}\
				if (weight == 0) {";
	for (channel = 0; channel < this.channels; ++channel) {
		toCompile += "outputBuffer[outputOffset++] = output" + channel + " / ratioWeight;";
	}
	toCompile += "}\
				else {\
					this.lastWeight = weight;";
	for (channel = 0; channel < this.channels; ++channel) {
		toCompile += "this.lastOutput[" + channel + "] = output" + channel + ";";
	}
	toCompile += "this.tailExists = true;\
					break;\
				}\
			} while (actualPosition < bufferLength);\
			return this.bufferSlice(outputOffset);\
		}\
		else {\
			return (this.noReturn) ? 0 : [];\
		}\
	}\
	else {\
		throw(new Error(\"Buffer was of incorrect sample length.\"));\
	}";
	this.interpolate = Function("buffer", toCompile);
};
Resampler.prototype.bypassResampler = function (buffer) {
	if (this.noReturn) {
		//Set the buffer passed as our own, as we don't need to resample it:
		this.outputBuffer = buffer;
		return buffer.length;
	} else {
		//Just return the buffer passsed:
		return buffer;
	}
};
Resampler.prototype.bufferSlice = function (sliceAmount) {
	if (this.noReturn) {
		//If we're going to access the properties directly from this object:
		return sliceAmount;
	} else {
		//Typed array and normal array buffer section referencing:
		try {
			return this.outputBuffer.subarray(0, sliceAmount);
		} catch (error) {
			try {
				//Regular array pass:
				this.outputBuffer.length = sliceAmount;
				return this.outputBuffer;
			} catch (error) {
				//Nightly Firefox 4 used to have the subarray function named as slice:
				return this.outputBuffer.slice(0, sliceAmount);
			}
		}
	}
};
Resampler.prototype.initializeBuffers = function (generateTailCache) {
	//Initialize the internal buffer:
	try {
		this.outputBuffer = new Float32Array(this.outputBufferSize);
		this.lastOutput = new Float32Array(this.channels);
	} catch (error) {
		this.outputBuffer = [];
		this.lastOutput = [];
	}
}; /*Initialize here first:
   Example:
   	Stereo audio with a sample rate of 70 khz, a minimum buffer of 15000 samples total, a maximum buffer of 25000 samples total and a neutral amplitude value of -1.
   		var parentObj = this;
   		this.audioHandle = new XAudioServer(2, 70000, 15000, 25000, function (sampleCount) {
   			return parentObj.audioUnderRun(sampleCount);
   		}, -1);
   
   The callback is passed the number of samples requested, while it can return any number of samples it wants back.
   */
function XAudioServer(channels, sampleRate, minBufferSize, maxBufferSize, underRunCallback, defaultValue) {
	this.audioChannels = channels == 2 ? 2 : 1;
	webAudioMono = this.audioChannels == 1;
	XAudioJSSampleRate = sampleRate > 0 && sampleRate <= 0xFFFFFF ? sampleRate : 44100;
	webAudioMinBufferSize = minBufferSize >= samplesPerCallback << 1 && minBufferSize < maxBufferSize ? minBufferSize & (webAudioMono ? 0xFFFFFFFF : 0xFFFFFFFE) : samplesPerCallback << 1;
	webAudioMaxBufferSize = Math.floor(maxBufferSize) > webAudioMinBufferSize + this.audioChannels ? maxBufferSize & (webAudioMono ? 0xFFFFFFFF : 0xFFFFFFFE) : minBufferSize << 1;
	this.underRunCallback = typeof underRunCallback == "function" ? underRunCallback : function () {};
	defaultNeutralValue = defaultValue >= -1 && defaultValue <= 1 && defaultValue != 0 ? defaultValue : 0;
	this.audioType = -1;
	this.mozAudioTail = [];
	this.audioHandleMoz = null;
	this.audioHandleFlash = null;
	this.flashInitialized = false;
	this.mozAudioFound = false;
	this.initializeAudio();
}
XAudioServer.prototype.MOZWriteAudio = function (buffer) {
	//mozAudio:
	this.MOZWriteAudioNoCallback(buffer);
	this.MOZExecuteCallback();
};
XAudioServer.prototype.MOZWriteAudioNoCallback = function (buffer) {
	//mozAudio:
	this.writeMozAudio(buffer);
};
XAudioServer.prototype.callbackBasedWriteAudio = function (buffer) {
	//Callback-centered audio APIs:
	this.callbackBasedWriteAudioNoCallback(buffer);
	this.callbackBasedExecuteCallback();
};
XAudioServer.prototype.callbackBasedWriteAudioNoCallback = function (buffer) {
	//Callback-centered audio APIs:
	if (!buffer) {
		return;
	}

	var length = buffer.length;
	for (var bufferCounter = 0; bufferCounter < length && audioBufferSize < webAudioMaxBufferSize;) {
		audioContextSampleBuffer[audioBufferSize++] = buffer[bufferCounter++];
	}
};
/*Pass your samples into here!
Pack your samples as a one-dimenional array
With the channel samplea packed uniformly.
examples:
    mono - [left, left, left, left]
    stereo - [left, right, left, right, left, right, left, right]
*/
XAudioServer.prototype.writeAudio = function (buffer) {
	if (this.audioType == 0) {
		this.MOZWriteAudio(buffer);
	} else if (this.audioType == 1) {
		this.callbackBasedWriteAudio(buffer);
	} else if (this.audioType == 2) {
		if (this.checkFlashInit() || launchedContext) {
			this.callbackBasedWriteAudio(buffer);
		} else if (this.mozAudioFound) {
			this.MOZWriteAudio(buffer);
		}
	}
};
/*Pass your samples into here if you don't want automatic callback calling:
Pack your samples as a one-dimenional array
With the channel samplea packed uniformly.
examples:
    mono - [left, left, left, left]
    stereo - [left, right, left, right, left, right, left, right]
Useful in preventing infinite recursion issues with calling writeAudio inside your callback.
*/
XAudioServer.prototype.writeAudioNoCallback = function (buffer) {
	if (this.audioType == 0) {
		this.MOZWriteAudioNoCallback(buffer);
	} else if (this.audioType == 1) {
		this.callbackBasedWriteAudioNoCallback(buffer);
	} else if (this.audioType == 2) {
		if (this.checkFlashInit() || launchedContext) {
			this.callbackBasedWriteAudioNoCallback(buffer);
		} else if (this.mozAudioFound) {
			this.MOZWriteAudioNoCallback(buffer);
		}
	}
};
//Developer can use this to see how many samples to write (example: minimum buffer allotment minus remaining samples left returned from this function to make sure maximum buffering is done...)
//If -1 is returned, then that means metric could not be done.
XAudioServer.prototype.remainingBuffer = function () {
	if (this.audioType == 0) {
		//mozAudio:
		return this.samplesAlreadyWritten - this.audioHandleMoz.mozCurrentSampleOffset();
	} else if (this.audioType == 1) {
		//WebKit Audio:
		return (resampledSamplesLeft() * resampleControl.ratioWeight >> this.audioChannels - 1 << this.audioChannels - 1) + audioBufferSize;
	} else if (this.audioType == 2) {
		if (this.checkFlashInit() || launchedContext) {
			//Webkit Audio / Flash Plugin Audio:
			return (resampledSamplesLeft() * resampleControl.ratioWeight >> this.audioChannels - 1 << this.audioChannels - 1) + audioBufferSize;
		} else if (this.mozAudioFound) {
			//mozAudio:
			return this.samplesAlreadyWritten - this.audioHandleMoz.mozCurrentSampleOffset();
		}
	}
	//Default return:
	return 0;
};
XAudioServer.prototype.MOZExecuteCallback = function () {
	//mozAudio:
	var samplesRequested = webAudioMinBufferSize - this.remainingBuffer();
	if (samplesRequested > 0) {
		this.writeMozAudio(this.underRunCallback(samplesRequested));
	}
};
XAudioServer.prototype.callbackBasedExecuteCallback = function () {
	//WebKit /Flash Audio:
	var samplesRequested = webAudioMinBufferSize - this.remainingBuffer();
	if (samplesRequested > 0) {
		this.callbackBasedWriteAudioNoCallback(this.underRunCallback(samplesRequested));
	}
};
//If you just want your callback called for any possible refill (Execution of callback is still conditional):
XAudioServer.prototype.executeCallback = function () {
	if (this.audioType == 0) {
		this.MOZExecuteCallback();
	} else if (this.audioType == 1) {
		this.callbackBasedExecuteCallback();
	} else if (this.audioType == 2) {
		if (this.checkFlashInit() || launchedContext) {
			this.callbackBasedExecuteCallback();
		} else if (this.mozAudioFound) {
			this.MOZExecuteCallback();
		}
	}
};
//DO NOT CALL THIS, the lib calls this internally!
XAudioServer.prototype.initializeAudio = function () {
	try {
		this.preInitializeMozAudio();
		if (navigator.platform == "Linux i686") {
			//Block out mozaudio usage for Linux Firefox due to moz bugs:
			throw new Error("");
		}
		this.initializeMozAudio();
	} catch (error) {
		try {
			this.initializeWebAudio();
		} catch (error) {
			try {
				this.initializeFlashAudio();
			} catch (error) {
				throw new Error("Browser does not support real time audio output.");
			}
		}
	}
};
XAudioServer.prototype.preInitializeMozAudio = function () {
	//mozAudio - Synchronous Audio API
	this.audioHandleMoz = new Audio();
	this.audioHandleMoz.mozSetup(this.audioChannels, XAudioJSSampleRate);
	this.samplesAlreadyWritten = 0;
	var emptySampleFrame = this.audioChannels == 2 ? [0, 0] : [0];
	var prebufferAmount = 0;
	if (navigator.platform != "MacIntel" && navigator.platform != "MacPPC") {
		//Mac OS X doesn't experience this moz-bug!
		while (this.audioHandleMoz.mozCurrentSampleOffset() == 0) {
			//Mozilla Audio Bugginess Workaround (Firefox freaks out if we don't give it a prebuffer under certain OSes):
			prebufferAmount += this.audioHandleMoz.mozWriteAudio(emptySampleFrame);
		}
		var samplesToDoubleBuffer = prebufferAmount / this.audioChannels;
		//Double the prebuffering for windows:
		for (var index = 0; index < samplesToDoubleBuffer; index++) {
			this.samplesAlreadyWritten += this.audioHandleMoz.mozWriteAudio(emptySampleFrame);
		}
	}
	this.samplesAlreadyWritten += prebufferAmount;
	webAudioMinBufferSize += this.samplesAlreadyWritten;
	this.mozAudioFound = true;
};
XAudioServer.prototype.initializeMozAudio = function () {
	//Fill in our own buffering up to the minimum specified:
	this.writeMozAudio(getFloat32(webAudioMinBufferSize));
	this.audioType = 0;
};
XAudioServer.prototype.initializeWebAudio = function () {
	if (launchedContext) {
		resetCallbackAPIAudioBuffer(webAudioActualSampleRate, samplesPerCallback);
		this.audioType = 1;
	} else {
		throw new Error("");
	}
};
XAudioServer.prototype.initializeFlashAudio = function () {
	var existingFlashload = document.getElementById("XAudioJS");
	if (existingFlashload == null) {
		var thisObj = this;
		var mainContainerNode = document.createElement("div");
		mainContainerNode.setAttribute("style", "position: fixed; bottom: 0px; right: 0px; margin: 0px; padding: 0px; border: none; width: 8px; height: 8px; overflow: hidden; z-index: -1000; ");
		var containerNode = document.createElement("div");
		containerNode.setAttribute("style", "position: static; border: none; width: 0px; height: 0px; visibility: hidden; margin: 8px; padding: 0px;");
		containerNode.setAttribute("id", "XAudioJS");
		mainContainerNode.appendChild(containerNode);
		document.getElementsByTagName("body")[0].appendChild(mainContainerNode);
		swfobject.embedSWF("XAudioJS.swf", "XAudioJS", "8", "8", "9.0.0", "", {}, { "allowscriptaccess": "always" }, { "style": "position: static; visibility: hidden; margin: 8px; padding: 0px; border: none" }, function (event) {
			if (event.success) {
				thisObj.audioHandleFlash = event.ref;
			} else {
				thisObj.audioType = 1;
			}
		});
	} else {
		this.audioHandleFlash = existingFlashload;
	}
	this.audioType = 2;
};
//Moz Audio Buffer Writing Handler:
XAudioServer.prototype.writeMozAudio = function (buffer) {
	if (!buffer) {
		return;
	}

	var length = this.mozAudioTail.length;
	if (length > 0) {
		var samplesAccepted = this.audioHandleMoz.mozWriteAudio(this.mozAudioTail);
		this.samplesAlreadyWritten += samplesAccepted;
		this.mozAudioTail.splice(0, samplesAccepted);
	}

	length = Math.min(buffer.length, webAudioMaxBufferSize - this.samplesAlreadyWritten + this.audioHandleMoz.mozCurrentSampleOffset());
	var samplesAccepted = this.audioHandleMoz.mozWriteAudio(buffer);
	this.samplesAlreadyWritten += samplesAccepted;
	for (var index = 0; length > samplesAccepted; --length) {
		//Moz Audio wants us saving the tail:
		this.mozAudioTail.push(buffer[index++]);
	}
};
//Checks to see if the NPAPI Adobe Flash bridge is ready yet:
XAudioServer.prototype.checkFlashInit = function () {
	if (!this.flashInitialized && this.audioHandleFlash && this.audioHandleFlash.initialize) {
		this.flashInitialized = true;
		this.audioHandleFlash.initialize(this.audioChannels, defaultNeutralValue);
		resetCallbackAPIAudioBuffer(44100, samplesPerCallback);
	}
	return this.flashInitialized;
};
/////////END LIB
function getFloat32(size) {
	try {
		var newBuffer = new Float32Array(size);
	} catch (error) {
		var newBuffer = new Array(size);
	}
	for (var audioSampleIndice = 0; audioSampleIndice < size; ++audioSampleIndice) {
		//Create a gradual neutral position shift here to make sure we don't cause annoying clicking noises
		//when the developer set neutral position is not 0.
		newBuffer[audioSampleIndice] = defaultNeutralValue * (audioSampleIndice / size);
	}
	return newBuffer;
}
function getFloat32Flat(size) {
	try {
		var newBuffer = new Float32Array(size);
	} catch (error) {
		var newBuffer = new Array(size);
		var audioSampleIndice = 0;
		do {
			newBuffer[audioSampleIndice] = 0;
		} while (++audioSampleIndice < size);
	}
	return newBuffer;
}
//Flash NPAPI Event Handler:
var samplesPerCallback = 2048; //Has to be between 2048 and 4096 (If over, then samples are ignored, if under then silence is added).
var outputConvert = null;
function audioOutputFlashEvent() {
	//The callback that flash calls...
	resampleRefill();
	return outputConvert();
}
function generateFlashStereoString() {
	//Convert the arrays to one long string for speed.
	var copyBinaryStringLeft = "";
	var copyBinaryStringRight = "";
	for (var index = 0; index < samplesPerCallback && resampleBufferStart != resampleBufferEnd; ++index) {
		//Sanitize the buffer:
		copyBinaryStringLeft += String.fromCharCode((Math.min(Math.max(resampled[resampleBufferStart++] + 1, 0), 2) * 0x3FFF | 0) + 0x3000);
		copyBinaryStringRight += String.fromCharCode((Math.min(Math.max(resampled[resampleBufferStart++] + 1, 0), 2) * 0x3FFF | 0) + 0x3000);
		if (resampleBufferStart == resampleBufferSize) {
			resampleBufferStart = 0;
		}
	}
	return copyBinaryStringLeft + copyBinaryStringRight;
}
function generateFlashMonoString() {
	//Convert the array to one long string for speed.
	var copyBinaryString = "";
	for (var index = 0; index < samplesPerCallback && resampleBufferStart != resampleBufferEnd; ++index) {
		//Sanitize the buffer:
		copyBinaryString += String.fromCharCode((Math.min(Math.max(resampled[resampleBufferStart++] + 1, 0), 2) * 0x3FFF | 0) + 0x3000);
		if (resampleBufferStart == resampleBufferSize) {
			resampleBufferStart = 0;
		}
	}
	return copyBinaryString;
}
//Audio API Event Handler:
var audioContextHandle = null;
var audioNode = null;
var audioSource = null;
var launchedContext = false;
var audioContextSampleBuffer = [];
var resampled = [];
var webAudioMinBufferSize = 15000;
var webAudioMaxBufferSize = 25000;
var webAudioActualSampleRate = 44100;
var XAudioJSSampleRate = 0;
var webAudioMono = false;
var defaultNeutralValue = 0;
var resampleControl = null;
var audioBufferSize = 0;
var resampleBufferStart = 0;
var resampleBufferEnd = 0;
var resampleBufferSize = 2;
function audioOutputEvent(event) {
	//Web Audio API callback...
	var index = 0;
	var buffer1 = event.outputBuffer.getChannelData(0);
	var buffer2 = event.outputBuffer.getChannelData(1);
	resampleRefill();
	if (!webAudioMono) {
		//STEREO:
		while (index < samplesPerCallback && resampleBufferStart != resampleBufferEnd) {
			buffer1[index] = resampled[resampleBufferStart++];
			buffer2[index++] = resampled[resampleBufferStart++];
			if (resampleBufferStart == resampleBufferSize) {
				resampleBufferStart = 0;
			}
		}
	} else {
		//MONO:
		while (index < samplesPerCallback && resampleBufferStart != resampleBufferEnd) {
			buffer2[index] = buffer1[index] = resampled[resampleBufferStart++];
			++index;
			if (resampleBufferStart == resampleBufferSize) {
				resampleBufferStart = 0;
			}
		}
	}
	//Pad with silence if we're underrunning:
	while (index < samplesPerCallback) {
		buffer2[index] = buffer1[index] = defaultNeutralValue;
		++index;
	}
}
function resampleRefill() {
	if (audioBufferSize > 0) {
		//Resample a chunk of audio:
		var resampleLength = resampleControl.resampler(getBufferSamples());
		var resampledResult = resampleControl.outputBuffer;
		for (var index2 = 0; index2 < resampleLength; ++index2) {
			resampled[resampleBufferEnd++] = resampledResult[index2];
			if (resampleBufferEnd == resampleBufferSize) {
				resampleBufferEnd = 0;
			}
			if (resampleBufferStart == resampleBufferEnd) {
				++resampleBufferStart;
				if (resampleBufferStart == resampleBufferSize) {
					resampleBufferStart = 0;
				}
			}
		}
		audioBufferSize = 0;
	}
}
function resampledSamplesLeft() {
	return (resampleBufferStart <= resampleBufferEnd ? 0 : resampleBufferSize) + resampleBufferEnd - resampleBufferStart;
}
function getBufferSamples() {
	//Typed array and normal array buffer section referencing:
	try {
		return audioContextSampleBuffer.subarray(0, audioBufferSize);
	} catch (error) {
		try {
			//Regular array pass:
			audioContextSampleBuffer.length = audioBufferSize;
			return audioContextSampleBuffer;
		} catch (error) {
			//Nightly Firefox 4 used to have the subarray function named as slice:
			return audioContextSampleBuffer.slice(0, audioBufferSize);
		}
	}
}
//Initialize WebKit Audio /Flash Audio Buffer:
function resetCallbackAPIAudioBuffer(APISampleRate, bufferAlloc) {
	audioContextSampleBuffer = getFloat32(webAudioMaxBufferSize);
	audioBufferSize = webAudioMaxBufferSize;
	resampleBufferStart = 0;
	resampleBufferEnd = 0;
	resampleBufferSize = Math.max(webAudioMaxBufferSize * Math.ceil(XAudioJSSampleRate / APISampleRate), samplesPerCallback) << 1;
	if (webAudioMono) {
		//MONO Handling:
		resampled = getFloat32Flat(resampleBufferSize);
		resampleControl = new Resampler(XAudioJSSampleRate, APISampleRate, 1, resampleBufferSize, true);
		outputConvert = generateFlashMonoString;
	} else {
		//STEREO Handling:
		resampleBufferSize <<= 1;
		resampled = getFloat32Flat(resampleBufferSize);
		resampleControl = new Resampler(XAudioJSSampleRate, APISampleRate, 2, resampleBufferSize, true);
		outputConvert = generateFlashStereoString;
	}
}
//Initialize WebKit Audio:
(function () {
	if (!launchedContext) {
		try {
			audioContextHandle = new AudioContext(); //Create a system audio context.
		} catch (error) {
			try {
				audioContextHandle = new webkitAudioContext(); //Create a system audio context.
			} catch (error) {
				return;
			}
		}
		try {
			audioSource = audioContextHandle.createBufferSource(); //We need to create a false input to get the chain started.
			audioSource.loop = false; //Keep this alive forever (Event handler will know when to ouput.)
			XAudioJSSampleRate = webAudioActualSampleRate = audioContextHandle.sampleRate;
			audioSource.buffer = audioContextHandle.createBuffer(1, 1, webAudioActualSampleRate); //Create a zero'd input buffer for the input to be valid.
			audioNode = audioContextHandle.createJavaScriptNode(samplesPerCallback, 1, 2); //Create 2 outputs and ignore the input buffer (Just copy buffer 1 over if mono)
			audioNode.onaudioprocess = audioOutputEvent; //Connect the audio processing event to a handling function so we can manipulate output
			audioSource.connect(audioNode); //Send and chain the input to the audio manipulation.
			audioNode.connect(audioContextHandle.destination); //Send and chain the output of the audio manipulation to the system audio output.
			audioSource.noteOn(0); //Start the loop!
		} catch (error) {
			return;
		}
		launchedContext = true;
	}
})();

/*** EXPORTS FROM exports-loader ***/
exports["Resampler"] = (Resampler);

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var config = __webpack_require__(1);
var StateEventDispatcher = __webpack_require__(5);
var utils = __webpack_require__(0);

var state = {
  READY: "ready",
  RECORDING: "recording"
};

var error_messages = {
  WEB_AUDIO_API: "Web Audio API is not supported by your browser.",
  WEB_AUDIO_RECORDING: "HTML5 audio recording is not supported by your browser.",
  PERMISSION_DENIED: "Permission to access microphone denied."
};

var AudioRecorder = function (_StateEventDispatcher) {
  _inherits(AudioRecorder, _StateEventDispatcher);

  function AudioRecorder(opts) {
    _classCallCheck(this, AudioRecorder);

    var _this = _possibleConstructorReturn(this, (AudioRecorder.__proto__ || Object.getPrototypeOf(AudioRecorder)).call(this, state.READY));

    try {
      try {
        _this.audioCtx = config.audioCtx || new AudioContext();
      } catch (e) {
        _this.audioCtx = config.audioCtx || new webkitAudioContext();
      }
      config.audioCtx = _this.audioCtx;
    } catch (e) {
      utils.log(e);
      return _possibleConstructorReturn(_this);
    }

    _this.source = null; // media stream source
    _this.stream = null; // media stream
    _this.bufferSize = opts && opts["bufferSize"] || 4096;
    _this.sampleRate = _this.audioCtx.sampleRate;

    _this.constraints = opts && opts.constraints || {
      audio: {
        channelCount: 1
      },
      video: false
    };

    //audio processing
    _this.scriptNode = _this.audioCtx.createScriptProcessor(_this.bufferSize, 1, 1);
    _this.scriptNode.onaudioprocess = function (e) {
      var buffer = e.inputBuffer.getChannelData(0);
      _this.fire("data", buffer.slice());
    };
    return _this;
  }

  _createClass(AudioRecorder, [{
    key: "start",
    value: function start() {
      var _this2 = this;

      setTimeout(function () {
        if (!_this2.isState(state.READY)) return;

        if (!_this2.audioCtx) {
          _this2.fire("error", error_messages.WEB_AUDIO_API);
          utils.log("audio_recorder: web audio api not supported");
          return;
        }

        // Fixed for Chrome on 20190222 by Haochuan:
        // If an AudioContext is created prior to the document receiving a user gesture,
        // it will be created in the "suspended" state,
        // and you will need to call resume() after a user gesture is received.
        if (_this2.audioCtx.state === "suspended") {
          _this2.audioCtx.resume();
        }

        var onSuccess = function onSuccess(ms) {
          utils.log("audio_recorder: acquired access to html5 audio recording");

          //create media source and connect to scriptNode (start processing)
          _this2.stream = ms;
          _this2.source = _this2.audioCtx.createMediaStreamSource(_this2.stream);
          _this2.source.connect(_this2.scriptNode);
          _this2.scriptNode.connect(_this2.audioCtx.destination);

          _this2.setStateSilent(state.RECORDING);
          utils.log("audio_recorder: recording audio");

          _this2.fire("start");
        };

        var onError = function onError(e) {
          _this2.fire("error", error_messages.PERMISSION_DENIED);
          utils.log("audio_recorder: error " + e.name);
          return;
        };

        if (_this2.stream) {
          onSuccess(_this2.stream);
          return;
        }

        var constraints = _this2.constraints;

        // initializing stream, getting access to user media
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia(constraints).then(onSuccess).catch(onError);
        } else {
          navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

          if (!navigator.getUserMedia) {
            // Not supported in Safari
            _this2.fire("error", error_messages.WEB_AUDIO_RECORDING);
            utils.log("audio_recorder: html5 audio recording not supported");
            return;
          }

          navigator.getUserMedia(constraints, onSuccess, onError);
        }
      }, 0);
    }
  }, {
    key: "stop",
    value: function stop(keepStream) {
      if (!this.isState(state.RECORDING)) return;

      if (!keepStream) {
        //stop media stream
        var msTrack = this.stream.getTracks()[0];
        msTrack.stop();
        this.stream = null;
      }

      if (this.source) {
        //stop media stream source and disconnect scriptNode (stop processing)
        this.source.disconnect(this.scriptNode);
        this.scriptNode.disconnect(this.audioCtx.destination);
        this.source = null;
      }

      this.setStateSilent(state.READY);
      utils.log("audio_recorder: stopped");

      this.fire("end");
    }
  }, {
    key: "pause",
    value: function pause() {
      this.stop(true);
    }
  }, {
    key: "isRecording",
    value: function isRecording() {
      return this.isState(state.RECORDING);
    }
  }]);

  return AudioRecorder;
}(StateEventDispatcher);

module.exports = AudioRecorder;

/***/ })
/******/ ]);
});