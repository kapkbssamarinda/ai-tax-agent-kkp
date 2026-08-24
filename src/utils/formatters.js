/**
 * Shared Number & Currency Formatters
 * Singleton instances — tidak instantiasi ulang setiap render.
 */

const _idFmt = new Intl.NumberFormat('id-ID');
const _idrFmt = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

/** Format angka dengan separator ribuan Indonesia (titik). */
export const fmtNumber = (n) => _idFmt.format(n ?? 0);

/** Format angka ke Rupiah (Rp 1.234.567). */
export const fmtRupiah = (n) => {
  if (n === null || n === undefined || isNaN(n)) return 'Rp 0';
  return _idrFmt.format(n);
};
