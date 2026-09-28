# -*- coding: utf-8 -*-
"""Проверка текстов проекта: символы CJK, латиница внутри русских слов,
двоения и пустые строки в подписях."""
import glob
import re
import sys

CJK = re.compile(r'[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\uf900-\ufaff\uff00-\uffef]')
LAT_IN_CYR = re.compile(r'[а-яё]{2,}[a-zA-Z]{1,}[а-яё]{2,}')
CYR_IN_LATEX = re.compile(r'\\[a-zA-Z]+\u00a0')


def main():
    bad = 0
    files = sorted(glob.glob('js/*.js')) + ['index.html', 'css/styles.css']
    for f in files:
        text = open(f, encoding='utf-8').read()
        for i, line in enumerate(text.splitlines(), 1):
            hits = []
            if CJK.search(line):
                hits.append('CJK: ' + ''.join(sorted(set(CJK.findall(line)))))
            m = LAT_IN_CYR.search(line)
            if m and 'http' not in line:
                hits.append('латиница в слове: ' + m.group(0))
            if hits:
                bad += 1
                print('%s:%d  %s' % (f, i, ' | '.join(hits)))
                print('    ' + line.strip()[:160])
    print('-' * 40)
    print('всего проблемных строк: %d' % bad)
    return 0


if __name__ == '__main__':
    sys.exit(main())
