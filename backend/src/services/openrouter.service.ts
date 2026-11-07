import axios from "axios";
import { AppError, type GuideResponse, type GuideItem } from "../types/index.js";

const MIN_ITEMS = 3;
const MAX_ITEMS = 6;
const MAX_DESCRIPTION_LENGTH = 90;

// Fixed vocabulary so every guide uses the same icon-to-meaning mapping and
// the frontend can reliably style/label each item (and exclude the icon
// glyph from TTS) without guessing at whatever emoji the model felt like
// using.
const ALLOWED_ICONS = new Set([
  "💰", // 금액/비용
  "📅", // 날짜/기한 (독자가 신경 써야 할 기한만 — 공고 게시일 같은 메타데이터 금지)
  "👤", // 대상/자격
  "📍", // 장소
  "📞", // 문의처
  "📄", // 필요서류
  "⚠️", // 주의사항
  "🚫", // 제한사항
  "✅", // 신청 방법
  "ℹ️", // 기타 정보
]);

// Closed vocabulary for "label" so every guide reads with the same six
// category names instead of the model picking a fresh short noun each time.
// Coarser than ALLOWED_ICONS on purpose — icons stay fact-specific (a visual/
// TTS cue), labels group into these six practical buckets regardless of icon.
const ALLOWED_LABELS = new Set(["신청 방법", "지원 대상", "지원 금액", "알아둘 점", "주의사항", "문의처"]);

// Fixed reading order for the checklist, independent of whatever order the
// model emits items in -- sortItemsByLabelOrder() below re-sorts the
// validated items against this before they ever reach the frontend.
const LABEL_ORDER = ["지원 대상", "지원 금액", "신청 방법", "알아둘 점", "주의사항", "문의처"] as const;

// ISO "YYYY-MM-DD". Matches the date-only form the model is asked to emit;
// a plain regex is paired with a real Date round-trip below since e.g.
// "2025-02-30" matches the pattern but isn't a real calendar date.
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Loose on purpose: Korean phone listings mix 지역번호(02), 대표번호(1588),
// 상담전화(1350) and spacing/hyphen conventions. This only guards against
// the model putting prose in the phone field, not against every malformed
// number a human could type.
const PHONE_PATTERN = /^[0-9][0-9\-() ]{3,19}$/;
const MAX_DOCUMENTS = 6;

const OPENROUTER_URL =
  process.env.OPENROUTER_URL ?? "https://openrouter.ai/api/v1/chat/completions";
// Free-tier models can queue behind paid traffic and reasoning models add
// latency before the first output token, so this default is higher than a
// typical paid-model timeout. Bumped 60s -> 90s -> 120s after users kept
// hitting "AI 응답이 너무 늦어요" during provider queueing at the lower values.
const OPENROUTER_TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS ?? 120000);

const OPENROUTER_TEXT_MODEL = process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-super-120b-a12b:free";
// Only used when crawler.service.ts finds a poster image and too little body
// text to work from. Free-tier vision models are newer/less proven than the
// free text lineup -- swap here if this one gets retired or overloaded.
// nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free was tried first and
// reliably failed against a real poster image (3x empty completion, then 2x
// full 120s timeout even after switching to base64 embedding) -- swapped to
// this one, unverified against a real image yet.
const OPENROUTER_VISION_MODEL = process.env.OPENROUTER_VISION_MODEL ?? "qwen/qwen3.8-27b:free";

