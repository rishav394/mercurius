var mercurius = require('../index.js');
var request = require('supertest');
var nock = require('nock');
var redis = require('../redis.js');
var testUtils = require('./testUtils.js');

describe('mercurius updateMeta', function() {
  var token;

  before(function() {
    return mercurius.ready
    .then(() => testUtils.register(mercurius.app, 'machineX', 'https://localhost:50005'))
    .then(gotToken => token = gotToken);
  });

  it('updates the metadata successfully', function(done) {
    nock('https://localhost:50005')
    .post('/')
    .reply(201);

    request(mercurius.app)
    .post('/updateMeta')
    .send({
      token: token,
      machineId: 'machineX',
      name: 'newName',
      active: false,
    })
    .expect(200, function() {
      request(mercurius.app)
      .post('/notify')
      .send({
        token: token,
        client: 'aClient',
        payload: 'hello',
      })
      .expect(200, done);
    });
  });

  it('returns 404 if the token doesn\'t exist', function(done) {
    request(mercurius.app)
    .post('/updateMeta')
    .send({
      token: 'token_inesistente',
      machineId: 'machineX',
      name: 'newName',
    })
    .expect(404, done);
  });

  it('returns 404 if the machine doesn\'t exist', function(done) {
    request(mercurius.app)
    .post('/updateMeta')
    .send({
      token: token,
      machineId: 'machine_inesistente',
      name: 'newName',
    })
    .expect(404, done);
  });

  it('returns 404 if the machine is in the token set but doesn\'t exist', function(done) {
    redis.sadd(token, 'machine_inesistente')
    .then(function() {
      request(mercurius.app)
      .post('/updateMeta')
      .send({
        token: token,
        machineId: 'machine_inesistente',
        name: 'newName',
      })
      .expect(404, done);
    });
  });

  it('returns 404 if the machine exists but isn\'t in the token set', function(done) {
    request(mercurius.app)
    .post('/register')
    .send({
      machineId: 'machine_3',
      endpoint: 'https://localhost:50005',
      key: 'key',
    })
    .end(function() {
      request(mercurius.app)
      .post('/updateMeta')
      .send({
        token: token,
        machineId: 'machine_3',
        name: 'newName',
      })
      .expect(404, done);
    });
  });
});
