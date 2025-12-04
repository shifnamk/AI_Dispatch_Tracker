# Contributing to ServeTrack

Thank you for your interest in contributing to ServeTrack! We welcome contributions from everyone.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/servetrack.git
   cd servetrack
   ```
3. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development Setup

### Prerequisites
- Python 3.8+
- Node.js 18+
- MySQL 8.0+

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env
# Edit .env with your configuration
```

### Frontend Setup
```bash
cd frontend
npm install
cp env.example .env
# Edit .env if needed
```

### Database Setup
```bash
mysql -u root -p < backend/database_setup.sql
```

## 📝 Coding Standards

### Python (Backend)
- Follow [PEP 8](https://pep8.org/) style guide
- Use type hints where appropriate
- Write docstrings for functions and classes
- Maximum line length: 88 characters (Black formatter)

### JavaScript/React (Frontend)
- Use ESLint configuration provided
- Follow React best practices
- Use functional components with hooks
- Write meaningful component and variable names

### General Guidelines
- Write clear, descriptive commit messages
- Keep commits focused and atomic
- Add tests for new features
- Update documentation as needed

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
# Run full test suite
./scripts/run_tests.sh
```

## 📋 Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Ensure all tests pass** locally
4. **Update the README.md** if needed
5. **Create a Pull Request** with:
   - Clear title and description
   - Reference any related issues
   - Screenshots for UI changes

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No new warnings or errors

## 🐛 Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Relevant logs/screenshots

## 💡 Suggesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and include:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Alternative solutions considered

## 🏗️ Project Structure

```
servetrack/
├── backend/           # Flask API
├── frontend/          # React app
├── .github/          # GitHub templates
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## 📚 Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://reactjs.org/)
- [YOLO-World](https://github.com/AILab-CVC/YOLO-World)
- [Ultralytics](https://docs.ultralytics.com/)

## 🤝 Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## 📞 Getting Help

- [GitHub Discussions](https://github.com/YOUR_USERNAME/servetrack/discussions)
- [Issues](https://github.com/YOUR_USERNAME/servetrack/issues)
- Email: support@servetrack.com

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special thanks in documentation

Thank you for contributing to ServeTrack! 🚀
