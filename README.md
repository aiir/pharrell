<img src="logo.svg" style="width:100%;max-width:500px;">

# Pharrell

*Because it's API'y*

Opinionated HTTP framework for Node.js to make the creation of [CRUDL](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) APIs as simple as possible. Built on the [Koa](http://koajs.com) framework, it offers support for both standard server operation as well as bundling for serverless operation via an AWS Lambda function.

The framework facilitates easy implementation of APIs based on the [API design from Deliveroo Engineering](https://deliveroo.engineering/guidelines/api-design/).

An intentionally simplistic internal router provides fast routing for relatively fixed path patterns, even with a large number of registered endpoints.

## Installation

Pharrell is written in ES6 and uses [Babel](https://babeljs.io) to transpile to support Node v8.10 or higher (the current highest supported version of Node for AWS Lambda functions).

```
$ npm install pharrell
```

## Hello Pharrell

```
import { Endpoint, ListResult, Pharrell } from '..';

class ExampleEndpoint extends Endpoint {
  constructor() {
    super('minion');
    this.use((context, next) => {
      context.set('X-Endpoint', 'Minion');
      await next();
    });
  }

  async lookup(id) {
    return db.find(id);
  }

  async list(page) {
    const limit = 100;
    const offset = page * limit;
    const results = db.findAll({ offset, limit });
    const ids = results.map(item => item.id);
    const total = db.count();
    return new ListResult(ids, total, limit);
  }
}

const app = new Pharrell();
const endpoint = new ExampleEndpoint();
app
  .mount(endpoint)
  .use((context, next) => {
    context.set('X-App', 'My App');
    await next();
  })
  .listen(3000);
```

## Endpoints

Because of the simplicity of the framework, most implementations should need only to create one or more subclasses of Endpoint to provide functionality. Check the [full example](https://github.com/aiir/pharrell/blob/master/example) to see how a fully featured API could be structured.

You should also read the [API design](https://deliveroo.engineering/guidelines/api-design/) Pharrell is based on to get a better understanding of why things are implemented the way they are.

## Using with Lambda

Thanks to [AWS Serverless Express](https://github.com/awslabs/aws-serverless-express) it's easy to also run Pharrell as a serverless Lambda function:

```
const app = new Pharrell();
const endpoint = new ExampleEndpoint();
app.mount(endpoint);

exports.handler = app.handler();
```

## Authors

- Created by [@andybee](https://twitter.com/andybee)
- Logo by [@JonathanEx](https://twitter.com/JonathanEx)

## License

MIT
