node-red-contrib-filament-syfter **(BETA)**
================================

A set of Node-RED nodes for received events from a Filament Syfter instance, and submitting custom data fields to documents.

These nodes rely on access to a Filament Syfter instance. To find out more, visit: https://syfter.ai/

## Install

There are multiple ways to install `node-red-contrib-filament-syfter`. The official ways are described in the Node-RED [documentation](https://nodered.org/docs/getting-started/adding-nodes).  The name of the package for installation is `node-red-contrib-filament-syfter`.

## Syfter Credentials

Use of these nodes requires admin access to a Syfter instance. You will need to generate an API Key, and use this, along with the host address of the instance, to create a set of connection credentials.

## Syfter Listener

This node subscribes to document events, either Companies or Articles. When a new article/company is added, the new data will be emitted by the node in the message payload. When an article/company is updated, the new version of the document will be emitted by the node in the message payload.

## Syfter Push

This node sends custom properties to documents, based on the ID of the company/article, and the ID of the custom property definition. The field mapping is defined in the node config, and any fields in this mapping that are present in the `msg.payload` will be submitted to Syfter. These fields can be strings or numbers. If a date is to be used, if not already a number, it will be converted to an epoch timestamp in millis.
