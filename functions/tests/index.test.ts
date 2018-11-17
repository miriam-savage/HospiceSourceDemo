import * as fireTest from 'firebase-functions-test';
const adminInitStub = sinon.stub(admin, 'initializeApp');

import * as myFunc from '../src/index';
