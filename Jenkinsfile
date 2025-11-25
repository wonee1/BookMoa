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
                    // 'app' 변수에 빌드 결과 저장
                    app = docker.build("chaewon121/bookmoa:${env.BUILD_ID}")
                }
            }
        }

        stage("Push Docker image") {
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'dockerhub') {
                        echo "Pushing Docker image..."
                        // 'app' 변수 사용
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

                // 1. deployment.yaml에 이미지 태그 업데이트 및 디버깅 🚀
                sh """
                    # sed 개선: 'image:' 다음의 모든 내용을 새 이미지:태그로 완벽하게 대체하여 YAML 포맷 손상 방지
                    # 이 명령은 라인의 들여쓰기를 포함한 image: 다음의 모든 문자를 치환합니다.
                    sed -i "s|image:.*|image: chaewon121/bookmoa:${env.BUILD_ID}|" deployment.yaml
                    
                    echo "--- DEBUG: Check updated image in deployment.yaml ---"
                    cat deployment.yaml | grep image:
                    echo "----------------------------------------------------"
                """

                // 2. deployment.yaml 적용 (KubernetesEngineBuilder 스텝 1)
                echo "Applying deployment.yaml..."
                step([
                    $class: 'KubernetesEngineBuilder',
                    projectId: PROJECT_ID,
                    clusterName: CLUSTER_NAME,
                    location: LOCATION,
                    manifestPattern: 'deployment.yaml', 
                    credentialsId: CREDENTIALS_ID,
                    verifyDeployments: true
                ])
                
                // 3. service.yaml 적용 (KubernetesEngineBuilder 스텝 2)
                echo "Applying service.yaml..."
                step([
                    $class: 'KubernetesEngineBuilder',
                    projectId: PROJECT_ID,
                    clusterName: CLUSTER_NAME,
                    location: LOCATION,
                    manifestPattern: 'service.yaml', 
                    credentialsId: CREDENTIALS_ID,
                    verifyDeployments: true
                ])
            }
        }
    }
}