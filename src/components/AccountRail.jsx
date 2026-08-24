import React from 'react';

// "Account rail" — elemen tanda tangan workbench: daftar akun (COA) yang bisa
// diklik untuk memfilter tabel ke satu akun. Menggantikan dropdown "Semua Akun".
// Di layar sempit (<768px) rail disembunyikan dan digantikan <select> mobile
// (keduanya dirender di sini; CSS yang mengatur visibilitas).
function AccountRail({ accounts, totalRows, selected, onSelect }) {
  return (
    <>
      <nav className="account-rail" aria-label="Navigasi akun">
        <div className="rail-heading" id="rail-heading">Akun</div>
        <ul className="rail-list" aria-labelledby="rail-heading">
          <li>
            <button
              className={`rail-item ${selected === null ? 'is-active' : ''}`}
              aria-current={selected === null ? 'true' : undefined}
              onClick={() => onSelect(null)}
            >
              <span className="rail-item-name">Semua akun</span>
              <span className="rail-item-count">{new Intl.NumberFormat('id-ID').format(totalRows)}</span>
            </button>
          </li>
          {accounts.map(acc => (
            <li key={acc.nama}>
              <button
                className={`rail-item ${selected === acc.nama ? 'is-active' : ''}`}
                aria-current={selected === acc.nama ? 'true' : undefined}
                onClick={() => onSelect(acc.nama)}
                title={`${acc.coa} — ${acc.nama}`}
              >
                <span className="rail-item-coa">{acc.coa}</span>
                <span className="rail-item-name">{acc.nama}</span>
                <span className="rail-item-count">{new Intl.NumberFormat('id-ID').format(acc.count)}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="account-rail-mobile">
        <label className="rail-mobile-label" htmlFor="rail-mobile-select">Akun</label>
        <select
          id="rail-mobile-select"
          className="rail-mobile-select"
          value={selected ?? ''}
          onChange={(e) => onSelect(e.target.value === '' ? null : e.target.value)}
        >
          <option value="">Semua akun ({new Intl.NumberFormat('id-ID').format(totalRows)})</option>
          {accounts.map(acc => (
            <option key={acc.nama} value={acc.nama}>
              {acc.coa} — {acc.nama} ({acc.count})
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

export default AccountRail;
