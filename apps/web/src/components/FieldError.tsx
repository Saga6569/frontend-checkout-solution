import { ApiError } from '../api/client.js';

export function fieldErrors(error: ApiError | null, prefix: string): string[] {
  if (!error?.fields) return [];
  return error.fields.filter((f) => f.path.startsWith(prefix)).map((f) => f.message);
}

export function FieldError({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  return <span className="field-error">{messages[0]}</span>;
}
