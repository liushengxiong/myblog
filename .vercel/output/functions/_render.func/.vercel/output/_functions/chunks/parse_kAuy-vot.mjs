const UNDEFINED = -1;
const HOLE = -2;
const NAN = -3;
const POSITIVE_INFINITY = -4;
const NEGATIVE_INFINITY = -5;
const NEGATIVE_ZERO = -6;
const SPARSE = -7;

// The largest valid value for a JavaScript array's `length` property,
// and the largest valid array index (one less than the max length).
const MAX_ARRAY_LEN = 2 ** 32 - 1;
const MAX_ARRAY_INDEX = MAX_ARRAY_LEN - 1;

/** @param {number} n */
function is_valid_array_index(n) {
	if (!Number.isInteger(n)) return false;
	if (n < 0) return false;
	if (n > MAX_ARRAY_INDEX) return false;
	return true;
}

/** @param {number} n */
function is_valid_array_len(n) {
	if (!Number.isInteger(n)) return false;
	if (n < 0) return false;
	if (n > MAX_ARRAY_LEN) return false;
	return true;
}

/* Baseline 2025 runtimes */


/**	@type {(base64: string) => ArrayBuffer} */
function decode_native(base64) {
	return Uint8Array.fromBase64(base64).buffer;
}

/**	@type {(base64: string) => ArrayBuffer} */
function decode_buffer(base64) {
	return Uint8Array.from(Buffer.from(base64, 'base64')).buffer;
}

/**	@type {(base64: string) => ArrayBuffer} */
function decode_legacy(base64) {
	const binary_string = atob(base64);
	const len = binary_string.length;
	const array = new Uint8Array(len);

	for (let i = 0; i < len; i++) {
		array[i] = binary_string.charCodeAt(i);
	}

	return array.buffer;
}

const native = typeof Uint8Array.fromBase64 === 'function';
const buffer = typeof process === 'object' && process.versions?.node !== undefined;
const decode64 = native ? decode_native : buffer ? decode_buffer : decode_legacy;

/**
 * Merges caller-provided operation overrides over the defaults. Iterating the
 * default keys (rather than the override's own keys) means nullish members
 * fall back to the default, and inherited members — e.g. from a class
 * instance — are picked up.
 *
 * @template {Record<string, any>} T
 * @param {T} defaults
 * @param {Partial<T> | undefined} overrides
 * @returns {T}
 */
function merge_operations(defaults, overrides) {
	return defaults;
}

/**
 * The default implementations of every construction operation `parse` and
 * `unflatten` perform while reviving a value. Each one uses native
 * JavaScript semantics (built-in constructors, property assignment, etc).
 *
 * Pass overrides via the `operations` option of `parse`/`unflatten` to
 * customize how values are built — e.g. to construct them from the
 * intrinsics of a different realm (a `node:vm` context), or to build up
 * values inside another JavaScript runtime (a WASM-hosted engine, a remote
 * process) through handle objects.
 *
 * The object is frozen — it is shared by every `parse` call that does not
 * override a given operation.
 *
 */
/** @type {import('./types.js').DefaultParseOperations} */
const parse_operations = {
	fromPrimitive: (primitive) => primitive,

	fromISOString: (iso) => new Date(iso),

	fromStringValue: (tag, text) => {
		if (tag === 'URL') return new URL(text);
		if (tag === 'URLSearchParams') return new URLSearchParams(text);
		// 'Temporal.Instant', 'Temporal.PlainDate', ...
		// @ts-expect-error TS doesn't know about Temporal yet
		return Temporal[tag.slice(9)].from(text);
	},

	fromArrayBuffer: (buffer) => buffer,

	fromRegExpInfo: (source, flags) => new RegExp(source, flags),

	fromViewInfo: (tag, buffer, byteOffset, length) => {
		const Constructor = /** @type {any} */ (globalThis)[tag];
		return byteOffset !== undefined
			? new Constructor(buffer, byteOffset, length)
			: new Constructor(buffer);
	},

	box: (value) => Object(value),

	createArray: (length) => new Array(length),

	createSparseArray: (length) => {
		/** @type {any[]} */
		const array = [];

		// Setting `array.length = length` (or equivalently calling
		// `new Array(length)`) on an untrusted length is a DoS vector: V8
		// eagerly allocates a contiguous backing store for array lengths below
		// ~10^8, so a small payload with a huge declared length can force
		// arbitrary memory allocation. Touching the largest-possible index
		// first forces V8 into dictionary-elements mode, where `length` is
		// just a number and no contiguous allocation occurs.
		array[MAX_ARRAY_INDEX] = undefined;
		delete array[MAX_ARRAY_INDEX];
		array.length = length;

		return array;
	},

	createObject: () => ({}),

	createNullPrototypeObject: () => Object.create(null),

	createSet: () => new Set(),

	createMap: () => new Map(),

	set: (target, key, value) => {
		target[key] = value;
	},

	addValue: (set, value) => {
		set.add(value);
	},

	addEntry: (map, key, value) => {
		map.set(key, value);
	}
};

