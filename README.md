# az-smartthings-logger

A SmartThings Smart App and Azure backend for storing SmartThings events.

# Azure Backend
When an event happens on SmartThings, it's pushed to an Azure Storage Queue. From there,
an Azure Function persists it to Azure Files as a .jsonl file (one per day). Periodically
the .jsonl files are converted to Parquet.

The result is a datalake that stores your SmartThings events, at a very low cost, forever.
Download the event files directly or connect with Spark for analysis.

Note the function app is deployed on a `consumption` plan with a `linux` host. At the time
of this writing, that was only available in some regions, including useast.

# SmartThings SmartApp
The SmartApp captures events and transmits them to the storage queue. You will need to install
this on the web console, and on your device. For details on how to implement, see the
[blog post](https://jeffsidea.com/stream-smartthings-data-to-azure/) here.

# Installation
If you would like to clone this repo and create your own Azure backend, do this first:
- install and configure the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- login to the Azure CLI and connect to your subscription (this is where the RG will get created)
- see `Environments & Configuration` below to set your config. Terraform requires a state file;
if you do not store it centrally, configure a `local` backend first.

To deploy:
`ENV=<config> npm run deploy`

# Environments & Configuration
The `config` directory can contain configurations for multiple environments. NPM
commands should be prefixed with an `ENV` to select a config (`dev` is default).

For example, to deploy using the production config:
`ENV=prod npm run deploy`
