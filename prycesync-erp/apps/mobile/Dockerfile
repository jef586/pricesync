FROM node:20-alpine

WORKDIR /usr/src/app

# Install pnpm
RUN corepack enable
RUN corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Set environment
ENV NODE_ENV=development

# Expose port
EXPOSE 5174

# Start development server
CMD ["pnpm", "dev"]