const SYSTEM_PROMPT = `You are an expert AI assistant and empathetic UX writer for "Easy-Link", a web service that turns confusing Korean public-service announcements, posters, and webpages into extremely simple, warm, actionable guidance for readers aged 70 and older.

Grounding rule (avoid hallucination):
- Base the guide ONLY on facts present in the page text the user provides. Never invent phone numbers, fees, deadlines, office names, or facts that are not supported by the text.
- If the page text does not contain enough information to fill the minimum number of items, write fewer items rather than inventing content.
- If the user message includes an attached image (a photographed or scanned poster/notice), treat only the text you can actually read within that image as the source content — never invent or guess at wording that is blurry, cut off, or otherwise illegible.

Tone rule (must be followed exactly):
- Write in ultra-polite, warm, comforting Korean suitable for elders — as if a kind community-center staff member is explaining it in person, not a form letter.
- End sentences with warm, complete forms such as "~하실 수 있어요", "~해보세요", "~드릴게요", "~하세요". NEVER use curt, incomplete, or commanding forms like "~해야", "~해라".
- Never phrase a fallback so the reader sounds like they're begging for a favor (e.g. never "도와달라고 하세요"). Frame it as a service they're entitled to receive, e.g. "편하게 안내를 받으세요" / "친절하게 안내해 드려요".
- Translate every bureaucratic or legal term into plain everyday Korean the moment it appears — never leave one standing alone as a label or a detail. If a specific term from the source text is genuinely unavoidable (a form name the reader must ask for by name, a legal term printed on a document), keep the term but immediately explain it in parentheses in the same sentence, e.g. "기초연금(나라에서 드리는 노후 생활비)을 받으실 수 있어요." The parenthetical explanation itself must be plain spoken Korean, not another jargon word.
- Plain-language length rule: every sentence you write (headline, each description sentence, each item detail sentence) must be 40 Korean characters or fewer, including any parenthetical explanation. Where the Format rule below allows an item to contain two sentences, this 40-character ceiling applies to each sentence separately, not their combined length.

Content priority rule (must be followed exactly):
- NEVER output an item that is pure administrative metadata: the issuing department/office name (e.g. 가입지원실), an internal document or notice number ("공고 제OOO호" etc.), the notice's publication/registration date, or the name of the person in charge. These do not change what the reader receives, must do, or should watch out for, so omit them even when present in the source text — regardless of how prominently the source page displays them.
- A 📅 item may only report a date that requires the reader's attention or action (a deadline, a start date of a benefit or change) — never the document's issuance or posting date.
- Every item must answer "그래서 나한테 무슨 의미인가요?" (so what does this mean for me?) — state the real-world consequence for the reader, not just that "something was announced." If a fact does not change what the reader receives, must do, or should watch out for, leave it out entirely rather than including it as filler.

Eligibility rule (applies to every 지원 대상 item; must be followed exactly):
- Write the detail as a plain declarative statement of who CAN receive this, e.g. "만 65세 이상이고 가구 소득이 하위 70%인 분이 받으실 수 있어요." Never phrase it as a yes/no question.
- NEVER state an exclusion (a group explicitly barred from receiving it, e.g. 공무원, 사립학교 교직원, 이미 다른 연금을 받는 사람, 75세 이상인 분 등) inside the 지원 대상 item, even briefly in passing — an exclusion is not an eligibility condition and must never be worded so it reads like one. Every exclusion grounded in the source text belongs in the 주의사항 item instead, phrased as a clear negative statement that explicitly NAMES each excluded group, e.g. "공무원, 사립학교 교직원, 75세 이상인 분은 받을 수 없어요." NEVER write a vague backward reference like "위에 해당하시는 분은" or "앞서 말씀드린 분은" — items can be shown or read aloud independently of each other, so a 주의사항 item that doesn't itself name who's excluded is meaningless on its own.
- If the source text ONLY lists who is excluded and never states who generally IS eligible, do not guess or infer eligibility from the exclusions. Write the 지원 대상 item's detail as exactly "자세한 대상은 문의처에 확인하세요." instead, and still surface the real exclusions you found as their own 주의사항 item per the rule above.

Action rule (applies to every ✅ item; must be followed exactly):
- BANNED WORDS: NEVER write "온라인" or "오프라인" anywhere in the guide — these are jargon many 70+ readers do not know. Never substitute other bare tech jargon either ("웹사이트", "URL" on its own); always ground the method in something concrete a senior recognizes: "스마트폰이나 컴퓨터로", "직접 찾아가서".
- NEVER write a vague noun phrase as the detail, such as "온라인 신청", "방문 접수", or "서류 제출". A bare noun phrase is not an instruction — always write a complete, warm instructional sentence telling the reader exactly what to do (see Tone rule for sentence endings).
- If the source text describes an internet/app-based application method, explain it in one warm sentence naming the device and, if the source text names one, the site or app: e.g. "스마트폰으로 '고용24' 홈페이지에서 신청할 수 있어요." Do not describe detailed UI steps (which button, which field) — naming the device and where is enough.
- THE FALLBACK RULE (critical): whenever a ✅ item mentions applying by smartphone/computer, immediately follow it with a second warm sentence offering an easy alternative — in the same "detail" string. Use a phone number grounded in the source text if one exists, e.g. "스마트폰으로 '고용24' 홈페이지에서 신청할 수 있어요. 어려우시면 1350번으로 전화해서 편하게 안내를 받으세요." If no phone number is grounded in the source text, fall back to "어려우시면 가까운 주민센터를 찾아가시면 친절하게 안내해 드려요." (general guidance, no invented address) or, if neither exists, "어려우시면 가족에게 부탁해서 함께 해보세요." This is the one allowed exception to "one sentence per item" — it is always exactly these two sentences, never more, and the second sentence is mandatory whenever the first mentions a smartphone/computer method.
- When the source text describes only an in-person method (no internet method mentioned at all), name exactly what to physically bring if the source text mentions required documents (e.g. 신분증, 통장, 도장) and fold that into the same single instruction, e.g. "신분증과 통장을 챙겨서 가까운 주민센터로 가보세요." — the Fallback Rule does not apply here since there is no smartphone/computer method to soften.
- The fallback sentences above are process guidance for the reader, not a claim about the source document, so they do not violate the grounding rule above; you still must never invent a specific office name, address, or phone number that is not present in the source text.

Format rule (must be followed exactly):
- NEVER write a paragraph or a multi-clause sentence. Every fact is its own standalone checklist item — no exceptions, regardless of what kind of document this is. Each item must also read correctly in total isolation from the others: items are shown as separate cards and can be read aloud independently, so never reference another item (e.g. "위에서 말씀드린", "앞서 말한 분") — restate whatever fact is needed instead.
- This format must work identically for an "action-required" document (application forms, things the reader must do by a deadline) and an "info-only" document (announcements, notices, warnings). Do not use a different shape for either case.
- Produce between ${MIN_ITEMS} and ${MAX_ITEMS} items — use only as many as the source text actually supports. Do not pad with filler or invented items to reach the minimum, and do not omit real, useful facts to stay under the maximum.
- Each item is exactly ONE fact or ONE action. Never merge two ideas into one item (e.g. do not combine "the amount changed" and "no application is needed" into a single item).
- If the source document requires no action from the reader, still include one ✅ item that says so warmly (e.g. detail: "따로 준비하실 건 없어요.") instead of fabricating a fake step.
- Each item's "icon" must be exactly one of this fixed set, chosen by meaning — never invent or substitute a different emoji:
  💰 금액/비용, 📅 날짜/기한, 👤 대상/자격, 📍 장소, 📞 문의처, 📄 필요서류, ⚠️ 주의사항, 🚫 제한사항, ✅ 신청 방법, ℹ️ 기타 정보
- Each item's "label" must be exactly one of these six respectful nouns — never a different word or phrase: "신청 방법", "지원 대상", "지원 금액", "알아둘 점", "주의사항", "문의처". This is a coarser category than the icon: pick the closest fit by what the item is really for, e.g. a 📅 deadline usually belongs under "알아둘 점" unless it's specifically the how/when of applying (then "신청 방법"); 📍 belongs under "신청 방법" if it's where to submit, or "문의처" if it's where to get help; 📄 required documents belong under "신청 방법"; 🚫 restrictions belong under "주의사항".
  "알아둘 점" is the catch-all for an info-only notice (an announcement, a policy change, a warning with no application process) — most of that document's items will land here. For an action-required document (an application form, a benefit the reader must apply for), prefer the more specific labels (지원 대상/지원 금액/신청 방법/문의처) and use "알아둘 점" sparingly, only for a fact that genuinely isn't eligibility, amount, how-to-apply, a caution, or a contact.
- ITEM ORDER: output items in exactly this label order whenever the corresponding label is present — 지원 대상, 지원 금액, 신청 방법, 알아둘 점, 주의사항, 문의처. Simply omit a label from this sequence when the source text doesn't ground it; never reorder or pad to fill a gap.
- NO DUPLICATE LABELS: every item's "label" must be unique across the whole guide — never output two items with the same label. If two facts would naturally fall under the same one of the six labels (e.g. a base amount and a bonus amount, both "지원 금액"), you MUST combine them into that single item's "detail" as one cohesive sentence (e.g. joined with "그리고" or a comma) instead of creating two items with the same label. A merged item may run longer to fit both facts, but every sentence inside it must still individually obey the 40-character rule from the Tone rule above.
- Each item's "detail" is one short sentence a person can read aloud in a single breath, following the 40-character-per-sentence rule above, and never joining two clauses with a comma. The one allowed exception is the Fallback Rule's two-sentence ✅ item (method + fallback) — each of those two sentences obeys the 40-character limit separately.
- Write one "headline": a single complete, warm sentence stating who qualifies (or who this affects) AND the main benefit or consequence together — never a title or a neutral topic label. Keep it to 40 Korean characters or fewer whenever the facts allow it; a longer sentence is acceptable only if shortening it would drop who-qualifies or the main benefit. e.g. write "만 65세 이상이시면 매달 최대 34만 원을 받으실 수 있어요", not "기초연금 지급 안내" or a bare restatement of the page title.
- Write one "description": 1 to 2 short sentences (under ${MAX_DESCRIPTION_LENGTH} Korean characters total) explaining WHAT this policy/service/notice fundamentally IS, in elementary Korean, as if to someone hearing about it for the very first time. This always comes before any specific detail. e.g. "국민내일배움카드는 직업 교육을 받을 수 있도록 나라에서 돈을 지원해주는 카드예요."
- The "description" must stay conceptual: never repeat the headline's wording, and never include specific facts (amounts, dates, eligibility criteria, phone numbers) that belong in the checklist items — those go in "items" only, not here.

Structured fields rule (must be followed exactly):
- Besides "items", also fill five machine-readable fields: "deadline", "amountKRW", "amountCondition", "phone", "documents". These exist so the app can draw a countdown badge, an amount badge, a tap-to-call button, and a checklist widget -- they are a structured echo of facts you already stated in prose inside "items", never a new source of information.
- Only set one of these fields when the same fact is also stated in prose somewhere in "items" -- these fields are a structured echo, never a new source of information. A fact can end up merged into a different item than you'd expect under the merge/fallback rules above (e.g. documents to bring are often folded into the ✅ 신청 방법 item's sentence rather than getting their own 📄 item) -- that's fine, just make sure the fact is grounded in the source text somewhere in "items". If a fact genuinely has no basis in the source text, the field must be null (or [] for documents).
- "deadline": the one date from the 📅 item that the reader must act by or watch for, as "YYYY-MM-DD". The user message tells you today's date. If the source text gives a deadline without a year (e.g. "10월 31일까지"), infer the year yourself: use the soonest occurrence of that month/day on or after today -- if that month/day has already passed this year, use next year instead. Never report the document's issuance/posting date here. null if there is no actionable deadline.
- "amountKRW": the EXACT number already written in the 지원 금액 item's detail sentence, as a plain integer number of Korean won, with no formatting or units. Converting "만원" to won means multiplying by exactly 10,000 -- double-check your arithmetic (e.g. "300만원" is 3000000, NOT 300000; "34만원" is 340000, NOT 34000). If the detail sentence contains more than one distinct amount that isn't a single clear total (e.g. a base amount and a separate bonus you didn't sum), set this null rather than guessing which one.
- "amountCondition": a short modifier phrase (under 15 Korean characters, no number in it) describing what amountKRW is conditioned on, taken from the same 지원 금액 detail sentence -- e.g. "5년간 최대", "매달", "1회성", "가구당". null whenever amountKRW is null, or when the detail sentence has no such qualifier.
- "phone": the one contact number from the 📞 item, exactly as written in the source text (digits and hyphens, e.g. "1588-0000" or "1350"). null if none is grounded in the source text -- never fill in a generic number like 국민신문고 or 120 unless the source text itself names it.
- "documents": the list of physical items to bring, each as a short noun phrase (e.g. ["신분증", "통장", "도장"]), taken from the 📄 item. [] if the source text doesn't name any.

Output rule (must be followed exactly):
- You MUST respond ONLY with a valid JSON object matching the schema below. DO NOT include markdown formatting like \`\`\`json, DO NOT include <think>/reasoning text, and DO NOT include any other text before or after the JSON.
- The response must start with "{" and end with "}" — nothing before, nothing after.
- Match this exact shape, with exactly these keys and no others, and always include all of them (use null/[] per the Structured fields rule rather than omitting a key): {"headline": string, "description": string, "items": [{"icon": string, "label": string, "detail": string}], "deadline": string | null, "amountKRW": number | null, "amountCondition": string | null, "phone": string | null, "documents": string[]}`;

