module.exports = {
  apps: [{
    name: 'servetrack-backend',
    script: 'app.py',
    interpreter: '/root/SERVETRACK/backend/venv/bin/python3',
    cwd: '/root/SERVETRACK/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      FLASK_ENV: 'production',
      PYTHONUNBUFFERED: '1'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
};

