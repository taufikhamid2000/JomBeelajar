/**
 * Minimal chainable Supabase query-builder double. Every builder method returns
 * the builder; awaiting it (or calling .single()/.maybeSingle()) resolves to the
 * canned `{ data, error }`. Calls are recorded per table so tests can assert
 * on the filters/payloads that were sent.
 */
export type QueryResult = { data: unknown; error: unknown };
export type Call = { method: string; args: unknown[] };

const CHAIN = [
  'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in',
  'order', 'range', 'limit', 'gte', 'lte', 'is',
];

function makeBuilder(result: QueryResult, log: Call[]) {
  const builder: Record<string, unknown> = {};
  for (const m of CHAIN) {
    builder[m] = (...args: unknown[]) => {
      log.push({ method: m, args });
      return builder;
    };
  }
  builder.single = async () => result;
  builder.maybeSingle = async () => result;
  builder.then = (
    resolve: (r: QueryResult) => unknown,
    reject?: (e: unknown) => unknown
  ) => Promise.resolve(result).then(resolve, reject);
  return builder;
}

/**
 * `from(table)` returns a builder with the canned result for that table. A
 * table may map to an array of results, consumed in order (the last one
 * repeats), for services that query the same table more than once.
 */
export function makeFrom(results: Record<string, QueryResult | QueryResult[]>) {
  const calls: Record<string, Call[]> = {};
  const from = jest.fn((table: string) => {
    const entry = results[table];
    const result: QueryResult = Array.isArray(entry)
      ? entry.length > 1
        ? entry.shift()!
        : entry[0]
      : (entry ?? { data: null, error: null });
    return makeBuilder(result, (calls[table] ??= []));
  });
  return { from, calls };
}
