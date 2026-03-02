declare module 'lodash.isequal';

declare module "*.module.scss" {
	const classes: { [key: string]: string; };
	export default classes;
}

// images.d.ts
declare module '*.jpg' {
	const value: string;
	export default value;
}

declare module '*.png' {
	const value: string;
	export default value;
}

declare module '*.svg' {
	const value: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
	export default value;
}

declare module '*.gif' {
	const value: string;
	export default value;
}

declare module '*.webp' {
	const value: string;
	export default value;
}

declare module '*.jpeg' {
	const value: string;
	export default value;
}

declare module '@env' {
	export const API_BASE_URL: string;
	export const RUST_API_BASE_URL: string;
	export const API_SOCKET_BASE_URL: string;
	export const API_BASE_URL_DEV: string;
	export const API_SOCKET_BASE_URL_DEV: string;
	export const NODE_ENV: string;
	export const PROJECT_STATUS: string;
}