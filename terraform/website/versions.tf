# No remote backend. State stays on the machine that runs Terraform.
# This repo has no AWS, GCP, or Azure account and no cluster credentials.
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "2.38.0"
    }
  }
}
