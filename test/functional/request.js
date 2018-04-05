import http from 'http';
import supertest from 'supertest';

import app from '../../example/app';

const callback = app.koa.callback();
const server = http.createServer(callback);
const request = supertest(server);

export default request;
