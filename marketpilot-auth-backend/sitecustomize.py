import sys
from pathlib import Path

# Add the project's 'src' directory to the module search path so that
# imports like `import app.schemas` resolve correctly.
SRC_DIR = Path(__file__).resolve().parent / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))
