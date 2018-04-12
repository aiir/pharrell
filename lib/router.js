import compose from 'koa-compose';
import ListResult from './list-result';

function buildAllowHeaderValue(methodMap, allowOptions = true) {
  return Object.keys(methodMap)
    .concat(allowOptions ? ['HEAD', 'OPTIONS'] : ['HEAD'])
    .sort()
    .join(', ');
}

async function evaluateMethod(context, methodMap, name, path) {
  const { method } = context;
  switch (method) {
    case 'HEAD': {
      const { params } = methodMap.GET;
      const body = await methodMap.GET.function(...params);
      context.body = body; // eslint-disable-line no-param-reassign
      break;
    }
    case 'OPTIONS': {
      const allow = buildAllowHeaderValue(methodMap);
      context.set('Allow', allow);
      context.status = 204; // eslint-disable-line no-param-reassign
      break;
    }
    default: {
      if (methodMap[method] === undefined) {
        const allow = buildAllowHeaderValue(methodMap);
        context.set('Allow', allow);
        const body = {};
        const key = name || 'general';
        body[key] = 'Method not allowed';
        context.status = 405; // eslint-disable-line no-param-reassign
        context.body = body; // eslint-disable-line no-param-reassign
        return;
      }
      const { params, isResource } = methodMap[method];
      let result = await methodMap[method].function(...params);
      if (method === 'DELETE') {
        context.status = 204; // eslint-disable-line no-param-reassign
        return;
      }
      if (isResource !== false) {
        const { id, _links } = result;
        if (id === undefined && _links === undefined) {
          throw new Error('Resource must have `id` or `_links` property');
        }
        if (method === 'POST') {
          context.status = 201; // eslint-disable-line no-param-reassign
        }
        if (_links === undefined) {
          const links = {
            _links: {
              self: `/${path || name}/${id}`,
            },
          };
          result = Object.assign(links, result);
        }
      }
      context.body = result; // eslint-disable-line no-param-reassign
      break;
    }
  }
}

function buildIndexBody(endpoints) {
  const body = {
    _links: Object.values(endpoints).reduce((accumulator, endpoint) => {
      const {
        name,
        namePlural,
        childEndpoints,
        validListQueryParams,
      } = endpoint;
      const query = (validListQueryParams.length > 0) ? `{?${validListQueryParams.join('&')}}` : '';
      accumulator[namePlural] = { href: `/${namePlural}${query}` }; // eslint-disable-line no-param-reassign
      if (query !== '') accumulator[namePlural].templated = true; // eslint-disable-line no-param-reassign
      accumulator[name] = { href: `/${namePlural}/{id}`, templated: true }; // eslint-disable-line no-param-reassign
      Object.values(childEndpoints).forEach((childEndpoint) => {
        const childNamePlural = childEndpoint.namePlural;
        const childValidListQueryParams = childEndpoint.validListQueryParams;
        const childQuery = (childValidListQueryParams.length > 0) ? `{?${childValidListQueryParams.join('&')}}` : '';
        accumulator[`${name}_${childNamePlural}`] = { // eslint-disable-line no-param-reassign
          href: `/${namePlural}/{id}/${childNamePlural}${childQuery}`,
          templated: true,
        };
      });
      return accumulator;
    }, {}),
  };
  return body;
}

async function buildListBody(endpoint, params, parentId, lookupResult) {
  const page = Number(params.page) || 1;
  const listResult = await endpoint.list(page, params, parentId, lookupResult);
  if (!ListResult.isListResult(listResult)) {
    throw new Error('Invalid result from endpoint list method, should comply with ListResult type');
  }
  const maxPage = Math.ceil(listResult.total / listResult.perPage) || 1;
  const prevPage = (page > 1) ? Math.min(page - 1, maxPage) : null;
  const nextPage = ((page * listResult.perPage) < listResult.total) ? Math.max(page + 1, 1) : null;
  const absolutePath = `/${endpoint.namePlural}`;
  let currentPath;
  if (parentId === undefined) {
    currentPath = absolutePath;
  } else {
    currentPath = `/${endpoint.parentEndpoint.namePlural}/${parentId}/${endpoint.namePlural}`;
  }
  const links = {
    self: `${currentPath}?page=${page}`,
    prev: prevPage ? `${currentPath}?page=${prevPage}` : null,
    next: nextPage ? `${currentPath}?page=${nextPage}` : null,
  };
  links[endpoint.name] = listResult.ids.map(id => ({ href: `${absolutePath}/${id}` }));
  const body = {
    page,
    per_page: listResult.perPage,
    total: listResult.total,
    _links: links,
  };
  return body;
}

