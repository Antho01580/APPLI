# -*- coding: utf-8 -*-
"""Rendu de la balance au format SECOGEST (geometrie mesuree sur le PDF d'origine)."""
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color

W, H = 595.2756, 841.8898
BLUE   = Color(0.12549, 0.470588, 0.67451)
ORANGE = Color(0.890196, 0.466667, 0.129412)
GREY   = Color(0.45, 0.45, 0.45)
SLATE  = Color(0.2, 0.26, 0.35)
BAND_A = Color(0.929412, 0.952941, 0.992157)
BAND_B = Color(0.956863, 0.976471, 0.992157)
RULE   = Color(0.60, 0.70, 0.82)
BL     = 0.793

VX  = [28.5, 99.0, 344.0, 360.0, 376.0, 440.0, 502.0, 566.5]
X_CPT, X_LIB = 32.0, 100.0
X_DEB, X_CRE, X_SLD = 438.0, 501.0, 565.0
Y_HDR_TOP, Y_HDR_BOT, Y_MAX = 110.0, 141.0, 780.0
H_ROW, H_TOT = 13.66, 27.0
# recapitulation
RVX = [28.5, 358.0, 428.0, 496.0, 566.5]
R_DEB, R_CRE, R_SLD = 426.0, 495.0, 564.0

def fr(v, blank_zero=True):
    if v is None: return ''
    if blank_zero and abs(v) < 0.005: return ''
    s = f'{abs(v):,.2f}'.replace(',', ' ').replace('.', ',')
    return ('-' + s) if v < 0 else s

