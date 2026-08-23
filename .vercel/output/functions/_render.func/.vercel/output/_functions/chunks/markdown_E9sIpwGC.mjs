import require$$0$3 from 'fs';
import require$$1 from 'section-matter';
import require$$0 from 'js-yaml';
import require$$0$2 from 'strip-bom-string';
import require$$0$1 from 'kind-of';
import { b as POST_FRONTMATTER_SCHEMA } from './schemas_Cl8h71Ns.mjs';

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var engines$2 = {exports: {}};

(function (module, exports) {

	const yaml = require$$0;

	/**
	 * Default engines
	 */

	const engines = module.exports;

	/**
	 * YAML
	 */

	engines.yaml = {
	  parse: yaml.safeLoad.bind(yaml),
	  stringify: yaml.safeDump.bind(yaml)
	};

	/**
	 * JSON
	 */

	engines.json = {
	  parse: JSON.parse.bind(JSON),
	  stringify: function(obj, options) {
	    const opts = Object.assign({replacer: null, space: 2}, options);
	    return JSON.stringify(obj, opts.replacer, opts.space);
	  }
	};

	/**
	 * JavaScript
	 */

	engines.javascript = {
	  parse: function parse(str, options, wrap) {
	    /* eslint no-eval: 0 */
	    try {
	      if (wrap !== false) {
	        str = '(function() {\nreturn ' + str.trim() + ';\n}());';
	      }
	      return eval(str) || {};
	    } catch (err) {
	      if (wrap !== false && /(unexpected|identifier)/i.test(err.message)) {
	        return parse(str, options, false);
	      }
	      throw new SyntaxError(err);
	    }
	  },
	  stringify: function() {
	    throw new Error('stringifying JavaScript is not supported');
	  }
	}; 
} (engines$2));

var enginesExports = engines$2.exports;

var utils$3 = {};

(function (exports) {

	const stripBom = require$$0$2;
	const typeOf = require$$0$1;

	exports.define = function(obj, key, val) {
	  Reflect.defineProperty(obj, key, {
	    enumerable: false,
	    configurable: true,
	    writable: true,
	    value: val
	  });
	};

	/**
	 * Returns true if `val` is a buffer
	 */

	exports.isBuffer = function(val) {
	  return typeOf(val) === 'buffer';
	};

	/**
	 * Returns true if `val` is an object
	 */

	exports.isObject = function(val) {
	  return typeOf(val) === 'object';
	};

	/**
	 * Cast `input` to a buffer
	 */

	exports.toBuffer = function(input) {
	  return typeof input === 'string' ? Buffer.from(input) : input;
	};

	/**
	 * Cast `val` to a string.
	 */

	exports.toString = function(input) {
	  if (exports.isBuffer(input)) return stripBom(String(input));
	  if (typeof input !== 'string') {
	    throw new TypeError('expected input to be a string or buffer');
	  }
	  return stripBom(input);
	};

	/**
	 * Cast `val` to an array.
	 */

	exports.arrayify = function(val) {
	  return val ? (Array.isArray(val) ? val : [val]) : [];
	};

	/**
	 * Returns true if `str` starts with `substr`.
	 */

	exports.startsWith = function(str, substr, len) {
	  if (typeof len !== 'number') len = substr.length;
	  return str.slice(0, len) === substr;
	}; 
} (utils$3));

const engines$1 = enginesExports;
const utils$2 = utils$3;

var defaults$4 = function(options) {
  const opts = Object.assign({}, options);

  // ensure that delimiters are an array
  opts.delimiters = utils$2.arrayify(opts.delims || opts.delimiters || '---');
  if (opts.delimiters.length === 1) {
    opts.delimiters.push(opts.delimiters[0]);
  }

  opts.language = (opts.language || opts.lang || 'yaml').toLowerCase();
  opts.engines = Object.assign({}, engines$1, opts.parsers, opts.engines);
  return opts;
};

var engine = function(name, options) {
  let engine = options.engines[name] || options.engines[aliase(name)];
  if (typeof engine === 'undefined') {
    throw new Error('gray-matter engine "' + name + '" is not registered');
  }
  if (typeof engine === 'function') {
    engine = { parse: engine };
  }
  return engine;
};

function aliase(name) {
  switch (name.toLowerCase()) {
    case 'js':
    case 'javascript':
      return 'javascript';
    case 'coffee':
    case 'coffeescript':
    case 'cson':
      return 'coffee';
    case 'yaml':
    case 'yml':
      return 'yaml';
    default: {
      return name;
    }
  }
}

const typeOf$1 = require$$0$1;
const getEngine$1 = engine;
const defaults$3 = defaults$4;