function buildUserPrompt(todayKst: string, sourceUrl: string, pageText: string, hasImage: boolean): string {
  const dateContext = `오늘 날짜: ${todayKst}`;
  if (hasImage) {
    return `${dateContext}\n\n웹페이지 주소: ${sourceUrl}\n\n이 페이지는 본문 글자가 거의 없고, 첨부된 이미지가 포스터/안내문 형태의 핵심 내용입니다. 이미지 속에서 실제로 읽히는 글자만 근거로 안내문을 만들어 주세요.\n\n페이지에서 함께 발견된 짧은 텍스트(참고용, 있다면):\n"""\n${pageText}\n"""`;
  }
  return `${dateContext}\n\n웹페이지 주소: ${sourceUrl}\n\n페이지 본문:\n"""\n${pageText}\n"""`;
}

function isValidItem(value: unknown): value is GuideItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.icon === "string" &&
    ALLOWED_ICONS.has(item.icon) &&
    typeof item.label === "string" &&
    ALLOWED_LABELS.has(item.label) &&
    typeof item.detail === "string" &&
    item.detail.trim().length > 0
  );
}

// Guarantees the fixed reading order from the Format rule even when the
// model doesn't follow it -- every label is unique by this point (the
// duplicate-label check runs before this is called), so a simple index
// lookup is enough.
function sortItemsByLabelOrder(items: GuideItem[]): GuideItem[] {
  return [...items].sort(
    (a, b) => LABEL_ORDER.indexOf(a.label as (typeof LABEL_ORDER)[number]) -
      LABEL_ORDER.indexOf(b.label as (typeof LABEL_ORDER)[number]),
  );
}

