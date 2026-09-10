import { FieldError, fieldErrors } from './FieldError.js';
import { ApiError } from '../api/client.js';

interface Props {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: ApiError | null;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  autoComplete?: string;
}

export function FormField({ label, name, type = 'text', value, onChange, error, ...rest }: Props) {
  return (
    <label>
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
      <FieldError messages={fieldErrors(error ?? null, `body/customer/${name}`)} />
    </label>
  );
}
