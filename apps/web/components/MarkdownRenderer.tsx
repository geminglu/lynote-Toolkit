import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type MarkdownRendererProps = {
  content: string;
  className?: string;
};

const markdownComponents: Components = {
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight text-balance",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-10 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn(
        "mt-6 scroll-m-20 text-xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "text-primary font-medium underline underline-offset-4",
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("mmy-6 ml-6 list-disc [&>li]:mt-2", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", className)}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn("mt-6 border-l-2 pl-6 italic", className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("border-border my-8", className)} {...props} />
  ),
  code: ({ className, children, ...props }) => {
    const isInlineCode = !className;

    if (isInlineCode) {
      return (
        <code
          className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <code className={cn("font-mono text-sm", className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "bg-muted mt-6 mb-4 overflow-x-auto rounded-lg border px-4 py-4",
        className,
      )}
      {...props}
    />
  ),
  table: ({
    children,
    ...props
  }: ComponentPropsWithoutRef<"table"> & { children?: ReactNode }) => (
    <div className="my-6 w-full overflow-x-auto">
      <table className="w-full" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead className={cn("", className)} {...props} />
  ),
  tbody: ({ className, ...props }) => (
    <tbody className={cn("", className)} {...props} />
  ),
  tr: ({ className, ...props }) => (
    <tr
      className={cn("even:bg-muted m-0 border-t p-0", className)}
      {...props}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
};

export default function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <article className={cn(className)}>
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
