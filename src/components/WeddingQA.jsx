import SectionHeading from './SectionHeading.jsx';

const questions = [
  {
    question: 'Can I bring a guest or a date?',
    answer:
      'We’re keeping our wedding intimate so we can spend time with the people closest to us. With limited seating, plus-ones are reserved for our principal sponsors (ninongs and ninangs). For all other guests, please RSVP for the names listed on your invitation.',
  },
  {
    question: 'Are children invited?',
    answer:
      'We love your little ones, and we hope our wedding gives you a chance to relax, catch up, and enjoy the celebration with us. We’ve planned an adults-only wedding and appreciate you making arrangements for your little ones.',
  },
  {
    question: 'Are there any colors I should avoid wearing?',
    answer:
      'We kindly ask that you avoid wearing white, ivory, or cream, as these colors are traditionally reserved for the bride.',
  },
];

export default function WeddingQA() {
  return (
    <section className="paper-texture px-4 py-16 sm:py-24" aria-labelledby="wedding-qa-title">
      <div className="section-shell">
        <div id="wedding-qa-title">
          <SectionHeading eyebrow="GOOD TO KNOW" title="A few questions answered" />
        </div>
        <div className="mx-auto max-w-3xl divide-y divide-[#c5a15b]/35 border-y border-[#c5a15b]/35">
          {questions.map((item) => (
            <article key={item.question} className="bg-white/55 px-5 py-5 sm:px-7">
              <h3 className="font-display text-lg text-[#570b19]">{item.question}</h3>
              <p className="mt-3 text-sm leading-7 text-[#76665c]">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
