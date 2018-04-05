import { Endpoint, Pharrell } from '..';

const app = new Pharrell();

const numberOfEndpoints = parseInt(process.env.EP || '1', 10);

console.log(`  ${numberOfEndpoints} endpoints`); // eslint-disable-line no-console

for (let i = 0; i < numberOfEndpoints; i += 1) {
  const endpoint = new Endpoint(`test-${Math.floor((Math.random() * 999999) + 100000)}`);
  app.mount(endpoint.mount(endpoint));
}

app.listen(3333);
