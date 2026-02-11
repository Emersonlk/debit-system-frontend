/**
 * Máscaras para campos de formulário
 */

/**
 * Aplica máscara de telefone: (11) 11111-1111 ou (11) 1111-1111
 * @param {string} value
 * @returns {string}
 */
export function maskPhone(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.replace(/(\d{2})/, '($1) ');
  if (digits.length <= 7) return digits.replace(/(\d{2})(\d+)/, '($1) $2');
  return digits.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
}

/**
 * Remove máscara de telefone (apenas dígitos)
 * @param {string} value
 * @returns {string}
 */
export function unmaskPhone(value) {
  if (!value) return '';
  return String(value).replace(/\D/g, '');
}

/**
 * Aplica máscara de valor em R$: R$ 1.000,00
 * Aceita string (dígitos) ou número (valor em reais, ex: 1000)
 * @param {string|number} value
 * @returns {string}
 */
export function maskMoney(value) {
  if (!value && value !== 0) return '';
  let digits = String(value).replace(/\D/g, '');
  if (!digits) {
    if (typeof value === 'number') digits = String(Math.round(value * 100));
    else return '';
  }
  if (!digits) return '';
  const num = parseInt(digits, 10);
  const cents = num % 100;
  const int = Math.floor(num / 100);
  const formatted = int.toLocaleString('pt-BR', { minimumFractionDigits: 0 }).replace(/\s/g, '.');
  return `R$ ${formatted},${String(cents).padStart(2, '0')}`;
}

/**
 * Converte valor numérico (da API) para string de input (dígitos em centavos)
 * Usado ao carregar valor no formulário
 * @param {number} value
 * @returns {string}
 */
export function moneyToInput(value) {
  if (value == null || value === '') return '';
  return String(Math.round(Number(value) * 100));
}

/**
 * Remove máscara de valor e retorna número para API
 * @param {string} value
 * @returns {number}
 */
export function unmaskMoney(value) {
  if (!value) return 0;
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}
