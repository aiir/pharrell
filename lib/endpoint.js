export default class Endpoint {
  constructor(name, options = {}) {
    if (options.namePlural === name) {
      throw new TypeError('Plural name cannot be the same as singular');
    }
    this.name = name;
    this.namePlural = options.namePlural || `${name}s`;
    this.identifierPattern = options.identifierPattern;
    this.validListQueryParams = options.validListQueryParams || [];
    this.parentEndpoint = null;
    this.childEndpoints = {};
    this.middleware = [];
  }

  static throw(status, message, key) {
    const error = new Error(message);
    error.expose = true;
    error.status = status;
    error.key = key;
    throw error;
  }

  mount(endpoint) {
    this.childEndpoints[endpoint.namePlural] = endpoint;
    endpoint.parentEndpoint = this; // eslint-disable-line no-param-reassign
    return this; // allows chaining
  }

  use(middleware) {
    this.middleware.push(middleware);
    return this; // allows chaining
  }

  async read(id, lookupResult) { // eslint-disable-line no-unused-vars, class-methods-use-this
    if (lookupResult === undefined) {
      throw new Error(`Both #lookup and #read for ${this.name} endpoint not implemented`);
    }
    return lookupResult;
  }

  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  async list(page, params, parentId, parentLookupResult) {
    throw new Error(`#list for ${this.name} endpoint not implemented`);
  }
}
