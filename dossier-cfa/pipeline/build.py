# -*- coding: utf-8 -*-
import io, json, os
d = os.path.dirname(os.path.abspath(__file__))
W = os.path.join(os.path.dirname(d), 'work')
rd = lambda f: io.open(os.path.join(d, f), encoding='utf-8').read()
data = io.open(os.path.join(W, 'data.json'), encoding='utf-8').read()
out = (rd('head.html') + '\n' + rd('body.html') +
       '\n<script>window.__DATA__=' + data + ';</script>\n<script>\n' +
       rd('app.js') + '\n' + rd('sections.js') + '\n</script>\n')
io.open(os.path.join(d, 'verification.html'), 'w', encoding='utf-8').write(out)
print('verification.html', round(len(out.encode())/1024), 'Ko')
