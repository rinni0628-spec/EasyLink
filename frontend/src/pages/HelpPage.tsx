const STEPS = [
  {
    text: "쉬운 안내문으로 바꾸고 싶은 공공서비스 웹페이지의 주소(URL)를 복사해요.",
  },
  {
    text: '"쉬운 안내문 만들기" 화면의 입력창에 주소를 붙여넣고 버튼을 눌러요.',
  },
  {
    text: '쉬운 말로 바뀐 안내문을 화면으로 읽거나, "소리로 듣기" 버튼을 눌러 들어요.',
  },
  {
    text: '만든 안내문은 "내 정책 보관소"에 자동으로 저장되어 나중에 다시 볼 수 있어요.',
  },
];

export function HelpPage() {
  return (
    <main className="flex flex-col gap-6 px-5 py-6">
      <header className="card-sticker rounded-3xl bg-highlight px-6 py-6 text-center">
        <h1 className="text-2xl font-black text-ink">서비스 이용 방법</h1>
        <p className="mt-2 text-lg text-muted">Easy-Link를 이렇게 사용해요.</p>
      </header>

      <ol className="card-sticker flex flex-col gap-4 rounded-3xl p-5">
        {STEPS.map((step, index) => (
          <li key={step.text} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-4 border-ink bg-primary text-base font-black text-paper"
            >
              {index + 1}
            </span>
            <p className="pt-1 text-lg leading-relaxed text-ink">{step.text}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