const default_parse_operations = Object.freeze(parse_operations);

/**
 * Revive a value serialized with `devalue.stringify`
 * @param {string} serialized
 * @param {Record<string, (value: any) => any>} [revivers]
 * @param {import('./types.js').ParseOptions} [options]
 */
function parse(serialized, revivers, options) {
	return unflatten(JSON.parse(serialized), revivers);
}

/**
 * Revive a value flattened with `devalue.stringify`
 * @param {number | any[]} parsed
 * @param {Record<string, (value: any) => any>} [revivers]
 * @param {import('./types.js').ParseOptions} [options]
 */
function unflatten(parsed, revivers, options) {
	/** @type {import('./types.js').ParseOperations} */
	const ops = merge_operations(default_parse_operations);

	if (typeof parsed === 'number') return hydrate(parsed, true);

	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error('Invalid input');
	}

	const values = /** @type {any[]} */ (parsed);

	const hydrated = Array(values.length);

	/**
	 * A set of values currently being hydrated with custom revivers,
	 * used to detect invalid cyclical dependencies
	 * @type {Set<number> | null}
	 */
	let hydrating = null;

	/**
	 * @param {number} index
	 * @returns {any}
	 */
	function hydrate(index, standalone = false) {
		if (index === UNDEFINED) return ops.fromPrimitive(undefined);
		if (index === NAN) return ops.fromPrimitive(NaN);
		if (index === POSITIVE_INFINITY) return ops.fromPrimitive(Infinity);
		if (index === NEGATIVE_INFINITY) return ops.fromPrimitive(-Infinity);
		if (index === NEGATIVE_ZERO) return ops.fromPrimitive(-0);

		if (standalone || typeof index !== 'number') {
			throw new Error(`Invalid input`);
		}

		if (index in hydrated) return hydrated[index];

		const value = values[index];

		if (!value || typeof value !== 'object') {
			hydrated[index] = ops.fromPrimitive(value);
		} else if (Array.isArray(value)) {
			if (typeof value[0] === 'string') {
				const type = value[0];

				const reviver = revivers && Object.hasOwn(revivers, type) ? revivers[type] : undefined;

				if (reviver) {
					let i = value[1];
					if (typeof i !== 'number') {
						// if it's not a number, it was serialized by a builtin reviver
						// so we need to munge it into the format expected by a custom reviver
						i = values.push(value[1]) - 1;
					}

					// If the payload is already hydrated, its recursion has already
					// terminated (e.g. a self-referential object cached itself before
					// following its own back-reference), so revive it directly. Falling
					// through to the `hydrating` guard here would wrongly reject a valid
					// cycle. An actually infinite payload (e.g. `[["Custom", 0]]`) is never
					// cached, so it still hits the guard below.
					if (Object.hasOwn(hydrated, i)) {
						return (hydrated[index] = reviver(hydrated[i]));
					}

					hydrating ??= new Set();

					if (hydrating.has(i)) {
						throw new Error('Invalid circular reference');
					}

					hydrating.add(i);
					hydrated[index] = reviver(hydrate(i));
					hydrating.delete(i);

					return hydrated[index];
				}

				switch (type) {
					case 'Date':
						hydrated[index] = ops.fromISOString(value[1]);
						break;

					case 'Set':
						const set = ops.createSet();
						hydrated[index] = set;
						for (let i = 1; i < value.length; i += 1) {
							ops.addValue(set, hydrate(value[i]));
						}
						break;

					case 'Map':
						const map = ops.createMap();
						hydrated[index] = map;
						for (let i = 1; i < value.length; i += 2) {
							ops.addEntry(map, hydrate(value[i]), hydrate(value[i + 1]));
						}
						break;

					case 'RegExp':
						hydrated[index] = ops.fromRegExpInfo(value[1], value[2]);
						break;

					case 'Object': {
						const wrapped_index = value[1];

						if (
							typeof values[wrapped_index] === 'object' &&
							values[wrapped_index][0] !== 'BigInt'
						) {
							// avoid infinite recusion in case of malformed input
							throw new Error('Invalid input');
						}

						hydrated[index] = ops.box(hydrate(wrapped_index));
						break;
					}

					case 'BigInt':
						hydrated[index] = ops.fromPrimitive(BigInt(value[1]));
						break;

					case 'null':
						const obj = ops.createNullPrototypeObject();
						hydrated[index] = obj;
						for (let i = 1; i < value.length; i += 2) {
							if (value[i] === '__proto__') {
								throw new Error('Cannot parse an object with a `__proto__` property');
							}

							ops.set(obj, value[i], hydrate(value[i + 1]));
						}
						break;

					case 'Int8Array':
					case 'Uint8Array':
					case 'Uint8ClampedArray':
					case 'Int16Array':
					case 'Uint16Array':
					case 'Float16Array':
					case 'Int32Array':
					case 'Uint32Array':
					case 'Float32Array':
					case 'Float64Array':
					case 'BigInt64Array':
					case 'BigUint64Array':
					case 'DataView': {
						if (values[value[1]][0] !== 'ArrayBuffer') {
							// without this, if we receive malformed input we could
							// end up trying to hydrate in a circle or allocate
							// huge amounts of memory when we call `new TypedArrayConstructor(buffer)`
							throw new Error('Invalid data');
						}

						const buffer = hydrate(value[1]);

						hydrated[index] = ops.fromViewInfo(type, buffer, value[2], value[3]);

						break;
					}

					case 'ArrayBuffer': {
						const base64 = value[1];
						if (typeof base64 !== 'string') {
							throw new Error('Invalid ArrayBuffer encoding');
						}
						hydrated[index] = ops.fromArrayBuffer(decode64(base64));
						break;
					}

					case 'URL':
					case 'URLSearchParams':
					case 'Temporal.Duration':
					case 'Temporal.Instant':
					case 'Temporal.PlainDate':
					case 'Temporal.PlainTime':
					case 'Temporal.PlainDateTime':
					case 'Temporal.PlainMonthDay':
					case 'Temporal.PlainYearMonth':
					case 'Temporal.ZonedDateTime': {
						// the same tags `toStringValue` serializes on the stringify side
						hydrated[index] = ops.fromStringValue(type, value[1]);
						break;
					}

					default:
						throw new Error(`Unknown type ${type}`);
				}
			} else if (value[0] === SPARSE) {
				// Sparse array encoding: [SPARSE, length, idx, val, idx, val, ...]
				const len = value[1];

				if (!is_valid_array_len(len)) {
					throw new Error('Invalid input');
				}

				// `len` comes from the input rather than being bounded by it, so
				// `createSparseArray` is responsible for not allocating storage
				// proportional to it.
				const array = ops.createSparseArray(len);
				hydrated[index] = array;

				for (let i = 2; i < value.length; i += 2) {
					const idx = value[i];

					if (!is_valid_array_index(idx) || idx >= len) {
						throw new Error('Invalid input');
					}

					ops.set(array, idx, hydrate(value[i + 1]));
				}
			} else {
				const array = ops.createArray(value.length);
				hydrated[index] = array;

				for (let i = 0; i < value.length; i += 1) {
					const n = value[i];
					if (n === HOLE) continue;

					ops.set(array, i, hydrate(n));
				}
			}
		} else {
			const object = ops.createObject();
			hydrated[index] = object;

			for (const key of Object.keys(value)) {
				if (key === '__proto__') {
					throw new Error('Cannot parse an object with a `__proto__` property');
				}

				ops.set(object, key, hydrate(value[key]));
			}
		}

		return hydrated[index];
	}

	return hydrate(0);
}

export { parse as p, unflatten as u };
