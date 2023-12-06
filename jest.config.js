module.exports = {
  roots: ["<rootDir>/src/", "<rootDir>/test/"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|\\.(test|spec))\\.[tj]sx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/bot/(.*)$": "<rootDir>/src/$1",
    "^@/utils/(.*)$": "<rootDir>/common/$1",
  },
};