export default class Router {
  constructor() {
    this.endpoints = {};
    this.applicationMiddleware = [];
  }

  mount(endpoint) {
    const name = endpoint.namePlural;
    if (Object.keys(this.endpoints).includes(name)) {
      throw new Error(`Cannot create route ${name}, already exists`);
    }
    this.endpoints[name] = endpoint;
  }

  use(middleware) {
    this.applicationMiddleware.push(middleware);
  }

  async route(context) {
    const { path } = context;
    if (path === '/') {
      const methodMap = {
        GET: { function: buildIndexBody, params: [this.endpoints], isResource: false },
      };
      const middleware = this.applicationMiddleware
        .concat(context => evaluateMethod(context, methodMap)); // eslint-disable-line no-shadow
      const composedMiddleware = compose(middleware);
      return composedMiddleware(context);
    }
    const components = path.substr(1).split('/');
    if (components.length < 1 || components.length > 3) {
      context.throw(404, 'Not found');
    }
    const [endpointNamePlural, id, childEndpointNamePlural] = components;
    // 404 on trailing slashes
    if ((components.length === 2 && !id) || (components.length === 3 && !childEndpointNamePlural)) {
      context.throw(404, 'Not found');
    }
    const endpoint = this.endpoints[endpointNamePlural];
    if (!endpoint) {
      context.throw(404, 'Not found');
    }
    const endpointMiddleware = endpoint.middleware;
    const { body } = context.request;
    if (components.length === 1) {
      const methodMap = {
        GET: { function: buildListBody, params: [endpoint, context.query], isResource: false },
      };
      if (typeof endpoint.create === 'function') {
        methodMap.POST = { function: endpoint.create.bind(endpoint), params: [body] };
      }
      const middleware = endpointMiddleware
        .concat(
          this.applicationMiddleware, // eslint-disable-next-line no-shadow
          context => evaluateMethod(context, methodMap, endpointNamePlural),
        );
      const composedMiddleware = compose(middleware);
      return composedMiddleware(context);
    }
    let resource;
    if (typeof endpoint.lookup === 'function') {
      resource = await endpoint.lookup(id);
      if (resource === null) {
        context.throw(404, 'Not found', { key: endpoint.name });
      }
    }
    if (components.length === 2) {
      const endpointName = endpoint.name;
      const methodMap = {};
      if (typeof endpoint.read === 'function') {
        methodMap.GET = {
          function: endpoint.read.bind(endpoint),
          params: [id, resource],
        };
      }
      if (typeof endpoint.update === 'function') {
        methodMap.PATCH = {
          function: endpoint.update.bind(endpoint),
          params: [id, body, resource],
        };
      }
      if (typeof endpoint.delete === 'function') {
        methodMap.DELETE = {
          function: endpoint.delete.bind(endpoint),
          params: [id, resource],
          isResource: false,
        };
      }
      const middleware = endpointMiddleware
        .concat(
          this.applicationMiddleware, // eslint-disable-next-line no-shadow
          context => evaluateMethod(context, methodMap, endpointName, endpointNamePlural),
        );
      const composedMiddleware = compose(middleware);
      return composedMiddleware(context);
    }
    const childEndpoint = endpoint.childEndpoints[childEndpointNamePlural];
    if (!childEndpoint) {
      context.throw(404, 'Not found');
    }
    const childEndpointMiddleware = childEndpoint.middleware;
    const middleware = endpointMiddleware
      .concat(
        this.applicationMiddleware,
        endpointMiddleware,
        childEndpointMiddleware,
        context => evaluateMethod(context, { // eslint-disable-line no-shadow
          GET: {
            function: buildListBody,
            params: [childEndpoint, context.query, id, resource],
            isResource: false,
          },
        }, childEndpointNamePlural),
      );
    const composedMiddleware = compose(middleware);
    return composedMiddleware(context);
  }
}