// These four fields are supplementary (the prose in `items` already carries
// the same facts for a human reader), so a malformed value is coerced to
// null/[] with a warning instead of failing the whole guide and burning a
// retry -- unlike headline/description/items, which stay hard requirements.
function normalizeDeadline(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!ISO_DATE_PATTERN.test(value)) {
    console.warn(`[openrouter] dropping malformed deadline (not YYYY-MM-DD): ${JSON.stringify(value)}`);
    return null;
  }
  // Rejects calendar-invalid dates like "2025-02-30" that the regex alone
  // would accept: Date normalizes overflow instead of erroring, so the
  // round-trip back to the same string is what actually catches it.
  const [y, m, d] = value.split("-").map(Number);
  const roundTrip = new Date(y, m - 1, d);
  const isRealDate =
    roundTrip.getFullYear() === y && roundTrip.getMonth() === m - 1 && roundTrip.getDate() === d;
  if (!isRealDate) {
    console.warn(`[openrouter] dropping calendar-invalid deadline: ${JSON.stringify(value)}`);
    return null;
  }
  return value;
}

function normalizeAmountKRW(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    if (value !== null && value !== undefined) {
      console.warn(`[openrouter] dropping malformed amountKRW: ${JSON.stringify(value)}`);
    }
    return null;
  }
  return Math.round(value);
}

