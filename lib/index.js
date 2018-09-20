'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml');
const browlUtil = require('browl-util');

class YamlDb {
  constructor(options) {
    this.path = options.path;
  }

  load() {
    try {
      return yaml.safeLoad(fs.readFileSync(this.path, 'utf8')) || {};
    } catch (err) {
      if (err.code === 'ENOENT') {
        return {};
      }

      throw err;
    }
  }

  save(data, callback) {
    const dump = yaml.safeDump(data);
    fs.writeFileSync(this.path, dump, 'utf8');
    callback(null);
  }

  add(repo, branch, callback) {
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

  list() {
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

    if (args.length === 2) {
      return (storage[repo] || []).includes(branch);
    }

    if (args.length === 1) {
      return repo in storage;
    }

    throw Error('db|exists: invalid parameters.');
  }

  branches(repo) {
    const storage = this.load();

    return storage[repo] || [];
  }

  instances(repo) {
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
