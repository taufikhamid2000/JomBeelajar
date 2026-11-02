/**
 * @jest-environment node
 */
jest.mock('server-only', () => ({}));

const fromMock = jest.fn(() => 'query');
const createClient = jest.fn(() => ({ from: fromMock, marker: 'client' }));
jest.mock('@supabase/supabase-js', () => ({ createClient: (...a: unknown[]) => (createClient as jest.Mock)(...a) }));

const ENV = { ...process.env };

function load() {
  jest.resetModules();
  return require('@/lib/supabaseAdmin') as typeof import('@/lib/supabaseAdmin');
}

describe('supabaseAdmin (lazy service-role client)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ENV };
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });
  afterAll(() => {
    process.env = ENV;
  });

  it('importing the module does not need the service-role key', () => {
    expect(() => load()).not.toThrow();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('throws on first use when the service-role key is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co';
    const { supabaseAdmin } = load();
    expect(() => supabaseAdmin.from('t')).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('throws on first use when no URL is configured', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key-placeholder';
    const { supabaseAdmin } = load();
    expect(() => supabaseAdmin.from('t')).toThrow(/Missing Supabase admin credentials/);
  });

  it('creates the client once, with no session persistence, and binds methods', () => {
    process.env.SUPABASE_URL = 'https://admin.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key-placeholder';
    const { supabaseAdmin } = load();

    expect(supabaseAdmin.from('t')).toBe('query');
    supabaseAdmin.from('u');
    expect(createClient).toHaveBeenCalledTimes(1);
    const [url, , opts] = (createClient as jest.Mock).mock.calls[0] as [string, string, Record<string, any>];
    expect(url).toBe('https://admin.supabase.co');
    expect(opts.auth).toEqual({ autoRefreshToken: false, persistSession: false });
    expect(opts.db).toEqual({ schema: 'edubridge' });
    expect((supabaseAdmin as unknown as { marker: string }).marker).toBe('client');
  });
});