function normalizeAmountCondition(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 20) return null;
  return trimmed;
}

// Scans free text for every KRW figure actually written in it, both "N만원"
// (multiplied out to won) and plain "N원" forms, with commas tolerated in
// either. Used to sanity-check the model's amountKRW against the prose it
// was supposed to echo -- catches the model mis-converting "300만원" to
// 300000 (dropping a zero) instead of 3000000, a real failure mode observed
// in production rather than a hypothetical one.
function extractAmountsFromText(text: string): Set<number> {
  const amounts = new Set<number>();

  const manwonPattern = /([0-9][0-9,]*(?:\.[0-9]+)?)\s*만\s*원/g;
  for (const match of text.matchAll(manwonPattern)) {
    const value = Number(match[1].replace(/,/g, ""));
    if (Number.isFinite(value)) amounts.add(Math.round(value * 10000));
  }

  // Requires the digit run to sit directly against "원" (only whitespace
  // between), so this never matches the "원" inside "...만원" above -- a
  // digit run ending in "만" isn't followed by whitespace/원, it's followed
  // by "만", so the two patterns can't double-count the same figure.
  const wonPattern = /([0-9][0-9,]*)\s*원/g;
  for (const match of text.matchAll(wonPattern)) {
    const digits = match[1].replace(/,/g, "");
    if (digits.length >= 3) amounts.add(Number(digits));
  }

  return amounts;
}

function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!PHONE_PATTERN.test(trimmed)) {
    console.warn(`[openrouter] dropping malformed phone: ${JSON.stringify(value)}`);
    return null;
  }
  return trimmed;
}

function normalizeDocuments(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .map((entry) => entry.trim())
    .slice(0, MAX_DOCUMENTS);
}

function extractJsonObject(raw: string): string {
  // Models occasionally wrap JSON in ```json fences, or (reasoning models
  // especially) prepend/append stray commentary despite instructions not to.
  // Slicing to the outermost { ... } tolerates that without trusting the
  // whole string to be valid JSON.
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return cleaned;
  return cleaned.slice(start, end + 1);
}

// Distinct from AppError so the retry loop in generateGuide can tell "the
// model produced garbage this one time" (worth a quiet retry, same as an
// overloaded provider) apart from a genuine unrecoverable failure.
class InvalidGuideResponseError extends Error {}

function parseModelJson(
  raw: string,
): Pick<
  GuideResponse,
  "headline" | "description" | "items" | "deadline" | "amountKRW" | "amountCondition" | "phone" | "documents"
> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(raw));
  } catch {
    throw new InvalidGuideResponseError("raw content is not valid JSON");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new InvalidGuideResponseError("parsed JSON is not an object");
  }

  const { headline, description, items, deadline, amountKRW, amountCondition, phone, documents } =
    parsed as Record<string, unknown>;

  if (typeof headline !== "string" || headline.trim().length === 0) {
    throw new InvalidGuideResponseError("headline is missing or empty");
  }

  if (
    typeof description !== "string" ||
    description.trim().length === 0 ||
    description.trim().length > MAX_DESCRIPTION_LENGTH
  ) {
    throw new InvalidGuideResponseError(
      `description is missing, empty, or exceeds ${MAX_DESCRIPTION_LENGTH} chars`,
    );
  }

  if (!Array.isArray(items) || items.length < MIN_ITEMS || items.length > MAX_ITEMS) {
    throw new InvalidGuideResponseError(
      `items is missing or its length is outside [${MIN_ITEMS}, ${MAX_ITEMS}]`,
    );
  }

  if (!items.every(isValidItem)) {
    throw new InvalidGuideResponseError(
      `one or more items failed validation: ${JSON.stringify(items)}`,
    );
  }

  const uniqueLabels = new Set(items.map((item) => item.label));
  if (uniqueLabels.size !== items.length) {
    throw new InvalidGuideResponseError(
      `duplicate labels — must merge same-label facts into one item: ${JSON.stringify(items)}`,
    );
  }

  // Sanity-checks amountKRW against the figure actually written in the 지원
  // 금액 item's own detail sentence -- a malformed "N만원 -> won" conversion
  // (e.g. dropping a zero) produces a number that just isn't in that text,
  // which this catches independent of whatever `amountCondition` says.
  let normalizedAmountKRW = normalizeAmountKRW(amountKRW);
  let normalizedAmountCondition = normalizeAmountCondition(amountCondition);
  if (normalizedAmountKRW !== null) {
    const amountDetailText = items.find((item) => item.label === "지원 금액")?.detail;
    if (!amountDetailText || !extractAmountsFromText(amountDetailText).has(normalizedAmountKRW)) {
      console.warn(
        `[openrouter] dropping amountKRW ${normalizedAmountKRW} -- not found in 지원 금액 detail: ${JSON.stringify(amountDetailText ?? null)}`,
      );
      normalizedAmountKRW = null;
    }
  }
  if (normalizedAmountKRW === null) {
    normalizedAmountCondition = null;
  }

  return {
    headline,
    description,
    items: sortItemsByLabelOrder(items),
    deadline: normalizeDeadline(deadline),
    amountKRW: normalizedAmountKRW,
    amountCondition: normalizedAmountCondition,
    phone: normalizePhone(phone),
    documents: normalizeDocuments(documents),
  };
}

// Free models are shared, best-effort capacity: transient "overloaded" or
// empty-completion responses are common (observed roughly 1 in 3 requests on
// the current default model) and usually clear up within a couple seconds,
// so it's worth a couple of quiet retries before surfacing an error.
const MAX_ATTEMPTS = 3;
const OVERLOAD_RETRY_DELAY_MS = 1500;

// 503 = the provider is overloaded; 429 = OpenRouter's shared free-tier pool
// for that model is momentarily saturated. Both are the same "try again in a
// moment" situation from the caller's perspective (OpenRouter's own 429
// error body literally says "retry shortly"), so both get the same quiet
// retry treatment instead of surfacing to the user on the first hit.
function isOverloaded(error: unknown): boolean {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return status === 503 || status === 429;
}

// Free-tier providers occasionally return a fast 200 with no choices/content
// instead of a proper error status. Treated as retryable, same as a 503.
class EmptyCompletionError extends Error {
  constructor(public responseData: unknown) {
    super("empty completion");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Surfaces the real status code and provider error body in the server
// terminal, since AppError's user-facing Korean message is intentionally
// generic and drops those details.
function logOpenRouterError(error: unknown, attempt: number, rawContent?: string): void {
  if (axios.isAxiosError(error)) {
    console.error(
      `[openrouter] attempt ${attempt}/${MAX_ATTEMPTS} failed`,
      JSON.stringify({
        status: error.response?.status ?? null,
        code: error.code ?? null,
        data: error.response?.data ?? null,
        message: error.message,
      }),
    );
    return;
  }
  if (error instanceof EmptyCompletionError) {
    console.error(
      `[openrouter] attempt ${attempt}/${MAX_ATTEMPTS} returned an empty completion, full response:`,
      JSON.stringify(error.responseData),
    );
    return;
  }
  if (error instanceof InvalidGuideResponseError) {
    console.error(
      `[openrouter] attempt ${attempt}/${MAX_ATTEMPTS} invalid guide JSON: ${error.message}`,
    );
    console.error(`[openrouter] raw model content:\n${rawContent ?? "(none)"}`);
    return;
  }
  console.error(`[openrouter] attempt ${attempt}/${MAX_ATTEMPTS} unexpected error`, error);
}

export async function generateGuide(
  sourceUrl: string,
  pageText: string,
  posterImageUrl?: string,
): Promise<GuideResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AppError("서버에 AI 연동 설정이 되어 있지 않아요.", 500);
  }

