# Build for az-smartthings-logger

# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "${var.prefix}-${var.environment}"
  location = var.location
}

# Storage Account
resource "azurerm_storage_account" "storage" {
  name                     = "storage${substr(md5(azurerm_resource_group.rg.id), 0, 8)}"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

output "StorageAccount" {
  value = azurerm_storage_account.storage.name
}

# Queue
resource "azurerm_storage_queue" "queue" {
  name                 = "events"
  storage_account_name = azurerm_storage_account.storage.name
}

output "Queue" {
  value = azurerm_storage_queue.queue.name
}

# SAS token to add to the queue
data "azurerm_storage_account_sas" "queuetoken" {
  connection_string = azurerm_storage_account.storage.primary_connection_string
  https_only        = true
  start             = "2020-01-01"
  expiry            = "2099-12-31"
  resource_types {
    object    = true
    container = false
    service   = false
  }
  services {
    blob  = false
    queue = true
    table = false
    file  = false
  }
  permissions {
    read    = false
    write   = false
    delete  = false
    list    = false
    add     = true
    create  = false
    update  = false
    process = false
  }
}

output "SASToken" {
  value = data.azurerm_storage_account_sas.queuetoken.sas
}

# Data file share
resource "azurerm_storage_share" "fileshare" {
  name                 = "data"
  storage_account_name = azurerm_storage_account.storage.name
}

# Deployment Container
resource "azurerm_storage_container" "deployments" {
  name                  = "function-releases"
  storage_account_name  = azurerm_storage_account.storage.name
  container_access_type = "private"
}

# Function App code
resource "azurerm_storage_blob" "functionapp-code" {
  name                   = "functionapp-${var.appversion}.zip"
  storage_account_name   = azurerm_storage_account.storage.name
  storage_container_name = azurerm_storage_container.deployments.name
  type                   = "Block"
  source                 = var.functionapp
}

# SAS token for code storage
data "azurerm_storage_account_sas" "sas" {
  connection_string = azurerm_storage_account.storage.primary_connection_string
  https_only        = true
  start             = "2020-01-01"
  expiry            = "2099-12-31"
  resource_types {
    object    = true
    container = false
    service   = false
  }
  services {
    blob  = true
    queue = false
    table = false
    file  = false
  }
  permissions {
    read    = true
    write   = false
    delete  = false
    list    = false
    add     = false
    create  = false
    update  = false
    process = false
  }
}

# App Service Plan
resource "azurerm_app_service_plan" "asp" {
  name                = "${var.prefix}-plan"
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.location
  kind                = "FunctionApp"
  reserved            = true
  sku {
    tier = "Dynamic"
    size = "Y1"
  }
}

# Azure Function
resource "azurerm_function_app" "functions" {
  name                      = "${var.prefix}-${var.environment}"
  location                  = var.location
  resource_group_name       = azurerm_resource_group.rg.name
  app_service_plan_id       = azurerm_app_service_plan.asp.id
  storage_connection_string = azurerm_storage_account.storage.primary_connection_string
  os_type                   = "linux"
  version                   = "~3"

  app_settings = {
    https_only                   = true
    FUNCTIONS_WORKER_RUNTIME     = "node"
    WEBSITE_NODE_DEFAULT_VERSION = "~12"
    FUNCTION_APP_EDIT_MODE       = "readonly"
    HASH                         = base64encode(filesha256(var.functionapp))
    WEBSITE_RUN_FROM_PACKAGE     = "https://${azurerm_storage_account.storage.name}.blob.core.windows.net/${azurerm_storage_container.deployments.name}/${azurerm_storage_blob.functionapp-code.name}${data.azurerm_storage_account_sas.sas.sas}"
  }

  # future azurerm functionality will support a storage_account block to specify a mount point.
  # in the interim this is done manually using az webapp config storage-account add
  provisioner "local-exec" {
    command = <<EOT
      az webapp config storage-account add -g ${azurerm_resource_group.rg.name} \
      -n ${var.prefix}-${var.environment} \
      --custom-id dataid \
      --storage-type AzureFiles \
      --account-name ${azurerm_storage_account.storage.name} \
      --share-name ${azurerm_storage_share.fileshare.name} \
      --access-key ${azurerm_storage_account.storage.primary_access_key} \
      --mount-path /data
    EOT
  }
}