var stringify$2 = function(file, data, options) {
  if (data == null && options == null) {
    switch (typeOf$1(file)) {
      case 'object':
        data = file.data;
        options = {};
        break;
      case 'string':
        return file;
      default: {
        throw new TypeError('expected file to be a string or object');
      }
    }
  }

  const str = file.content;
  const opts = defaults$3(options);
  if (data == null) {
    if (!opts.data) return file;
    data = opts.data;
  }

  const language = file.language || opts.language;
  const engine = getEngine$1(language, opts);
  if (typeof engine.stringify !== 'function') {
    throw new TypeError('expected "' + language + '.stringify" to be a function');
  }

  data = Object.assign({}, file.data, data);
  const open = opts.delimiters[0];
  const close = opts.delimiters[1];
  const matter = engine.stringify(data, options).trim();
  let buf = '';

  if (matter !== '{}') {
    buf = newline(open) + newline(matter) + newline(close);
  }

  if (typeof file.excerpt === 'string' && file.excerpt !== '') {
    if (str.indexOf(file.excerpt.trim()) === -1) {
      buf += newline(file.excerpt) + newline(close);
    }
  }

  return buf + newline(str);
};

function newline(str) {
  return str.slice(-1) !== '\n' ? str + '\n' : str;
}

const defaults$2 = defaults$4;

var excerpt$1 = function(file, options) {
  const opts = defaults$2(options);

  if (file.data == null) {
    file.data = {};
  }

  if (typeof opts.excerpt === 'function') {
    return opts.excerpt(file, opts);
  }

  const sep = file.data.excerpt_separator || opts.excerpt_separator;
  if (sep == null && (opts.excerpt === false || opts.excerpt == null)) {
    return file;
  }

  const delimiter = typeof opts.excerpt === 'string'
    ? opts.excerpt
    : (sep || opts.delimiters[0]);

  // if enabled, get the excerpt defined after front-matter
  const idx = file.content.indexOf(delimiter);
  if (idx !== -1) {
    file.excerpt = file.content.slice(0, idx);
  }

  return file;
};

const typeOf = require$$0$1;
const stringify$1 = stringify$2;
const utils$1 = utils$3;

/**
 * Normalize the given value to ensure an object is returned
 * with the expected properties.
 */

var toFile$1 = function(file) {
  if (typeOf(file) !== 'object') {
    file = { content: file };
  }

  if (typeOf(file.data) !== 'object') {
    file.data = {};
  }

  // if file was passed as an object, ensure that
  // "file.content" is set
  if (file.contents && file.content == null) {
    file.content = file.contents;
  }

  // set non-enumerable properties on the file object
  utils$1.define(file, 'orig', utils$1.toBuffer(file.content));
  utils$1.define(file, 'language', file.language || '');
  utils$1.define(file, 'matter', file.matter || '');
  utils$1.define(file, 'stringify', function(data, options) {
    if (options && options.language) {
      file.language = options.language;
    }
    return stringify$1(file, data, options);
  });

  // strip BOM and ensure that "file.content" is a string
  file.content = utils$1.toString(file.content);
  file.isEmpty = false;
  file.excerpt = '';
  return file;
};

const getEngine = engine;
const defaults$1 = defaults$4;

var parse$1 = function(language, str, options) {
  const opts = defaults$1(options);
  const engine = getEngine(language, opts);
  if (typeof engine.parse !== 'function') {
    throw new TypeError('expected "' + language + '.parse" to be a function');
  }
  return engine.parse(str, opts);
};

const fs = require$$0$3;
const sections = require$$1;
const defaults = defaults$4;
const stringify = stringify$2;
const excerpt = excerpt$1;
const engines = enginesExports;
const toFile = toFile$1;
const parse = parse$1;
const utils = utils$3;

/**
 * Takes a string or object with `content` property, extracts
 * and parses front-matter from the string, then returns an object
 * with `data`, `content` and other [useful properties](#returned-object).
 *
 * ```js
 * const matter = require('gray-matter');
 * console.log(matter('---\ntitle: Home\n---\nOther stuff'));
 * //=> { data: { title: 'Home'}, content: 'Other stuff' }
 * ```
 * @param {Object|String} `input` String, or object with `content` string
 * @param {Object} `options`
 * @return {Object}
 * @api public
 */

function matter(input, options) {
  if (input === '') {
    return { data: {}, content: input, excerpt: '', orig: input };
  }

  let file = toFile(input);
  const cached = matter.cache[file.content];

  if (!options) {
    if (cached) {
      file = Object.assign({}, cached);
      file.orig = cached.orig;
      return file;
    }

    // only cache if there are no options passed. if we cache when options
    // are passed, we would need to also cache options values, which would
    // negate any performance benefits of caching
    matter.cache[file.content] = file;
  }

  return parseMatter(file, options);
}

/**
 * Parse front matter
 */

