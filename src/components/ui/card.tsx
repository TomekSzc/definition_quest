import React from "react";
import type { HTMLAttributes } from "react";
import clsx from "clsx";

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("rounded border bg-background p-4", className)} {...props} />
);

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("mb-2", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={clsx("text-lg font-semibold", className)} {...props} />
);

export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("", className)} {...props} />
);

export const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("mt-2", className)} {...props} />
);
