/* eslint no-param-reassign: 0 */

import bodyParser from 'koa-bodyparser';
import Koa from 'koa';
import lambda from 'aws-serverless-express';

import Router from './router';

const endpointFunctionNames = ['create', 'lookup', 'read', 'update', 'delete', 'list'];

/**
 * Middleware to add Server header to all outgoing responses.
 */
async function addServerHeader(context, next) {
  await next();
  context.set('Server', 'pharrell');
}

/**
 * Middleware to handle exceptions thrown lower down and wrap in to an appropriate HTTP response.
 */
async function handleException(context, next) {
  try {
    await next();
  } catch (error) {
    if (error instanceof SyntaxError) {
      error.status = 400;
      error.message = 'Bad request';
      error.expose = true;
    }
    const isExposable = Boolean(error.expose);
    const isInDevelopmentMode = process.env.NODE_ENV === 'development';
    if (!isInDevelopmentMode && !isExposable) {
      console.log(error); // eslint-disable-line no-console
    }
    const key = (isExposable && error.key !== undefined) ? error.key : 'general';
    const message = isExposable ? error.message : 'Internal server error';
    const body = {};
    body[key] = message;
    context.status = error.status ? error.status : 500;
    context.body = body;
  }
}

export default class Application {
  constructor() {
    this.router = new Router();
    this.koa = new Koa();
    this.koa
      .use(addServerHeader)
      .use(handleException)
      .use(bodyParser())
      .use(this.router.route.bind(this.router));
  }

  mount(endpoint) {
    const hasValidFunction = endpointFunctionNames.some(name => (typeof endpoint[name] === 'function'));
    if (!hasValidFunction) {
      const error = new Error(`Endpoint must have at least one of ${endpointFunctionNames.join(', ')} functions`);
      throw error;
    }
    this.router.mount(endpoint);
    return this; // allows chaining
  }

  use(middleware) {
    this.router.use(middleware);
    return this; // allows chaining
  }

  listen(...args) {
    this.koa.listen(...args);
    return this; // allows chaining
  }

  handler() {
    const server = lambda.createServer(this.koa.callback());
    return function lambdaHandlerFunction(event, context) {
      lambda.proxy(server, event, context);
    };
  }
}
