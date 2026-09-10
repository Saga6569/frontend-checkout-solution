import { formatMoney } from '../format.js';

export function Money({ value }: { value: number }) {
  return <>{formatMoney(value)}</>;
}
