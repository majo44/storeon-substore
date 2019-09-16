// options for typescript (
process.env['TS_NODE_TRANSPILE_ONLY'] = 'true';
process.env['TS_NODE_COMPILER_OPTIONS'] = '{"module":"commonjs", "noEmit": "false"}';
// polyfiles for AbortController
// transpiling esm to commonjs
require('ts-node/register');
require('source-map-support/register');
// chai & sinon setup
const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");

chai.use(sinonChai);

global.expect = chai.expect;
global.sinon = sinon;