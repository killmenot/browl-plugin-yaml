'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml');
const browlUtil = require('browl-util');
const debug = require('debug')('browl-yaml');

class YamlDb {
  constructor(options) {
    debug('init: %j', options);

    this.path = options.path;
  }

  load() {
    debug('load');

    try {
      return yaml.safeLoad(fs.readFileSync(this.path, 'utf8')) || {};
    } catch (err) {
      if (err.code === 'ENOENT') {
        debug('load ENOENT');
        return {};
      }

      throw err;
    }
  }

  save(data, callback) {
    debug('save: %j', data);
    const dump = yaml.safeDump(data);
    fs.writeFileSync(this.path, dump, 'utf8');
    callback(null);
  }

  add(repo, branch, callback) {
    debug('add: repo = %s, branch = %s', repo, branch);

    let promise;

    if (!callback) {
      promise = new Promise((resolve, reject) => callback = browlUtil.callbackPromise(resolve, reject));
    }

    const storage = this.load();
    const branches = storage[repo] || [];

    branches.push(branch);
    storage[repo] = branches;

    this.save(storage, callback);

    return promise;
  }

  remove(repo, branch, callback) {
    debug('remove: repo = %s, branch = %s', repo, branch);

    let promise;

    if (!callback) {
      promise = new Promise((resolve, reject) => callback = browlUtil.callbackPromise(resolve, reject));
    }

    const storage = this.load();
    storage[repo] = (storage[repo] || []).filter(x => x !== branch);

    if (Object.keys(storage[repo]).length === 0) {
      delete storage[repo];
    }

    this.save(storage, callback);

    return promise;
  }

  /**
   * @deprecated
   */
  list() {
    debug('list');

    try {
      return fs.readFileSync(this.path, 'utf8') || '';
    } catch (err) {
      if (err.code === 'ENOENT') {
        return '';
      }
      throw err;
    }
  }

  exists(...args) {
    const storage = this.load();
    const [repo, branch] = args;

    debug('exists: repo = %s, branch = %s', repo, branch);

    if (args.length === 2) {
      return (storage[repo] || []).includes(branch);
    }

    if (args.length === 1) {
      return repo in storage;
    }

    throw Error('db|exists: invalid parameters.');
  }

  branches(repo) {
    debug('branches: %s', repo);

    const storage = this.load();

    return storage[repo] || [];
  }

  instances(repo) {
    debug('instances: %s', repo);

    const data = this.load();
    const repos = repo ? [repo] : Object.keys(data);
    const reducer = (instances, repo) => {
      return instances.concat(data[repo].map(x =>
        ({
          branch: x,
          repo: repo
        }))
      );
    };

    return repos.reduce(reducer, []);
  }
}

module.exports = YamlDb;
