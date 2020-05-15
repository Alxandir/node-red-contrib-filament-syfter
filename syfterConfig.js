
module.exports = (RED) => {
    function SyfterConfigNode(n) {
        RED.nodes.createNode(this,n);
        this.config = {
            host: n.host,
            apiKey: n.apiKey
        };
    }
    RED.nodes.registerType("filament-syfter-config", SyfterConfigNode);
};
