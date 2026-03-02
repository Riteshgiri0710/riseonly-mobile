import { m } from 'mobx-toolbox'

export const ModerationsSchema = m.schema({
	full_name: m
		.reset()
		.string()
		.minLength(3, {message: 'ФИО должно быть от 3 до 100 символов'})
		.maxLength(100)
		.build(),
	nationality: m
		.reset()
		.string()
		.minLength(2, {message: 'Страна должна быть от 2 до 50 символов'})
		.maxLength(50)
		.build(),
	city: m
		.reset()
		.string()
		.minLength(2, {message: 'Город должен быть от 2 до 50 символов'})
		.maxLength(50)
		.build(),
	reason: m
		.reset()
		.string()
		.minLength(10, {message: 'Причина должна быть от 10 до 1000 символов'})
		.maxLength(1000)
		.build(),
	phone: m
		.reset()
		.required({message: 'Введите номер телефона'})
		.minLength(5, {message: 'Номер телефона должен быть от 5 до 15 символов'})
		.maxLength(15)
		.build(),
})
