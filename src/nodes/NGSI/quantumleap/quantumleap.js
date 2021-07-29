/**
 *
 *   FIWARE QuantumLeap node
 *
 *   Given an QuantumLeap node
 *
 *   Copyright (c) 2019 FIWARE Foundation e.V.
 *
 *   @author Kostas Gompakis
 *
 */

const http = require('../../../http.js');
const common = require('../../../common.js');

function validate(config, payload) {
  let out = true;
  if (!config.endpoint) {
    out = false;
  }

  if (!common.getParam('entityType', config, payload)) {
    out = false;
  }

  return out;
}

function buildParameters(config, payload) {
  let out = 'v2/';

  out=out.concat(`${common.getParam('queryType', config, payload)}`);
  out=out.concat(`/`);
  out=out.concat(`${common.getParam('entityType', config, payload)}`);
  const attrs = common.getParam('attrs', config, payload);
  if (attrs) {
    out=out.concat(`/attrs/${attrs}`);
  }
  const q = common.getParam('q', config, payload);
  if (q) {
    out=out.concat(`?${q}`);
  }
  return out;
}

module.exports = function(RED) {
  function NgsiQuantumLeapNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const endpointConfig = RED.nodes.getNode(config.endpoint);
    const endpoint = endpointConfig.endpoint;

    node.on('input', async function(msg) {
      if (!validate(config, msg.payload)) {
        msg.payload = null;
        node.error('Node is not properly configured, entity type not provided');
        return;
      }

      const parameters = buildParameters(config, msg.payload);

      let response = null;
      try {
        response = await http.get(
          `${endpoint}/${parameters}`,
          await common.buildQueryHeaders(config, endpointConfig)
        );
      } catch (e) {
        msg.payload = { e };
        node.error(
          `Exception while retrieving dataset: ${config.name} ` + e,
          msg
        );
        return;
      }
      const statusCode = response.response.statusCode;

      switch (statusCode) {
        case 200:
          msg.payload = response.body;
          node.send(msg);
          break;
        default:
          msg.payload = null;
          node.error(`Query returned HTTP status code in error: ${statusCode}\n\r ${response.body}`);
      }
    });
  }

  RED.nodes.registerType('NGSI-QuantumLeap', NgsiQuantumLeapNode);
};
