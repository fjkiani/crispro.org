
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ClinicalMarkdownProps {
  content: string;
}

export function ClinicalMarkdown({ content }: ClinicalMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => (
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mb-6 pb-2 border-b-2 border-slate-900" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-lg lg:text-xl font-black text-slate-800 uppercase tracking-widest mt-10 mb-4 bg-slate-100 p-3 rounded-xl border-l-4 border-slate-400" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-md font-bold text-slate-700 uppercase tracking-wider mt-8 mb-3" {...props} />
        ),
        p: ({ node, ...props }) => (
          <p className="text-slate-900 leading-relaxed mb-4 text-[15px]" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc list-inside space-y-2 mb-6 text-slate-900 ml-2" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal list-inside space-y-2 mb-6 text-slate-900 ml-2" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="leading-relaxed" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-amber-500 bg-amber-50 text-slate-900 not-italic p-4 my-6 rounded-r-xl shadow-sm text-[15px] font-bold" {...props} />
        ),
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-8 border border-slate-200 rounded-xl shadow-sm bg-white">
            <table className="w-full text-left text-sm whitespace-nowrap" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => (
          <thead className="bg-slate-50 border-b-2 border-slate-200" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th className="p-4 font-black uppercase tracking-widest text-[11px] text-slate-500" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="p-4 border-b border-slate-100 text-slate-700 font-medium" {...props} />
        ),
        code: ({ node, inline, className, children, ...props }: any) => {
          if (inline) {
            return <code className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-mono text-xs font-bold" {...props}>{children}</code>;
          }
          return (
            <div className="my-6 rounded-xl overflow-hidden shadow-sm border border-slate-800 bg-slate-900 p-4">
              <pre className="overflow-x-auto"><code className="font-mono text-xs text-slate-300" {...props}>{children}</code></pre>
            </div>
          );
        },
        a: ({ node, ...props }) => (
          <a className="font-bold text-blue-600 hover:text-blue-500 underline decoration-blue-200 hover:decoration-blue-500 underline-offset-4 transition-all" {...props} />
        ),
        strong: ({ node, ...props }) => (
          <strong className="font-black text-slate-900" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
