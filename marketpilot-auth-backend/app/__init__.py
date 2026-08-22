import sys
from pathlib import Path

# Ensure the project's 'src' directory is on the import path so that
# imports like `import app.schemas` resolve to the package under src.
PROJECT_ROOT = Path(__file__).resolve().parent
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))
