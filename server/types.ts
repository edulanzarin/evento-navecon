/** Formato de uma linha de `registrations` conforme lida do banco. */
export interface RegistrationRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company: string | null;
  amount_cents: number;
  status: string;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  payment_method: string | null;
  installments: number | null;
  paid_amount_cents: number | null;
  notified_paid: boolean;
}

/** Formata centavos como "R$ 1.899,00". */
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
