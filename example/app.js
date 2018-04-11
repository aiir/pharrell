/* eslint-disable class-methods-use-this */

import { Endpoint, ListResult, Pharrell } from '..';

class Store {
  constructor(indexedResources) {
    this.indexedResources = indexedResources;
  }

  find(id) {
    const resource = this.indexedResources[id];
    return (resource !== undefined) ? resource : null;
  }

  findAll() {
    return Object.values(this.indexedResources);
  }

  findByAssociation(options) {
    return this.findAll()
      .filter(resource => // eslint-disable-next-line no-underscore-dangle
        Object.keys(options).some(key => (resource._links[key].href === options[key])));
  }

  create(params) {
    const response = Object.assign({}, params);
    response.id = 125;
    return response;
  }
}

class HotelEndpoint extends Endpoint {
  constructor() {
    super('hotel', { validListQueryParams: ['published'] });
    this.store = new Store({
      123: {
        id: 123,
        name: 'Luxury resort in Marylebone',
        _links: {
          manager: {
            href: '/users/111',
          },
        },
      },
      124: {
        id: 124,
        name: 'The Ritz',
      },
    });
  }

  async create(params) { // eslint-disable-line class-methods-use-this
    const hotel = this.store.create(params);
    return hotel;
  }

  async lookup(id) {
    return this.store.find(id);
  }

  async update(id, params, lookupResult) { // eslint-disable-line class-methods-use-this
    return Object.assign(lookupResult, params);
  }

  async delete() { // eslint-disable-line class-methods-use-this
    return true;
  }

  async list(page) { // eslint-disable-line class-methods-use-this
    let ids;
    if (page !== 1) {
      ids = [];
    } else {
      ids = this.store.findAll().map(hotel => hotel.id);
    }
    return new ListResult(ids, this.store.findAll().length, 100);
  }
}

class PhotoEndpoint extends Endpoint {
  constructor() {
    super('photo', { validListQueryParams: ['default'] });
    this.use(async (context, next) => {
      context.set('X-Endpoint', 'Photo');
      await next();
    });
    this.store = new Store({
      1: {
        id: 1,
        name: 'A nice photo',
        _links: {
          hotel: {
            href: '/hotels/123',
          },
        },
      },
      2: {
        id: 2,
        name: 'Another nice photo',
        _links: {
          hotel: {
            href: '/hotels/123',
          },
        },
      },
      3: {
        id: 3,
        name: 'A further nice photo',
        _links: {
          hotel: {
            href: '/hotels/124',
          },
        },
      },
    });
  }

  async lookup(id) {
    const result = this.store.find(id);
    return result;
  }

  async list(page, queryParams, parentId) {
    let photos;
    if (parentId !== undefined) {
      photos = this.store.findByAssociation({ hotel: `/hotels/${parentId}` });
    } else {
      photos = this.store.findAll();
    }
    const ids = photos.map(photo => photo.id);
    return new ListResult(ids, ids.length, 100);
  }
}

const app = new Pharrell();
const endpoint = new HotelEndpoint();
const childEndpoint = new PhotoEndpoint();
app
  .mount(endpoint.mount(childEndpoint))
  .mount(childEndpoint)
  .use(async (context, next) => {
    context.set('X-App', 'Example');
    await next();
  });

export default app;
