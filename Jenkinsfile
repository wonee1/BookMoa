pipeline {
    agent any

    environment {
        PROJECT_ID     = 'warm-utility-455909-s5'
        CLUSTER_NAME   = 'bookmoa-cluster1'
        LOCATION       = 'asia-northeast3-c'
        CREDENTIALS_ID = '6139de6d-8d83-4692-974c-98627b379e8b'
    }

    stages {

        stage("Checkout code") {
            steps {
                checkout scm
            }
        }

        stage("Build Docker image") {
            steps {
                script {
                    echo "Building Docker image..."
                    app = docker.build("wonee1/bookmoa:${env.BUILD_ID}")
                }
            }
        }

        stage("Push Docker image") {
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'dockerhub') {
                        echo "Pushing Docker image..."
                        app.push("latest")
                        app.push("${env.BUILD_ID}")
                    }
                }
            }
        }

        stage("Deploy to GKE") {
            when {
                branch 'main'
            }
            steps {
                echo "Deploying to GKE..."

                sh """
                    sed -i "s|image: wonee1/bookmoa.*|image: wonee1/bookmoa:${env.BUILD_ID}|" k8s/deployment.yaml
                """

                step([
                    $class: 'KubernetesEngineBuilder',
                    projectId: PROJECT_ID,
                    clusterName: CLUSTER_NAME,
                    location: LOCATION,
                    manifestPattern: 'k8s/**',
                    credentialsId: CREDENTIALS_ID,
                    verifyDeployments: true
                ])
            }
        }
    }
}
