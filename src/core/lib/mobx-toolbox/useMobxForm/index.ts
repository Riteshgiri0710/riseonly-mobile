import { makeAutoObservable } from 'mobx';
import { FormErrors, FormStateOptions, FormValues, ValidationResult, Validator } from 'mobx-toolbox';
import { ValidatorBuilder } from 'mobx-toolbox/src/validators';

class ValidationSchema extends ValidatorBuilder {
	validators: Record<string, Validator[]> = {};

	/**
	 * Used to validate your input keys.
	 * Telegram: https://t.me/nics51
	 *
	 * @example
	 * export const orderFormSchema = m.schema({
	 *   name: m.reset().required().string().minLength(3, { message: '...' }).build(),
	 *   description: m.reset().required().string().minLength(10).build()
	 * })
	 * Schema can be reused and is used by useMobxForm.
	 * @param object - Validation settings; remember to call .build() at the end.
	 */
	schema(validators: Record<string, Validator[]>): ValidationSchema {
		const schema = new ValidationSchema();
		schema.validators = validators;
		return schema;
	}

	/**
	 * Adds new validators to an existing schema.
	 * Telegram: https://t.me/nics51
	 * Second param is override (default false). If true, parent key is replaced when names match; if false, validators are merged.
	 * @param newValidators - New validators to add
	 * @param override - If true, overrides existing validators for the same key
	 * @returns Updated ValidationSchema
	 */
	extend(newValidators: Record<string, Validator[]>, override: boolean = false): ValidationSchema {
		for (const field in newValidators) {
			if (override || !this.validators[field]) this.validators[field] = newValidators[field];
			else this.validators[field] = this.validators[field].concat(newValidators[field]);
		}
		return this;
	}

	/**
	 * Picks only the specified keys from the schema.
	 * Telegram: https://t.me/nics51
	 * @param keys - Keys to pick from the schema
	 * @returns New schema with only the picked keys
	 */
	pick(keys: string[]): ValidationSchema {
		const pickedValidators: Record<string, Validator[]> = {};

		for (const key of keys) {
			if (this.validators[key]) {
				pickedValidators[key] = this.validators[key];
			}
		}

		return this.schema(pickedValidators);
	}

	validate(values: Record<string, any>): ValidationResult {
		const errors: Record<string, string> = {};
		let success = true;

		for (const field in this.validators) {
			const validators = this.validators[field];
			for (const validate of validators) {
				const validationResult = validate(values[field], values);
				if (validationResult !== true) {
					success = false;
					errors[field + 'Err'] = typeof validationResult === 'string'
						? validationResult
						: `Invalid value for ${field}`;
					break;
				}
			}
		}

		return { success, errors };
	}
}


const formStateDefaultOptions = {
	instaValidate: true,
	inputResetErr: true,
	validateAllOnChange: false,
	resetErrIfNoValue: true,
	disabled: false,
	observableAnnotations: {},
	observableOptions: {}
};

class FormState<T> {
	values: FormValues<T>;
	errors: FormErrors<T> = {} as FormErrors<T>;
	validationSchema: ValidationSchema;
	options: Partial<FormStateOptions> = { instaValidate: true, validateAllOnChange: false, inputResetErr: true };
	initialValues: FormValues<T>;
	disabled: boolean = true;

	constructor(
		initialValues: FormValues<T>,
		validationSchema: ValidationSchema,
		options: FormStateOptions
	) {
		this.initialValues = initialValues;
		this.values = initialValues;
		this.validationSchema = validationSchema;
		this.options = { ...formStateDefaultOptions, ...options };

		if (options.disabled) this.disabled = options.disabled;

		makeAutoObservable(this, options.observableAnnotations || {}, options.observableOptions || {});
	}

	/**
	 * Value setter.
	 * Telegram: https://t.me/nics51
	 */
	setValue = (field: string, value: T[keyof T]) => {
		this.values[field as keyof T] = value;

		// @ts-ignore
		if (this.options.inputResetErr) this.errors[`${field}Err`] = '';

		if (this.options.instaValidate) {
			const error = this.validationSchema.validate(this.values);
			this.disabled = !error.success;

			if (this.options.validateAllOnChange) {
				this.errors = error.errors as FormErrors<T>;
			} else {
				// @ts-ignore
				this.errors[field + 'Err'] = error.errors[field + 'Err'] || '';
			}
		} else if (value == '' && this.options.resetErrIfNoValue) {
			// @ts-ignore
			this.errors[field + 'Err'] = '';
		}
	};

	/**
	 * Error setter.
	 * Telegram: https://t.me/nics51
	 */
	setError(field: keyof T, error: string) {
		// @ts-ignore
		this.errors[`${field}Err`] = error || '';

		const ifNoErrors = Object.values(this.errors).every(error => error === '');

		this.disabled = !ifNoErrors;
	}

	/**
	 * Resets all inputs to initial state.
	 * Telegram: https://t.me/nics51
	 */
	reset() {
		this.values = { ...this.initialValues };
		this.errors = {} as FormErrors<T>;
	}

	/**
	 * Validates keys; writes errors to errors, returns true/false for success.
	 * Telegram: https://t.me/nics51
	 * @example this.orderForm.validate() // true | false
	 */
	validate(): boolean {
		const result: ValidationResult = this.validationSchema.validate(this.values);
		if (!result.success) this.errors = result.errors as FormErrors<T>;
		else this.errors = {} as FormErrors<T>;

		this.disabled = !result.success;

		return result.success;
	}
}

/**
 * Creates an object with all settings needed to manage form, inputs and errors.
 * Telegram: https://t.me/nics51
 *
 * @example
 * orderForm = useMobxForm(
 *   { name: '', description: '' },
 *   orderFormSchema,
 * 	{ instaValidate: true, inputResetErr: true }
 * );
 * 
 * In the component you get:
 * const {
 * 	orderForm: {
 * 		setValue,
 * 		values: { name, description },
 * 		errors: { nameErr, descriptionErr }
 * 	}
 * } = orderStore
 *
 * @param initialValues - Object with keys for inputs
 * @param schema - Schema object with validation settings
 * @param options - Form options and makeAutoObservable options:
 *   - instaValidate: validate on input (default true)
 *   - inputResetErr: clear errors on input (default true)
 *   - validateAllOnChange: validate all inputs when one changes, only if instaValidate true (default false)
 *   - resetErrIfNoValue: clear error when input is empty (default true)
 *   - observableAnnotations, observableOptions: for makeAutoObservable
 */
export function useMobxForm<T>(
	initialValues: FormValues<T>,
	validationSchema: ValidationSchema,
	options: Partial<FormStateOptions> = {
		instaValidate: true,
		inputResetErr: true,
		validateAllOnChange: false,
		resetErrIfNoValue: true,
		disabled: false,
		observableAnnotations: {},
		observableOptions: {}
	},
) {
	return new FormState<T>(initialValues, validationSchema, options);
}
