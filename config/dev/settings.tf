# Backend config (optional).  Remove block for local default.
terraform {
  backend "azurerm" {
    resource_group_name="tfstate"
    storage_account_name="storage435433"
    container_name="tfstate"
    key="az-smartthing-logger/dev.tfstate"
  }
}

# Terraform configuration settings
variable "prefix" {
    type = string
    default = "azlogger"
}

variable "environment" {
    type = string
    default = "dev"
}

variable "location" {
    type = string
    default = "eastus"
}
