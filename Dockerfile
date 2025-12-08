# Imagem oficial do Node.js
FROM node:18

# Cria uma pasta dentro do container
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm install --production

# Copia todo o projeto para dentro do container
COPY . .

# Variáveis de ambiente (opcionais, podem ficar no Back4App)
ENV NODE_ENV=production

# O bot NÃO expõe porta, então nada de EXPOSE

# Comando para rodar seu bot
CMD ["node", "index.js"]
