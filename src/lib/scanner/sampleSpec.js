/** sampleSpec — deliberately vulnerable spec for "Try a sample" + smoke.
 *  Expected findings: Critical apiKey-in-query scheme + query credential,
 *  Medium unbounded list + error-leak, High http:// server + basic auth,
 *  Low deprecated op + unvalidated body, Info no-error-responses. */
export const SAMPLE_SPEC = JSON.stringify({
  openapi: '3.0.3',
  info: { title: 'Sample Widget API (deliberately vulnerable)', version: '1.0.0' },
  servers: [{ url: 'http://api.widgets.example.com' }],
  components: {
    securitySchemes: {
      ApiKey: { type: 'apiKey', in: 'query', name: 'api_key' },
      LegacyBasic: { type: 'http', scheme: 'basic' }
    },
    schemas: {
      Widget: {
        type: 'object',
        properties: { id: { type: 'string' }, name: { type: 'string' } }
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          stack: { type: 'string' },
          trace: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/widgets': {
      get: {
        operationId: 'listWidgets',
        summary: 'List widgets — no auth, no pagination',
        responses: {
          '200': {
            description: 'list',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Widget' } }
              }
            }
          }
        }
      },
      post: {
        operationId: 'createWidget',
        summary: 'Create widget',
        security: [{ ApiKey: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { name: { type: 'string' }, adminNote: { type: 'string' } }
              }
            }
          }
        },
        responses: {
          '201': { description: 'created' },
          '500': {
            description: 'error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error' } }
            }
          }
        }
      }
    },
    '/widgets/{id}': {
      get: {
        operationId: 'getWidget',
        deprecated: true,
        security: [{ LegacyBasic: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'api_key', in: 'query', required: false, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/Widget' } } } },
          '404': { description: 'missing' }
        }
      }
    },
    '/admin/reset': {
      post: {
        operationId: 'adminReset',
        summary: 'Privileged op with no error responses documented',
        security: [],
        responses: { '200': { description: 'ok' } }
      }
    }
  }
}, null, 2);
