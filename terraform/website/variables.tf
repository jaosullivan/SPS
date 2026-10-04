variable "kubeconfig_path" {
  type        = string
  description = "Kubeconfig for planning or applying. Pull-request CI uses an ephemeral cluster. A real cluster kubeconfig is not stored in this repo."
}

variable "image" {
  type        = string
  default     = "localhost/sps-website:latest"
  description = "Website image produced by the Podman build. No image registry account is configured."
}
