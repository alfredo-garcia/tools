variable "project_id" {
  type = string
}

variable "secret_id" {
  type = string
}

variable "labels" {
  type    = map(string)
  default = {}
}
