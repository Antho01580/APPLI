# -*- coding: utf-8 -*-
"""Rendu du grand-livre au format SECOGEST (geometrie mesuree sur le PDF d'origine)."""
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
from reportlab.pdfbase.pdfmetrics import stringWidth

W, H = 595.2756, 841.8898
BLUE   = Color(0.12549, 0.470588, 0.67451)
ORANGE = Color(0.890196, 0.466667, 0.129412)
GREY   = Color(0.45, 0.45, 0.45)
BAND_A = Color(0.929412, 0.952941, 0.992157)   # bandeau entete / Total
BAND_B = Color(0.956863, 0.976471, 0.992157)   # bandeau Compte
RULE   = Color(0.60, 0.70, 0.82)

VX   = [28.8, 66.5, 125.7, 157.7, 353.5, 414.3, 437.0, 497.5, 566.2]
X_DEB, X_CRE, X_SOL = 413.0, 496.5, 559.0
X_DATE, X_PIECE, X_JNL, X_LIB, X_LET = 30.5, 68.0, 138.0, 160.0, 416.0
Y_TOP_RULE, Y_HDR_TOP, Y_HDR_BOT = 50.4, 98.8, 112.6
Y_FOOT_RULE, Y_MAX = 794.0, 781.0
H_COMPTE, H_ROW, H_TOTAL, GAP = 14.4, 13.66, 13.1, 2.8
DY_COMPTE, DY_AMT, DY_TXT, DY_PIECE, DY_TOTAL, DY_WRAP = 3.5, 3.4, 3.85, 4.3, 3.0, 8.6
LIB_W = 353.5 - X_LIB - 1.0

def fr(v, blank_zero=True):
    if v is None: return ''
    if blank_zero and abs(v) < 0.005: return ''
    s = f'{abs(v):,.2f}'.replace(',', ' ').replace('.', ',')
    return ('-' + s) if v < 0 else s

def wrap(txt, font, size, width):
    out, cur = [], ''
    for word in (txt or '').split():
        t = (cur + ' ' + word).strip()
        if stringWidth(t, font, size) <= width or not cur: cur = t
        else: out.append(cur); cur = word
    if cur: out.append(cur)
    return out or ['']

