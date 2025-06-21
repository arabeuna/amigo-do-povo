const { body } = require('express-validator');

const validarCriarAluno = [
  body('nome')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços'),
  
  body('cpf')
    .optional()
    .isLength({ min: 11, max: 14 })
    .withMessage('CPF deve ter entre 11 e 14 caracteres')
    .matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/)
    .withMessage('CPF deve estar no formato válido (000.000.000-00)'),
  
  body('rg')
    .optional()
    .isLength({ max: 20 })
    .withMessage('RG deve ter no máximo 20 caracteres'),
  
  body('data_nascimento')
    .optional()
    .isISO8601()
    .withMessage('Data de nascimento deve ser uma data válida'),
  
  body('sexo')
    .optional()
    .isIn(['M', 'F'])
    .withMessage('Sexo deve ser M ou F'),
  
  body('telefone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Telefone deve ter no máximo 20 caracteres'),
  
  body('celular')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Celular deve ter no máximo 20 caracteres'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ser um email válido')
    .normalizeEmail(),
  
  body('endereco')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Endereço deve ter no máximo 255 caracteres'),
  
  body('bairro')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Bairro deve ter no máximo 100 caracteres'),
  
  body('cidade')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Cidade deve ter no máximo 100 caracteres'),
  
  body('estado')
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage('Estado deve ter exatamente 2 caracteres'),
  
  body('cep')
    .optional()
    .matches(/^\d{5}-?\d{3}$/)
    .withMessage('CEP deve estar no formato válido (00000-000)'),
  
  body('observacoes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Observações deve ter no máximo 1000 caracteres')
];

const validarAtualizarAluno = [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços'),
  
  body('cpf')
    .optional()
    .isLength({ min: 11, max: 14 })
    .withMessage('CPF deve ter entre 11 e 14 caracteres')
    .matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/)
    .withMessage('CPF deve estar no formato válido (000.000.000-00)'),
  
  body('rg')
    .optional()
    .isLength({ max: 20 })
    .withMessage('RG deve ter no máximo 20 caracteres'),
  
  body('data_nascimento')
    .optional()
    .isISO8601()
    .withMessage('Data de nascimento deve ser uma data válida'),
  
  body('sexo')
    .optional()
    .isIn(['M', 'F'])
    .withMessage('Sexo deve ser M ou F'),
  
  body('telefone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Telefone deve ter no máximo 20 caracteres'),
  
  body('celular')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Celular deve ter no máximo 20 caracteres'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ser um email válido')
    .normalizeEmail(),
  
  body('endereco')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Endereço deve ter no máximo 255 caracteres'),
  
  body('bairro')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Bairro deve ter no máximo 100 caracteres'),
  
  body('cidade')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Cidade deve ter no máximo 100 caracteres'),
  
  body('estado')
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage('Estado deve ter exatamente 2 caracteres'),
  
  body('cep')
    .optional()
    .matches(/^\d{5}-?\d{3}$/)
    .withMessage('CEP deve estar no formato válido (00000-000)'),
  
  body('observacoes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Observações deve ter no máximo 1000 caracteres')
];

module.exports = {
  validarCriarAluno,
  validarAtualizarAluno
}; 