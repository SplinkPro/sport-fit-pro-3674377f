/**
 * Authentication integration entry point.
 *
 * Wraps the underlying OAuth SDK so application code only depends on this
 * stable internal API. If the underlying provider is ever swapped out, only
 * this file needs to change.
 */
export { lovable as oauth } from "../lovable";
