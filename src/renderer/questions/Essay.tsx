import fields from './fields.module.css';

export default function Essay({
  text,
  checked,
  onChange,
}: {
  text: string;
  checked: boolean;
  onChange: (text: string) => void;
}) {
  return (
    <textarea
      className={fields.textarea}
      aria-label="Odgovor"
      placeholder="Tukaj zapiši svoj odgovor …"
      value={text}
      disabled={checked}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
