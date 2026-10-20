import { test } from 'node:test';
import assert from 'node:assert/strict';
import { novaHra, odpovez, aktualniZastaveni, klicUloziste, uloz, nacti } from '../site/js/hra.js';

const trasa = {
  id: 't1',
  zastaveni: [
    { id: 'a', ukol: { typ: 'cislo' } },
    { id: 'b', ukol: { typ: 'foto' } },
    { id: 'c', ukol: { typ: 'text' } },
  ],
};

function fakeUloziste() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

test('novaHra začíná na indexu 0, nedokončená', () => {
  assert.deepEqual(novaHra(trasa), { trasaId: 't1', index: 0, odpovedi: {}, dokonceno: false });
});

test('odpovez posune na další zastavení a nezmění původní stav', () => {
  const s0 = novaHra(trasa);
  const s1 = odpovez(s0, trasa, ' 42 ');
  assert.equal(s1.index, 1);
  assert.deepEqual(s1.odpovedi, { a: '42' });
  assert.equal(s0.index, 0);
  assert.deepEqual(s0.odpovedi, {});
  assert.equal(aktualniZastaveni(s1, trasa).id, 'b');
});

test('po třetí odpovědi je dokonceno a aktualniZastaveni je null', () => {
  let s = novaHra(trasa);
  s = odpovez(s, trasa, '1');
  s = odpovez(s, trasa, 'foto');
  s = odpovez(s, trasa, 'text');
  assert.equal(s.dokonceno, true);
  assert.equal(aktualniZastaveni(s, trasa), null);
  assert.deepEqual(s.odpovedi, { a: '1', b: 'foto', c: 'text' });
  assert.throws(() => odpovez(s, trasa, 'x'), /Hra je dokončená/);
});

test('prázdná odpověď je odmítnuta', () => {
  assert.throws(() => odpovez(novaHra(trasa), trasa, '   '), /Prázdná odpověď/);
});

test('uloz + nacti vrátí stejný stav', () => {
  const u = fakeUloziste();
  const s = odpovez(novaHra(trasa), trasa, '7');
  uloz(u, 'k', s);
  assert.deepEqual(nacti(u, 'k', trasa), s);
});

test('nacti s prázdným úložištěm, rozbitým JSON nebo jiným trasaId vrátí null', () => {
  const u = fakeUloziste();
  assert.equal(nacti(u, 'k', trasa), null);
  u.setItem('k', '{rozbite');
  assert.equal(nacti(u, 'k', trasa), null);
  uloz(u, 'k', { trasaId: 'jina', index: 0, odpovedi: {}, dokonceno: false });
  assert.equal(nacti(u, 'k', trasa), null);
});

test('nacti vrátí null pro strukturálně neplatný stav', () => {
  const u = fakeUloziste();
  for (const s of [
    { trasaId: 't1', index: 5, odpovedi: {}, dokonceno: false },
    { trasaId: 't1', index: -1, odpovedi: {}, dokonceno: false },
    { trasaId: 't1', index: 0, odpovedi: null, dokonceno: false },
    { trasaId: 't1', index: 0, odpovedi: [], dokonceno: false },
    null,
  ]) {
    u.setItem('k', JSON.stringify(s));
    assert.equal(nacti(u, 'k', trasa), null);
  }
  u.setItem('k', JSON.stringify({ trasaId: 't1', index: 3, odpovedi: {}, dokonceno: true }));
  assert.notEqual(nacti(u, 'k', trasa), null);
});

test('uloz a nacti nehází, když úložiště vyhazuje výjimky', () => {
  const u = {
    getItem() { throw new Error('x'); },
    setItem() { throw new Error('x'); },
  };
  assert.doesNotThrow(() => uloz(u, 'k', novaHra(trasa)));
  assert.equal(nacti(u, 'k', trasa), null);
});

test('demo a ostrý režim mají různý klíč', () => {
  assert.equal(klicUloziste('t1', false), 'horice-hra:t1');
  assert.equal(klicUloziste('t1', true), 'horice-hra:t1:demo');
});
