const axios = require('axios');

module.exports = (RED) => {
    function FilamentSyfterPush(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        this.syfterConfig = RED.nodes.getNode(config.syfterConfig);
        this.documentType = config.documentType;
        if (!this.documentType) {
            node.error('Invalid Document Type');
            return;
        }
        if (!this.syfterConfig || !this.syfterConfig.config || !this.syfterConfig.config.host || !this.syfterConfig.config.apiKey) {
            node.error('Invalid Syfter config');
            return;
        }

        node.on('input', async function (msg) {
            const id = msg._id || msg.payload._id;
            if (!id) {
                node.error('Missing ID parameter (msg._id or msg.payload._id)')
                return;
            }

            let { host, apiKey } = this.syfterConfig.config;
            if (!host.toLowerCase().startsWith('http')) {
                host = `https://${host}`;
            }
            if (!host.endsWith('/')) {
                host = `${host}/`;
            }
            const body = {};
            for (const dataField of config.dataFields) {
                if (msg.payload.hasOwnProperty(dataField.field)) {
                    const { type } = dataField;
                    let value = msg.payload[dataField.field];
                    if (type === 'number') {
                        value = Number(value);
                        if (Number.isNaN(value)) {
                            node.error(`Field: ${dataField.field} - Value: ${msg.payload[dataField.field]} cannot be cast to a Number`);
                        }
                    } else if (type === 'datetime') {
                        if (value instanceof Date) {
                            value = (new Date(value)).getTime();
                        }
                        value = Number(value);
                        if (Number.isNaN(value)) {
                            node.error(`Field: ${dataField.field} - Value: ${msg.payload[dataField.field]} cannot be cast to an epoch timestamp`);
                        }
                    }
                    body[dataField.field] = value;
                    body.mappings = body.mappings || {};
                    body.mappings[dataField.field] = {
                        field: dataField.name,
                        type: dataField.type
                    }
                }
            }
            if (!Object.keys(body).length) {
                node.error('No matching payload fields found');
                return;
            }
            try {
                await axios.post(`${host}api/${this.documentType}/${id}/custom`, body, { headers: { Authorization: `Api-Key ${apiKey}` } })
            } catch(err) {
                node.error(err);
            }
        });
    }
    RED.nodes.registerType('filament-syfter-push', FilamentSyfterPush);
};
