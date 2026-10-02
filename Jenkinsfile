pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    APP_DIR = "webkitsunova_proyecto"
    COMPOSE_FILE = "webkitsunova_proyecto/docker-compose.yml"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install dependencies') {
      steps {
        dir("${APP_DIR}") {
          sh 'npm ci'
        }
      }
    }

    stage('Generate Prisma client') {
      steps {
        dir("${APP_DIR}") {
          sh 'npx prisma generate'
        }
      }
    }

    stage('Typecheck') {
      steps {
        dir("${APP_DIR}") {
          sh 'npm run typecheck'
        }
      }
    }

    stage('Tests') {
      steps {
        dir("${APP_DIR}") {
          sh 'npm test'
        }
      }
    }

    stage('Build') {
      steps {
        dir("${APP_DIR}") {
          sh 'npm run build'
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
