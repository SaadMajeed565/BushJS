import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^@framework$': '<rootDir>/src/bush.ts',
    '^@framework/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/stubs/**',
    '!src/Console/cli.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 48,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};

export default config;
