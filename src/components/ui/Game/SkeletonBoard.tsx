export default function SkeletonBoard({ cardCount }: { cardCount: number }) {
  return (
    <div className="flex flex-wrap bg-secondary w-full md:w-[calc(100%-199px)] p-[32px] min-h-[80vh] relative">
      <div className="flex flex-wrap h-fit justify-center mx-auto animate-pulse">
        {Array.from({ length: cardCount }).map((_, idx) => (
          <div
            key={idx}
            className="mb-6 mx-2 bg-neutral-200 w-[250px] h-[200px] rounded-md border border-neutral-300"
          />
        ))}
      </div>
    </div>
  );
}
