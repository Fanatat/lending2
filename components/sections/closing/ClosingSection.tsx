import RevealOnScroll from "@/components/effects/RevealOnScroll";

const TELEGRAM_URL = "https://t.me/fanatat";

export default function ClosingSection() {
  return (
    <section
      id="closing"
      className="border-t border-line px-6 py-24 sm:px-10 md:px-16"
    >
      <div className="mx-auto max-w-2xl">
        <RevealOnScroll index={0}>
          <h2 className="text-2xl text-fg-primary sm:text-3xl">
            Содержание инфраструктуры: 2000 рублей в месяц
          </h2>
        </RevealOnScroll>

        <RevealOnScroll index={1}>
          <p className="mt-6 text-sm leading-relaxed text-fg-primary/90 sm:text-base">
            Арендованный сервер: 300 рублей. Сторонний прокси: 200 рублей.
            Подписка на нейросеть, которая всё это разрабатывает и
            обслуживает: 1500 рублей. Больше не понадобилось.
          </p>
        </RevealOnScroll>

        <RevealOnScroll index={2}>
          <p className="mt-4 text-sm leading-relaxed text-fg-primary/90 sm:text-base">
            Я делаю системы, и иногда могу чересчур погрузиться в них. Чтобы
            лишний раз потом не ходить в поликлинику, за моей комнатой следит
            HP100. А чтобы всё это работало — нужно 2000 рублей в месяц.
          </p>
        </RevealOnScroll>

        <RevealOnScroll index={3}>
          <p className="mt-4 text-sm leading-relaxed text-fg-primary/90 sm:text-base">
            Я не беру заказы. Я беру задачи, которые мне искренне интересно
            решить — в этом залог моего творчества. Если у вас есть такая
            задача и понимание её ценности — напишите. Я посмотрю, стоит ли
            её решать. И если да — заберу вашу проблему и передам вам
            работающий механизм.
          </p>
        </RevealOnScroll>

        <RevealOnScroll index={4}>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="interactive"
            className="mt-8 inline-block border border-accent px-6 py-3 text-sm text-accent transition-[filter] duration-200 hover:[filter:drop-shadow(0_0_6px_var(--accent))]"
          >
            Написать в Telegram
          </a>
        </RevealOnScroll>
      </div>
    </section>
  );
}
