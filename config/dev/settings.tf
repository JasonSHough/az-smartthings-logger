# Backend config (optional).  Remove block for local default.
terraform {
  backend "azurerm" {
    resource_group_name="smartthings"
    storage_account_name="betheladls"
    container_name="betheliot"
    key="az-smartthing-logger/dev.betheliot"
  }
}

# Terraform configuration settings
variable "prefix" {
    type = string
    default = "iotlogger"
}

variable "environment" {
    type = string
    default = "dev"
}

variable "location" {
    type = string
    default = "centralcanada"
}
