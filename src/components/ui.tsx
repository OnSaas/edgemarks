import { Switch } from "@base-ui/react/switch";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function cx(...parts: Array<string | false | null | undefined>) {
	return parts.filter(Boolean).join(" ");
}

export const controlClass =
	"h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 disabled:opacity-50";

const buttonBase =
	"inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition select-none disabled:pointer-events-none disabled:opacity-50";

const buttonVariant = {
	primary: "bg-teal-700 text-white hover:bg-teal-800",
	secondary: "border border-[var(--line)] bg-[var(--card)] text-[var(--fg)] hover:bg-[var(--soft)]",
	ghost: "text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--fg)]",
	danger: "text-red-600 hover:bg-red-500/10",
} as const;

export function Button({
	variant = "primary",
	className,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariant }) {
	return <button className={cx(buttonBase, buttonVariant[variant], className)} {...props} />;
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="button"
			className={cx(
				"inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--card)] text-[var(--fg)] transition hover:bg-[var(--soft)] disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
	return <input className={cx(controlClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return <textarea className={cx(controlClass, "h-auto min-h-20 py-2", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
	return <select className={cx(controlClass, className)} {...props} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<label className="grid gap-1.5 text-sm">
			<span className="text-[var(--muted)]">{label}</span>
			{children}
		</label>
	);
}

export function Panel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
	return (
		<section className={cx("grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--card)] p-4", className)}>
			{title && <h2 className="text-sm font-medium">{title}</h2>}
			{children}
		</section>
	);
}

export function Chip({
	active,
	className,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
	return (
		<button
			type="button"
			className={cx(
				"inline-flex h-8 items-center rounded-lg px-2.5 text-sm transition",
				active ? "bg-[var(--card)] text-[var(--fg)] ring-1 ring-[var(--line)]" : "text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--fg)]",
				className,
			)}
			{...props}
		/>
	);
}

export function Toggle({
	checked,
	onCheckedChange,
}: {
	checked: boolean;
	onCheckedChange: (v: boolean) => void;
}) {
	return (
		<Switch.Root
			checked={checked}
			onCheckedChange={onCheckedChange}
			className="relative inline-flex h-6 w-10 shrink-0 rounded-full bg-zinc-400 transition data-checked:bg-teal-700"
		>
			<Switch.Thumb className="h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-checked:translate-x-[18px]" />
		</Switch.Root>
	);
}

export function PageTitle({ children }: { children: ReactNode }) {
	return <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{children}</h1>;
}
