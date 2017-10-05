import os
import os.path
import re
from itertools import chain

all_filenames = chain(*[[os.path.join(directory, filename)
                         for filename in filenames]
                        for directory, _, filenames in os.walk('.')])

html_filenames = filter(lambda filename: os.path.splitext(filename)[1]
                        in ['.html', '.htm', '.php'], all_filenames)

tags = set()
regular = re.compile(r'<([a-zA-Z_]+)(?: (?:.|\n)*?)?>', re.M)

for html_filename in html_filenames:
    with open(html_filename, 'rb') as html_file:
        html = html_file.read().decode('utf-8')
        tags.update(regular.findall(html))

print('Всего тегов: ', len(tags),
      '\nВ проекте используются следующие теги:\n', sorted(tags))
