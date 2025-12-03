pipeline {
    agent any

    environment {
        PROJECT_ID     = 'warm-utility-455909-s5' // GCP 프로젝트 ID
        CLUSTER_NAME   = 'bookmoa-cluster1' // GKE 클러스터 이름
        LOCATION       = 'asia-northeast3-c' // GKE 클러스터 위치
        CREDENTIALS_ID = '41b37ed5-5a02-4cb3-b41c-3200ac6eb4b3' // Jenkins에 저장된 GCP 서비스 계정 키
    }

    stages {

        stage("Checkout code") {// 코드 체크아웃
            steps {
                checkout scm
            }
        }

        stage("Build Docker image") {// 도커 이미지 빌드
            steps {
                script {
                    echo "Building Docker image..."
                    // 'app' 변수에 빌드 결과 저장
                    app = docker.build("chaewon121/bookmoa:${env.BUILD_ID}")
                }
            }
        }

        stage("Push Docker image") {// 도커 이미지 푸시
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

        stage("Deploy to GKE") {// GKE에 배포
            when {
                branch 'main'
            }
            steps {
                echo "Deploying to GKE..."

                // 1. deployment.yaml에 이미지 태그 업데이트 및 디버깅 출력
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