function parseMatter(file, options) {
  const opts = defaults(options);
  const open = opts.delimiters[0];
  const close = '\n' + opts.delimiters[1];
  let str = file.content;

  if (opts.language) {
    file.language = opts.language;
  }

  // get the length of the opening delimiter
  const openLen = open.length;
  if (!utils.startsWith(str, open, openLen)) {
    excerpt(file, opts);
    return file;
  }

  // if the next character after the opening delimiter is
  // a character from the delimiter, then it's not a front-
  // matter delimiter
  if (str.charAt(openLen) === open.slice(-1)) {
    return file;
  }

  // strip the opening delimiter
  str = str.slice(openLen);
  const len = str.length;

  // use the language defined after first delimiter, if it exists
  const language = matter.language(str, opts);
  if (language.name) {
    file.language = language.name;
    str = str.slice(language.raw.length);
  }

  // get the index of the closing delimiter
  let closeIndex = str.indexOf(close);
  if (closeIndex === -1) {
    closeIndex = len;
  }

  // get the raw front-matter block
  file.matter = str.slice(0, closeIndex);

  const block = file.matter.replace(/^\s*#[^\n]+/gm, '').trim();
  if (block === '') {
    file.isEmpty = true;
    file.empty = file.content;
    file.data = {};
  } else {

    // create file.data by parsing the raw file.matter block
    file.data = parse(file.language, file.matter, opts);
  }

  // update file.content
  if (closeIndex === len) {
    file.content = '';
  } else {
    file.content = str.slice(closeIndex + close.length);
    if (file.content[0] === '\r') {
      file.content = file.content.slice(1);
    }
    if (file.content[0] === '\n') {
      file.content = file.content.slice(1);
    }
  }

  excerpt(file, opts);

  if (opts.sections === true || typeof opts.section === 'function') {
    sections(file, opts.section);
  }
  return file;
}

/**
 * Expose engines
 */

matter.engines = engines;

/**
 * Stringify an object to YAML or the specified language, and
 * append it to the given string. By default, only YAML and JSON
 * can be stringified. See the [engines](#engines) section to learn
 * how to stringify other languages.
 *
 * ```js
 * console.log(matter.stringify('foo bar baz', {title: 'Home'}));
 * // results in:
 * // ---
 * // title: Home
 * // ---
 * // foo bar baz
 * ```
 * @param {String|Object} `file` The content string to append to stringified front-matter, or a file object with `file.content` string.
 * @param {Object} `data` Front matter to stringify.
 * @param {Object} `options` [Options](#options) to pass to gray-matter and [js-yaml].
 * @return {String} Returns a string created by wrapping stringified yaml with delimiters, and appending that to the given string.
 * @api public
 */

matter.stringify = function(file, data, options) {
  if (typeof file === 'string') file = matter(file, options);
  return stringify(file, data, options);
};

/**
 * Synchronously read a file from the file system and parse
 * front matter. Returns the same object as the [main function](#matter).
 *
 * ```js
 * const file = matter.read('./content/blog-post.md');
 * ```
 * @param {String} `filepath` file path of the file to read.
 * @param {Object} `options` [Options](#options) to pass to gray-matter.
 * @return {Object} Returns [an object](#returned-object) with `data` and `content`
 * @api public
 */

matter.read = function(filepath, options) {
  const str = fs.readFileSync(filepath, 'utf8');
  const file = matter(str, options);
  file.path = filepath;
  return file;
};

/**
 * Returns true if the given `string` has front matter.
 * @param  {String} `string`
 * @param  {Object} `options`
 * @return {Boolean} True if front matter exists.
 * @api public
 */

matter.test = function(str, options) {
  return utils.startsWith(str, defaults(options).delimiters[0]);
};

/**
 * Detect the language to use, if one is defined after the
 * first front-matter delimiter.
 * @param  {String} `string`
 * @param  {Object} `options`
 * @return {Object} Object with `raw` (actual language string), and `name`, the language with whitespace trimmed
 */

matter.language = function(str, options) {
  const opts = defaults(options);
  const open = opts.delimiters[0];

  if (matter.test(str)) {
    str = str.slice(open.length);
  }

  const language = str.slice(0, str.search(/\r?\n/));
  return {
    raw: language,
    name: language ? language.trim() : ''
  };
};

/**
 * Expose `matter`
 */

matter.cache = {};
matter.clearCache = function() {
  matter.cache = {};
};
var grayMatter = matter;

const matter$1 = /*@__PURE__*/getDefaultExportFromCjs(grayMatter);

const POST_FM_FIELD_ORDER = [
  "title",
  "description",
  "dateFormatted",
  "locale",
  "tags",
  "featured"
];
function parseFrontmatter(raw) {
  const parsed = matter$1(raw);
  const fm = POST_FRONTMATTER_SCHEMA.parse(parsed.data);
  const body = parsed.content;
  const serialized = serializePost({ frontmatter: fm, body });
  return { frontmatter: fm, body, serialized };
}
function serializePost(args) {
  const orderedFm = {};
  for (const k of POST_FM_FIELD_ORDER) {
    const v = args.frontmatter[k];
    if (v === void 0) continue;
    orderedFm[k] = v;
  }
  const fmStr = matter$1.stringify("", orderedFm).replace(/^---\n/, "").replace(/\n---\n$/, "").trim();
  const bodyTrimmed = args.body.replace(/^\n+/, "");
  return `---
${fmStr}
---

${bodyTrimmed}`;
}
function roundtripFrontmatter(raw) {
  const parsed = parseFrontmatter(raw);
  const reSerialized = serializePost({
    frontmatter: parsed.frontmatter,
    body: parsed.body
  });
  return {
    equal: parsed.frontmatter.title === parseFrontmatter(reSerialized).frontmatter.title,
    parsed,
    reSerialized
  };
}

export { parseFrontmatter, roundtripFrontmatter, serializePost };
