module.exports = {
  extends: [
    'eslint-config-alloy/react',
    'eslint-config-alloy/typescript'
  ],
  globals: {},
  settings: {
    react: {
      version: '16.0'
    }
  },
  rules: {
    'arrow-parens': 'error',
    complexity: 'off',
    indent: ['error', 2, {
      SwitchCase: 1
    }],
    "max-nested-callbacks": ['error', 4],
    // 禁止不必要的布尔转换
    'no-extra-boolean-cast': 'error',
    // 禁止不必要的括号
    'no-extra-parens': 'error',
    // 强制使用有效的 JSDoc 注释
    // 'valid-jsdoc': 'error',
    'no-param-reassign': 'off',
    "no-return-await": 'off',
    'no-unused-vars': 'off',
    'no-undefined': 'off',
    'no-shadow': 'error',
    'object-curly-spacing': ['error', 'always'],
    'prefer-template': 'error',
    'prefer-object-spread': 'off',
    radix: 'off',
    'react/jsx-indent': ['error', 2],
    'react/jsx-indent-props': ['error', 2],
    // 一个缩进必须用两个空格替代
    '@typescript-eslint/indent': [
      'error',
      2,
      { SwitchCase: 1, flatTernaryExpressions: true }
    ],
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/prefer-function-type': 'off',
    '@typescript-eslint/member-ordering': ['error', {
      default: [
        "public-static-field",
        "protected-static-field",
        "private-static-field",

        "public-instance-field",
        "protected-instance-field",
        "private-instance-field",

        "public-field",
        "protected-field",
        "private-field",

        "static-field",
        "instance-field",

        "field",

        "constructor",

        "public-static-method",
        "protected-static-method",
        "private-static-method",

        "public-instance-method",
        "protected-instance-method",
        "private-instance-method",

        "public-method",
        "protected-method",
        "private-method",

        "static-method",
        "instance-method",

        "method"
      ]
    }]
  },
  overrides: [{
    files: ['*.d.ts'],
    rules: {
      'no-dupe-class-members': 'off',
      'no-use-before-define': 'off',
      'no-useless-constructor': 'off',
    }
  }]
}
