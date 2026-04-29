# API DOLCI - E-commerce de Doces Gourmet

## Objetivo do Projeto:
Esta é uma API RESTful estruturada para fornecer toda a inteligência de backend de um aplicativo web focado na venda de doces gourmet, o DOLCI. 

O sistema foi desenhado para cobrir de ponta a ponta as operações do negócio, oferecendo endpoints para o gerenciamento do catálogo (doces, combos e receitas), controle detalhado de estoque (produtos prontos e matérias-primas), além de orquestrar a jornada de compra do cliente (carrinhos, validação de cupons, registro de vendas com congelamento de preços) e o rastreio logístico de entregas. É uma fundação sólida e escalável, ideal para suportar as operações diárias e o crescimento de uma microempresa no setor de confeitaria.

## Tecnologias e Linguagens Utilizadas:

* **Node.js (JavaScript):** O ambiente de execução principal. Foi escolhido pela sua alta performance no manuseio de requisições assíncronas (I/O) e agilidade para o desenvolvimento de microsserviços e APIs.
* **Express.js:** Framework minimalista para Node.js, utilizado para criar toda a arquitetura de roteamento da API baseada no padrão MVC (separando as rotas da lógica de controle).
* **PostgreSQL:** Banco de dados SQL relacional escolhido por sua robustez e confiabilidade. Fundamental para garantir a integridade dos dados financeiros e de estoque através de transações (`BEGIN`, `COMMIT`), travas estruturais (`CHECK`) e cálculos complexos diretamente no banco (`json_agg`).
* **NeonDB Serverless:** Plataforma de nuvem utilizada para hospedar o banco de dados PostgreSQL, permitindo escalabilidade sob demanda e conexão segura.
* **Bcryptjs:** Biblioteca de segurança implementada para aplicar o *hashing* (criptografia de mão única) nas senhas dos usuários, garantindo que dados sensíveis não sejam expostos.