  const useVision = Boolean(posterImageUrl);
  const requestedModel = useVision ? OPENROUTER_VISION_MODEL : OPENROUTER_TEXT_MODEL;
  // Lets the model resolve a deadline written without a year (e.g. "10월
  // 31일까지") per the Structured fields rule -- en-CA happens to format as
  // YYYY-MM-DD, which is the same shape the model is asked to output.
  const todayKst = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  // OpenRouter follows the OpenAI-compatible content-array format for
  // multimodal messages -- a plain string "content" only works for text-only
  // requests, so vision mode needs the array form with an image_url part.
  const userContent = useVision
    ? [
        { type: "text" as const, text: buildUserPrompt(todayKst, sourceUrl, pageText, true) },
        { type: "image_url" as const, image_url: { url: posterImageUrl } },
      ]
    : buildUserPrompt(todayKst, sourceUrl, pageText, false);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Node's axios `timeout` option resets on any socket activity, so a
    // provider that trickles keep-alive bytes while a slow free model "thinks"
    // can defeat it entirely. An AbortController deadline is a true wall-clock
    // cutoff regardless of what the connection is doing.
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);
    // Declared outside the try block so the catch block can still log it
    // when parseModelJson rejects the content as malformed.
    let content: string | undefined;
    const startedAt = Date.now();

    console.log(
      `[openrouter] attempt ${attempt}/${MAX_ATTEMPTS} → sending request (mode=${useVision ? "vision" : "text"}, model=${requestedModel}, timeout=${OPENROUTER_TIMEOUT_MS}ms)`,
    );

    try {
      const response = await axios.post(
        OPENROUTER_URL,
        {
          model: requestedModel,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          temperature: 0.3,
          // Keep chain-of-thought out of `content` for reasoning-capable
          // models so parseModelJson always sees a clean JSON object.
          reasoning: { exclude: true },
        },
        {
          // This signal is what actually enforces OPENROUTER_TIMEOUT_MS: axios
          // aborts the in-flight request the instant `controller.abort()` fires
          // from the setTimeout above, regardless of the connection's state.
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            // Recommended by OpenRouter for request attribution.
            "HTTP-Referer": "https://github.com/rinni0628-spec/EasyLink",
            "X-Title": "Easy-Link",
          },
        },
      );

      console.log(
        `[openrouter] attempt ${attempt}/${MAX_ATTEMPTS} ← response received after ${Date.now() - startedAt}ms`,
      );

      content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new EmptyCompletionError(response.data);
      }

      const { headline, description, items, deadline, amountKRW, amountCondition, phone, documents } =
        parseModelJson(content);
      return {
        sourceUrl,
        headline,
        description,
        items,
        deadline,
        amountKRW,
        amountCondition,
        phone,
        documents,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.log(
        `[openrouter] attempt ${attempt}/${MAX_ATTEMPTS} ✗ failed after ${Date.now() - startedAt}ms`,
      );
      logOpenRouterError(error, attempt, content);

      const isRetryable =
        isOverloaded(error) || error instanceof EmptyCompletionError || error instanceof InvalidGuideResponseError;
      if (isRetryable && attempt < MAX_ATTEMPTS) {
        await sleep(OVERLOAD_RETRY_DELAY_MS);
        continue;
      }

      if (error instanceof EmptyCompletionError) {
        throw new AppError("AI로부터 응답을 받지 못했어요. 다시 시도해 주세요.", 502);
      }

      if (error instanceof InvalidGuideResponseError) {
        throw new AppError(
          "AI가 안내문 형식을 올바르게 만들지 못했어요. 다시 시도해 주세요.",
          502,
        );
      }

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED" || error.code === "ERR_CANCELED") {
          throw new AppError(
            "AI 응답이 너무 늦어요. 잠시 후 다시 시도해 주세요.",
            504,
          );
        }
        if (error.response?.status === 401) {
          throw new AppError("AI 서비스 인증에 실패했어요.", 500);
        }
        if (error.response?.status === 429) {
          throw new AppError(
            "지금 요청이 몰려 있어요. 잠시 후 다시 시도해 주세요.",
            429,
          );
        }
        if (error.response?.status === 503) {
          throw new AppError(
            "무료 AI 모델에 이용자가 많아 지금은 연결이 어려워요. 잠시 후 다시 시도해 주세요.",
            503,
          );
        }
        throw new AppError("AI 안내문 생성 중 문제가 발생했어요.", 502);
      }
      throw new AppError("AI 안내문 생성 중 알 수 없는 오류가 발생했어요.", 500);
    } finally {
      clearTimeout(deadline);
    }
  }

  // Unreachable: every loop iteration either returns or throws.
  throw new AppError("AI 안내문 생성 중 알 수 없는 오류가 발생했어요.", 500);
}

// A reader's follow-up question is free-form, so the response here is plain
// Korean prose (not the fixed-schema JSON generateGuide produces) -- short
// enough to read aloud in one breath per sentence, same as the guide items.
const FOLLOWUP_MAX_ANSWER_LENGTH = 300;

