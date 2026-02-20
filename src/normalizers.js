// ─── Shared normalization functions ──────────────────────────────────────────
// Used by both generate-report.js (server-side) and the browser (client-side).

function normGender(g) {
  if (!g) return null;
  if (g === 'Home') return 'Home';
  if (g === 'Dona') return 'Dona';
  return 'Altre';
}

function ageGroup(age) {
  if (!age) return null;
  if (age <= 20) return '18-20';
  if (age <= 25) return '21-25';
  if (age <= 30) return '26-30';
  if (age <= 35) return '31-35';
  if (age <= 40) return '36-40';
  return '41+';
}

function normRelationship(r) {
  if (!r) return null;
  var l = r.toLowerCase();
  if (l.includes('solter')) return 'Solter/a';
  if (l.includes('mon') || l.includes('estandar')) return 'Parella monògama';
  if (l.includes('oberta') || l.includes('liberal') || l.includes('pseudo')) return 'Parella oberta/liberal';
  if (l.includes('poliam')) return 'Relació poliamorosa';
  if (l.includes('etiquetes')) return 'Sense etiquetes';
  return 'Altre';
}

function normFrequency(f) {
  if (!f) return null;
  var l = f.toLowerCase();
  if (l.includes('sovint')) return 'Sovint';
  if (l.includes('fantasia')) return 'Fantasia recurrent';
  if (l.includes('puntual') || l.includes('alguna')) return 'Alguna vegada puntual';
  if (l === 'mai') return 'Mai';
  if (l.includes('plantejo')) return "No m'ho plantejo";
  return null;
}

function normTried(t) {
  if (!t) return null;
  var l = t.toLowerCase();
  if (l.includes('xit') || l.includes('èxit') || l.includes('exit')) return 'Sí, amb èxit';
  if (l.includes('no ha sortit') || (l.includes('s') && l.includes('per') && l.includes('no'))) return 'Sí, però no ha sortit bé';
  if (l.includes('agradaria')) return "No, però m'agradaria";
  if (l.includes('plantejo')) return "No m'ho plantejo";
  return null;
}

function normBarrier(b) {
  if (!b) return null;
  var l = b.toLowerCase();
  if (l.includes('natural') || l.includes('sortit de forma')) return 'No ha sortit de forma natural';
  if (l.includes('seguretat') && !l.includes('confian')) return 'Por a la seguretat';
  if (l.includes('vergonya') || l.includes('judici')) return 'Vergonya / judici social';
  if (l.includes('confian')) return 'Manca de confiança';
  if (l.includes('saber on') || l.includes('on buscar')) return 'No saber on buscar';
  if (l.includes('gelosia')) return 'Gelosia';
  if (l.includes('mala exp')) return 'Mala experiència prèvia';
  return null;
}

function normLookingFor(lf) {
  if (!lf) return null;
  var l = lf.toLowerCase();
  if (l.includes('indiferent') || l.includes('dep')) return 'Indiferent / Depèn';
  if (l.includes('solteres')) return 'Persones solteres';
  if (l.includes('parelles') || l.includes('arelles')) return 'Parelles';
  return null;
}

function normComposition(c) {
  if (!c) return null;
  var l = c.toLowerCase();
  if (l.includes('1 home + 2 dones') || l.includes('1 home +2 dones')) return '1 home + 2 dones';
  if (l.includes('2 homes + 1 dona') || l.includes('2 homes +1 dona')) return '2 homes + 1 dona';
  if (l.includes('3 persones') || l.includes('mateix g')) return '3 del mateix gènere';
  if (l.includes('4 persones') || l.includes('4+')) return '4+ persones';
  return null;
}

function normWhere(w) {
  if (!w) return null;
  var l = w.toLowerCase();
  if (l.includes('entorns')) return 'Entorns socials';
  if (l.includes('especialitzades')) return 'Apps especialitzades';
  if (l.includes('tradicionals')) return 'Apps de cites tradicionals';
  if (l.includes('no buscaria')) return 'No buscaria';
  if (l.includes('no s') && l.includes('on buscar')) return 'No sé on buscar';
  return null;
}

function normApp(a) {
  if (!a) return null;
  var l = a.toLowerCase();
  if (l.includes('segur') && (l.startsWith('s') || l.includes('si'))) return 'Sí segur';
  if (l.includes('potser') || l.includes('consensuat')) return 'Potser';
  if (l.includes('probablement no')) return 'Probablement no';
  if (l.includes('no') && !l.includes('potser') && !l.includes('probablement')) return 'No';
  return null;
}

function normPay(p) {
  if (!p) return null;
  var l = p.toLowerCase();
  if (l.includes('gratu') || l.includes('no pagaria')) return 'Només gratuïta';
  if (l.includes('molt baix')) return 'Preu molt baix';
  if (l.includes('depenent') || (l.includes('potser') && l.includes('preu'))) return 'Potser, depenent del preu';
  if (l.includes('segurament')) return 'Sí, segurament';
  return null;
}

function sorted(obj, desc) {
  if (desc === undefined) desc = true;
  return Object.entries(obj).sort(function(a, b) { return desc ? b[1] - a[1] : a[1] - b[1]; });
}

function pct(n, total) {
  if (!total) return 0;
  return Math.round(n / total * 100);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normGender, ageGroup, normRelationship, normFrequency, normTried,
    normBarrier, normLookingFor, normComposition, normWhere, normApp, normPay,
    sorted, pct
  };
}
