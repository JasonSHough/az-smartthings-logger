#!/bin/bash

# Function app and storage account names must be unique.
resourceGroupName=smartthings
storageName=ststorageaccount$RANDOM
storageQueueName=stevents
functionAppName=qtocosmos
region=canadacentral
cosmosAccountName=cosmos-$RANDOM
cosmosDBName=smarthome
cosmosContainer=stevents
cosmosFreeTier=false # if this is your first cosmos DB, set to true

# Create a resource group.
az group create --name $resourceGroupName --location $region

# Create an Azure storage account in the resource group.
az storage account create \
  --name $storageName \
  --location $region \
  --resource-group $resourceGroupName \
  --sku Standard_LRS

# Save the connection string for use later
storageConnectionString=$(az storage account show-connection-string \
  --resource-group $resourceGroupName \
  --name $storageName \
  --query connectionString \
  --output tsv)

# Create a storage queue to receive smartthings events
az storage queue create \
  --name $storageQueueName \
  --account-name $storageName \
  --connection-string $storageConnectionString

# Create a SAS token to adding to the queue
SASToken=$(az storage queue generate-sas \
    --name $storageQueueName \
    --account-name $storageName \
    --connection-string $storageConnectionString \
    --expiry 2099-01-01T00:00:00Z \
    --https-only \
    --permissions a \
    --output tsv)

# Create a Cosmos account for SQL API
# If you have already used the free tier in another account, comment it out.
az cosmosdb create \
    --name $cosmosAccountName \
    --resource-group $resourceGroupName \
    --enable-free-tier $cosmosFreeTier

# Save the connection string for use later
cosmosDBConnection=$(az cosmosdb keys list \
    --type connection-strings \
    --name $cosmosAccountName \
    --resource-group $resourceGroupName \
    --query "connectionStrings[0].connectionString" --output tsv)

# Create a SQL API database
az cosmosdb sql database create \
    --account-name $cosmosAccountName \
    --resource-group $resourceGroupName \
    --name $cosmosDBName

# Create a function app
az functionapp create \
  --functions-version 3 \
  --resource-group $resourceGroupName \
  --consumption-plan-location $region \
  --runtime node \
  --runtime-version 12 \
  --name $functionAppName \
  --storage-account $storageName

# Set function app settings
az functionapp config appsettings set \
  --name $functionAppName \
  --resource-group $resourceGroupName \
  --settings ST_QUEUENAME=$storageQueueName \
             CosmosDBConnection=$cosmosDBConnection \
             CosmosDBName=$cosmosDBName \
             CosmosContainer=$cosmosContainer

# Add a function to move queue messages to Cosmos
az functionapp deployment source config \
  --name $functionAppName \
  --resource-group $resourceGroupName \
  --repo-url https://github.com/jschnurr/az-smartthings-logger \
  --manual-integration

# Test it out! Put a message on storage queue, should end up in Cosmos
testtext=$(echo "{\"test\":\"test\"}" | base64)
az storage message put \
    --content $testtext \
    --queue-name $storageQueueName \
    --account-name $storageName \
    --connection-string $storageConnectionString

# Output required settings for the Smartthings SmartApp
echo "\n\n-------------------\nSMARTTHINGS SETTINGS:\n \
  Queue: $storageQueueName\n \
  SASToken: $SASToken\n \
  StorageAccount: $storageName \
  \n\n"