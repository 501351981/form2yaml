module.exports = {
    'env': {
        'es2021': true
    },
    'extends': [
        'eslint:recommended'
    ],
    'overrides': [
    ],
    'parserOptions': {
        'ecmaVersion': 'latest',
        'sourceType': 'module'
    },
    'rules': {
        'semi': ['error','always'],
        'no-multi-spaces': ['error', { ignoreEOLComments: false }],
        'quotes': ['error', 'single']
    }
};
