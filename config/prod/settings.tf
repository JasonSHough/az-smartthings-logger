# Backend config (optional).  Remove block for local default.
terraform {
  backend "azurerm" {
    resource_group_name="tfstate"
    storage_account_name="storage435433"
    container_name="tfstate"
    key="az-smartthing-logger/prod.tfstate"
  }
}

# Terraform configuration settings
variable "prefix" {
    type = string
    default = "azlogger"
}

variable "environment" {
    type = string
    default = "prod"
}

variable "location" {
    type = string
    default = "eastus"
}
