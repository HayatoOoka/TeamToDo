FROM node:24

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
ENV HOST=0.0.0.0
ENV PORT=3001

CMD ["npm", "run", "dev"]