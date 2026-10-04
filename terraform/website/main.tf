provider "kubernetes" {
  config_path = var.kubeconfig_path
}

resource "kubernetes_namespace_v1" "website" {
  metadata {
    name = "sps-website"
    labels = {
      "app.kubernetes.io/name" = "sps-website"
    }
  }
}

resource "kubernetes_deployment_v1" "website" {
  metadata {
    name      = "sps-website"
    namespace = kubernetes_namespace_v1.website.metadata[0].name
    labels = {
      "app.kubernetes.io/name" = "sps-website"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        "app.kubernetes.io/name" = "sps-website"
      }
    }

    template {
      metadata {
        labels = {
          "app.kubernetes.io/name" = "sps-website"
        }
      }

      spec {
        container {
          name              = "website"
          image             = var.image
          image_pull_policy = "IfNotPresent"

          port {
            name           = "http"
            container_port = 3000
          }
        }
      }
    }
  }
}

resource "kubernetes_service_v1" "website" {
  metadata {
    name      = "sps-website"
    namespace = kubernetes_namespace_v1.website.metadata[0].name
    labels = {
      "app.kubernetes.io/name" = "sps-website"
    }
  }

  spec {
    type = "ClusterIP"

    selector = {
      "app.kubernetes.io/name" = "sps-website"
    }

    port {
      name        = "http"
      port        = 80
      target_port = "http"
    }
  }
}
