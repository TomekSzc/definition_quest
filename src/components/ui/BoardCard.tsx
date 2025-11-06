import type { FC } from "react";
import type { BoardCardVM } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { BoardSummaryDTO } from "@/types";

interface IBoardCardProps {
  board: BoardSummaryDTO;
}

export const BoardCard: FC<IBoardCardProps> = ({ board }) => {
  const href = `/boards/${board.id}`;
  return (
    <a href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="cursor-pointer transition-shadow hover:shadow-lg border-2 border-[var(--color-primary)] rounded-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
            {board.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{board.title}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {board.tags.map((t) => (
              <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        </CardContent>
        <CardFooter />
      </Card>
    </a>
  );
};
