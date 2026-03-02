import type { Config } from 'jest';

const config: Config = {
	testEnvironment: 'node',
	transform: {
		'^.+\\.tsx?$': ['ts-jest', {
			tsconfig: {
				jsx: 'react',
				esModuleInterop: true,
				allowSyntheticDefaultImports: true,
			}
		}],
	},
	globals: {
		__DEV__: true,
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	testPathIgnorePatterns: [
		'/node_modules/',
		'/__tests__/utils/',
	],
	testMatch: [
		'**/__tests__/microservices/**/*.test.ts',
		'**/__tests__/integration/**/*.test.ts',
	],
	setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
	moduleNameMapper: {
		'^@api/(.*)$': '<rootDir>/src/core/api/$1',
		'^@core/(.*)$': '<rootDir>/src/core/$1',
		'^@lib/(.*)$': '<rootDir>/src/core/lib/$1',
		'^@storage/(.*)$': '<rootDir>/src/core/storage/$1',
		'^@utils/(.*)$': '<rootDir>/src/core/utils/$1',
		'^@auth/(.*)$': '<rootDir>/src/modules/auth/$1',
		'^src/(.*)$': '<rootDir>/src/$1',
		'\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/src/__tests__/__mocks__/fileMock.js',
	},
	testTimeout: 30000,
	verbose: true,
};

export default config;