class BAL:
    def __init__(self, path, societe='155984 - SARL WE-FORM', periode='Du 17/04/2025 au 31/07/2026',
                 pied='SECOGEST RHONE ET JURA', horo='05/09/2026 - 07:56',
                 sld_new='Sld 31/07/2026', sld_old='Sld 31/07/2025'):
        self.c = canvas.Canvas(path, pagesize=(W, H))
        self.societe, self.per, self.pied, self.horo = societe, periode, pied, horo
        self.sld_new, self.sld_old = sld_new, sld_old
        self.page = 0; self.titre = ''; self.edition = 'Edition Provisoire'
        self.mode = 'std'

    def _txt(self, x, top, s, font='Helvetica', size=8.2, color=None, align='l'):
        c = self.c; c.setFont(font, size); c.setFillColor(color or Color(0, 0, 0))
        y = H - top - BL * size
        (c.drawRightString if align == 'r' else c.drawCentredString if align == 'c' else c.drawString)(x, y, s)

    def _band(self, top, h, col, vx=None):
        vx = vx or VX
        self.c.setFillColor(col); self.c.rect(vx[0], H - top - h, vx[-1] - vx[0], h, stroke=0, fill=1)

    def _hline(self, top, lw=0.6, vx=None):
        vx = vx or VX
        self.c.setStrokeColor(RULE); self.c.setLineWidth(lw); self.c.line(vx[0], H - top, vx[-1], H - top)

    def new_page(self, titre, mode='std', edition='Edition Provisoire'):
        if self.page: self.c.showPage()
        self.page += 1; self.titre, self.mode, self.edition = titre, mode, edition
        self._txt(38.0, 37.2, self.societe, 'Helvetica', 9.8, BLUE)
        self._txt(W / 2, 55.7, titre, 'Helvetica', 14.2, ORANGE, 'c')
        self._hline(51.0, 0.8)
        if mode == 'std':
            self._txt(32.0, 100.2, edition, 'Helvetica', 9.8, BLUE)
            self._txt(W / 2, 100.2, self.per, 'Helvetica', 9.8, BLUE, 'c')
            self._txt(561.0, 100.2, 'Exprimé en euros', 'Helvetica', 9.8, BLUE, 'r')
            self._band(Y_HDR_TOP, Y_HDR_BOT - Y_HDR_TOP, BAND_A)
            self._hline(Y_HDR_TOP); self._hline(Y_HDR_BOT)
            self._txt(412.0, 114.5, self.sld_new, 'Helvetica-Bold', 8.2, BLUE)
            self._txt(X_CPT, 126.5, 'N° Compte', 'Helvetica-Bold', 8.2, BLUE)
            self._txt(X_LIB, 126.5, 'Intitulé', 'Helvetica-Bold', 8.2, BLUE)
            self._txt(352.0, 126.5, 'Rév.', 'Helvetica-Bold', 8.2, BLUE, 'c')
            self._txt(368.0, 126.5, 'Sup.', 'Helvetica-Bold', 8.2, BLUE, 'c')
            self._txt(408.0, 126.5, 'Débiteur', 'Helvetica-Bold', 8.2, BLUE, 'c')
            self._txt(471.0, 126.5, 'Créditeur', 'Helvetica-Bold', 8.2, BLUE, 'c')
            self._txt(534.25, 126.5, self.sld_old, 'Helvetica-Bold', 8.2, BLUE, 'c')
            self.y = Y_HDR_BOT; self.pending_gap = 0.97
        else:
            self._txt(32.0, 88.2, edition, 'Helvetica', 9.8, BLUE)
            self._txt(W / 2, 88.2, self.per, 'Helvetica', 9.8, BLUE, 'c')
            self._txt(561.0, 88.2, 'Exprimé en euros', 'Helvetica', 9.8, BLUE, 'r')
            self._band(98.0, 30.0, BAND_A, RVX)
            self._hline(98.0, 0.6, RVX); self._hline(128.0, 0.6, RVX)
            self._txt(400.0, 102.5, self.sld_new, 'Helvetica-Bold', 8.2, BLUE)
            self._txt(96.0, 114.5, 'Intitulé', 'Helvetica-Bold', 8.2, BLUE)
            self._txt(393.0, 114.5, 'Débiteur', 'Helvetica-Bold', 8.2, BLUE, 'c')
            self._txt(462.0, 114.5, 'Créditeur', 'Helvetica-Bold', 8.2, BLUE, 'c')
            self._txt(531.25, 114.5, self.sld_old, 'Helvetica-Bold', 8.2, BLUE, 'c')
            self.y = 128.0; self.pending_gap = 0.0
        self._hline(794.0, 0.6, [28.5, 566.5])
        self._txt(38.0, 798.9, self.pied, 'Helvetica', 9.0, GREY)
        self._txt(564.5, 798.9, f'Page - {self.page}', 'Helvetica', 9.0, GREY, 'r')
        self._txt(409.2, 800.4, self.horo, 'Helvetica', 7.0, GREY)

    def row(self, compte, intitule, debit, credit, sld_old=None):
        if self.y + H_ROW > Y_MAX: self.new_page(self.titre, self.mode, self.edition)
        self._txt(X_CPT, self.y + 3.7, str(compte), 'Helvetica', 8.2)
        self._txt(X_LIB, self.y + 4.2, intitule or '', 'Helvetica', 6.8)
        self._txt(X_DEB, self.y + 3.7, fr(debit), 'Helvetica', 8.2, SLATE, 'r')
        self._txt(X_CRE, self.y + 3.7, fr(credit), 'Helvetica', 8.2, SLATE, 'r')
        if sld_old is not None: self._txt(X_SLD, self.y + 3.7, fr(sld_old), 'Helvetica', 8.2, SLATE, 'r')
        self.y += H_ROW

    def total(self, label, debit, credit, net):
        if self.y + H_TOT > Y_MAX: self.new_page(self.titre, self.mode, self.edition)
        self.y += getattr(self, 'pending_gap', 0.0); self.pending_gap = 0.0
        self._band(self.y, H_TOT, BAND_B)
        self._txt(X_CPT, self.y + 4.0, label, 'Helvetica-Bold', 8.2, BLUE)
        self._txt(X_DEB, self.y + 4.0, fr(debit), 'Helvetica-Bold', 8.2, BLUE, 'r')
        self._txt(X_CRE, self.y + 4.0, fr(credit), 'Helvetica-Bold', 8.2, BLUE, 'r')
        x = X_DEB if (net or 0) >= 0 else X_CRE
        self._txt(x, self.y + 16.0, fr(abs(net) if net else 0), 'Helvetica', 8.2, BLUE, 'r')
        self.y += H_TOT

    def rtotal(self, label, debit, credit, net, side='d', extra=None):
        self._txt(X_CPT, self.y + 4.5, label, 'Helvetica-Bold', 8.2, BLUE)
        self._txt(R_DEB, self.y + 4.5, fr(debit), 'Helvetica-Bold', 8.2, BLUE, 'r')
        self._txt(R_CRE, self.y + 4.5, fr(credit), 'Helvetica-Bold', 8.2, BLUE, 'r')
        if net is not None:
            self._txt(R_DEB if side == 'd' else R_CRE, self.y + 16.5, fr(net), 'Helvetica', 8.2, BLUE, 'r')
        if extra: self._txt(40.0, self.y + 16.5, extra, 'Helvetica-Bold', 8.2, BLUE)
        self._hline(self.y, 0.6, RVX)
        self.y += 27.0

    def save(self): self.c.save()
