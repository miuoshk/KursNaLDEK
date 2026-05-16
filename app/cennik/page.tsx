import Link from "next/link";

export default function CennikPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <h1 className="font-heading text-heading-xl text-primary">Cennik</h1>
      <p className="mt-4 font-body text-body-md text-secondary">
        Wybór i zakup dostępu do konkretnego roku odbywa się w panelu wyboru. Możesz tam aktywować darmowy rok
        testowy albo przejść do płatności Stripe.
      </p>
      <Link
        href="/wybor-roku"
        className="mt-8 inline-flex w-fit rounded-btn bg-brand-gold px-5 py-2.5 font-body font-semibold text-brand-bg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
      >
        Przejdź do wyboru roku
      </Link>
    </div>
  );
}
