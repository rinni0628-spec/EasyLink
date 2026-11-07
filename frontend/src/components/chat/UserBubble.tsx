interface UserBubbleProps {
  text: string;
}

export function UserBubble({ text }: UserBubbleProps) {
  return (
    <div className="flex justify-end">
      <p className="card-sticker max-w-[85%] break-words rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-lg leading-snug text-paper">
        {text}
      </p>
    </div>
  );
}
