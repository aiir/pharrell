import tap from 'babel-tap';

import request from './request';

tap.test('/', (parentTest) => {
  parentTest.test('OPTIONS', (test) => {
    request.options('/')
      .expect(204)
      .end((error, response) => {
        test.error(error);
        test.same(response.headers.allow, 'GET, HEAD, OPTIONS');
        test.end();
      });
  });

  parentTest.test('HEAD', (test) => {
    request.head('/')
      .expect(200)
      .end((error, response) => {
        test.same(response.body, {});
        test.end();
      });
  });

  parentTest.test('GET', (test) => {
    request.get('/')
      .expect(200)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, {
          _links: {
            hotels: {
              href: '/hotels{?published}',
              templated: true,
            },
            hotel: {
              href: '/hotels/{id}',
              templated: true,
            },
            hotel_photos: {
              href: '/hotels/{id}/photos{?default}',
              templated: true,
            },
            photos: {
              href: '/photos{?default}',
              templated: true,
            },
            photo: {
              href: '/photos/{id}',
              templated: true,
            },
          },
        });
        test.end();
      });
  });

  parentTest.test('POST', (test) => {
    request.post('/')
      .expect(405)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, { general: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.test('PUT', (test) => {
    request.put('/')
      .expect(405)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, { general: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.test('DELETE', (test) => {
    request.delete('/')
      .expect(405)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, { general: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.test('middleware', (test) => {
    request.get('/')
      .end((error, response) => {
        test.error(error);
        test.same(response.headers['x-app'], 'Example');
        test.end();
      });
  });

  parentTest.end();
});

tap.test('/hotels', (parentTest) => {
  const route = '/hotels';

  parentTest.test('OPTIONS', (test) => {
    request.options(route)
      .expect(204)
      .end((error, response) => {
        test.error(error);
        test.same(response.headers.allow, 'GET, HEAD, OPTIONS, POST');
        test.end();
      });
  });

  parentTest.test('HEAD', (test) => {
    request.head(route)
      .expect(200)
      .end((error, response) => {
        test.same(response.body, {});
        test.end();
      });
  });

  parentTest.test('GET', (test) => {
    request.get(route)
      .expect(200)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, {
          _links: {
            hotel: [
              {
                href: '/hotels/123',
              },
              {
                href: '/hotels/124',
              },
            ],
            next: null,
            prev: null,
            self: '/hotels?page=1',
          },
          page: 1,
          per_page: 100,
          total: 2,
        });
        test.end();
      });
  });

  parentTest.test('GET with excessive page number', (test) => {
    request.get(`${route}?page=100`)
      .expect(200)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, {
          _links: {
            hotel: [],
            next: null,
            prev: '/hotels?page=1',
            self: '/hotels?page=100',
          },
          page: 100,
          per_page: 100,
          total: 2,
        });
        test.end();
      });
  });

  parentTest.test('POST', (test) => {
    request.post(route)
      .send({ name: 'Nice Hotel' })
      .expect(201)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, {
          id: 125,
          name: 'Nice Hotel',
          _links: {
            self: '/hotels/125',
          },
        });
        test.end();
      });
  });

  parentTest.test('PUT', (test) => {
    request.put(route)
      .end((error, response) => {
        test.error(error);
        test.equal(response.status, 405);
        test.same(response.body, { hotels: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.test('DELETE', (test) => {
    request.delete(route)
      .end((error, response) => {
        test.error(error);
        test.equal(response.status, 405);
        test.same(response.body, { hotels: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.end();
});

tap.test('/hotels/{id}', (parentTest) => {
  const route = '/hotels/123';

  parentTest.test('OPTIONS', (test) => {
    request.options(route)
      .expect(204)
      .end((error, response) => {
        test.error(error);
        test.same(response.headers.allow, 'DELETE, GET, HEAD, OPTIONS, PATCH');
        test.end();
      });
  });

  parentTest.test('HEAD', (test) => {
    request.head(route)
      .expect(200)
      .end((error, response) => {
        test.same(response.body, {});
        test.end();
      });
  });

  parentTest.test('GET', (test) => {
    request.get(route)
      .expect(200)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, {
          id: 123,
          name: 'Luxury resort in Marylebone',
          _links: {
            manager: {
              href: '/users/111',
            },
          },
        });
        test.end();
      });
  });

  parentTest.test('GET with invalid id', (test) => {
    request.get('/hotels/999')
      .expect(404)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, {
          hotel: 'Not found',
        });
        test.end();
      });
  });

  parentTest.test('PATCH', (test) => {
    request.patch(route)
      .send({ name: 'New Hotel' })
      .expect(200)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, {
          id: 123,
          name: 'New Hotel',
          _links: {
            manager: {
              href: '/users/111',
            },
          },
        });
        test.end();
      });
  });

  parentTest.test('DELETE', (test) => {
    request.delete(route)
      .expect(204)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, {});
        test.end();
      });
  });

  parentTest.test('POST', (test) => {
    request.post(route)
      .end((error, response) => {
        test.error(error);
        test.equal(response.status, 405);
        test.same(response.body, { hotel: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.test('PUT', (test) => {
    request.put(route)
      .end((error, response) => {
        test.error(error);
        test.equal(response.status, 405);
        test.same(response.body, { hotel: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.end();
});

tap.test('/hotels/{id}/photos', (parentTest) => {
  const route = '/hotels/123/photos';

  parentTest.test('OPTIONS', (test) => {
    request.options(route)
      .expect(204)
      .end((error, response) => {
        test.error(error);
        test.same(response.headers.allow, 'GET, HEAD, OPTIONS');
        test.end();
      });
  });

  parentTest.test('HEAD', (test) => {
    request.head(route)
      .expect(200)
      .end((error, response) => {
        test.same(response.body, {});
        test.end();
      });
  });

  parentTest.test('GET', (test) => {
    request.get(route)
      .expect(200)
      .end((error, response) => {
        test.same(response.body, {
          page: 1,
          per_page: 100,
          total: 2,
          _links: {
            prev: null,
            next: null,
            self: `${route}?page=1`,
            photo: [
              {
                href: '/photos/1',
              },
              {
                href: '/photos/2',
              },
            ],
          },
        });
        test.end();
      });
  });

  parentTest.test('POST', (test) => {
    request.post(route)
      .send({})
      .end((error, response) => {
        test.error(error);
        test.equal(response.status, 405);
        test.same(response.body, { photos: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.test('PATCH', (test) => {
    request.patch(route)
      .end((error, response) => {
        test.error(error);
        test.equal(response.status, 405);
        test.same(response.body, { photos: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.test('DELETE', (test) => {
    request.delete(route)
      .end((error, response) => {
        test.error(error);
        test.equal(response.status, 405);
        test.same(response.body, { photos: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.test('PUT', (test) => {
    request.put(route)
      .end((error, response) => {
        test.error(error);
        test.equal(response.status, 405);
        test.same(response.body, { photos: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.end();
});

tap.test('/photos', (parentTest) => {
  const route = '/photos';

  parentTest.test('OPTIONS', (test) => {
    request.options(route)
      .expect(204)
      .end((error, response) => {
        test.error(error);
        test.same(response.headers.allow, 'GET, HEAD, OPTIONS');
        test.end();
      });
  });

  parentTest.test('HEAD', (test) => {
    request.head(route)
      .expect(200)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, {});
        test.end();
      });
  });

  parentTest.test('GET', (test) => {
    request.get(route)
      .expect(200)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, {
          page: 1,
          per_page: 100,
          total: 3,
          _links: {
            prev: null,
            next: null,
            self: `${route}?page=1`,
            photo: [
              {
                href: '/photos/1',
              },
              {
                href: '/photos/2',
              },
              {
                href: '/photos/3',
              },
            ],
          },
        });
        test.end();
      });
  });

  parentTest.test('POST', (test) => {
    request.post(route)
      .expect(405)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, { photos: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.test('PUT', (test) => {
    request.put(route)
      .expect(405)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, { photos: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.test('DELETE', (test) => {
    request.delete(route)
      .expect(405)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, { photos: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.test('middleware', (test) => {
    request.get(route)
      .end((error, response) => {
        test.error(error);
        test.same(response.headers['x-endpoint'], 'Photo');
        test.end();
      });
  });

  parentTest.end();
});

tap.test('/photos/{id}', (parentTest) => {
  const route = '/photos/1';

  parentTest.test('OPTIONS', (test) => {
    request.options(route)
      .expect(204)
      .end((error, response) => {
        test.error(error);
        test.same(response.headers.allow, 'GET, HEAD, OPTIONS');
        test.end();
      });
  });

  parentTest.test('HEAD', (test) => {
    request.head(route)
      .expect(200)
      .end((error, response) => {
        test.same(response.body, {});
        test.end();
      });
  });

  parentTest.test('GET', (test) => {
    request.get(route)
      .expect(200)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, {
          id: 1,
          name: 'A nice photo',
          _links: {
            hotel: {
              href: '/hotels/123',
            },
          },
        });
        test.end();
      });
  });

  parentTest.test('GET', (test) => {
    request.get('/photos/999')
      .expect(404)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, {
          photo: 'Not found',
        });
        test.end();
      });
  });

  parentTest.test('POST', (test) => {
    request.post(route)
      .expect(405)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, { photo: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.test('PUT', (test) => {
    request.put(route)
      .expect(405)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, { photo: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.test('DELETE', (test) => {
    request.delete(route)
      .expect(405)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, { photo: 'Method not allowed' });
        test.end();
      });
  });

  parentTest.end();
});

tap.test('Unknown route', (parentTest) => {
  const route = '/unknown-route';

  parentTest.test('GET', (test) => {
    request.get(route)
      .expect(404)
      .end((error, response) => {
        test.error(error);
        test.same(response.body, { general: 'Not found' });
        test.end();
      });
  });

  parentTest.end();
});
