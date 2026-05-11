module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],

  rootDir: 'src',

  testRegex: '.*\\.spec\\.ts$',

  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },

  testEnvironment: 'node',

  collectCoverageFrom: ['**/*.(t|j)s'],

  coverageDirectory: '../coverage',

  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};