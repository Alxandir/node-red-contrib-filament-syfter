const axios = require('axios');
const { snakeCase } = require('change-case');

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
            for (const dataField of config.dataFields) {
                if (msg.payload.hasOwnProperty(dataField.field)) {
                    const { type } = dataField;
                    let value = msg.payload[dataField.field];
                    let metadata;
                    if (value !== null && typeof value === 'object') {
                        if (!value.hasOwnProperty('value')) {
                            node.error(`Field: ${dataField.field} - value object does not contain a 'value' field`);
                            continue;
                        }
                        metadata = value.metadata;
                        value = value.value;
                        if (metadata) {
                            if (typeof metadata !== 'object') {
                                node.error(`Field: ${dataField.field} - Metadata: ${metadata} is not a valid object`);
                                continue;
                            }
                            if (metadata.ml_file_id) {
                                const ml_file_id = Number(metadata.ml_file_id);
                                if (!Number.isSafeInteger(ml_file_id) || ml_file_id < 0) {
                                    node.error(`Field: ${dataField.field} - Metadata ML file ID: ${ml_file_id} is not a valid integer ID`);
                                    continue;
                                }
                                metadata.ml_file_id = ml_file_id;
                            }
                            if (metadata.confidence) {
                                const confidence = Number(metadata.confidence);
                                if (Number.isNaN(confidence) || confidence > 1 || confidence < 0) {
                                    node.error(`Field: ${dataField.field} - Metadata confidence: ${confidence} is not a valid number (0 - 1) eg. 0.75`);
                                    continue;
                                }
                                metadata.confidence = confidence;
                            }
                            if (metadata.page_number) {
                                const page_number = Number(metadata.page_number);
                                if (!Number.isSafeInteger(page_number) || page_number < 0) {
                                    node.error(`Field: ${dataField.field} - Metadata page number: ${page_number} is not a valid integer`);
                                    continue;
                                }
                                metadata.page_number = page_number;
                            }
                        }
                    }
                    if (type === 'string') {
                        value = String(value);
                    }
                    if (type === 'number') {
                        value = Number(value);
                        if (Number.isNaN(value)) {
                            node.error(`Field: ${dataField.field} - Value: ${msg.payload[dataField.field]} cannot be cast to a Number`);
                            continue;
                        }
                    } else if (type === 'datetime') {
                        if (value instanceof Date) {
                            value = (new Date(value)).getTime();
                        }
                        value = Number(value);
                        if (Number.isNaN(value)) {
                            node.error(`Field: ${dataField.field} - Value: ${msg.payload[dataField.field]} cannot be cast to an epoch timestamp`);
                            continue;
                        }
                    } else if (type === 'boolean') {
                        value = Boolean(value);
                    }
                    const idField = config.documentType === 'articles' ? 'article_id' : 'company_id';
                    const source = snakeCase(config.dataSource || 'ml');
                    const definitionId = Number(dataField.definitionId)
                    if (!Number.isSafeInteger(definitionId)) {
                        node.error(`Custom Defition ID: ${dataField.definitionId} is not a valid integer ID`);
                        continue;
                    }
                    const body = {
                        custom_property_definition_id: definitionId,
                        [idField]: id,
                        value,
                        source
                    }
                    if (metadata) {
                        body.metadata = metadata;
                    }
                    try {
                        await axios.post(`${host}api/custom-property-values`, body, { headers: { Authorization: `Api-Key ${apiKey}` } })
                    } catch (err) {
                        if (err.response && err.response.data) {
                            node.error(err.response.data);
                        } else {
                            node.error(err);
                        }
                    }
                }
            }
        });
    }
    RED.nodes.registerType('filament-syfter-push', FilamentSyfterPush);
};