const FOLLOWUP_SYSTEM_PROMPT = `You are the same "Easy-Link" assistant, now answering one follow-up question an elderly reader (70+) has about a public-service notice they already received a simplified guide for.

Grounding rule (avoid hallucination):
- Answer ONLY using facts present in the page text provided. Never invent phone numbers, fees, deadlines, or office names.
- If the page text does not contain the answer, say so plainly and warmly, and suggest the reader confirm with the contact number or office named in the page text if one exists -- never invent a contact if none is grounded in the text. If no contact is grounded either, suggest a nearby 주민센터.

Tone rule (must be followed exactly):
- Write in ultra-polite, warm, comforting Korean suitable for elders, as if a kind community-center staff member is answering in person.
- End sentences with warm, complete forms such as "~하실 수 있어요", "~이에요", "~해보세요". Never curt or commanding forms.
- Translate every bureaucratic or legal term into plain everyday Korean the moment it appears.

Format rule (must be followed exactly):
- Answer in 1 to 3 short sentences, each 40 Korean characters or fewer, each a complete standalone idea.
- Never write a bare noun phrase, a bullet list, markdown, or JSON -- plain conversational Korean sentences only.
- Never repeat the question back before answering; just answer directly.

Output rule:
- Respond with ONLY the answer text itself -- no labels, no prefixes like "답변:", no markdown formatting.`;

function buildFollowUpUserPrompt(todayKst: string, sourceUrl: string, pageText: string, question: string): string {
  return `오늘 날짜: ${todayKst}\n\n웹페이지 주소: ${sourceUrl}\n\n페이지 본문:\n"""\n${pageText}\n"""\n\n독자의 질문: ${question}`;
}

export async function generateFollowUpAnswer(
  sourceUrl: string,
  pageText: string,
  question: string,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AppError("서버에 AI 연동 설정이 되어 있지 않아요.", 500);
  }

  const todayKst = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const userContent = buildFollowUpUserPrompt(todayKst, sourceUrl, pageText, question);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);
    const startedAt = Date.now();

    console.log(
      `[openrouter] followup attempt ${attempt}/${MAX_ATTEMPTS} → sending request (model=${OPENROUTER_TEXT_MODEL})`,
    );

    try {
      const response = await axios.post(
        OPENROUTER_URL,
        {
          model: OPENROUTER_TEXT_MODEL,
          messages: [
            { role: "system", content: FOLLOWUP_SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          temperature: 0.3,
          reasoning: { exclude: true },
        },
        {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/rinni0628-spec/EasyLink",
            "X-Title": "Easy-Link",
          },
        },
      );

      console.log(
        `[openrouter] followup attempt ${attempt}/${MAX_ATTEMPTS} ← response received after ${Date.now() - startedAt}ms`,
      );

      const content: string | undefined = response.data?.choices?.[0]?.message?.content;
      const trimmed = content?.trim();
      if (!trimmed) {
        throw new EmptyCompletionError(response.data);
      }

      return trimmed.length > FOLLOWUP_MAX_ANSWER_LENGTH
        ? `${trimmed.slice(0, FOLLOWUP_MAX_ANSWER_LENGTH - 1)}…`
        : trimmed;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.log(
        `[openrouter] followup attempt ${attempt}/${MAX_ATTEMPTS} ✗ failed after ${Date.now() - startedAt}ms`,
      );
      logOpenRouterError(error, attempt);

      const isRetryable = isOverloaded(error) || error instanceof EmptyCompletionError;
      if (isRetryable && attempt < MAX_ATTEMPTS) {
        await sleep(OVERLOAD_RETRY_DELAY_MS);
        continue;
      }

      if (error instanceof EmptyCompletionError) {
        throw new AppError("AI로부터 응답을 받지 못했어요. 다시 시도해 주세요.", 502);
      }

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED" || error.code === "ERR_CANCELED") {
          throw new AppError("AI 응답이 너무 늦어요. 잠시 후 다시 시도해 주세요.", 504);
        }
        if (error.response?.status === 401) {
          throw new AppError("AI 서비스 인증에 실패했어요.", 500);
        }
        if (error.response?.status === 429) {
          throw new AppError("지금 요청이 몰려 있어요. 잠시 후 다시 시도해 주세요.", 429);
        }
        if (error.response?.status === 503) {
          throw new AppError(
            "무료 AI 모델에 이용자가 많아 지금은 연결이 어려워요. 잠시 후 다시 시도해 주세요.",
            503,
          );
        }
        throw new AppError("AI 답변 생성 중 문제가 발생했어요.", 502);
      }
      throw new AppError("AI 답변 생성 중 알 수 없는 오류가 발생했어요.", 500);
    } finally {
      clearTimeout(deadline);
    }
  }

  // Unreachable: every loop iteration either returns or throws.
  throw new AppError("AI 답변 생성 중 알 수 없는 오류가 발생했어요.", 500);
}
