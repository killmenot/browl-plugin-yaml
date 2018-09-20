'use strict';

const path = require('path');
const chai = require('chai');
const sinonChai = require('sinon-chai');

process.env.STORAGE_PATH = path.join(__dirname, 'storage.test.yml');
process.env.NODE_ENV = 'test';

chai.use(sinonChai);

global.expect = chai.expect;
