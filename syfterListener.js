const SocketClient = require('socket.io-client');

module.exports = function(RED) {
    function SyfterListener(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.documentType = config.documentType;
        var node = this;
        if (!this.documentType) {
            node.error('Invalid Document Type');
            return;
        }
        
        this.syfterConfig = RED.nodes.getNode(config.syfterConfig);
        if (!this.syfterConfig || !this.syfterConfig.config || !this.syfterConfig.config.host || !this.syfterConfig.config.apiKey) {
            node.error('Invalid Syfter config');
            return;
        }
        const options = { path: '/ws', query: { 'Api-Key': this.syfterConfig.config.apiKey } }
        this.socket = new SocketClient(this.syfterConfig.config.host, options);

        this.socket.on('connect', function() {
            node.status({ fill: 'green', shape: 'dot', text: 'connected' });
        });

        this.socket.on('disconnect', function () {
            node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
        });

        this.socket.on('connect_error', function(err) {
            if (err) {
                node.status({ fill: 'red', shape: 'ring', text: 'error' });
                node.send({ payload: err });
            }
        });

        this.socket.on(node.documentType, function (data) {
            node.send({ payload: data });
        })

        node.on('close', function (done) {
            node.socket.disconnect();
            node.status({});
            done();
        });
    }
    RED.nodes.registerType('filament-syfter-listener', SyfterListener);
};