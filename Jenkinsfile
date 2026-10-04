pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    APP_DIR = "webkitsunova_proyecto"
    FRONTEND_DIR = "webkitsunova_proyecto/frontend"
    BACKEND_DIR = "webkitsunova_proyecto/backend"
    COMPOSE_FILE = "webkitsunova_proyecto/docker-compose.yml"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install dependencies') {
      parallel {
        stage('Frontend install') {
          steps {
            dir("${FRONTEND_DIR}") {
              sh 'npm install'
            }
          }
        }
        stage('Backend install') {
          steps {
            dir("${BACKEND_DIR}") {
              sh 'npm install'
            }
          }
        }
      }
    }

    stage('Typecheck and build') {
      parallel {
        stage('Frontend build') {
          steps {
            dir("${FRONTEND_DIR}") {
              sh 'npm run typecheck && npm run build'
            }
          }
        }
        stage('Backend build') {
          steps {
            dir("${BACKEND_DIR}") {
              sh 'npm run typecheck && npm run build'
            }
          }
        }
      }
    }

    stage('Docker compose build') {
      steps {
        dir("${APP_DIR}") {
          sh 'docker compose -f docker-compose.yml build'
        }
      }
    }

    stage('Deploy') {
      when {
        branch 'main'
      }
      steps {
        script {
          if (env.DEPLOY_HOST?.trim() && env.DEPLOY_USER?.trim() && env.DEPLOY_PATH?.trim()) {
            echo "Deployment variables detected. Connect this stage to your remote host or registry."
          } else {
            echo "Deploy stage skipped: DEPLOY_HOST / DEPLOY_USER / DEPLOY_PATH not configured."
          }
        }
      }
    }
  }

  post {
    always {
      echo 'Pipeline completed.'
    }
  }
}