class GL:
    def __init__(self, path, titre, societe='155984 - SARL WE-FORM',
                 periode='Du 17/04/2025 au 31/07/2026', edition='Edition provisoire',
                 pied='SECOGEST RHONE ET JURA', horodatage='05/09/2026 - 07:56', surtitre=None):
        self.c = canvas.Canvas(path, pagesize=(W, H))
        self.titre, self.societe, self.periode = titre, societe, edition + ' ' + periode
        self.edition, self.per = edition, periode
        self.pied, self.horo, self.surtitre = pied, horodatage, surtitre
        self.page = 0; self.y = None; self.rules_from = None
        self._new_page()

    def _txt(self, x, top, s, font='Helvetica', size=7.0, color=None, align='l'):
        c = self.c; c.setFont(font, size); c.setFillColor(color or Color(0, 0, 0))
        BL = 0.793 * size
        if align == 'r':   c.drawRightString(x, H - top - BL, s)
        elif align == 'c': c.drawCentredString(x, H - top - BL, s)
        else:              c.drawString(x, H - top - BL, s)

    def _band(self, top, h, col):
        self.c.setFillColor(col); self.c.rect(VX[0], H - top - h, VX[-1] - VX[0], h, stroke=0, fill=1)

    def _hline(self, top, lw=0.6, col=None):
        self.c.setStrokeColor(col or RULE); self.c.setLineWidth(lw)
        self.c.line(VX[0], H - top, VX[-1], H - top)

    def _close_rules(self, to_top):
        if self.rules_from is None: return
        self.c.setStrokeColor(RULE); self.c.setLineWidth(0.5)
        for x in VX: self.c.line(x, H - self.rules_from, x, H - to_top)
        self.rules_from = None

    def _new_page(self):
        if self.page: self.c.showPage()
        self.page += 1; c = self.c
        if self.surtitre: self._txt(W / 2, 28.4, self.surtitre, 'Helvetica', 9.0, ORANGE, 'c')
        self._txt(38.0, 37.4, self.societe, 'Helvetica', 9.0, BLUE)
        self._txt(W / 2, 55.9, self.titre, 'Helvetica', 14.0, ORANGE, 'c')
        self._hline(Y_TOP_RULE, 0.8)
        self._txt(32.0, 87.9, self.edition, 'Helvetica', 9.0, BLUE)
        self._txt(W / 2, 87.9, self.per, 'Helvetica', 9.0, BLUE, 'c')
        self._txt(564.0, 87.9, 'Exprimé en euros', 'Helvetica', 9.0, BLUE, 'r')
        self._band(Y_HDR_TOP, Y_HDR_BOT - Y_HDR_TOP, BAND_A)
        self._hline(Y_HDR_TOP); self._hline(Y_HDR_BOT)
        for x, lab in ((X_DATE + 1.5, 'Date'), (X_PIECE, 'Pièce'), (X_JNL - 2, 'Jnl'), (X_LIB, 'Libellé compte')):
            self._txt(x, 102.6, lab, 'Helvetica-Bold', 7.5, BLUE)
        self._txt(399.0, 102.6, 'Débit', 'Helvetica-Bold', 7.5, BLUE, 'r')
        self._txt(X_LET, 102.6, 'Let.', 'Helvetica-Bold', 7.5, BLUE)
        self._txt(482.0, 102.6, 'Crédit', 'Helvetica-Bold', 7.5, BLUE, 'r')
        self._txt(542.0, 102.6, 'Solde', 'Helvetica-Bold', 7.5, BLUE, 'r')
        self._hline(Y_FOOT_RULE, 0.6)
        self._txt(38.0, 798.9, self.pied, 'Helvetica', 9.0, GREY)
        self._txt(564.0, 798.9, f'Page - {self.page}', 'Helvetica', 9.0, GREY, 'r')
        self._txt(409.2, 800.4, self.horo, 'Helvetica', 7.0, GREY)
        self.y = 118.0

    def _need(self, h):
        if self.y + h > Y_MAX:
            self._close_rules(self.y); self._new_page(); return True
        return False

    def compte(self, code, intitule, suite=False):
        self._band(self.y, H_COMPTE, BAND_B)
        self._txt(32.0, self.y + DY_COMPTE, 'Compte', 'Helvetica-Bold', 8.5)
        self._txt(69.0, self.y + DY_COMPTE + 0.4, str(code), 'Helvetica-Bold', 8.0)
        self._txt(146.0, self.y + DY_COMPTE + 0.4, intitule + (' (Suite)' if suite else ''), 'Helvetica-Bold', 8.0)
        self.y += H_COMPTE; self.rules_from = self.y

    def row(self, date, piece, jnl, libelle, debit, credit, solde, lettrage=''):
        lines = wrap(libelle, 'Helvetica', 7.0, LIB_W)
        h = H_ROW + DY_WRAP * (len(lines) - 1)
        if self.y + h > Y_MAX:
            self._close_rules(self.y); code, lib = self._cur; self._new_page(); self.compte(code, lib, suite=True)
        self._txt(X_DATE, self.y + DY_TXT, date or '', 'Helvetica', 7.0)
        if piece: self._txt(X_PIECE, self.y + DY_PIECE, piece, 'Helvetica', 6.0)
        self._txt(X_JNL, self.y + DY_TXT, jnl or '', 'Helvetica', 7.0)
        for i, ln in enumerate(lines):
            self._txt(X_LIB, self.y + DY_TXT + i * DY_WRAP, ln, 'Helvetica', 7.0)
        self._txt(X_DEB, self.y + DY_AMT, fr(debit), 'Helvetica', 7.6, align='r')
        if lettrage: self._txt(X_LET, self.y + DY_AMT, lettrage, 'Helvetica', 7.6)
        self._txt(X_CRE, self.y + DY_AMT, fr(credit), 'Helvetica', 7.6, align='r')
        self._txt(X_SOL, self.y + DY_AMT, fr(solde, blank_zero=False), 'Helvetica', 7.6, align='r')
        self.y += h

    def total(self, debit, credit, solde, label='Total'):
        self._need(H_TOTAL); self._close_rules(self.y)
        self._band(self.y, H_TOTAL, BAND_A)
        self._txt(229.0, self.y + DY_TOTAL, label, 'Helvetica-Bold', 8.0, BLUE)
        self._txt(X_DEB, self.y + DY_TOTAL + 0.3, fr(debit), 'Helvetica-Bold', 7.6, BLUE, 'r')
        self._txt(X_CRE, self.y + DY_TOTAL + 0.3, fr(credit), 'Helvetica-Bold', 7.6, BLUE, 'r')
        self._txt(X_SOL, self.y + DY_TOTAL + 0.3, fr(solde, blank_zero=False), 'Helvetica-Bold', 7.6, BLUE, 'r')
        self.y += H_TOTAL + GAP

    def bloc(self, code, intitule, rows):
        self._need(H_COMPTE + H_ROW)
        self._cur = (code, intitule)
        self.compte(code, intitule)
        d = c = 0.0; s = 0.0
        for r in rows:
            s = round(s + (r.get('debit') or 0) - (r.get('credit') or 0), 2)
            d += r.get('debit') or 0; c += r.get('credit') or 0
            self.row(r.get('date'), r.get('piece'), r.get('jnl'), r.get('libelle'),
                     r.get('debit'), r.get('credit'), r.get('solde', s), r.get('lettrage', ''))
        self.total(round(d, 2), round(c, 2), round(d - c, 2))
        return round(d, 2), round(c, 2)

    def save(self):
        self._close_rules(self.y); self.c.save()
