pipeline {
    agent any

    environment {
        PROJECT_ID     = 'warm-utility-455909-s5'
        CLUSTER_NAME   = 'bookmoa-cluster1'
        LOCATION       = 'asia-northeast3-c'
        CREDENTIALS_ID = '11a74dda-01be-43ba-b432-4eb6303b68cc'
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
                    app = docker.build("chaewon121/bookmoa:${env.BUILD_ID}")
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
                    sed -i "s|image: chaewon121/bookmoa.*|image: chaewon121/bookmoa:${env.BUILD_ID}|" deployment.yaml
                """

            step([
                $class: 'KubernetesEngineBuilder',
                projectId: PROJECT_ID,
                clusterName: CLUSTER_NAME,
                location: LOCATION,
                manifestPattern: '*.yaml',   // ← 루트에서 YAML 찾음
                credentialsId: CREDENTIALS_ID,
                verifyDeployments: true
                ])
            }

        }
    }
}
