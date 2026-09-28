"""Проверка синтаксиса всех JS-файлов лаборатории (esprima).

Запуск:  .venv\\Scripts\\python tools\\jscheck.py
"""
import glob
import os
import sys

import esprima


def main() -> int:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    files = sorted(glob.glob(os.path.join(root, "js", "*.js")))
    bad = 0
    for f in files:
        try:
            with open(f, encoding="utf-8") as fh:
                esprima.parseScript(fh.read(), loc=True)
            print("OK   %s" % os.path.basename(f))
        except Exception as exc:  # noqa: BLE001
            bad += 1
            print("FAIL %s -> %s" % (os.path.basename(f), exc))
    print("-" * 40)
    print("файлов: %d, с ошибками: %d" % (len(files), bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
