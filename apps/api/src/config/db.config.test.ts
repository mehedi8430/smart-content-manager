import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeDatabaseUrl } from './db.config';

describe('normalizeDatabaseUrl', () => {
  it('preserves an explicit local Postgres sslmode=disable value', () => {
    const url = 'postgresql://postgres:postgres@db:5432/smart_content_manager_e2e?schema=public&sslmode=disable';

    assert.equal(normalizeDatabaseUrl(url), url);
  });

  it('preserves an explicit remote sslmode=require value', () => {
    const url = 'postgresql://neondb_owner:secret@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require';

    assert.equal(normalizeDatabaseUrl(url), url);
  });

  it('adds sslmode=require for remote URLs that do not specify a mode', () => {
    const url = 'postgresql://user:pass@ep-example.us-east-1.aws.neon.tech/neondb';

    assert.equal(
      normalizeDatabaseUrl(url),
      'postgresql://user:pass@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require',
    );
  });

  it('does not force SSL for localhost database URLs', () => {
    const url = 'postgresql://postgres:postgres@localhost:5432/app';

    assert.equal(normalizeDatabaseUrl(url), url);
  });
});
