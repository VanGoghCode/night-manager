provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

# TODO: PRODUCTION add VPC, ECS, RDS, Redis, S3, Step Functions, EventBridge, IAM, and observability resources.
