export function HelpPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
      <header>
        <h1 className="text-2xl font-extrabold text-primary">서비스 이용 방법</h1>
        <p className="mt-2 text-lg">Easy-Link를 이렇게 사용해요.</p>
      </header>

      <ol className="flex flex-col gap-5 text-lg leading-relaxed">
        <li>
          <strong className="text-primary">1단계.</strong> 쉬운 안내문으로 바꾸고 싶은 공공서비스
          웹페이지의 주소(URL)를 복사해요.
        </li>
        <li>
          <strong className="text-primary">2단계.</strong> "쉬운 안내문 만들기" 화면의 입력창에
          주소를 붙여넣고 버튼을 눌러요.
        </li>
        <li>
          <strong className="text-primary">3단계.</strong> 쉬운 말로 바뀐 안내문을 화면으로 읽거나,
          "소리로 듣기" 버튼을 눌러 들어요.
        </li>
        <li>
          <strong className="text-primary">4단계.</strong> 만든 안내문은 "내 정책 보관소"에 자동으로
          저장되어 나중에 다시 볼 수 있어요.
        </li>
      </ol>
    </main>
  );
}
