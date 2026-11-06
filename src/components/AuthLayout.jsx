import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-base px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-9 text-center">
          <div className="mb-5 inline-flex items-center justify-center">
            <Icon className="h-6 w-6 text-flare" aria-hidden="true" strokeWidth={1.4} />
          </div>
          <h1 className="t-season text-foreground">{title}</h1>
          {subtitle && <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-sm border border-ink-line bg-ink-raised p-7">
          {children}
        </div>
        {footer && (
          <p className="mt-6 text-center text-[12.5px] text-muted-foreground">{footer}</p>
        )}
      </div>
    </div>
  );
}