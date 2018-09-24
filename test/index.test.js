'use strict';

const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const YamlDb = require('../lib/');
const STORAGE_PATH = process.env.STORAGE_PATH;

describe('yaml', () => {
  let db;

  function seeds(data) {
    const dump = yaml.safeDump(data);
    fs.writeFileSync(STORAGE_PATH, dump, 'utf8');
  }

  function loadStorage() {
    return fs.readFileSync(STORAGE_PATH, 'utf8');
  }

  before(() => {
    db = new YamlDb({
      path: STORAGE_PATH
    });
  });

  afterEach(() => {
    try {
      fs.unlinkSync(STORAGE_PATH);
    } catch (err) {
      if (err.code !== 'ENOENT') { throw err; }
    }
  });

  describe('#branches', () => {
    it('should return empty list', () => {
      const expected = [];

      const actual = db.branches('foo');

      expect(actual).eql(expected);
    });

    it('should return empty list', () => {
      const expected = ['bar1', 'baz1'];

      const data = {
        foo: ['bar1', 'baz1'],
        quux: ['baz2', 'bar2']
      };
      seeds(data);

      const actual = db.branches('foo');

      expect(actual).eql(expected);
    });
  });

  describe('#instances', () => {
    beforeEach(() => {
      const data = {
        foo: ['bar1', 'baz1'],
        quux: ['baz2', 'bar2']
      };
      seeds(data);
    });

    it('should return all instances', () => {
      const expected = [
        { branch: 'bar1', repo: 'foo' },
        { branch: 'baz1', repo: 'foo' },
        { branch: 'baz2', repo: 'quux' },
        { branch: 'bar2', repo: 'quux' }
      ];

      const actual = db.instances();

      expect(actual).eql(expected);
    });

    it('should return all repo instances', () => {
      const expected = [
        { branch: 'bar1', repo: 'foo' },
        { branch: 'baz1', repo: 'foo' }
      ];

      const actual = db.instances('foo');

      expect(actual).eql(expected);
    });
  });

  describe('#list', () => {
    it('should return empty when no file exists', () => {
      const expected = '';

      const actual = db.list();

      expect(actual).eql(expected);
    });

    it('should return printable list of deployed instances', () => {
      const expected = [
        'foo:',
        '  - bar1',
        '  - baz1',
        'quux:',
        '  - baz2',
        '  - bar2',
        ''
      ].join('\n');

      const data = {
        foo: ['bar1', 'baz1'],
        quux: ['baz2', 'bar2']
      };
      seeds(data);

      const actual = db.list();

      expect(actual).eql(expected);
    });
  });

  describe('#add', () => {
    it('should add new repo and branch (callback)', (done) => {
      const expected = [
        'foo:',
        '  - bar',
        ''
      ].join('\n');

      db.add('foo', 'bar', (err) => {
        const actual = loadStorage();

        expect(err).eql(null);
        expect(actual).eql(expected);

        done();
      });
    });

    it('should add new repo and branch (promise)', (done) => {
      const expected = [
        'foo:',
        '  - bar',
        ''
      ].join('\n');

      db.add('foo', 'bar').then(() => {
        const actual = loadStorage();

        expect(actual).eql(expected);

        done();
      });
    });

    it('should add branch to existing repo (callback)', (done) => {
      const expected = [
        'foo:',
        '  - bar',
        '  - baz',
        ''
      ].join('\n');

      const data = {
        'foo': ['bar']
      };
      seeds(data);

      db.add('foo', 'baz', (err) => {
        const actual = loadStorage();

        expect(err).eql(null);
        expect(actual).eql(expected);

        done();
      });
    });

    it('should add branch to existing repo (promise)', (done) => {
      const expected = [
        'foo:',
        '  - bar',
        '  - baz',
        ''
      ].join('\n');

      const data = {
        'foo': ['bar']
      };
      seeds(data);

      db.add('foo', 'baz').then(() => {
        const actual = loadStorage();

        expect(actual).eql(expected);

        done();
      });
    });
  });

  describe('#remove', () => {
    it('should remove branch from repo (callback)', (done) => {
      const expected = [
        'foo:',
        '  - baz',
        ''
      ].join('\n');

      const data = {
        'foo': ['bar', 'baz']
      };
      seeds(data);

      db.remove('foo', 'bar', (err) => {
        const actual = loadStorage();

        expect(err).eql(null);
        expect(actual).eql(expected);

        done();
      });
    });

    it('should remove branch from repo (promise)', (done) => {
      const expected = [
        'foo:',
        '  - baz',
        ''
      ].join('\n');

      const data = {
        'foo': ['bar', 'baz']
      };
      seeds(data);

      db.remove('foo', 'bar').then(() => {
        const actual = loadStorage();

        expect(actual).eql(expected);

        done();
      });
    });

    it('should remove branch and repo (callback)', (done) => {
      const expected = '{}\n';

      const data = {
        'foo': ['baz']
      };
      seeds(data);

      db.remove('foo', 'baz', (err) => {
        const actual = loadStorage();

        expect(err).eql(null);
        expect(actual).eql(expected);

        done();
      });
    });

    it('should remove branch and repo (promise)', (done) => {
      const expected = '{}\n';

      const data = {
        'foo': ['baz']
      };
      seeds(data);

      db.remove('foo', 'baz').then(() => {
        const actual = loadStorage();

        expect(actual).eql(expected);

        done();
      });
    });
  });

  describe('#exists', () => {
    describe('repo', () => {
      it('should return false when no repo found', () => {
        const expected = false;
        const actual = db.exists('foo');
        expect(actual).equal(expected);
      });

      it('should return true when repo found', () => {
        const expected = true;

        const data = {
          'foo': ['bar']
        };
        seeds(data);

        const actual = db.exists('foo');
        expect(actual).equal(expected);
      });
    });

    describe('repo + branch', () => {
      it('should return false when no repo found', () => {
        const expected = false;
        const actual = db.exists('foo', 'branch');
        expect(actual).equal(expected);
      });

      it('should return false when no branch found', () => {
        const expected = false;

        const data = {
          'foo': ['bar']
        };
        seeds(data);

        const actual = db.exists('foo', 'baz');
        expect(actual).equal(expected);
      });

      it('should return true when branch found', () => {
        const expected = true;

        const data = {
          'foo': ['bar']
        };
        seeds(data);

        const actual = db.exists('foo', 'bar');
        expect(actual).equal(expected);
      });
    });

    it('should throw error when wrong parameters', () => {
      expect(() => {
        db.exists();
      }).throw(Error, 'db|exists: invalid parameters.');
    });
  });
});
